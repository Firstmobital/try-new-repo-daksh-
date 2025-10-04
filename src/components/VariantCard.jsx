import React from "react";
import { Link, useNavigate } from "react-router-dom";

export default function VariantCard({ variant, showBack = false }) {
  const navigate = useNavigate();

  return (
    <div className="relative bg-white rounded-2xl shadow-lg overflow-hidden group hover:shadow-xl transition">
      {/* Optional Back Button */}
      {showBack && (
        <button
          onClick={() => navigate(-1)}
          className="absolute top-2 left-2 z-10 bg-gray-200 hover:bg-gray-300 text-gray-800 px-2 py-1 rounded-lg text-xs"
        >
          ← Back
        </button>
      )}

      {/* Wrap the image + info in Link */}
      <Link to={`/variant/${variant.id}`}>
        {/* Image */}
        <div className="h-40 bg-gray-100 overflow-hidden">
          {variant.image_url ? (
            <img
              src={variant.image_url}
              alt={variant.name}
              className="w-full h-full object-cover group-hover:scale-[1.02] transition"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              No Image
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4 space-y-1">
          <h3 className="text-base font-semibold text-gray-900">
            {variant.name}
          </h3>
          <p className="text-sm text-gray-500">
            {variant.fuel_label || variant.fuel_type_label} •{" "}
            {variant.transmission_label || "—"}
          </p>
          <p className="text-lg font-bold text-blue-600">
            ₹{Number(variant.ex_showroom || 0).toLocaleString()}
          </p>
        </div>

        {/* Features Preview */}
        {variant.features && variant.features.length > 0 && (
          <div className="px-4 pb-4">
            <ul className="text-xs text-gray-600 space-y-1">
              {variant.features.slice(0, 4).map((f, idx) => (
                <li key={idx} className="flex items-center space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </Link>
    </div>
  );
}
