// src/pages/RtoSelectionPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRtoBreakdown, getVariant } from "../utils/api";
import { useQuoteStore } from "../store/quoteStore";

export default function RtoSelectionPage() {
  const { variantId } = useParams();
  const navigate = useNavigate();

  // Zustand store actions
  const setRTO = useQuoteStore((s) => s.setRTO);
  const setVariant = useQuoteStore((s) => s.setVariant);
  const selectedVariant = useQuoteStore((s) => s.selectedVariant);

  const [rtoOptions, setRtoOptions] = useState([]);
  const [selectedRegType, setSelectedRegType] = useState(null);

  useEffect(() => {
    if (variantId) {
      // fetch RTO options
      getRtoBreakdown(variantId)
        .then(setRtoOptions)
        .catch(console.error);

      // fetch variant if not already in store
      if (!selectedVariant || selectedVariant.id !== variantId) {
        getVariant(variantId)
          .then(setVariant)
          .catch(console.error);
      }
    }
  }, [variantId]);

  const handleSelectRTO = (rto) => {
    setSelectedRegType(rto.reg_type);

    // compute total of all items in RTO breakdown
    const totalRto =
      Number(rto.new_registration || 0) +
      Number(rto.hypothecation_addition || 0) +
      Number(rto.duplicate_tax_card || 0) +
      Number(rto.mv_tax || 0) +
      Number(rto.surcharge_mv_tax || 0) -
      Number(rto.rebate_waiver || 0);

    // Save into Zustand
    setRTO({
      reg_type: rto.reg_type,
      ...rto,
      total: totalRto,
    });

    // Navigate to Insurance page
    navigate(`/insurance/${variantId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      {/* Back button */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-xl font-medium"
      >
        ← Back
      </button>

      <h1 className="text-3xl font-bold mb-8">Select RTO Option</h1>

      {rtoOptions.length === 0 && (
        <p className="text-gray-500">No RTO data found for this variant.</p>
      )}

      <div className="grid md:grid-cols-4 gap-6">
        {rtoOptions.map((rto, idx) => (
          <div
            key={idx}
            className={`bg-white rounded-xl shadow-md hover:shadow-xl transition p-6 flex flex-col justify-between border-2 ${
              selectedRegType === rto.reg_type
                ? "border-blue-600"
                : "border-transparent"
            }`}
          >
            <h2 className="text-xl font-semibold mb-4 capitalize">
              {rto.reg_type}
            </h2>

            <div className="space-y-1 text-sm">
              <div className="flex justify-between">
                <span>New Registration</span>
                <span>
                  {rto.new_registration ? `₹${rto.new_registration}` : "–"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Hypothecation Addition</span>
                <span>
                  {rto.hypothecation_addition
                    ? `₹${rto.hypothecation_addition}`
                    : "–"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Duplicate Tax Card</span>
                <span>
                  {rto.duplicate_tax_card
                    ? `₹${rto.duplicate_tax_card}`
                    : "–"}
                </span>
              </div>
              <div className="flex justify-between">
                <span>MV Tax</span>
                <span>{rto.mv_tax ? `₹${rto.mv_tax}` : "–"}</span>
              </div>
              <div className="flex justify-between">
                <span>Surcharge on MV Tax</span>
                <span>
                  {rto.surcharge_mv_tax ? `₹${rto.surcharge_mv_tax}` : "–"}
                </span>
              </div>
              <div className="flex justify-between font-medium text-green-700">
                <span>Rebate / Waiver</span>
                <span>
                  {rto.rebate_waiver ? `₹${rto.rebate_waiver}` : "–"}
                </span>
              </div>
            </div>

            <button
              onClick={() => handleSelectRTO(rto)}
              className="mt-6 bg-blue-600 hover:bg-blue-700 text-white w-full py-2 rounded-xl font-medium"
            >
              Select & Continue
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
