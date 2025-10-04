import React from "react";

export default function FilterSidebar({
  fuelTypes,
  selectedFuel,
  setFuel,
  transmissions,
  selectedTransmission,
  setTransmission,
  editions,
  selectedEditions,
  toggleEdition,
  priceRange,
  setPriceRange,
  resetFilters,
}) {
  return (
    <aside className="bg-white rounded-2xl shadow-xl p-6 space-y-8">
      <h2 className="text-2xl font-bold mb-4">Filters</h2>

      {/* Fuel Types */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Fuel</h3>
        <div className="grid grid-cols-2 gap-2">
          {(fuelTypes || []).map((fuel) => (
            <button
              key={fuel}
              className={`px-3 py-2 rounded border text-sm ${
                selectedFuel === fuel
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
              onClick={() => setFuel(fuel)}
            >
              {fuel}
            </button>
          ))}
        </div>
      </div>

      {/* Transmission */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Transmission</h3>
        <div className="grid grid-cols-2 gap-2">
          {(transmissions || []).map((tx) => (
            <button
              key={tx}
              className={`px-3 py-2 rounded border text-sm ${
                selectedTransmission === tx
                  ? "bg-blue-600 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
              onClick={() => setTransmission(tx)}
            >
              {tx}
            </button>
          ))}
        </div>
      </div>

      {/* Editions */}
      <div>
        <h3 className="text-lg font-semibold mb-2">Edition</h3>
        <div className="space-y-2">
          {(editions || []).map((ed) => (
            <div key={ed} className="flex items-center space-x-2">
              <input
                type="checkbox"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                checked={selectedEditions.includes(ed)}
                onChange={() => toggleEdition(ed)}
                id={`edition-${ed}`}
              />
              <label
                htmlFor={`edition-${ed}`}
                className="text-sm text-gray-700 cursor-pointer"
              >
                {ed}
              </label>
            </div>
          ))}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="text-lg font-semibold mb-2">
          Price ≤ ₹{priceRange.toLocaleString()}
        </h3>
        <input
          type="range"
          min={100000}
          max={4000000}
          step={50000}
          value={priceRange}
          onChange={(e) => setPriceRange(Number(e.target.value))}
          className="w-full accent-blue-600"
        />
      </div>

      {/* Reset button */}
      <button
        onClick={resetFilters}
        className="w-full bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded-xl font-medium text-sm"
      >
        Reset Filters
      </button>
    </aside>
  );
}
