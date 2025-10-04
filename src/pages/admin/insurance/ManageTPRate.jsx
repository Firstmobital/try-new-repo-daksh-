// src/pages/admin/insurance/ManageTpRates.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import Papa from "papaparse";

export default function ManageTpRates() {
  const [variants, setVariants] = useState([]);
  const [rates, setRates] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: v } = await supabase.from("model_variant").select("id,name");
    setVariants(v || []);

    const { data, error } = await supabase.from("insurance_tp_rate").select("*");
    if (error) return alert(error.message);
    setRates(data || []);
  }

  async function save(r) {
    const { error } = await supabase
      .from("insurance_tp_rate")
      .upsert(
        { variant_id: r.variant_id, tp_amount: r.tp_amount },
        { onConflict: "variant_id" }
      );
    if (error) return alert(error.message);
    load();
  }

  function exportCSV() {
    const rows = variants.map(v => {
      const found = rates.find(r => r.variant_id === v.id);
      return { variant: v.name, tp_amount: found?.tp_amount || 0 };
    });
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tp_rates.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importCSV(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: async (res) => {
        const payload = res.data
          .map(row => {
            const variant = variants.find(v => v.name === row.variant);
            return variant
              ? { variant_id: variant.id, tp_amount: Number(row.tp_amount) || 0 }
              : null;
          })
          .filter(Boolean);
        const { error } = await supabase
          .from("insurance_tp_rate")
          .upsert(payload, { onConflict: "variant_id" });
        if (error) return alert(error.message);
        load();
      },
    });
  }

  const rows = variants.map(v => ({
    variant_id: v.id,
    name: v.name,
    tp_amount: rates.find(r => r.variant_id === v.id)?.tp_amount || 0,
  }));

  const filtered = rows.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase())
  );
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Third Party (TP) Rates</h2>

      <div className="flex gap-2">
        <button onClick={exportCSV} className="btn btn-outline">Export</button>
        <label className="btn btn-outline cursor-pointer">
          Import
          <input
            type="file"
            className="hidden"
            accept=".csv"
            onChange={importCSV}
          />
        </label>
      </div>

      <input
        placeholder="Search variant…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="border rounded px-2 py-1 w-full"
      />

      <table className="table w-full mt-4">
        <thead>
          <tr>
            <th>Variant</th>
            <th>Third Party Amount (₹)</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map((r) => (
            <tr key={r.variant_id}>
              <td>{r.name}</td>
              <td>
                <input
                  type="number"
                  value={r.tp_amount}
                  onChange={(e) => {
                    const val = Number(e.target.value);
                    setRates((prev) => [
                      ...prev.filter((x) => x.variant_id !== r.variant_id),
                      { variant_id: r.variant_id, tp_amount: val },
                    ]);
                  }}
                  className="border rounded px-2 py-1 w-28"
                />
              </td>
              <td>
                <button
                  onClick={() => save(r)}
                  className="btn btn-primary"
                >
                  Save
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-center gap-2 mt-2">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
          className="btn btn-outline"
        >
          Prev
        </button>
        <span>
          Page {page} of {totalPages || 1}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage((p) => p + 1)}
          className="btn btn-outline"
        >
          Next
        </button>
      </div>
    </div>
  );
}
