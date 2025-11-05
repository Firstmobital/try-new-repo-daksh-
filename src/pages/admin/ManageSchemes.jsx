// ✅ src/pages/admin/ManageSchemes.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import Papa from "papaparse";

export default function ManageSchemes() {
  const [rows, setRows] = useState([]);
  const [cars, setCars] = useState([]);
  const [variants, setVariants] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 10;
  const [editingId, setEditingId] = useState(null);
  const [loading, setLoading] = useState(false);
  const [creatingNew, setCreatingNew] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);

    const { data: carData } = await supabase.from("car").select("id,name");
    const { data: variantData } = await supabase
      .from("model_variant")
      .select("id,name");

    const { data: schemeData, error } = await supabase
      .from("scheme_rule")
      .select("*")
      .order("id", { ascending: false });

    if (error) alert(error.message);

    const combined = (schemeData || []).map((s) => ({
      ...s,
      car_name: carData?.find((c) => c.id === s.car_id)?.name || "",
      variant_name: variantData?.find((v) => v.id === s.variant_id)?.name || "",
    }));

    setCars(carData || []);
    setVariants(variantData || []);
    setRows(combined);
    setLoading(false);
  }

  async function save(row) {
    const car_id = cars.find((c) => c.name === row.car_name)?.id || null;
    const variant_id =
      variants.find((v) => v.name === row.variant_name)?.id || null;

    const payload = {
      car_id,
      variant_id,
      scheme: row.scheme,
      amount: Number(row.amount || 0),
      scope: row.scope || "VARIANT",
      apply_default: !!row.apply_default,
      active: !!row.active,
    };

    let error;

    if (row.id && !creatingNew) {
      // ✅ Update existing record by PK
      const res = await supabase
        .from("scheme_rule")
        .update(payload)
        .eq("id", row.id);
      error = res.error;
    } else {
      // ✅ Insert new record and refresh
      const res = await supabase.from("scheme_rule").insert([payload]).select();
      error = res.error;
      setCreatingNew(false);
    }

    if (error) {
      alert(error.message);
    } else {
      setEditingId(null);
      loadData();
    }
  }

  async function del(id) {
    if (!confirm("Delete this scheme?")) return;
    await supabase.from("scheme_rule").delete().eq("id", id);
    loadData();
  }

  async function exportCSV() {
    const csv = Papa.unparse(
      rows.map((r) => ({
        car_name: r.car_name,
        variant_name: r.variant_name,
        scheme: r.scheme,
        amount: r.amount,
        scope: r.scope,
        apply_default: r.apply_default,
        active: r.active,
      }))
    );
    const blob = new Blob([csv], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "schemes.csv";
    a.click();
  }

  async function importCSV(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const list = results.data;
        const payload = list.map((r) => ({
          car_id: cars.find((c) => c.name === r.car_name)?.id || null,
          variant_id:
            variants.find((v) => v.name === r.variant_name)?.id || null,
          scheme: r.scheme,
          amount: Number(r.amount || 0),
          scope: r.scope || "VARIANT",
          apply_default:
            r.apply_default === "true" || r.apply_default === "1",
          active: r.active === "true" || r.active === "1",
        }));

        await supabase.from("scheme_rule").insert(payload);
        loadData();
      },
    });
  }

  function addNewScheme() {
    setCreatingNew(true);
    const newRow = {
      id: null,
      car_name: "",
      variant_name: "",
      scheme: "",
      amount: 0,
      scope: "VARIANT",
      apply_default: false,
      active: true,
    };
    setRows([newRow, ...rows]);
    setEditingId(newRow.id);
  }

  const filtered = rows.filter(
    (r) =>
      r.scheme?.toLowerCase().includes(search.toLowerCase()) ||
      r.variant_name?.toLowerCase().includes(search.toLowerCase()) ||
      r.car_name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filtered.length / perPage);
  const paginated = filtered.slice((page - 1) * perPage, page * perPage);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Manage Schemes</h1>
        <div className="flex gap-2">
          <button onClick={addNewScheme} className="btn btn-primary">
            + Add Scheme
          </button>
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

      <div className="flex justify-end">
        <input
          type="text"
          placeholder="Search schemes..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>

      <div className="card overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Car</th>
              <th>Variant</th>
              <th>Scheme</th>
              <th>Amount</th>
              <th>Scope</th>
              <th>Apply Default</th>
              <th>Active</th>
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="8" className="text-center py-6">
                  Loading...
                </td>
              </tr>
            ) : paginated.length === 0 ? (
              <tr>
                <td colSpan="8" className="text-center py-6 text-gray-500">
                  No schemes found.
                </td>
              </tr>
            ) : (
              paginated.map((r, index) =>
                editingId === r.id ? (
                  <tr key={index}>
                    <td>
                      <select
                        value={r.car_name}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((x) =>
                              x === r ? { ...x, car_name: e.target.value } : x
                            )
                          )
                        }
                        className="border rounded px-2 py-1"
                      >
                        <option value="">Select Car</option>
                        {cars.map((c) => (
                          <option key={c.id} value={c.name}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <select
                        value={r.variant_name}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((x) =>
                              x === r
                                ? { ...x, variant_name: e.target.value }
                                : x
                            )
                          )
                        }
                        className="border rounded px-2 py-1"
                      >
                        <option value="">Select Variant</option>
                        {variants.map((v) => (
                          <option key={v.id} value={v.name}>
                            {v.name}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <input
                        value={r.scheme}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((x) =>
                              x === r ? { ...x, scheme: e.target.value } : x
                            )
                          )
                        }
                        className="border rounded px-2 py-1 w-32"
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        value={r.amount}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((x) =>
                              x === r ? { ...x, amount: e.target.value } : x
                            )
                          )
                        }
                        className="border rounded px-2 py-1 w-24"
                      />
                    </td>
                    <td>
                      <select
                        value={r.scope}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((x) =>
                              x === r ? { ...x, scope: e.target.value } : x
                            )
                          )
                        }
                        className="border rounded px-2 py-1"
                      >
                        <option value="VARIANT">VARIANT</option>
                        <option value="CAR">CAR</option>
                        <option value="GLOBAL">GLOBAL</option>
                      </select>
                    </td>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={r.apply_default}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((x) =>
                              x === r
                                ? { ...x, apply_default: e.target.checked }
                                : x
                            )
                          )
                        }
                      />
                    </td>
                    <td className="text-center">
                      <input
                        type="checkbox"
                        checked={r.active}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((x) =>
                              x === r
                                ? { ...x, active: e.target.checked }
                                : x
                            )
                          )
                        }
                      />
                    </td>
                    <td className="text-right space-x-2">
                      <button
                        onClick={() => save(r)}
                        className="btn btn-primary"
                      >
                        Save
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="btn btn-outline"
                      >
                        Cancel
                      </button>
                    </td>
                  </tr>
                ) : (
                  <tr key={r.id}>
                    <td>{r.car_name}</td>
                    <td>{r.variant_name}</td>
                    <td>{r.scheme}</td>
                    <td>₹{r.amount}</td>
                    <td>{r.scope}</td>
                    <td>{r.apply_default ? "✔️" : "❌"}</td>
                    <td>{r.active ? "✔️" : "❌"}</td>
                    <td className="text-right">
                      <button
                        onClick={() => {
                          setEditingId(r.id);
                          setCreatingNew(false);
                        }}
                        className="btn btn-outline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => del(r.id)}
                        className="btn btn-outline text-red-600 ml-2"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                )
              )
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-center gap-2 mt-4">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="btn btn-outline"
        >
          Prev
        </button>
        <span>
          Page {page} of {totalPages || 1}
        </span>
        <button
          disabled={page === totalPages}
          onClick={() => setPage(page + 1)}
          className="btn btn-outline"
        >
          Next
        </button>
      </div>
    </div>
  );
}
