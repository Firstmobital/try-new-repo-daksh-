// src/pages/InsuranceSelectionPage.jsx
import React, { useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuoteStore } from "../store/quoteStore";

// Sample TP Rates (per variant CC/type)
const TP_RATES = {
  default: 10640, // fallback
};

// Sample OD Discounts per company
const OD_DISCOUNTS = {
  ICICI: 0.5,
  "Tata AIG": 0.5,
  "New India": 0.5,
};

// Sample Add-ons table (rates depend on tp_type like HS, Others, etc.)
const ADDON_RATES = {
  ICICI: {
    "Zero Dep": { HS: 0.003147, Others: 0.003501 },
    RSA: { HS: 0.000268, Others: 0.000814 },
    "Key Replacement": { HS: 0.000223, Others: 0.000678 },
    "Engine Protection": { HS: 0.0012, Others: 0.001199 },
  },
  "Tata AIG": {
    "Zero Dep": { HS: 0.002698, Others: 0.003501 },
    RSA: { HS: 0.000268, Others: 0.000814 },
    "Key Replacement": { HS: 0.000164, Others: 0.000497 },
    "Engine Protection": { HS: 0.000899, Others: 0.001001 },
  },
  "New India": {
    "Zero Dep": { HS: 0.003507, Others: 0.003401 },
    RSA: { HS: 0.000027, Others: 0.000082 },
    "Key Replacement": { HS: 0.000112, Others: 0.00034 },
    "Engine Protection": { HS: 0.001, Others: 0.00101 },
  },
};

export default function InsuranceSelectionPage() {
  const { variantId } = useParams();
  const navigate = useNavigate();

  const selectedVariant = useQuoteStore((s) => s.selectedVariant);
  const selectedRTO = useQuoteStore((s) => s.selectedRTO);
  const setInsurance = useQuoteStore((s) => s.setInsurance);

  const [selectedCompany, setSelectedCompany] = useState(null);
  const [addons, setAddons] = useState([]);

  const companies = ["ICICI", "Tata AIG", "New India"];

  // 🔑 Insurance calculations
  const insuranceData = useMemo(() => {
    if (!selectedVariant) return [];

    const exShowroom = Number(selectedVariant.ex_showroom || 0);
    const appliedSchemes = selectedVariant.scheme_deduction || 0; // assume you saved scheme total earlier
    const idv = 0.95 * (exShowroom - appliedSchemes);

    const odRate = Number(selectedVariant.od_rate || 0.03191); // default OD rate 3.191%
    const odPremium = idv * odRate;

    return companies.map((company) => {
      const discount = OD_DISCOUNTS[company] || 0;
      const netOd = odPremium * (1 - discount);

      const tpAmt =
        TP_RATES[selectedVariant.cc] || TP_RATES.default || 0;

      // Add-ons total (if any selected)
      const tpType = selectedVariant.tp_type || "Others";
      let addonTotal = 0;
      addons.forEach((addon) => {
        const rate =
          ADDON_RATES[company]?.[addon]?.[tpType] || 0;
        addonTotal += idv * rate;
      });

      const total = netOd + tpAmt + addonTotal;

      return {
        company,
        idv,
        odPremium,
        discount: discount * 100,
        netOd,
        tpAmt,
        addonTotal,
        total,
      };
    });
  }, [selectedVariant, addons]);

  const toggleAddon = (addon) => {
    setAddons((prev) =>
      prev.includes(addon)
        ? prev.filter((a) => a !== addon)
        : [...prev, addon]
    );
  };

  const handleNext = () => {
    if (!selectedCompany) return alert("Please select an insurance company");
    const chosen = insuranceData.find((c) => c.company === selectedCompany);
    setInsurance({ ...chosen, addons });
    navigate(`/accessories/${variantId}`);
  };

  if (!selectedVariant || !selectedRTO) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-12 text-center">
        <p className="text-gray-500">
          Missing variant or RTO details. Please go back.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 space-y-8">
      <button
        onClick={() => navigate(-1)}
        className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-lg text-sm"
      >
        ← Back
      </button>

      <h1 className="text-3xl font-bold mb-6">
        Select Insurance for {selectedVariant.name}
      </h1>

      {/* Add-ons */}
      <div className="card p-6">
        <h2 className="text-xl font-semibold mb-4">Optional Add-ons</h2>
        <div className="grid md:grid-cols-2 gap-4 text-sm">
          {["Zero Dep", "RSA", "Key Replacement", "Engine Protection"].map(
            (addon) => (
              <label key={addon} className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  checked={addons.includes(addon)}
                  onChange={() => toggleAddon(addon)}
                />
                <span>{addon}</span>
              </label>
            )
          )}
        </div>
      </div>

      {/* Insurance Comparison */}
      <div className="grid md:grid-cols-3 gap-6">
        {insuranceData.map((ins) => (
          <div
            key={ins.company}
            className={`p-6 rounded-xl shadow-md border-2 flex flex-col justify-between ${
              selectedCompany === ins.company
                ? "border-blue-600"
                : "border-transparent"
            }`}
          >
            <h2 className="text-xl font-bold mb-4">{ins.company}</h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>IDV</span>
                <span>₹{ins.idv.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span>OD Premium</span>
                <span>₹{ins.odPremium.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount</span>
                <span>{ins.discount}%</span>
              </div>
              <div className="flex justify-between">
                <span>Net OD</span>
                <span>₹{ins.netOd.toFixed(0)}</span>
              </div>
              <div className="flex justify-between">
                <span>TP Amount</span>
                <span>₹{ins.tpAmt}</span>
              </div>
              <div className="flex justify-between">
                <span>Add-ons</span>
                <span>₹{ins.addonTotal.toFixed(0)}</span>
              </div>
              <div className="flex justify-between font-bold border-t pt-2">
                <span>Total</span>
                <span>₹{ins.total.toFixed(0)}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedCompany(ins.company)}
              className="mt-6 w-full py-2 rounded-xl font-medium bg-blue-600 text-white hover:bg-blue-700"
            >
              {selectedCompany === ins.company ? "Selected" : "Choose"}
            </button>
          </div>
        ))}
      </div>

      <button
        onClick={handleNext}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-semibold"
      >
        Next → Accessories
      </button>
    </div>
  );
}
