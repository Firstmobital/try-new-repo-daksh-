// src/components/PriceCalculator.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export default function PriceCalculator({ variant }) {
  const [schemes, setSchemes] = useState([]);
  const [selectedSchemes, setSelectedSchemes] = useState([]);

  useEffect(() => {
    if (!variant?.id) return;

    // fetch schemes for variant
    supabase
      .from("scheme_rule")
      .select("scheme,amount")
      .eq("variant_id", variant.id)
      .then(({ data, error }) => {
        if (error) console.error(error);
        if (data) setSchemes(data);
      });
  }, [variant]);

  // handle toggle
  const toggleScheme = (scheme) => {
    setSelectedSchemes((prev) =>
      prev.includes(scheme)
        ? prev.filter((s) => s !== scheme)
        : [...prev, scheme]
    );
  };

  // compute total deduction
  const deduction = schemes
    .filter((s) => selectedSchemes.includes(s.scheme))
    .reduce((sum, s) => sum + (s.amount || 0), 0);

  const exShowroom = Number(variant.ex_showroom || 0);
  const finalPrice = exShowroom - deduction; // RTO to add later

  return (
    <div className="card p-6">
      <h2 className="text-2xl font-bold mb-4">Pricing</h2>
      <div className="mb-4">
        <p className="text-gray-500 text-sm">Ex-Showroom</p>
        <p className="text-2xl font-bold">
          ₹{exShowroom.toLocaleString()}
        </p>
      </div>

      <h3 className="text-lg font-semibold mb-2">Available Schemes</h3>
      <div className="space-y-2">
        {schemes.length > 0 ? (
          schemes.map((s) => (
            <div key={s.scheme} className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="w-4 h-4"
                checked={selectedSchemes.includes(s.scheme)}
                onChange={() => toggleScheme(s.scheme)}
              />
              <label className="flex-1 cursor-pointer">
                {s.scheme}
              </label>
              <span className="text-green-600 font-medium">
                -₹{s.amount.toLocaleString()}
              </span>
            </div>
          ))
        ) : (
          <p className="text-gray-400 text-sm">No schemes found</p>
        )}
      </div>

      <div className="mt-6 border-t pt-4">
        <p className="text-gray-500 text-sm">Final Price</p>
        <p className="text-3xl font-extrabold">
          ₹{finalPrice.toLocaleString()}
        </p>
      </div>
    </div>
  );
}
