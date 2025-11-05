// src/pages/RtoSelectionPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getRtoBreakdown, getVariant } from "../utils/api";
import { useQuoteStore } from "../store/quoteStore";

export default function RtoSelectionPage() {
  const { variantId } = useParams();
  const navigate = useNavigate();

  const setRTO = useQuoteStore((s) => s.setRTO);
  const setVariant = useQuoteStore((s) => s.setVariant);
  const selectedVariant = useQuoteStore((s) => s.selectedVariant);

  const [rtoOptions, setRtoOptions] = useState([]);
  const [selectedRegType, setSelectedRegType] = useState(null);

  const TRANSFER_CHARGE = 200;

  useEffect(() => {
    if (variantId) {
      getRtoBreakdown(variantId)
        .then(setRtoOptions)
        .catch(console.error);

      if (!selectedVariant || selectedVariant.id !== variantId) {
        getVariant(variantId)
          .then(setVariant)
          .catch(console.error);
      }
    }
  }, [variantId]);

  /* ✅ Updated Total Calculation */
  const computeTotal = (rto) =>
    Number(rto.new_registration || 0) +
    Number(rto.hypothecation_addition || 0) +
    Number(rto.duplicate_tax_card || 0) +
    Number(rto.mv_tax || 0) +
    Number(rto.surcharge_mv_tax || 0) +
    Number(rto.green_tax || 0) - // ✅ Added
    Number(rto.rebate_waiver || 0);

  const handleSelectRTO = (rto) => {
    const total = computeTotal(rto);
    setSelectedRegType(rto.reg_type);
    setRTO({
      reg_type: rto.reg_type,
      ...rto,
      total,
    });
    navigate(`/insurance/${variantId}`);
  };

  const handleSelectTransfer = () => {
    setSelectedRegType("Transfer");
    setRTO({
      reg_type: "Transfer",
      new_registration: 0,
      hypothecation_addition: 0,
      duplicate_tax_card: 0,
      mv_tax: 0,
      surcharge_mv_tax: 0,
      green_tax: 0, // ✅ Ensure consistent object
      rebate_waiver: 0,
      transfer_charge: TRANSFER_CHARGE,
      total: TRANSFER_CHARGE,
    });
    navigate(`/insurance/${variantId}`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
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
        {rtoOptions.map((rto, idx) => {
          const total = computeTotal(rto);
          return (
            <div
              key={idx}
              className={`bg-white rounded-xl shadow-md hover:shadow-xl transition p-6 flex flex-col justify-between min-h-[350px] border-2 ${
                selectedRegType === rto.reg_type
                  ? "border-blue-600"
                  : "border-transparent"
              }`}
            >
              <h2 className="text-xl font-semibold mb-4 capitalize">
                {rto.reg_type}
              </h2>

              <div className="space-y-1 text-sm flex-1">
                <Row label="New Registration" value={rto.new_registration} />
                <Row label="Hypothecation Addition" value={rto.hypothecation_addition} />
                <Row label="Duplicate Tax Card" value={rto.duplicate_tax_card} />
                <Row label="MV Tax" value={rto.mv_tax} />
                <Row label="Surcharge on MV Tax" value={rto.surcharge_mv_tax} />
                <Row 
                  label="Green Tax" 
                  value={rto.green_tax} 
                />
                <Row
                  label="Rebate / Waiver"
                  value={rto.rebate_waiver}
                  highlight="green"
                />
              </div>

              <div className="flex justify-between font-bold text-lg mt-4">
                <span>Total</span>
                <span>₹{total}</span>
              </div>

              <button
                onClick={() => handleSelectRTO(rto)}
                className="mt-4 bg-blue-600 hover:bg-blue-700 text-white w-full py-2 rounded-xl font-medium"
              >
                Select & Continue
              </button>
            </div>
          );
        })}

        {/* ✅ Transfer Card (unchanged except green_tax presence) */}
        <div
          className={`bg-white rounded-xl shadow-md hover:shadow-xl transition p-6 flex flex-col justify-between min-h-[350px] border-2 ${
            selectedRegType === "Transfer"
              ? "border-blue-600"
              : "border-transparent"
          }`}
        >
          <h2 className="text-xl font-semibold mb-4">Transfer</h2>

          <div className="space-y-1 text-sm font-medium text-gray-700 flex-1">
            <Row label="Transfer Charge" value={TRANSFER_CHARGE} />
          </div>

          <div className="flex justify-between font-bold text-lg mt-4">
            <span>Total</span>
            <span>₹{TRANSFER_CHARGE}</span>
          </div>

          <button
            onClick={handleSelectTransfer}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white w-full py-2 rounded-xl font-medium"
          >
            Select & Continue
          </button>
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, highlight }) {
  return (
    <div
      className={`flex justify-between ${
        highlight === "green"
          ? "text-green-700 font-medium"
          : highlight === "red"
          ? "text-red-700 font-medium"
          : ""
      }`}
    >
      <span>{label}</span>
      <span>{value ? `₹${value}` : "–"}</span>
    </div>
  );
}
