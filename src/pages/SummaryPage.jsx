// src/pages/SummaryPage.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useQuoteStore } from "../store/quoteStore";
import { money } from "../utils/insurance";

export default function SummaryPage() {
  const navigate = useNavigate();

  const {
    selectedCar,
    selectedVariant,
    selectedRTO,
    selectedAccessories,
    selectedInsurance,
  } = useQuoteStore();

  const [addonRows, setAddonRows] = useState([]);
  const [saving, setSaving] = useState(false);

  // ✅ EMI CALCULATOR STATES (added)
  const [showEMI, setShowEMI] = useState(false);
  const [downPayment, setDownPayment] = useState(0);
  const [tenure, setTenure] = useState(36);
  const [interestRate, setInterestRate] = useState(9);

  if (!selectedVariant) {
    return (
      <div className="max-w-4xl mx-auto p-6 text-center text-gray-500">
        Variant is not selected. Please start again.
      </div>
    );
  }

  const exShowroom = Number(selectedVariant?.ex_showroom || 0);
  const allSchemes = Array.isArray(selectedVariant?.schemes)
    ? selectedVariant.schemes
    : [];

  const schemesApplied = useMemo(() => {
    if (allSchemes.length === 0) {
      const total = Number(selectedVariant?.scheme_deduction || 0);
      return { lines: [], total };
    }
    const lines = allSchemes
      .filter((s) => Number(s.amount) > 0)
      .map((s) => ({
        code: String(s.scheme || "").toUpperCase(),
        label: String(s.scheme || "").replace(/_/g, " "),
        amount: Number(s.amount || 0),
        apply_default: !!s.apply_default,
      }));
    const total = lines.reduce((acc, s) => acc + s.amount, 0);
    return { lines, total };
  }, [allSchemes, selectedVariant?.scheme_deduction]);

  const priceAfterSchemes = Math.max(0, exShowroom - schemesApplied.total);

  const rtoTotal = Number(selectedRTO?.total || 0);

  const rtoLines = [
    ["Registration Type", selectedRTO?.reg_type ?? "—"],
    ["New Registration", money(selectedRTO?.new_registration || 0)],
    ["Hypothecation Addition", money(selectedRTO?.hypothecation_addition || 0)],
    ["Duplicate Tax Card", money(selectedRTO?.duplicate_tax_card || 0)],
    ["MV Tax", money(selectedRTO?.mv_tax || 0)],
    ["Surcharge on MV Tax", money(selectedRTO?.surcharge_mv_tax || 0)],
    ["Green Tax", money(selectedRTO?.green_tax || 0)],
    ["Rebate / Waiver", String(selectedRTO?.rebate_waiver ?? "—")],
  ];

  const ins = selectedInsurance || {};
  const idv = Number(ins?.idv || 0);
  const odPremium = Number(ins?.odPremium || 0);
  const discountPercent = Number(ins?.discount_percent || 0);
  const discountAmount = Math.max(0, odPremium - Number(ins?.netOD || 0));
  const netOD = Number(ins?.netOD || 0);
  const tpPremium = Number(ins?.tp || 0);
  const computedGST = (netOD + Number(ins?.addonTotal || 0)) * 0.18;
  const gst = Number.isFinite(Number(ins?.gst)) ? Number(ins?.gst) : computedGST;

  useEffect(() => {
    async function loadAddons() {
      try {
        if (
          !ins?.company_id ||
          !ins?.tpTypeId ||
          !Array.isArray(ins?.selectedAddons) ||
          ins.selectedAddons.length === 0
        ) {
          setAddonRows([]);
          return;
        }

        const { data: names } = await supabase
          .from("insurance_addon")
          .select("id,name")
          .in("id", ins.selectedAddons);

        const { data: rates } = await supabase
          .from("insurance_addon_rate")
          .select("addon_id, percentage")
          .eq("company_id", ins.company_id)
          .eq("tp_type_id", ins.tpTypeId)
          .in("addon_id", ins.selectedAddons);

        const percentByAddon = {};
        (rates || []).forEach((r) => {
          percentByAddon[r.addon_id] = Number(r.percentage || 0);
        });

        const rows = (names || []).map((n) => {
          const pct = percentByAddon[n.id] ?? 0;
          const amount = idv * (pct / 100);
          return { id: n.id, name: n.name, percent: pct, amount };
        });

        setAddonRows(rows);
      } catch (err) {
        console.error("Failed to load addon rows:", err.message);
        setAddonRows([]);
      }
    }
    loadAddons();
  }, [ins?.company_id, ins?.tpTypeId, JSON.stringify(ins?.selectedAddons), idv]);

  const addonTotal = addonRows.reduce((s, r) => s + r.amount, 0);

  const insuranceTotal = Number.isFinite(Number(ins?.total))
    ? Number(ins.total)
    : netOD + addonTotal + tpPremium + (netOD + addonTotal) * 0.18;

  const accessories = Array.isArray(selectedAccessories)
    ? selectedAccessories
    : [];

  const accessoriesTotal = accessories.reduce(
    (sum, a) => sum + Number(a.price || 0),
    0
  );

  const finalPrice =
    priceAfterSchemes + rtoTotal + insuranceTotal + accessoriesTotal;

  // ✅ EMI Calculator Formula
  const principal = Math.max(0, finalPrice - Number(downPayment || 0));
  const monthlyRate = Number(interestRate) / 100 / 12;
  const emi =
    monthlyRate === 0
      ? principal / Number(tenure || 1)
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure || 1)) /
        (Math.pow(1 + monthlyRate, tenure || 1) - 1);

  async function handleSave() {
    const name = prompt("Enter customer name to save quotation:");
    if (!name) return;

    const payload = {
      customer_name: name,
      car_id: selectedCar?.id,
      variant_id: selectedVariant?.id,
      ex_showroom: exShowroom,
      schemes: {
        lines: schemesApplied.lines,
        total: schemesApplied.total,
      },
      rto: selectedRTO,
      insurance: {
        company_id: ins?.company_id,
        company_name: ins?.company_name,
        idv,
        odPremium,
        discount_percent: discountPercent,
        discount_amount: discountAmount,
        netOD,
        addons: addonRows.map((r) => ({
          id: r.id,
          name: r.name,
          percent: r.percent,
          amount: Math.round(r.amount),
        })),
        addonTotal: Math.round(addonTotal),
        gst: Math.round(gst),
        tp: tpPremium,
        total: Math.round(insuranceTotal),
        tpTypeId: ins?.tpTypeId,
        tpTypeName: ins?.tpTypeName,
      },
      accessories: accessories.map((a) => ({
        id: a.id,
        name: a.name,
        price: Number(a.price || 0),
      })),
      totals: {
        priceAfterSchemes: Math.round(priceAfterSchemes),
        rtoTotal: Math.round(rtoTotal),
        insuranceTotal: Math.round(insuranceTotal),
        accessoriesTotal: Math.round(accessoriesTotal),
        grandTotal: Math.round(finalPrice),
      },
    };

    try {
      setSaving(true);
      const { error } = await supabase.from("quote").insert([payload]);
      setSaving(false);
      if (error) throw error;
      alert("Quote saved!");
    } catch (err) {
      setSaving(false);
      alert("Error saving quote: " + err.message);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 grid md:grid-cols-3 gap-8">

      {/* LEFT: Sections */}
      <div className="md:col-span-2 space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-xl font-medium"
        >
          ← Back
        </button>

        <h1 className="text-3xl font-bold mb-4">Quotation Summary</h1>

        {/* ✅ Car + Variant Box */}
        <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 shadow-sm">
          <p className="font-semibold text-blue-800 text-lg">
            {selectedCar?.name || "—"} · {selectedVariant?.name || "—"} ·{" "}
            {selectedVariant?.fuel_label || "—"} ·{" "}
            {selectedVariant?.transmission_label || "—"}
          </p>
        </div>

        {/* Schemes */}
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-3">Schemes Applied</h2>

          {schemesApplied.lines.length === 0 ? (
            <div className="text-sm text-gray-600">
              No scheme lines provided. Using total scheme deduction.
              <div className="flex justify-between font-medium mt-2">
                <span>Total Schemes</span>
                <span>-{money(schemesApplied.total)}</span>
              </div>
            </div>
          ) : (
            <>
              <ul className="text-sm space-y-1">
                {schemesApplied.lines.map((s) => (
                  <li key={s.code} className="flex justify-between">
                    <span>
                      {s.label}
                      {s.apply_default ? " (Default)" : ""}
                    </span>
                    <span>-{money(s.amount)}</span>
                  </li>
                ))}
              </ul>
              <hr className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Total Schemes</span>
                <span>-{money(schemesApplied.total)}</span>
              </div>
            </>
          )}

          <div className="flex justify-between font-bold mt-2">
            <span>Ex-Showroom after Schemes</span>
            <span>{money(priceAfterSchemes)}</span>
          </div>
        </div>

        {/* RTO */}
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-3">RTO Charges</h2>
          {selectedRTO ? (
            <>
              <ul className="text-sm space-y-1">
                {rtoLines.map(([k, v]) => (
                  <li key={k} className="flex justify-between">
                    <span>{k}</span>
                    <span>{v}</span>
                  </li>
                ))}
              </ul>
              <hr className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Total RTO</span>
                <span>{money(rtoTotal)}</span>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">No RTO selection.</p>
          )}
        </div>

        {/* Insurance */}
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-3">Insurance Breakdown</h2>
          {selectedInsurance ? (
            <>
              <div className="text-sm mb-2">
                <div className="flex justify-between">
                  <span>Insurer</span>
                  <span>{ins.company_name || "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span>IDV</span>
                  <span>{money(idv)}</span>
                </div>
                <div className="flex justify-between">
                  <span>OD Premium</span>
                  <span>{money(odPremium)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Less Discount</span>
                  <span>
                    {discountPercent}% ({money(discountAmount)})
                  </span>
                </div>
                <div className="flex justify-between font-medium">
                  <span>Net OD</span>
                  <span>{money(netOD)}</span>
                </div>
              </div>

              {/* Add-ons */}
              <div className="mt-3">
                <div className="font-semibold mb-2">Add-ons</div>
                {addonRows.length === 0 ? (
                  <div className="text-sm text-gray-500">
                    No add-ons selected.
                  </div>
                ) : (
                  <ul className="text-sm space-y-1">
                    {addonRows.map((r) => (
                      <li key={r.id} className="flex justify-between">
                        <span>
                          {r.name}{" "}
                          <span className="text-gray-500">
                            ({r.percent}% of IDV)
                          </span>
                        </span>
                        <span>+{money(r.amount)}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="flex justify-between font-medium mt-2">
                  <span>Total Add-ons</span>
                  <span>{money(addonTotal)}</span>
                </div>

                <div className="flex justify-between mt-1">
                  <span>GST @ 18% on (Net OD + Add-ons)</span>
                  <span>{money(gst)}</span>
                </div>

                <div className="flex justify-between mt-1">
                  <span>TP Premium</span>
                  <span>{money(tpPremium)}</span>
                </div>

                <hr className="my-2" />
                <div className="flex justify-between font-bold text-blue-700">
                  <span>Total Insurance Premium</span>
                  <span>{money(insuranceTotal)}</span>
                </div>
              </div>
            </>
          ) : (
            <p className="text-sm text-gray-500">No insurance selected.</p>
          )}
        </div>

        {/* Accessories */}
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-3">Accessories</h2>
          {accessories.length === 0 ? (
            <p className="text-sm text-gray-500">No accessories selected.</p>
          ) : (
            <>
              <ul className="text-sm">
                {accessories.map((a) => (
                  <li key={a.id} className="flex justify-between py-1">
                    <span>{a.name}</span>
                    <span>{money(a.price || 0)}</span>
                  </li>
                ))}
              </ul>
              <hr className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Total Accessories</span>
                <span>{money(accessoriesTotal)}</span>
              </div>
            </>
          )}
        </div>
      </div>

      {/* RIGHT Sidebar */}
      <div className="md:col-span-1">
        <div className="sticky top-6 bg-white shadow rounded-xl p-6 h-fit space-y-4">
          <h2 className="text-2xl font-bold">Final Price</h2>
          <ul className="space-y-1 text-sm">
            <li className="flex justify-between">
              <span>Ex-Showroom (after Schemes)</span>
              <span>{money(priceAfterSchemes)}</span>
            </li>
            <li className="flex justify-between">
              <span>RTO</span>
              <span>{money(rtoTotal)}</span>
            </li>
            <li className="flex justify-between">
              <span>Insurance</span>
              <span>{money(insuranceTotal)}</span>
            </li>
            <li className="flex justify-between">
              <span>Accessories</span>
              <span>{money(accessoriesTotal)}</span>
            </li>
          </ul>

          <hr className="my-3" />
          <p className="text-3xl font-extrabold text-blue-600">
            {money(finalPrice)}
          </p>

          {/* ✅ EMI Calculator UI */}
          <button
            onClick={() => setShowEMI((v) => !v)}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-xl font-medium"
          >
            {showEMI ? "Hide EMI Calculator" : "Calculate EMI"}
          </button>

          {showEMI && (
            <div className="space-y-3 p-3 border rounded-xl bg-gray-50">
              <div className="grid grid-cols-2 gap-3">
                <label className="text-sm">
                  Down Payment
                  <input
                    type="number"
                    min="0"
                    value={downPayment}
                    onChange={(e) => setDownPayment(e.target.value)}
                    className="w-full border rounded px-2 py-1 mt-1"
                  />
                </label>
                <label className="text-sm">
                  Tenure (months)
                  <input
                    type="number"
                    min="1"
                    value={tenure}
                    onChange={(e) => setTenure(e.target.value)}
                    className="w-full border rounded px-2 py-1 mt-1"
                  />
                </label>
                <label className="text-sm">
                  Interest Rate (% p.a.)
                  <input
                    type="number"
                    min="0"
                    step="0.1"
                    value={interestRate}
                    onChange={(e) => setInterestRate(e.target.value)}
                    className="w-full border rounded px-2 py-1 mt-1"
                  />
                </label>
                <label className="text-sm">
                  Loan Amount
                  <input
                    type="text"
                    disabled
                    value={money(principal)}
                    className="w-full border rounded px-2 py-1 mt-1 bg-gray-100"
                  />
                </label>
              </div>
              <p className="text-green-700 font-bold text-lg text-center">
                EMI: {money(Math.max(0, Math.round(emi)))} / month
              </p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={() => navigate(-1)}
              className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-xl font-medium"
            >
              Back
            </button>
            <button
              disabled={saving}
              onClick={handleSave}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl font-medium"
            >
              {saving ? "Saving..." : "Save Quote"}
            </button>
          </div>
        </div>
      </div>

    </div>
  );
}
