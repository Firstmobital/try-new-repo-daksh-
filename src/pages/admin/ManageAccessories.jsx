// src/pages/admin/ManageAccessories.jsx
import React, { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { toCSV, readCSV } from "../../utils/csv";

export default function ManageAccessories() {
  const [cars, setCars] = useState([]);
  const [accessories, setAccessories] = useState([]);
  const [newAccessory, setNewAccessory] = useState({
    car_id: "",
    name: "",
    part_number: "",
    image_url: "",
    price: 0,
    active: true,
  });
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;

  useEffect(() => {
    fetchCars();
    fetchAccessories();
  }, []);

  async function fetchCars() {
    const { data, error } = await supabase.from("car").select("id,name");
    if (error) console.error(error);
    else setCars(data || []);
  }

  async function fetchAccessories() {
    const { data, error } = await supabase.from("car_accessory").select("*");
    if (error) console.error(error);
    else setAccessories(data || []);
  }

  async function addAccessory() {
    if (!newAccessory.car_id || !newAccessory.name || !newAccessory.price) {
      alert("Please select a car and fill name & price.");
      return;
    }

    const { error } = await supabase
      .from("car_accessory")
      .insert([newAccessory]);
    if (error) {
      console.error(error);
      alert("Error adding accessory: " + error.message);
    } else {
      alert("Accessory added!");
      setNewAccessory({
        car_id: "",
        name: "",
        part_number: "",
        image_url: "",
        price: 0,
        active: true,
      });
      fetchAccessories();
    }
  }

  async function deleteAccessory(id) {
    const { error } = await supabase
      .from("car_accessory")
      .delete()
      .eq("id", id);
    if (error) {
      console.error(error);
      alert("Error deleting accessory: " + error.message);
    } else {
      fetchAccessories();
    }
  }

  // --- CSV Export ---
  async function exportCSV() {
    const csv = toCSV(accessories);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "car_accessories.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  // --- CSV Import ---
  async function importCSV(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const list = await readCSV(file);
    const payload = list.map((r) => ({
      id: r.id || undefined,
      car_id: r.car_id,
      name: r.name,
      part_number: r.part_number || null,
      image_url: r.image_url || null,
      price: Number(r.price || 0),
      active: r.active === "true" || r.active === true,
    }));
    const { error } = await supabase
      .from("car_accessory")
      .upsert(payload, { onConflict: "id" });
    if (error) return alert(error.message);
    fetchAccessories();
  }

  // --- Filtering + Pagination ---
  const filtered = accessories.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.part_number.toLowerCase().includes(search.toLowerCase()) ||
      (cars.find((c) => c.id === a.car_id)?.name || "")
        .toLowerCase()
        .includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Manage Accessories</h1>
        <div className="flex gap-2">
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

      {/* Add new accessory form */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        <select
          className="border p-2 rounded"
          value={newAccessory.car_id}
          onChange={(e) =>
            setNewAccessory({ ...newAccessory, car_id: e.target.value })
          }
        >
          <option value="">Select Car</option>
          {cars.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <input
          className="border p-2 rounded"
          placeholder="Name"
          value={newAccessory.name}
          onChange={(e) =>
            setNewAccessory({ ...newAccessory, name: e.target.value })
          }
        />
        <input
          className="border p-2 rounded"
          placeholder="Part Number"
          value={newAccessory.part_number}
          onChange={(e) =>
            setNewAccessory({ ...newAccessory, part_number: e.target.value })
          }
        />
        <input
          className="border p-2 rounded"
          placeholder="Image URL"
          value={newAccessory.image_url}
          onChange={(e) =>
            setNewAccessory({ ...newAccessory, image_url: e.target.value })
          }
        />
        <input
          className="border p-2 rounded"
          placeholder="Price"
          type="number"
          value={newAccessory.price}
          onChange={(e) =>
            setNewAccessory({
              ...newAccessory,
              price: Number(e.target.value),
            })
          }
        />
        <button
          onClick={addAccessory}
          className="bg-blue-600 hover:bg-blue-700 text-white rounded p-2"
        >
          Add
        </button>
      </div>

      {/* Search bar */}
      <div className="flex justify-end mb-3">
        <input
          type="text"
          placeholder="Search accessories..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1);
          }}
          className="border rounded px-3 py-2"
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2">Car</th>
              <th className="p-2">Name</th>
              <th className="p-2">Part #</th>
              <th className="p-2">Image</th>
              <th className="p-2">Price</th>
              <th className="p-2">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((a) => (
              <tr key={a.id} className="border-b">
                <td className="p-2">
                  {cars.find((c) => c.id === a.car_id)?.name || a.car_id}
                </td>
                <td className="p-2">{a.name}</td>
                <td className="p-2">{a.part_number}</td>
                <td className="p-2">
                  {a.image_url ? (
                    <img
                      src={a.image_url}
                      alt={a.name}
                      className="h-12 w-12 object-cover rounded"
                    />
                  ) : (
                    <span className="text-gray-400">No image</span>
                  )}
                </td>
                <td className="p-2">₹{a.price}</td>
                <td className="p-2">
                  <button
                    onClick={() => deleteAccessory(a.id)}
                    className="text-red-600 hover:underline"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {paginated.length === 0 && (
              <tr>
                <td
                  colSpan={6}
                  className="text-center p-4 text-gray-500 italic"
                >
                  No accessories found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-4">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="btn btn-outline px-3 py-1"
        >
          Prev
        </button>
        <span className="px-2 py-1">
          Page {page} of {totalPages || 1}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="btn btn-outline px-3 py-1"
        >
          Next
        </button>
      </div>
    </div>
  );
}
