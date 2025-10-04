// src/pages/admin/insurance/ManageTpTypes.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import Papa from "papaparse";

export default function ManageTpTypes() {
  const [tpTypes, setTpTypes] = useState([]);
  const [newTpType, setNewTpType] = useState({ name: "", description: "" });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data, error } = await supabase
      .from("insurance_tp_type")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) return alert(error.message);
    setTpTypes(data || []);
  }

  async function addTpType() {
    if (!newTpType.name.trim()) return alert("Enter TP Type name");
    const { error } = await supabase
      .from("insurance_tp_type")
      .insert([newTpType]);
    if (error) return alert(error.message);
    setNewTpType({ name: "", description: "" });
    load();
  }

  async function updateTpType(id, field, value) {
    const { error } = await supabase
      .from("insurance_tp_type")
      .update({ [field]: value })
      .eq("id", id);
    if (error) alert(error.message);
  }

  async function deleteTpType(id) {
    if (!confirm("Delete this TP Type?")) return;
    const { error } = await supabase
      .from("insurance_tp_type")
      .delete()
      .eq("id", id);
    if (error) alert(error.message);
    else load();
  }

  // Import CSV
  async function importCSV(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: async (res) => {
        const payload = res.data
          .filter((r) => r.name)
          .map((r) => ({
            name: r.name.trim(),
            description: r.description || "",
          }));
        const { error } = await supabase
          .from("insurance_tp_type")
          .upsert(payload, { onConflict: "name" });
        if (error) return alert(error.message);
        load();
      },
    });
  }

  // Export CSV
  function exportCSV() {
    const csv = Papa.unparse(tpTypes);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "tp_types.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // Filtered + paginated
  const filtered = tpTypes.filter((t) =>
    t.name.toLowerCase().includes(search.toLowerCase())
  );
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Manage TP Types</h1>
        <div className="flex gap-2">
          <button onClick={exportCSV} className="btn btn-outline">
            Export CSV
          </button>
          <label className="btn btn-outline cursor-pointer">
            Import CSV
            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={importCSV}
            />
          </label>
        </div>
      </header>

      {/* Add Form */}
      <div className="card p-4 grid grid-cols-3 gap-3">
        <input
          className="border rounded px-3 py-2"
          placeholder="TP Type name"
          value={newTpType.name}
          onChange={(e) =>
            setNewTpType({ ...newTpType, name: e.target.value })
          }
        />
        <input
          className="border rounded px-3 py-2"
          placeholder="Description"
          value={newTpType.description}
          onChange={(e) =>
            setNewTpType({ ...newTpType, description: e.target.value })
          }
        />
        <button
          onClick={addTpType}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded px-4 py-2"
        >
          Add
        </button>
      </div>

      {/* Search */}
      <div className="flex justify-end">
        <input
          type="text"
          placeholder="Search TP Type..."
          className="border rounded px-3 py-2"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="card p-4 overflow-x-auto">
        <table className="w-full text-left border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Name</th>
              <th className="p-2">Description</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((t) => (
              <tr key={t.id} className="border-b">
                <td className="p-2">
                  <input
                    className="border rounded px-2 py-1 w-full"
                    value={t.name}
                    onChange={(e) =>
                      updateTpType(t.id, "name", e.target.value)
                    }
                  />
                </td>
                <td className="p-2">
                  <input
                    className="border rounded px-2 py-1 w-full"
                    value={t.description || ""}
                    onChange={(e) =>
                      updateTpType(t.id, "description", e.target.value)
                    }
                  />
                </td>
                <td className="p-2 text-right">
                  <button
                    onClick={() => deleteTpType(t.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={3} className="p-4 text-center text-gray-500">
                  No TP types found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center items-center gap-2">
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
