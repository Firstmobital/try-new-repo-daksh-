import React, { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import FilterSidebar from "../components/FilterSidebar";
import VariantCard from "../components/VariantCard";
import { useQuoteStore } from "../store/quoteStore";
import { useNavigate } from "react-router-dom";

export default function ConfiguratorPage() {
  const navigate = useNavigate();
  const selectedCar = useQuoteStore((s) => s.selectedCar);

  const [fuelTypes, setFuelTypes] = useState([]);
  const [transmissions, setTransmissions] = useState([]);
  const [editions, setEditions] = useState(["Standard", "Dark", "Stealth"]);
  const [variants, setVariants] = useState([]);

  // filters
  const [selectedFuel, setSelectedFuel] = useState("");
  const [selectedTransmission, setSelectedTransmission] = useState("");
  const [selectedEditions, setSelectedEditions] = useState([]);
  const [priceRange, setPriceRange] = useState(3000000);

  // ✅ Reset filters whenever a new car is selected
  useEffect(() => {
    if (selectedCar) {
      setSelectedFuel("");
      setSelectedTransmission("");
      setSelectedEditions([]);
      setPriceRange(3000000);
    }
  }, [selectedCar]);

  // fetch all fuel types from supabase (for sidebar filter)
  useEffect(() => {
    supabase
      .from("fuel_type")
      .select("id,label")
      .then(({ data }) => {
        if (data) {
          setFuelTypes(data);
        }
      })
      .catch(console.error);
  }, []);

  // fetch all transmissions from supabase (for sidebar filter)
  useEffect(() => {
    supabase
      .from("transmission")
      .select("id,label,code")
      .then(({ data }) => {
        if (data) {
          setTransmissions(data);
        }
      })
      .catch(console.error);
  }, []);

  // fetch variants for selected car from supabase
  useEffect(() => {
    if (!selectedCar) return;

    supabase
      .from("model_variant")
      .select(
        `
        *,
        fuel_type:fuel_type_id (id,label),
        transmission:transmission_id (id,label,code)
      `
      )
      .eq("car_id", selectedCar.id)
      .eq("is_published", true)
      .then(({ data, error }) => {
        if (error) {
          console.error(error);
          return;
        }
        const transformed = (data || []).map((v) => ({
          ...v,
          fuel_label: v.fuel_type?.label,
          transmission_label: v.transmission?.label,
          features: typeof v.features === "string"
            ? v.features.split("|").map((f) => f.trim())
            : Array.isArray(v.features)
            ? v.features
            : [],
        }));
        setVariants(transformed);
      })
      .catch(console.error);
  }, [selectedCar]);

  const toggleEdition = (ed) => {
    setSelectedEditions((prev) =>
      prev.includes(ed) ? prev.filter((x) => x !== ed) : [...prev, ed]
    );
  };

  const resetFilters = () => {
    setSelectedFuel("");
    setSelectedTransmission("");
    setSelectedEditions([]);
    setPriceRange(3000000);
  };

  // client-side filter of variants
  const filteredVariants = (variants || []).filter((v) => {
    let ok = true;
    if (selectedFuel && v.fuel_label !== selectedFuel) ok = false;
    if (selectedTransmission && v.transmission_label !== selectedTransmission)
      ok = false;
    if (v.ex_showroom > priceRange) ok = false;
    return ok;
  });

  return (
    <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8 px-4 py-12">
      <FilterSidebar
        // pass full objects for fuel + transmission now
        fuelTypes={fuelTypes.map((f) => f.label)}
        selectedFuel={selectedFuel}
        setFuel={setSelectedFuel}
        transmissions={transmissions.map((t) => t.label)}
        selectedTransmission={selectedTransmission}
        setTransmission={setSelectedTransmission}
        editions={editions}
        selectedEditions={selectedEditions}
        toggleEdition={toggleEdition}
        priceRange={priceRange}
        setPriceRange={setPriceRange}
        resetFilters={resetFilters}
      />

      <main className="md:col-span-3 space-y-8">
        {/* ✅ Back Button */}
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">
            {selectedCar ? selectedCar.name : "Select a Car"}
          </h1>
          <button
            onClick={() => navigate("/")}
            className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm font-medium"
          >
            ← Back
          </button>
        </div>

        {(filteredVariants || []).length > 0 ? (
          <div className="grid md:grid-cols-3 gap-6">
            {filteredVariants.map((variant) => (
              <VariantCard key={variant.id} variant={variant} />
            ))}
          </div>
        ) : (
          <p className="text-gray-500">No variants match your filters.</p>
        )}
      </main>
    </div>
  );
}
