// src/components/VariantGallery.jsx
import React from "react";

export default function VariantGallery({ images = [], fallback }) {
  if (!images.length && !fallback) {
    return (
      <div className="card p-6 text-gray-400 text-center">
        No Images Available
      </div>
    );
  }

  return (
    <div className="card overflow-hidden">
      <div className="grid grid-cols-3 gap-2">
        {images.length > 0
          ? images.map((url, i) => (
              <img
                key={i}
                src={url}
                alt={`Variant ${i + 1}`}
                className="w-full h-32 object-cover rounded"
              />
            ))
          : (
            <img
              src={fallback}
              alt="Variant main"
              className="w-full object-cover rounded"
            />
          )}
      </div>
    </div>
  );
}
