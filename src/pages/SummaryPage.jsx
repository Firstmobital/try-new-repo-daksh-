import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuoteStore } from "../store/quoteStore";
import { supabase } from "../lib/supabase";

export default function SummaryPage() {
  const navigate = useNavigate();

  // 🔹 pull everything from the store
  const {
    selectedCar,
    selectedVariant,
    selectedRTO,
    selectedAccessories,
    selectedInsurance,
    selectedExchange,
    selectedMSME,
    selectedSolar,
    selectedCorporate,
  } = useQuoteStore();

  const [showEMI, setShowEMI] = useState(false);
  const [downPayment, setDownPayment] = useState(0);
  const [tenure, setTenure] = useState(36);
  const [interestRate, setInterestRate] = useState(9);
  const [saving, setSaving] = useState(false);

  // ===================
  // SCHEMES
  // ===================
  const allSchemes = selectedVariant?.schemes || [];
  const defaults = allSchemes.filter((s) =>
    ["CONSUMER", "GREEN_BONUS", "INTERVENTION"].includes(s.scheme)
  );
  const optionalSchemes = allSchemes.filter((s) =>
    ["SCRAP", "MSME", "SOLAR", "CORPORATE"].includes(s.scheme)
  );

  const exShowroom = Number(selectedVariant?.ex_showroom || 0);
  const defaultDeduction = defaults.reduce(
    (acc, s) => acc + (s.amount || 0),
    0
  );

  let optionalTotal = 0;
  if (selectedExchange)
    optionalTotal +=
      optionalSchemes.find((x) => x.scheme === "SCRAP")?.amount || 0;
  if (selectedMSME)
    optionalTotal +=
      optionalSchemes.find((x) => x.scheme === "MSME")?.amount || 0;
  if (selectedSolar)
    optionalTotal +=
      optionalSchemes.find((x) => x.scheme === "SOLAR")?.amount || 0;
  if (selectedCorporate)
    optionalTotal +=
      optionalSchemes.find((x) => x.scheme === "CORPORATE")?.amount || 0;

  const priceAfterSchemes = exShowroom - defaultDeduction - optionalTotal;

  // ===================
  // RTO / Insurance / Accessories Totals
  // ===================
  const rtoTotal = Number(selectedRTO?.total || 0);
  const insuranceTotal = Number(selectedInsurance?.total || 0);
  const accessoriesTotal = (selectedAccessories || []).reduce(
    (sum, a) => sum + Number(a.price || 0),
    0
  );

  const finalPrice =
    priceAfterSchemes + rtoTotal + insuranceTotal + accessoriesTotal;

  // EMI Calculation
  const principal = finalPrice - Number(downPayment || 0);
  const monthlyRate = Number(interestRate) / 100 / 12;
  const emi =
    monthlyRate === 0
      ? principal / Number(tenure)
      : (principal * monthlyRate * Math.pow(1 + monthlyRate, tenure)) /
        (Math.pow(1 + monthlyRate, tenure) - 1);

  // Save Quotation
  async function handleSave() {
    const name = prompt("Enter customer name to save quotation:");
    if (!name) return;

    setSaving(true);
    const { error } = await supabase.from("quote").insert([
      {
        customer_name: name,
        car_id: selectedCar?.id,
        variant_id: selectedVariant?.id,
        schemes: {
          defaults,
          selectedExchange,
          selectedMSME,
          selectedSolar,
          selectedCorporate,
        },
        rto: selectedRTO,
        insurance: selectedInsurance,
        accessories: selectedAccessories,
        total: finalPrice,
      },
    ]);
    setSaving(false);

    if (error) {
      console.error(error);
      alert("Error saving quote: " + error.message);
    } else {
      alert("Quote saved!");
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 grid md:grid-cols-3 gap-8">
      {/* LEFT SECTION */}
      <div className="md:col-span-2 space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-xl font-medium"
        >
          ← Back
        </button>

        <h1 className="text-3xl font-bold mb-8">Your Summary</h1>

        {/* Car + Variant */}
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-2">Car & Variant</h2>
          <p className="font-medium">{selectedCar?.name || "—"}</p>
          <p className="text-sm text-gray-500">{selectedVariant?.name || "—"}</p>
        </div>

        {/* Schemes */}
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-2">Schemes</h2>
          {defaults.length === 0 &&
          !selectedExchange &&
          !selectedMSME &&
          !selectedSolar &&
          !selectedCorporate ? (
            <p className="text-gray-500 text-sm">No current schemes.</p>
          ) : (
            <ul className="text-sm space-y-1">
              {defaults.map((s) => (
                <li key={s.scheme} className="flex justify-between">
                  <span>{s.scheme.replace("_", " ")}</span>
                  <span>-₹{s.amount.toLocaleString()}</span>
                </li>
              ))}
              {selectedExchange &&
                optionalSchemes.find((x) => x.scheme === "SCRAP") && (
                  <li className="flex justify-between">
                    <span>Exchange / Scrap</span>
                    <span>
                      -₹
                      {optionalSchemes
                        .find((x) => x.scheme === "SCRAP")
                        .amount.toLocaleString()}
                    </span>
                  </li>
                )}
              {selectedMSME &&
                optionalSchemes.find((x) => x.scheme === "MSME") && (
                  <li className="flex justify-between">
                    <span>MSME</span>
                    <span>
                      -₹
                      {optionalSchemes
                        .find((x) => x.scheme === "MSME")
                        .amount.toLocaleString()}
                    </span>
                  </li>
                )}
              {selectedSolar &&
                optionalSchemes.find((x) => x.scheme === "SOLAR") && (
                  <li className="flex justify-between">
                    <span>Solar</span>
                    <span>
                      -₹
                      {optionalSchemes
                        .find((x) => x.scheme === "SOLAR")
                        .amount.toLocaleString()}
                    </span>
                  </li>
                )}
              {selectedCorporate &&
                optionalSchemes.find((x) => x.scheme === "CORPORATE") && (
                  <li className="flex justify-between">
                    <span>Corporate</span>
                    <span>
                      -₹
                      {optionalSchemes
                        .find((x) => x.scheme === "CORPORATE")
                        .amount.toLocaleString()}
                    </span>
                  </li>
                )}
            </ul>
          )}
          <hr className="my-2" />
          <div className="flex justify-between font-bold">
            <span>Price after Schemes</span>
            <span>₹{priceAfterSchemes.toLocaleString()}</span>
          </div>
        </div>

        {/* RTO */}
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-2">RTO Selection</h2>
          {selectedRTO ? (
            <ul className="text-sm space-y-1">
              <li className="flex justify-between">
                <span>Registration Type</span>
                <span>{selectedRTO.reg_type}</span>
              </li>
              <li className="flex justify-between">
                <span>New Registration</span>
                <span>₹{selectedRTO.new_registration || 0}</span>
              </li>
              <li className="flex justify-between">
                <span>Hypothecation Addition</span>
                <span>₹{selectedRTO.hypothecation_addition || 0}</span>
              </li>
              <li className="flex justify-between">
                <span>Duplicate Tax Card</span>
                <span>₹{selectedRTO.duplicate_tax_card || 0}</span>
              </li>
              <li className="flex justify-between">
                <span>MV Tax</span>
                <span>₹{selectedRTO.mv_tax || 0}</span>
              </li>
              <li className="flex justify-between">
                <span>Surcharge on MV Tax</span>
                <span>₹{selectedRTO.surcharge_mv_tax || 0}</span>
              </li>
              <li className="flex justify-between">
                <span>Rebate / Waiver</span>
                <span>{selectedRTO.rebate_waiver || "–"}</span>
              </li>
              <hr />
              <li className="flex justify-between font-bold">
                <span>Total RTO Charges</span>
                <span>₹{selectedRTO.total || 0}</span>
              </li>
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No RTO selected</p>
          )}
        </div>

        {/* Insurance */}
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-2">Insurance</h2>
          {selectedInsurance ? (
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span>Insurer</span>
                <span>{selectedInsurance.insurer_name}</span>
              </div>
              <div className="flex justify-between">
                <span>Basic Premium</span>
                <span>₹{selectedInsurance.basic_premium}</span>
              </div>
              <div className="flex justify-between">
                <span>Third Party Liability</span>
                <span>₹{selectedInsurance.third_party_liability}</span>
              </div>
              {(selectedInsurance.addons || []).map((a, idx) => (
                <div key={idx} className="flex justify-between">
                  <span>{a.label}</span>
                  <span>+₹{a.amount}</span>
                </div>
              ))}
              <hr />
              <div className="flex justify-between font-bold">
                <span>Total Insurance Premium</span>
                <span>₹{selectedInsurance.total}</span>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-sm">No Insurance selected</p>
          )}
        </div>

        {/* Accessories */}
        <div className="bg-white shadow rounded-xl p-6">
          <h2 className="text-xl font-semibold mb-2">Accessories</h2>
          {(selectedAccessories || []).length > 0 ? (
            <ul className="text-sm">
              {selectedAccessories.map((acc) => (
                <li
                  key={acc.id}
                  className="flex justify-between border-b py-1 text-xs"
                >
                  <span>{acc.name}</span>
                  <span>₹{Number(acc.price || 0).toLocaleString()}</span>
                </li>
              ))}
              <hr />
              <li className="flex justify-between font-bold">
                <span>Total Accessories</span>
                <span>₹{accessoriesTotal.toLocaleString()}</span>
              </li>
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No Accessories selected</p>
          )}
        </div>
      </div>

      {/* RIGHT CARD (sticky) */}
      <div className="md:col-span-1">
        <div className="sticky top-6 bg-white shadow rounded-xl p-6 h-fit space-y-4">
          <h2 className="text-2xl font-bold mb-4">Final Price</h2>
          <ul className="space-y-1 text-sm">
            <li className="flex justify-between">
              <span>Ex-Showroom (after Schemes)</span>
              <span>₹{priceAfterSchemes.toLocaleString()}</span>
            </li>
            <li className="flex justify-between">
              <span>RTO</span>
              <span>₹{rtoTotal.toLocaleString()}</span>
            </li>
            <li className="flex justify-between">
              <span>Insurance</span>
              <span>₹{insuranceTotal.toLocaleString()}</span>
            </li>
            <li className="flex justify-between">
              <span>Accessories</span>
              <span>₹{accessoriesTotal.toLocaleString()}</span>
            </li>
          </ul>
          <hr className="my-3" />
          <p className="text-3xl font-extrabold text-blue-600">
            ₹{finalPrice.toLocaleString()}
          </p>

          <button
            onClick={() => setShowEMI(!showEMI)}
            className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-xl font-medium"
          >
            {showEMI ? "Hide EMI Calculator" : "Calculate EMI"}
          </button>

          {showEMI && (
            <div className="space-y-2 text-sm">
              <label>
                Down Payment
                <input
                  type="number"
                  value={downPayment}
                  onChange={(e) => setDownPayment(e.target.value)}
                  className="w-full border rounded px-2 py-1"
                />
              </label>
              <label>
                Tenure (Months)
                <input
                  type="number"
                  value={tenure}
                  onChange={(e) => setTenure(e.target.value)}
                  className="w-full border rounded px-2 py-1"
                />
              </label>
              <label>
                Interest Rate (%)
                <input
                  type="number"
                  value={interestRate}
                  onChange={(e) => setInterestRate(e.target.value)}
                  className="w-full border rounded px-2 py-1"
                />
              </label>
              <p className="text-green-700 font-bold">
                EMI: ₹
                {emi.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                /month
              </p>
            </div>
          )}

          <button
            disabled={saving}
            onClick={handleSave}
            className="w-full bg-green-600 hover:bg-green-700 text-white py-2 rounded-xl font-medium"
          >
            {saving ? "Saving..." : "Save Quotation"}
          </button>
        </div>
      </div>
    </div>
  );
}
