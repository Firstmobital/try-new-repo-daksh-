// src/pages/admin/ManageAccessories.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { toCSV, readCSV } from "../../utils/csv";

export default function ManageAccessories() {
  const [cars, setCars] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [editAccessory, setEditAccessory] = useState(null);
  const [newAccessory, setNewAccessory] = useState({
    car_id: "",
    name: "",
    part_number: "",
    image_url: "",
    price: 0,
    active: true,
  });

  const [search, setSearch] = useState("");
  const [filterCar, setFilterCar] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;

  const [previewImg, setPreviewImg] = useState(null);

  useEffect(() => {
    fetchCars();
    fetchAccessories();
  }, []);

  async function fetchCars() {
    const { data } = await supabase.from("car").select("id,name").order("name");
    setCars(data || []);
  }

  async function fetchAccessories() {
    const { data } = await supabase.from("car_accessory").select("*");
    setAccessories(data || []);
  }

  async function submitAccessory() {
    if (!newAccessory.car_id || !newAccessory.name)
      return alert("Car & Name required");

    let action;
    if (editAccessory) {
      action = supabase.from("car_accessory").update(newAccessory).eq("id", editAccessory.id);
    } else {
      action = supabase.from("car_accessory").insert([newAccessory]);
    }

    const { error } = await action;
    if (error) return alert(error.message);

    alert(editAccessory ? "Accessory Updated!" : "Accessory Added!");
    resetForm();
    fetchAccessories();
  }

  function resetForm() {
    setNewAccessory({
      car_id: "",
      name: "",
      part_number: "",
      image_url: "",
      price: 0,
      active: true,
    });
    setEditAccessory(null);
  }

  async function deleteAccessory(id) {
    if (!confirm("Delete accessory?")) return;
    await supabase.from("car_accessory").delete().eq("id", id);
    fetchAccessories();
  }

  /* ✅ CSV Export as Car Names */
  async function exportCSV() {
    const rows = accessories.map((a) => ({
      id: a.id,
      car: cars.find((c) => c.id === a.car_id)?.name || "",
      name: a.name,
      part_number: a.part_number,
      image_url: a.image_url,
      price: a.price,
      active: a.active,
    }));
    const csv = toCSV(rows);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv]));
    a.download = "car_accessories.csv";
    a.click();
  }

  /* ✅ CSV Import Validation + Name → ID Mapping */
  async function importCSV(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    const list = await readCSV(file);
    const errors = [];
    const payload = list
      .map((r, i) => {
        const car = cars.find(
          (c) => c.name.trim().toLowerCase() === r.car?.trim().toLowerCase()
        );
        if (!car) {
          errors.push(`Row ${i + 2}: Car not found → ${r.car}`);
          return null;
        }

        return {
          id: r.id || undefined,
          car_id: car.id,
          name: r.name,
          part_number: r.part_number || null,
          image_url: r.image_url || null,
          price: Number(r.price || 0),
          active: String(r.active).toLowerCase() !== "false",
        };
      })
      .filter(Boolean);

    if (errors.length) {
      alert("Import Errors:\n" + errors.join("\n"));
      return;
    }

    const { error } = await supabase.from("car_accessory").upsert(payload);
    if (!error) fetchAccessories();
  }

  /* ✅ Search + Car filter */
  const filtered = accessories.filter((a) => {
    const matchesSearch =
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.part_number?.toLowerCase().includes(search.toLowerCase());
    const matchesCar = filterCar ? a.car_id === filterCar : true;
    return matchesSearch && matchesCar;
  });

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <header className="flex justify-between mb-6">
        <h1 className="text-2xl font-bold">Manage Accessories</h1>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={exportCSV}>Export CSV</button>
          <label className="btn btn-outline cursor-pointer">
            Import CSV
            <input className="hidden" type="file" accept=".csv" onChange={importCSV} />
          </label>
        </div>
      </header>

      {/* Add / Edit Form */}
      <div className="card p-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <select
          className="border p-2 rounded"
          value={newAccessory.car_id}
          onChange={(e) => setNewAccessory({ ...newAccessory, car_id: e.target.value })}
        >
          <option value="">Select Car</option>
          {cars.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <input className="border p-2 rounded" placeholder="Name"
          value={newAccessory.name}
          onChange={(e) => setNewAccessory({ ...newAccessory, name: e.target.value })} />

        <input className="border p-2 rounded" placeholder="Part Number"
          value={newAccessory.part_number}
          onChange={(e) => setNewAccessory({ ...newAccessory, part_number: e.target.value })} />

        <input className="border p-2 rounded" placeholder="Image URL"
          value={newAccessory.image_url}
          onChange={(e) => setNewAccessory({ ...newAccessory, image_url: e.target.value })} />

        <input type="number" className="border p-2 rounded" placeholder="Price"
          value={newAccessory.price}
          onChange={(e) => setNewAccessory({ ...newAccessory, price: Number(e.target.value) })} />

        <label className="flex items-center gap-2 text-sm font-medium">
          <input type="checkbox" checked={newAccessory.active}
            onChange={(e) => setNewAccessory({ ...newAccessory, active: e.target.checked })} />
          Active
        </label>

        <button className="btn btn-primary col-span-full" onClick={submitAccessory}>
          {editAccessory ? "Update Accessory" : "Add Accessory"}
        </button>
        {editAccessory && (
          <button className="btn btn-outline col-span-full" onClick={resetForm}>
            Cancel Edit
          </button>
        )}
      </div>

      {/* Filter + Search */}
      <div className="flex justify-between mb-4">
        <select
          className="border rounded px-3 py-2"
          value={filterCar}
          onChange={(e) => {
            setFilterCar(e.target.value);
            setPage(1);
          }}
        >
          <option value="">All Cars</option>
          {cars.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <input
          type="text"
          placeholder="Search..."
          className="border rounded px-3 py-2"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
        />
      </div>

      {/* Table */}
      <div className="overflow-auto">
        <table className="w-full border text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2">Car</th>
              <th className="p-2">Name</th>
              <th className="p-2">Part #</th>
              <th className="p-2">Image</th>
              <th className="p-2">Price</th>
              <th className="p-2">Active</th>
              <th className="p-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((a) => (
              <tr key={a.id} className="border-b">
                <td className="p-2">
                  {cars.find((c) => c.id === a.car_id)?.name}
                </td>
                <td className="p-2">{a.name}</td>
                <td className="p-2">{a.part_number}</td>
                <td className="p-2">
                  {a.image_url ?
                    <img
                      src={a.image_url}
                      className="h-10 w-10 rounded cursor-pointer"
                      onClick={() => setPreviewImg(a.image_url)}
                    /> :
                    <span className="text-gray-400">None</span>
                  }
                </td>
                <td className="p-2">₹{a.price.toLocaleString()}</td>
                <td className="p-2">{a.active ? "✅" : "❌"}</td>
                <td className="p-2 text-right space-x-2">
                  <button
                    className="btn btn-outline"
                    onClick={() => {
                      setEditAccessory(a);
                      setNewAccessory(a);
                    }}
                  >Edit</button>

                  <button
                    className="btn btn-outline text-red-600"
                    onClick={() => deleteAccessory(a.id)}
                  >Delete</button>
                </td>
              </tr>
            ))}
            {!paginated.length && (
              <tr><td colSpan={7} className="text-center p-4 text-gray-500">
                No accessories found
              </td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-3 mt-4">
        <button className="btn btn-outline" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
        <span>Page {page} of {totalPages || 1}</span>
        <button className="btn btn-outline" disabled={page >= totalPages} onClick={() => setPage(page + 1)}>Next</button>
      </div>

      {/* ✅ Image Preview Modal */}
      {previewImg && (
        <div className="fixed inset-0 bg-black/70 flex justify-center items-center z-50">
          <img src={previewImg} className="max-h-[80vh] rounded shadow-lg" />
          <button
            className="absolute top-6 right-6 text-white text-3xl"
            onClick={() => setPreviewImg(null)}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
