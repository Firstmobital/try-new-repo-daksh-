// src/pages/Insurance.jsx
import { useEffect, useMemo, useState } from "react";
import { supabase } from "../lib/supabase";
import { useQuoteStore } from "../store/quoteStore";
import {
  toFraction,
  money,
  computeIDV,
  computeODPremium,
  computeNetOD,
  computeAddons,
  computeTotal,
} from "../utils/insurance";

const GST = 0.18;

export default function Insurance() {
  const { variant } = useQuoteStore(); // expect: { id, name, ex_showroom, tp_type, schemes, selectedExchange, selectedMSME, selectedSolar, selectedCorporate }
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  // Data from DB
  const [companies, setCompanies] = useState([]); // [{code,name}]
  const [discounts, setDiscounts] = useState({}); // { [company]: fraction }
  const [variantRate, setVariantRate] = useState(null); // { od_rate, tp_amount }
  const [addonMaster, setAddonMaster] = useState([]); // [{code,label}]
  const [addonRateIndex, setAddonRateIndex] = useState({}); // { [company]: { [addon]: { [tpType]: rate } } }

  // UI: which add-ons selected (global)
  const [selectedAddons, setSelectedAddons] = useState([
    // preselect a few if you like:
    // 'ZERO_DEP'
  ]);

  // Load everything
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setErr("");

        // Companies
        const { data: co } = await supabase.from("insurance_company").select("code,name").order("name");
        setCompanies(co || []);

        // Discounts
        const { data: disc } = await supabase.from("insurance_company_discount").select("company,od_discount");
        const dmap = {};
        (disc || []).forEach((r) => (dmap[r.company] = toFraction(r.od_discount)));
        setDiscounts(dmap);

        // Variant OD rate + TP
        if (variant?.id) {
          const { data: vr } = await supabase
            .from("insurance_variant_rate")
            .select("od_rate,tp_amount")
            .eq("variant_id", variant.id)
            .maybeSingle();
          setVariantRate(vr || null);
        }

        // Addon master
        const { data: am } = await supabase.from("insurance_addon_master").select("code,label").order("label");
        setAddonMaster(am || []);

        // Addon rates matrix
        const { data: ar } = await supabase
          .from("insurance_addon_rate")
          .select("company,addon,tp_type,rate");
        // build index
        const idx = {};
        (ar || []).forEach((r) => {
          idx[r.company] = idx[r.company] || {};
          idx[r.company][r.addon] = idx[r.company][r.addon] || {};
          idx[r.company][r.addon][r.tp_type] = Number(r.rate || 0);
        });
        setAddonRateIndex(idx);
      } catch (e) {
        setErr(e.message || String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [variant?.id]);

  // Scheme total (from your store’s chosen flags + variant.schemes)
  const schemeTotal = useMemo(() => {
    if (!variant?.schemes) return 0;

    const defaults = (variant.schemes || []).filter((s) =>
      ["CONSUMER", "GREEN_BONUS", "INTERVENTION"].includes(s.scheme)
    );
    const optional = (variant.schemes || []).filter((s) =>
      ["SCRAP", "MSME", "SOLAR", "CORPORATE"].includes(s.scheme)
    );

    let total = 0;
    // defaults always applied if apply_default
    defaults.forEach((s) => {
      if (s.apply_default) total += Number(s.amount || 0);
    });
    // optionals based on flags from store
    if (variant.selectedExchange) {
      total += optional.find((x) => x.scheme === "SCRAP")?.amount || 0;
    }
    if (variant.selectedMSME) {
      total += optional.find((x) => x.scheme === "MSME")?.amount || 0;
    }
    if (variant.selectedSolar) {
      total += optional.find((x) => x.scheme === "SOLAR")?.amount || 0;
    }
    if (variant.selectedCorporate) {
      total += optional.find((x) => x.scheme === "CORPORATE")?.amount || 0;
    }
    return total;
  }, [variant]);

  const idv = useMemo(() => {
    return computeIDV(variant?.ex_showroom, schemeTotal);
  }, [variant?.ex_showroom, schemeTotal]);

  const toggleAddon = (code) => {
    setSelectedAddons((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]
    );
  };

  if (loading) return <div className="p-6">Loading insurance…</div>;
  if (err) return <div className="p-6 text-red-600">{err}</div>;
  if (!variant) return <div className="p-6">No variant selected.</div>;
  if (!variantRate) return <div className="p-6">No insurance rate set for this variant yet.</div>;

  const tpType = (variant.tp_type || "HS").toUpperCase();
  const odPremium = computeODPremium(idv, variantRate.od_rate);

  // Build per-company rows
  const rows = (companies || []).map((co) => {
    const disc = discounts[co.code] ?? 0;
    const netOD = computeNetOD(odPremium, disc);
    const addonTotal = computeAddons(idv, tpType, co.code, selectedAddons, addonRateIndex);
    const totalWithGST = computeTotal(netOD, variantRate.tp_amount, addonTotal, GST);

    return {
      company: co,
      odPremium,
      discount: disc,
      netOD,
      tp: variantRate.tp_amount,
      addonTotal,
      totalWithGST,
    };
  });

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Insurance • {variant.name}</h1>
          <p className="text-sm text-gray-600">
            TP Type: <b>{tpType}</b> &nbsp;|&nbsp; Ex-Showroom: <b>{money(variant.ex_showroom)}</b> &nbsp;|&nbsp; Applied Schemes: <b>{money(schemeTotal)}</b>
          </p>
          <p className="text-sm text-gray-600">
            IDV <span className="text-gray-500">(95% × (Ex-Showroom − Schemes))</span>: <b>{money(idv)}</b>
          </p>
        </div>
      </div>

      {/* Add-ons picker */}
      <div className="card p-4">
        <h2 className="font-semibold mb-3">Add-Ons</h2>
        <div className="flex flex-wrap gap-2">
          {addonMaster.map((a) => (
            <label key={a.code} className={`px-3 py-1 rounded-full border cursor-pointer text-sm ${
              selectedAddons.includes(a.code)
                ? "bg-indigo-50 border-indigo-400 text-indigo-700"
                : "bg-gray-50 border-gray-300 text-gray-600"
            }`}>
              <input
                type="checkbox"
                className="mr-2 align-middle"
                checked={selectedAddons.includes(a.code)}
                onChange={() => toggleAddon(a.code)}
              />
              {a.label}
            </label>
          ))}
        </div>
        <p className="text-xs text-gray-500 mt-2">
          Add-on premium is computed as <i>IDV × (Add-On Rate for your variant’s TP Type)</i>, and rates differ by company.
        </p>
      </div>

      {/* Comparison table */}
      <div className="card overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th className="text-left">Company</th>
              <th className="text-right">OD Premium</th>
              <th className="text-right">OD Discount</th>
              <th className="text-right">Net OD</th>
              <th className="text-right">TP</th>
              <th className="text-right">Add-Ons</th>
              <th className="text-right">Total (incl. GST)</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.company.code}>
                <td className="font-medium">{r.company.name}</td>
                <td className="text-right">{money(r.odPremium)}</td>
                <td className="text-right">{Math.round((r.discount || 0) * 100)}%</td>
                <td className="text-right">{money(r.netOD)}</td>
                <td className="text-right">{money(r.tp)}</td>
                <td className="text-right">{money(r.addonTotal)}</td>
                <td className="text-right font-semibold">{money(r.totalWithGST)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-gray-500">
        Notes: OD Rate is variant-specific and common across companies. OD Discount differs by company. TP is variant-specific and same across companies.
        Add-on rates depend on company and TP Type: <b>{tpType}</b>. GST assumed at {Math.round(GST*100)}%.
      </p>
    </div>
  );
}
