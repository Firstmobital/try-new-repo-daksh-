import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import Papa from "papaparse";

export default function AssignVariantTpType() {
  const [variants, setVariants] = useState([]);
  const [tpTypes, setTpTypes] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  // Load all data
  useEffect(() => {
    loadAll();
  }, []);

  async function loadAll() {
    const { data: v, error: vErr } = await supabase
      .from("model_variant")
      .select("id, name")
      .order("name");
    if (vErr) return alert(vErr.message);
    setVariants(v || []);

    const { data: t, error: tErr } = await supabase
      .from("insurance_tp_type")
      .select("id, name")
      .order("name");
    if (tErr) return alert(tErr.message);
    setTpTypes(t || []);

    const { data: map, error: mErr } = await supabase
      .from("variant_tp_type")
      .select("variant_id, tp_type_id");
    if (mErr) return alert(mErr.message);
    setAssignments(map || []);
  }

  async function handleSave(variantId, tpTypeId) {
    const { error } = await supabase
      .from("variant_tp_type")
      .upsert({ variant_id: variantId, tp_type_id: tpTypeId }, { onConflict: "variant_id" });
    if (error) return alert(error.message);
    loadAll();
  }

  async function exportCSV() {
    const mapped = variants.map((v) => {
      const assigned = assignments.find((a) => a.variant_id === v.id);
      const tpName = tpTypes.find((t) => t.id === assigned?.tp_type_id)?.name || "";
      return { variant: v.name, tp_type: tpName };
    });
    const csv = Papa.unparse(mapped);
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "variant_tp_type.csv";
    a.click();
  }

  async function importCSV(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: async (results) => {
        const rows = results.data;
        const tpTypeMap = Object.fromEntries(tpTypes.map((t) => [t.name, t.id]));
        const variantMap = Object.fromEntries(variants.map((v) => [v.name, v.id]));

        const payload = rows
          .filter((r) => r.variant && r.tp_type)
          .map((r) => ({
            variant_id: variantMap[r.variant],
            tp_type_id: tpTypeMap[r.tp_type],
          }))
          .filter((r) => r.variant_id && r.tp_type_id);

        if (payload.length === 0) return alert("No valid rows found in CSV");

        const { error } = await supabase
          .from("variant_tp_type")
          .upsert(payload, { onConflict: "variant_id" });
        if (error) return alert(error.message);
        alert("Import complete!");
        loadAll();
      },
    });
  }

  const filtered = variants.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase())
  );

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Assign Variant → TP Type</h1>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={exportCSV}>
            Export CSV
          </button>
          <label className="btn btn-outline cursor-pointer">
            Import CSV
            <input type="file" className="hidden" accept=".csv" onChange={importCSV} />
          </label>
        </div>
      </div>

      {/* Search */}
      <div className="flex justify-end">
        <input
          type="text"
          placeholder="Search variant..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>

      {/* Table */}
      <div className="card overflow-x-auto">
        <table className="w-full table-auto border-collapse">
          <thead className="bg-gray-100">
            <tr>
              <th className="text-left p-2">Variant</th>
              <th className="text-left p-2">TP Type</th>
              <th className="text-right p-2">Action</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((v) => {
              const assigned = assignments.find((a) => a.variant_id === v.id);
              return (
                <tr key={v.id} className="border-b">
                  <td className="p-2">{v.name}</td>
                  <td className="p-2">
                    <select
                      className="border rounded px-2 py-1 w-full"
                      value={assigned?.tp_type_id || ""}
                      onChange={(e) => handleSave(v.id, e.target.value)}
                    >
                      <option value="">Select TP Type</option>
                      {tpTypes.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="text-right p-2">
                    {assigned?.tp_type_id ? (
                      <span className="text-green-600 font-medium">Assigned</span>
                    ) : (
                      <span className="text-gray-400 text-sm">Not assigned</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2 mt-4">
        <button
          className="btn btn-outline"
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
        >
          Prev
        </button>
        <span>
          Page {page} of {totalPages || 1}
        </span>
        <button
          className="btn btn-outline"
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
