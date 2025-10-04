import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { toCSV, readCSV } from "../../utils/csv";

export default function ManageCars() {
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    name: "",
    hero_image_url: "",
    is_published: true,
  });

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const { data, error } = await supabase.from("car").select("*").order("name");
    if (error) return alert(error.message);
    setRows(data || []);
  }

  async function save() {
    if (!form.name.trim()) return alert("Name required");
    const payload = {
      ...form,
      is_published: !!form.is_published,
    };
    const { error } = await supabase.from("car").upsert(payload, { onConflict: "id" });
    if (error) return alert(error.message);
    setForm({ name: "", hero_image_url: "", is_published: true });
    load();
  }

  function edit(r) {
    setForm(r);
  }

  async function del(id) {
    if (!confirm("Delete car?")) return;
    const { error } = await supabase.from("car").delete().eq("id", id);
    if (error) return alert(error.message);
    load();
  }

  async function exportCSV() {
    const csv = toCSV(
      rows.map((r) => ({
        id: r.id,
        name: r.name,
        hero_image_url: r.hero_image_url,
        is_published: r.is_published,
      }))
    );
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "cars.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importCSV(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const list = await readCSV(file);
    const payload = list.map((r) => ({
      name: r.name,
      hero_image_url: r.hero_image_url || null,
      is_published: String(r.is_published).toLowerCase() !== "false",
      id: r.id || undefined,
    }));
    const { error } = await supabase.from("car").upsert(payload, { onConflict: "id" });
    if (error) return alert(error.message);
    load();
  }

  return (
    <div className="space-y-6">
      <header className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Cars</h1>
        <div className="flex items-center gap-2">
          <button className="btn btn-outline" onClick={exportCSV}>
            Export CSV
          </button>
          <label className="btn btn-outline cursor-pointer">
            Import CSV
            <input
              type="file"
              className="hidden"
              accept=".csv"
              onChange={importCSV}
            />
          </label>
        </div>
      </header>

      {/* Add / Edit form */}
      <div className="card p-4 grid md:grid-cols-3 gap-2">
        <input
          className="border rounded-xl px-3 py-2"
          placeholder="Name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
        />
        <input
          className="border rounded-xl px-3 py-2"
          placeholder="Hero Image URL"
          value={form.hero_image_url || ""}
          onChange={(e) => setForm({ ...form, hero_image_url: e.target.value })}
        />
        <label className="text-sm flex items-center gap-2">
          <input
            type="checkbox"
            checked={!!form.is_published}
            onChange={(e) =>
              setForm({ ...form, is_published: e.target.checked })
            }
          />
          Published
        </label>
        <div className="col-span-full">
          <button className="btn btn-primary" onClick={save}>
            {form.id ? "Update" : "Add"} Car
          </button>
        </div>
      </div>

      {/* Cards Grid */}
      <div className="grid md:grid-cols-3 lg:grid-cols-4 gap-6">
        {rows.map((r) => (
          <div
            key={r.id}
            className="bg-white rounded-xl shadow hover:shadow-lg transition p-4 flex flex-col items-center text-center"
          >
            <div className="w-full h-32 bg-gray-100 rounded mb-3 overflow-hidden">
              {r.hero_image_url ? (
                <img
                  src={r.hero_image_url}
                  alt={r.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 text-xs">
                  No Image
                </div>
              )}
            </div>
            <h2 className="text-lg font-semibold">{r.name}</h2>
            <p className="text-sm text-gray-500 mb-2">
              {r.is_published ? "Published" : "Not Published"}
            </p>
            <div className="flex gap-2 mt-auto">
              <button
                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300"
                onClick={() => edit(r)}
              >
                Edit
              </button>
              <button
                className="px-3 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                onClick={() => del(r.id)}
              >
                Delete
              </button>
            </div>
          </div>
        ))}
        {rows.length === 0 && (
          <p className="col-span-full text-center text-gray-500">
            No cars yet.
          </p>
        )}
      </div>
    </div>
  );
}
