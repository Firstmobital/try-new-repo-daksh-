// src/pages/admin/insurance/ManageAddons.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import Papa from "papaparse";

export default function ManageAddons() {
  const [companies, setCompanies] = useState([]);
  const [addons, setAddons] = useState([]);
  const [tpTypes, setTpTypes] = useState([]);
  const [rates, setRates] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [editingAddonId, setEditingAddonId] = useState(null);

  const [newAddon, setNewAddon] = useState({ name: "", description: "" });
  const [newTpType, setNewTpType] = useState("");

  useEffect(() => {
    loadMeta();
  }, []);

  useEffect(() => {
    if (selectedCompany) loadRates();
  }, [selectedCompany]);

  async function loadMeta() {
    const [c, a, t] = await Promise.all([
      supabase.from("insurance_company").select("id,name").order("name"),
      supabase.from("insurance_addon").select("id,name,description").order("name"),
      supabase.from("insurance_tp_type").select("id,name").order("name"),
    ]);
    setCompanies(c.data || []);
    setAddons(a.data || []);
    setTpTypes(t.data || []);
  }

  async function loadRates() {
    const { data, error } = await supabase
      .from("insurance_addon_rate")
      .select("addon_id,tp_type_id,percentage")
      .eq("company_id", selectedCompany);
    if (error) return alert(error.message);
    setRates(data || []);
  }

  // Add / Delete Addon
  async function addAddon() {
    if (!newAddon.name.trim()) return alert("Enter addon name");
    const { error } = await supabase.from("insurance_addon").insert(newAddon);
    if (error) return alert(error.message);
    setNewAddon({ name: "", description: "" });
    loadMeta();
  }

  async function deleteAddon(id) {
    if (!confirm("Delete this addon?")) return;
    const { error } = await supabase.from("insurance_addon").delete().eq("id", id);
    if (error) return alert(error.message);
    loadMeta();
  }

  async function saveAddonEdit(addon) {
    const { error } = await supabase
      .from("insurance_addon")
      .update({ name: addon.name, description: addon.description })
      .eq("id", addon.id);
    if (error) return alert(error.message);
    setEditingAddonId(null);
    loadMeta();
  }

  // TP Types
  async function addTpType() {
    if (!newTpType.trim()) return alert("Enter TP Type name");
    const { error } = await supabase.from("insurance_tp_type").insert([{ name: newTpType }]);
    if (error) return alert(error.message);
    setNewTpType("");
    loadMeta();
  }

  async function deleteTpType(id) {
    if (!confirm("Delete this TP Type?")) return;
    const { error } = await supabase.from("insurance_tp_type").delete().eq("id", id);
    if (error) return alert(error.message);
    loadMeta();
  }

  // Save Rate
  async function saveRate(addonId, tpTypeId, value) {
    const payload = {
      company_id: selectedCompany,
      addon_id: addonId,
      tp_type_id: tpTypeId,
      percentage: Number(value || 0),
    };
    const { error } = await supabase
      .from("insurance_addon_rate")
      .upsert(payload, { onConflict: "company_id,addon_id,tp_type_id" });
    if (error) return alert(error.message);
    setRates((prev) => {
      const i = prev.findIndex(
        (r) => r.addon_id === addonId && r.tp_type_id === tpTypeId
      );
      if (i > -1) {
        const clone = [...prev];
        clone[i].percentage = payload.percentage;
        return clone;
      }
      return [...prev, payload];
    });
  }

  // CSV Export / Import
  async function exportCSV() {
    const company = companies.find((c) => c.id === selectedCompany);
    if (!company) return alert("Select company first.");

    const rows = addons.map((addon) => {
      const base = {
        company: company.name,
        addon_name: addon.name,
        description: addon.description || "",
      };
      tpTypes.forEach((tp) => {
        const found = rates.find(
          (r) => r.addon_id === addon.id && r.tp_type_id === tp.id
        );
        base[tp.name] = found ? found.percentage : 0;
      });
      return base;
    });

    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `addon_rates_${company.name}.csv`;
    a.click();
  }

  async function importCSV(e) {
    const file = e.target.files?.[0];
    if (!file || !selectedCompany) return alert("Select company first");
    Papa.parse(file, {
      header: true,
      complete: async (res) => {
        const rows = res.data;
        const tpMap = Object.fromEntries(tpTypes.map((t) => [t.name, t.id]));
        const addonMap = Object.fromEntries(addons.map((a) => [a.name, a.id]));

        const payload = [];
        rows.forEach((r) => {
          const addonId = addonMap[r.addon_name];
          if (!addonId) return;
          Object.keys(r).forEach((k) => {
            if (tpMap[k]) {
              payload.push({
                company_id: selectedCompany,
                addon_id: addonId,
                tp_type_id: tpMap[k],
                percentage: Number(r[k] || 0),
              });
            }
          });
        });

        const { error } = await supabase
          .from("insurance_addon_rate")
          .upsert(payload, { onConflict: "company_id,addon_id,tp_type_id" });

        if (error) alert(error.message);
        else {
          alert("Import complete!");
          loadRates();
        }
      },
    });
  }

  // Pagination + Search
  const filtered = addons.filter((a) =>
    a.name.toLowerCase().includes(search.toLowerCase())
  );
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-xl font-bold">Manage Addons & TP %</h1>
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

      {/* Create Addon */}
      <div className="flex gap-2 items-end">
        <input
          placeholder="Addon name"
          className="border rounded px-2 py-1"
          value={newAddon.name}
          onChange={(e) => setNewAddon({ ...newAddon, name: e.target.value })}
        />
        <input
          placeholder="Description"
          className="border rounded px-2 py-1 flex-1"
          value={newAddon.description}
          onChange={(e) =>
            setNewAddon({ ...newAddon, description: e.target.value })
          }
        />
        <button className="btn btn-primary" onClick={addAddon}>
          + Add Addon
        </button>
      </div>

      {/* TP Types */}
      <div className="flex gap-2 items-end">
        <input
          placeholder="New TP Type"
          className="border rounded px-2 py-1"
          value={newTpType}
          onChange={(e) => setNewTpType(e.target.value)}
        />
        <button className="btn btn-primary" onClick={addTpType}>
          + Add TP Type
        </button>
      </div>

      {/* Company Dropdown */}
      <div className="flex gap-4 items-center">
        <label className="font-medium">Select Company:</label>
        <select
          className="border rounded px-3 py-2"
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
        >
          <option value="">-- Choose --</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* Search */}
      <div className="flex justify-end">
        <input
          placeholder="Search addon..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>

      {/* Table */}
      {selectedCompany ? (
        <div className="overflow-x-auto card">
          <table className="w-full border-collapse">
            <thead className="bg-gray-100">
              <tr>
                <th className="p-2 text-left">Addon</th>
                <th className="p-2 text-left">Description</th>
                {tpTypes.map((tp) => (
                  <th key={tp.id} className="p-2 text-center">
                    {tp.name}
                  </th>
                ))}
                <th></th>
              </tr>
            </thead>
            <tbody>
              {paginated.map((a) => (
                <tr key={a.id} className="border-b">
                  {editingAddonId === a.id ? (
                    <>
                      <td className="p-2">
                        <input
                          className="border rounded px-2 py-1 w-full"
                          value={a.name}
                          onChange={(e) =>
                            setAddons((prev) =>
                              prev.map((x) =>
                                x.id === a.id ? { ...x, name: e.target.value } : x
                              )
                            )
                          }
                        />
                      </td>
                      <td className="p-2">
                        <input
                          className="border rounded px-2 py-1 w-full"
                          value={a.description || ""}
                          onChange={(e) =>
                            setAddons((prev) =>
                              prev.map((x) =>
                                x.id === a.id
                                  ? { ...x, description: e.target.value }
                                  : x
                              )
                            )
                          }
                        />
                      </td>
                    </>
                  ) : (
                    <>
                      <td className="p-2">{a.name}</td>
                      <td className="p-2 text-sm text-gray-600">{a.description}</td>
                    </>
                  )}

                  {tpTypes.map((tp) => {
                    const current = rates.find(
                      (r) => r.addon_id === a.id && r.tp_type_id === tp.id
                    );
                    return (
                      <td key={tp.id} className="p-1 text-center">
                        <input
                          type="number"
                          className="border rounded w-20 px-2 py-1 text-center"
                          value={current?.percentage || ""}
                          onChange={(e) =>
                            saveRate(a.id, tp.id, e.target.value)
                          }
                        />
                      </td>
                    );
                  })}

                  <td className="text-right p-2">
                    {editingAddonId === a.id ? (
                      <button
                        className="text-green-600 mr-3"
                        onClick={() => saveAddonEdit(a)}
                      >
                        ✅ Save
                      </button>
                    ) : (
                      <button
                        className="text-blue-500 mr-3"
                        onClick={() => setEditingAddonId(a.id)}
                      >
                        ✏️ Edit
                      </button>
                    )}
                    <button
                      className="text-red-500 hover:text-red-700"
                      onClick={() => deleteAddon(a.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex justify-center gap-2 p-4">
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
      ) : (
        <p className="text-gray-500 mt-4">Select a company to view data.</p>
      )}
    </div>
  );
}
