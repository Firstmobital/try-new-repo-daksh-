// src/components/CarGrid.jsx
import { useEffect, useState } from "react";
import { getCars } from "../utils/api";
import { useQuoteStore } from "../store/quoteStore";
import { useNavigate } from "react-router-dom";

export default function CarGrid() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const cars = useQuoteStore((s) => s.cars);
  const setCars = useQuoteStore((s) => s.setCars);
  const selectCar = useQuoteStore((s) => s.selectCar);

  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const list = await getCars();
        setCars(list);
      } catch (e) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) return <div className="p-6">Loading cars…</div>;
  if (err) return <div className="p-6 text-red-600">{String(err)}</div>;

  return (
    <div className="grid grid-cols-3 gap-6">
      {(cars || []).map((c) => (
        <button
          key={c.id}
          onClick={() => {
            selectCar(c); // set car in store
            navigate("/configurator"); // go to configurator page
          }}
          className="card text-left overflow-hidden group"
        >
          <div className="h-40 bg-gray-100 overflow-hidden">
            {c.hero_image_url ? (
              <img
                src={c.hero_image_url}
                alt={c.name}
                className="w-full h-full object-cover group-hover:scale-[1.02] transition"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">
                No Image
              </div>
            )}
          </div>
          <div className="p-4">
            <div className="font-semibold text-base">{c.name}</div>
            <div className="text-xs text-gray-500">
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}
