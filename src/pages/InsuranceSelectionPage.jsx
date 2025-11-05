// ✅ src/pages/InsuranceSelectionPage.jsx
// Full working page with:
// 1) "Skip Insurance" button that navigates to Accessories
// 2) TP row moved above GST
// 3) GST @18% applied on (Net OD + TP + Add-ons)

import React, { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useQuoteStore } from "../store/quoteStore";
import {
  computeIDV,
  computeODPremium,
  computeNetOD,
  computeAddons,
  // computeTotal, // not used, we compute final explicitly to include TP in GST base
  toFraction,
  money,
} from "../utils/insurance";

export default function InsuranceSelectionPage() {
  // ─────────────────────────────────────────────────────────────
  // Router params + navigation
  // ─────────────────────────────────────────────────────────────
  const { variantId } = useParams();
  const navigate = useNavigate();

  // ─────────────────────────────────────────────────────────────
  // Global store
  // ─────────────────────────────────────────────────────────────
  const selectedVariant = useQuoteStore((s) => s.selectedVariant);
  const selectedRTO = useQuoteStore((s) => s.selectedRTO);
  const setSelectedInsurance = useQuoteStore((s) => s.setSelectedInsurance);

  // ─────────────────────────────────────────────────────────────
  // Local state: pricing sources
  // ─────────────────────────────────────────────────────────────
  const [companies, setCompanies] = useState([]);
  const [tpAmount, setTpAmount] = useState(0);
  const [odRatePercent, setOdRatePercent] = useState(0);
  const [odDiscounts, setOdDiscounts] = useState([]);
  const [addons, setAddons] = useState([]);
  const [addonRates, setAddonRates] = useState([]);

  // TP Type context
  const [tpTypeId, setTpTypeId] = useState(null);
  const [tpTypeName, setTpTypeName] = useState("");

  // UI state
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);

  const todayStr = new Date().toLocaleDateString("en-IN");

  // ─────────────────────────────────────────────────────────────
  // Load data from Supabase
  // ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!variantId) return;

    async function load() {
      // Companies
      const { data: c } = await supabase
        .from("insurance_company")
        .select("id,name,active")
        .eq("active", true);
      setCompanies(c || []);

      // TP amount by variant
      const { data: tp } = await supabase
        .from("insurance_tp_rate")
        .select("tp_amount")
        .eq("variant_id", variantId)
        .maybeSingle();
      setTpAmount(Number(tp?.tp_amount || 0));

      // OD rate by variant
      const { data: odr } = await supabase
        .from("insurance_od_rate")
        .select("rate_percent")
        .eq("variant_id", variantId)
        .maybeSingle();
      setOdRatePercent(Number(odr?.rate_percent || 0));

      // Company-specific OD discounts for variant
      const { data: odd } = await supabase
        .from("insurance_od_discount")
        .select("company_id, discount_percent")
        .eq("variant_id", variantId);
      setOdDiscounts(odd || []);

      // Variant TP type
      const { data: type } = await supabase
        .from("variant_tp_type")
        .select("tp_type_id")
        .eq("variant_id", variantId)
        .maybeSingle();
      const tpid = type?.tp_type_id ?? null;
      setTpTypeId(tpid);

      // TP type name
      if (tpid) {
        const { data: tn } = await supabase
          .from("insurance_tp_type")
          .select("name")
          .eq("id", tpid)
          .maybeSingle();
        setTpTypeName(tn?.name || "");
      } else {
        setTpTypeName("");
      }

      // Add-on master list
      const { data: ad } = await supabase
        .from("insurance_addon")
        .select("id,name")
        .order("id");
      setAddons(ad || []);

      // Add-on % rates per company + tp_type
      const { data: adr } = await supabase
        .from("insurance_addon_rate")
        .select("company_id, addon_id, tp_type_id, percentage");
      setAddonRates(adr || []);
    }

    load();
  }, [variantId]);

  // ─────────────────────────────────────────────────────────────
  // Guard: must have variant + RTO set by earlier steps
  // ─────────────────────────────────────────────────────────────
  if (!selectedVariant || !selectedRTO) {
    return <div className="text-center py-10 text-gray-500">Loading...</div>;
  }

  // ─────────────────────────────────────────────────────────────
  // IDV derived from ex-showroom less scheme deduction
  // ─────────────────────────────────────────────────────────────
  const idv = computeIDV(
    Number(selectedVariant.ex_showroom || 0),
    Number(selectedVariant.scheme_deduction || 0)
  );

  // ─────────────────────────────────────────────────────────────
  // Build Add-on lookup: company → addon → tpType → fraction
  // stored as a fraction, not percent (so 2.5 becomes 0.025)
  // ─────────────────────────────────────────────────────────────
  const addonIndex = useMemo(() => {
    const idx = {};
    for (const r of addonRates) {
      const fraction = (Number(r.percentage) || 0) / 100;
      if (!idx[r.company_id]) idx[r.company_id] = {};
      if (!idx[r.company_id][r.addon_id]) idx[r.company_id][r.addon_id] = {};
      idx[r.company_id][r.addon_id][r.tp_type_id] = fraction;
    }
    return idx;
  }, [addonRates]);

  // ─────────────────────────────────────────────────────────────
  // Price computation for each company
  // IMPORTANT: GST must be on (Net OD + TP + Add-ons)
  // ─────────────────────────────────────────────────────────────
  const pricing = useMemo(() => {
    const odRate = toFraction(odRatePercent);

    return companies.map((co) => {
      // Discount line for this company
      const dRow = odDiscounts.find((d) => d.company_id === co.id);
      const discountFraction = toFraction(dRow?.discount_percent);

      // OD premium & Net OD
      const odPremium = computeODPremium(idv, odRate);
      const netOD = computeNetOD(odPremium, discountFraction);

      // Add-ons subtotal at IDV * rate for each selected add-on
      const addonTotal = computeAddons(
        idv,
        tpTypeId,
        co.id,
        selectedAddons,
        addonIndex
      );

      // TP premium from table
      const tp = tpAmount;

      // GST base and GST itself
      const gstBase = netOD + tp + addonTotal;
      const gst = gstBase * 0.18;

      // Final total
      const total = gstBase + gst;

      return {
        company_id: co.id,
        company_name: co.name,
        odPremium,                        // numeric
        discount_percent: dRow?.discount_percent || 0, // %
        netOD,                            // numeric
        tp,                               // numeric
        addonTotal,                       // numeric
        gst,                              // numeric
        total,                            // numeric
      };
    });
  }, [
    companies,
    odRatePercent,
    odDiscounts,
    selectedAddons,
    addonIndex,
    tpAmount,
    tpTypeId,
    idv,
  ]);

  // Recommended = minimum total
  const cheapestCompanyId =
    pricing.length > 0
      ? pricing.reduce((min, p) => (p.total < min.total ? p : min)).company_id
      : null;

  // ─────────────────────────────────────────────────────────────
  // Handlers
  // ─────────────────────────────────────────────────────────────
  const toggleAddon = (addonId) => {
    setSelectedAddons((prev) =>
      prev.includes(addonId)
        ? prev.filter((x) => x !== addonId)
        : [...prev, addonId]
    );
    setSelectedCompanyId(null); // force re-choose after add-on change
  };

  const handleNext = () => {
    if (!selectedCompanyId) {
      alert("Please select an insurance company first.");
      return;
    }
    const chosen = pricing.find((p) => p.company_id === selectedCompanyId);
    // Persist chosen plan in the store
    setSelectedInsurance({
      ...chosen,
      selectedAddons,
      tpTypeId,
      tpTypeName,
      idv,
      company_id: chosen.company_id,
      company_name: chosen.company_name,
    });
    // Go to accessories for the same car family
    navigate(`/accessories/${selectedVariant.car_id}`);
  };

  const handleSkip = () => {
    // Clear any prior insurance choice and continue to accessories
    setSelectedInsurance(null);
    navigate(`/accessories/${selectedVariant.car_id}`);
  };

  // Header line for variant
  const variantHeader = [
    selectedVariant.car?.name,
    selectedVariant.name,
    selectedVariant.fuel_label,
    selectedVariant.transmission_label,
  ]
    .filter(Boolean)
    .join(" · ");

  // ─────────────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────────────
  return (
    <div className="max-w-8xl mx-auto p-6 space-y-6">
      {/* Top Info Card */}
      <div className="bg-white/90 backdrop-blur shadow-lg rounded-2xl p-6 border">
        <div className="flex justify-between">
          <button
            onClick={() => navigate(-1)}
            className="bg-gray-200 hover:bg-gray-300 px-3 py-2 rounded-lg"
          >
            ← Back
          </button>
          <span className="text-sm text-gray-600">Date: {todayStr}</span>
        </div>

        <h2 className="font-bold text-xl mt-2">Insurance Selection</h2>
        <p className="text-gray-700 mt-1">{variantHeader}</p>
        <p className="text-gray-800 font-semibold">
          IDV: {money(idv)} • TP Type: {tpTypeName || "—"}
        </p>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto rounded-2xl shadow-xl bg-white border">
        <table className="min-w-full text-center">
          <thead className="bg-blue-600 text-white sticky top-0">
            <tr>
              <th className="p-3 text-left">Breakdown</th>
              {pricing.map((p) => (
                <th key={p.company_id} className="p-3">
                  <div className="font-bold">{p.company_name}</div>
                  {p.company_id === cheapestCompanyId && (
                    <span className="text-xs bg-green-500 text-white px-2 py-1 rounded-lg mt-1 inline-block">
                      Recommended
                    </span>
                  )}
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y text-sm">
            {/* OD Premium */}
            <tr className="bg-gray-50">
              <td className="p-3 font-medium text-left">OD Premium</td>
              {pricing.map((p) => (
                <td key={p.company_id}>{money(p.odPremium)}</td>
              ))}
            </tr>

            {/* Less Discount */}
            <tr>
              <td className="p-3 font-medium text-left">Less Discount</td>
              {pricing.map((p) => {
                const discountAmt = p.odPremium - p.netOD;
                return (
                  <td key={p.company_id} className="text-red-600">
                    {p.discount_percent}% ({money(discountAmt)})
                  </td>
                );
              })}
            </tr>

            {/* Net OD */}
            <tr className="bg-gray-50 font-semibold">
              <td className="p-3 text-left">Net OD</td>
              {pricing.map((p) => (
                <td key={p.company_id}>{money(p.netOD)}</td>
              ))}
            </tr>

            {/* TP Amount — moved ABOVE Add-ons and before GST */}
            <tr>
              <td className="p-3 font-medium text-left">TP Amount</td>
              {pricing.map((p) => (
                <td key={p.company_id}>{money(p.tp)}</td>
              ))}
            </tr>

            {/* Add-ons: one line per add-on with per-company amounts */}
            {addons.map((addon) => (
              <tr key={addon.id}>
                <td className="p-3 text-left font-medium">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      className="accent-blue-600"
                      checked={selectedAddons.includes(addon.id)}
                      onChange={() => toggleAddon(addon.id)}
                    />
                    {addon.name}
                  </label>
                </td>

                {pricing.map((p) => {
                  const rate =
                    addonIndex[p.company_id]?.[addon.id]?.[tpTypeId] ?? null;
                  const amount = rate ? idv * rate : 0;
                  const enabled = rate != null;

                  return (
                    <td
                      key={p.company_id}
                      className={`font-medium ${
                        enabled
                          ? selectedAddons.includes(addon.id)
                            ? "text-blue-600"
                            : "text-gray-500"
                          : "text-red-500"
                      }`}
                    >
                      {enabled ? money(amount) : "❌"}
                    </td>
                  );
                })}
              </tr>
            ))}

            {/* GST on (Net OD + TP + Add-ons) */}
            <tr className="bg-gray-50 font-medium">
              <td className="p-3 text-left">GST @18% on (Net OD + TP + Add-ons)</td>
              {pricing.map((p) => (
                <td key={p.company_id}>{money(p.gst)}</td>
              ))}
            </tr>

            {/* Final */}
            <tr className="bg-blue-100 font-bold text-blue-900 text-base">
              <td className="p-3 text-left">Final Insurance Amount</td>
              {pricing.map((p) => (
                <td
                  key={p.company_id}
                  onClick={() => setSelectedCompanyId(p.company_id)}
                  className={`p-3 rounded-lg cursor-pointer transition ${
                    selectedCompanyId === p.company_id
                      ? "bg-blue-700 text-white shadow-lg"
                      : "hover:bg-blue-200"
                  }`}
                  title="Click to select this insurer"
                >
                  {money(p.total)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Bottom Sticky CTA with Skip + Next */}
      <div className="sticky bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
        <div className="max-w-8xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Skip Insurance */}
          <button
            onClick={handleSkip}
            className="w-full py-3 rounded-xl font-semibold text-gray-800 bg-gray-200 hover:bg-gray-300"
          >
            Skip Insurance → Accessories
          </button>

          {/* Spacer on md */}
          <div className="hidden md:block" />

          {/* Next */}
          <button
            onClick={handleNext}
            disabled={!selectedCompanyId}
            className={`w-full py-3 rounded-xl font-semibold text-lg transition ${
              selectedCompanyId
                ? "bg-blue-600 text-white hover:bg-blue-700"
                : "bg-gray-300 text-gray-500 pointer-events-none"
            }`}
          >
            Next → Accessories
          </button>
        </div>
      </div>
    </div>
  );
}
