// src/pages/AccessoriesPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useQuoteStore } from "../store/quoteStore";

export default function AccessoriesPage() {
  const { carId } = useParams();
  const navigate = useNavigate();

  // Zustand store
  const selectedVariant = useQuoteStore((s) => s.selectedVariant);
  const selectedAccessories = useQuoteStore((s) => s.selectedAccessories || []);
  const setSelectedAccessories = useQuoteStore((s) => s.setSelectedAccessories);

  const [accessories, setAccessories] = useState([]);

  // Fetch accessories for this car
  useEffect(() => {
    async function fetchAcc() {
      const { data, error } = await supabase
        .from("car_accessory")
        .select("*")
        .eq("car_id", carId)
        .eq("active", true);
      if (error) {
        console.error(error);
        return;
      }
      setAccessories(data || []);
    }
    fetchAcc();
  }, [carId]);

  const toggleAccessory = (acc) => {
    const current = [...selectedAccessories];
    const index = current.findIndex((x) => x.id === acc.id);
    if (index !== -1) {
      current.splice(index, 1);
    } else {
      current.push(acc);
    }
    setSelectedAccessories(current);
  };

  // derive selected details
  const selectedDetails = selectedAccessories;

  const total = selectedDetails.reduce(
    (sum, a) => sum + Number(a.price || 0),
    0
  );

  return (
    <div className="max-w-7xl mx-auto px-4 py-12 grid md:grid-cols-3 gap-8">
      <div className="md:col-span-2 space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-xl font-medium"
        >
          ← Back
        </button>

        <h1 className="text-3xl font-bold mb-6">Choose Accessories</h1>

        {accessories.length === 0 && (
          <p className="text-gray-500">No accessories found for this car yet.</p>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {(accessories || []).map((a) => {
            const isSelected = selectedDetails.some((x) => x.id === a.id);
            return (
              <div
                key={a.id}
                className={`bg-white rounded-xl shadow-md hover:shadow-xl transition p-4 flex flex-col ${
                  isSelected ? "ring-2 ring-blue-500" : ""
                }`}
              >
                <div className="h-32 bg-gray-100 rounded mb-4 overflow-hidden">
                  {a.image_url ? (
                    <img
                      src={a.image_url}
                      alt={a.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full text-gray-400">
                      No Image
                    </div>
                  )}
                </div>
                <h3 className="text-base font-semibold mb-1">{a.name}</h3>
                <p className="text-xs text-gray-500 mb-1">
                  Part No: {a.part_number}
                </p>
                <p className="text-sm font-bold text-blue-600 mb-3">
                  ₹{Number(a.price || 0).toLocaleString()}
                </p>
                <button
                  onClick={() => toggleAccessory(a)}
                  className={`px-3 py-1 rounded text-sm font-medium ${
                    isSelected
                      ? "bg-blue-600 text-white"
                      : "bg-gray-200 text-gray-800"
                  }`}
                >
                  {isSelected ? "Remove" : "Add"}
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right sticky total */}
      <div className="md:col-span-1">
        <div className="sticky top-6 bg-white rounded-xl shadow-xl p-6 space-y-4">
          <h2 className="text-xl font-bold mb-4">Selected Accessories</h2>
          {selectedDetails.length === 0 && (
            <p className="text-gray-500 text-sm">No accessories selected.</p>
          )}
          <ul className="text-sm space-y-1 max-h-64 overflow-auto">
            {selectedDetails.map((a) => (
              <li key={a.id} className="flex justify-between">
                <span>{a.name}</span>
                <span>₹{Number(a.price || 0).toLocaleString()}</span>
              </li>
            ))}
          </ul>
          <div className="border-t pt-2">
            <p className="text-lg font-bold text-blue-600">
              Total: ₹{total.toLocaleString()}
            </p>
          </div>
          <button
            onClick={() =>
              navigate(`/summary/${selectedVariant?.id || carId}`)
            }
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl font-medium"
          >
            Continue to Summary
          </button>
        </div>
      </div>
    </div>
  );
}
