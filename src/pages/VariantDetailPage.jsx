// src/pages/VariantDetailPage.jsx
import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  getVariant,
  getVariantContent,
  getSchemesForVariant,
} from "../utils/api";
import { useQuoteStore } from "../store/quoteStore";

export default function VariantDetailPage() {
  const { variantId } = useParams();
  const navigate = useNavigate();
  const { setVariant } = useQuoteStore();

  const [variant, setLocalVariant] = useState(null);
  const [content, setContent] = useState(null);
  const [schemes, setSchemes] = useState([]);
  const [mainImage, setMainImage] = useState(null);

  // optional schemes state
  const [selectedExchange, setSelectedExchange] = useState(false);
  const [selectedMSME, setSelectedMSME] = useState(false);
  const [selectedSolar, setSelectedSolar] = useState(false);
  const [selectedCorporate, setSelectedCorporate] = useState(false);

  useEffect(() => {
    if (!variantId) return;

    getVariant(variantId).then(setLocalVariant).catch(console.error);

    getVariantContent(variantId)
      .then((c) => {
        if (!c) return;
        const imgs = [
          c.image1_url,
          c.image2_url,
          c.image3_url,
          c.image4_url,
          c.image5_url,
          c.image6_url,
          c.image7_url,
        ].filter(Boolean);

        setContent({
          ...c,
          features: typeof c.features === "string"
            ? c.features.split("|").map((f) => f.trim()).filter(Boolean)
            : Array.isArray(c.features)
            ? c.features
            : [],
          images: imgs,
        });

        if (imgs.length > 0) setMainImage(imgs[0]);
      })
      .catch(console.error);

    getSchemesForVariant(variantId).then(setSchemes).catch(console.error);
  }, [variantId]);

  if (!variant) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-16 text-center">
        <p className="text-gray-500">Loading variant…</p>
      </div>
    );
  }

  // Scheme logic
  const defaults = schemes.filter((s) =>
    ["CONSUMER", "GREEN_BONUS", "INTERVENTION"].includes(s.scheme)
  );
  const optional = schemes.filter((s) =>
    ["SCRAP", "MSME", "SOLAR", "CORPORATE"].includes(s.scheme)
  );

  const exShowroom = Number(variant.ex_showroom || 0);
  const defaultDeduction = defaults.reduce((acc, s) => acc + (s.amount || 0), 0);

  let optionalTotal = 0;
  if (selectedExchange)
    optionalTotal += optional.find((x) => x.scheme === "SCRAP")?.amount || 0;
  if (selectedMSME)
    optionalTotal += optional.find((x) => x.scheme === "MSME")?.amount || 0;
  if (selectedSolar)
    optionalTotal += optional.find((x) => x.scheme === "SOLAR")?.amount || 0;
  if (selectedCorporate)
    optionalTotal += optional.find((x) => x.scheme === "CORPORATE")?.amount || 0;

  const finalPrice = exShowroom - defaultDeduction - optionalTotal;
  const amt = (v) => (v > 0 ? `-₹${v.toLocaleString()}` : null);

  const handleNext = () => {
    setVariant({
      ...variant,
      schemes,
      selectedExchange,
      selectedMSME,
      selectedSolar,
      selectedCorporate,
    });
    navigate(`/rto/${variantId}`);
  };

  return (
    <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8 px-4 py-12">
      {/* LEFT COLUMN */}
      <div className="md:col-span-2 space-y-6">
        <button
          onClick={() => navigate(-1)}
          className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-3 py-1 rounded-lg text-sm"
        >
          ← Back
        </button>

        <h1 className="text-3xl font-bold">{variant.name}</h1>

        {/* IMAGE GALLERY */}
        {content?.images?.length > 0 && (
          <div className="space-y-3">
            <div className="w-full h-72 bg-gray-100 rounded-xl flex items-center justify-center overflow-hidden">
              <img
                src={mainImage}
                alt="Main"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {content.images.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`thumb-${idx}`}
                  className={`h-20 w-full object-cover rounded cursor-pointer border ${
                    mainImage === img ? "border-blue-500" : "border-transparent"
                  }`}
                  onClick={() => setMainImage(img)}
                />
              ))}
            </div>
          </div>
        )}

        {/* FEATURES */}
        <div className="card p-6">
          <h2 className="text-xl font-bold mb-4">Key Features</h2>
          {content?.features?.length > 0 ? (
            <ul className="grid md:grid-cols-2 gap-x-6 gap-y-2 text-sm text-gray-700">
              {content.features.map((f, idx) => (
                <li key={idx} className="flex items-start space-x-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 mt-2"></span>
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-sm">No features added yet.</p>
          )}
        </div>
      </div>

      {/* RIGHT COLUMN (unchanged) */}
      <div className="md:col-span-1 space-y-6 sticky top-6">
        {/* Price Breakdown */}
        <div className="card p-6">
          <h2 className="text-xl font-bold mb-4">Price Breakdown</h2>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span>Ex-Showroom</span>
              <span>₹{exShowroom.toLocaleString()}</span>
            </div>

            {defaults.map(
              (s) =>
                s.amount > 0 && (
                  <div className="flex justify-between" key={s.scheme}>
                    <span>{s.scheme.replace("_", " ")}</span>
                    <span>{amt(s.amount)}</span>
                  </div>
                )
            )}

            {selectedExchange &&
              optional.find((x) => x.scheme === "SCRAP")?.amount > 0 && (
                <div className="flex justify-between">
                  <span>Exchange / Scrap</span>
                  <span>
                    {amt(optional.find((x) => x.scheme === "SCRAP").amount)}
                  </span>
                </div>
              )}

            {selectedMSME &&
              optional.find((x) => x.scheme === "MSME")?.amount > 0 && (
                <div className="flex justify-between">
                  <span>MSME</span>
                  <span>
                    {amt(optional.find((x) => x.scheme === "MSME").amount)}
                  </span>
                </div>
              )}

            {selectedSolar &&
              optional.find((x) => x.scheme === "SOLAR")?.amount > 0 && (
                <div className="flex justify-between">
                  <span>Solar</span>
                  <span>
                    {amt(optional.find((x) => x.scheme === "SOLAR").amount)}
                  </span>
                </div>
              )}

            {selectedCorporate &&
              optional.find((x) => x.scheme === "CORPORATE")?.amount > 0 && (
                <div className="flex justify-between">
                  <span>Corporate</span>
                  <span>
                    {amt(optional.find((x) => x.scheme === "CORPORATE").amount)}
                  </span>
                </div>
              )}

            <div className="flex justify-between font-bold pt-3 border-t">
              <span>Final Price</span>
              <span>₹{finalPrice.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* Scheme Selection */}
        <div className="card p-6">
          <h2 className="text-xl font-bold mb-4">Choose Schemes</h2>
          {optional.length > 0 ? (
            <div className="space-y-3 text-sm">
              {/* existing scheme selection code unchanged */}
              {optional.find((x) => x.scheme === "SCRAP") && (
                <div className="flex items-center space-x-2">
                  <input
                    id="exchange"
                    type="checkbox"
                    checked={selectedExchange}
                    onChange={() => setSelectedExchange(!selectedExchange)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="exchange" className="flex-1 cursor-pointer">
                    Exchange / Scrap
                  </label>
                </div>
              )}
              {optional.find((x) => x.scheme === "MSME") && (
                <div className="flex items-center space-x-2">
                  <input
                    id="msme"
                    type="radio"
                    name="msmeSolar"
                    checked={selectedMSME}
                    onChange={() => {
                      setSelectedMSME(true);
                      setSelectedSolar(false);
                    }}
                    className="w-4 h-4"
                  />
                  <label htmlFor="msme" className="flex-1 cursor-pointer">
                    MSME
                  </label>
                </div>
              )}
              {optional.find((x) => x.scheme === "SOLAR") && (
                <div className="flex items-center space-x-2">
                  <input
                    id="solar"
                    type="radio"
                    name="msmeSolar"
                    checked={selectedSolar}
                    onChange={() => {
                      setSelectedSolar(true);
                      setSelectedMSME(false);
                    }}
                    className="w-4 h-4"
                  />
                  <label htmlFor="solar" className="flex-1 cursor-pointer">
                    Solar
                  </label>
                </div>
              )}
              {optional.find((x) => x.scheme === "CORPORATE") && (
                <div className="flex items-center space-x-2">
                  <input
                    id="corporate"
                    type="checkbox"
                    checked={selectedCorporate}
                    onChange={() => setSelectedCorporate(!selectedCorporate)}
                    className="w-4 h-4"
                  />
                  <label htmlFor="corporate" className="flex-1 cursor-pointer">
                    Corporate
                  </label>
                </div>
              )}
            </div>
          ) : (
            <p className="text-xs text-gray-500">
              No optional schemes available for this variant.
            </p>
          )}
        </div>

        <button
          onClick={handleNext}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-xl font-medium"
        >
          Next → Select RTO
        </button>
      </div>
    </div>
  );
}
