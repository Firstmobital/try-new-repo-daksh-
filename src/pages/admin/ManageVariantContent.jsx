// src/pages/admin/ManageVariantContent.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { toCSV, readCSV } from "../../utils/csv";

export default function ManageVariantContent() {
  const [variants, setVariants] = useState([]);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [perPage] = useState(5);
  const [editingRow, setEditingRow] = useState(null);

  useEffect(() => {
    (async () => {
      const { data: v } = await supabase
        .from("model_variant")
        .select("id,name")
        .order("name", { ascending: true });
      setVariants(v || []);
      load();
    })();
  }, []);

  async function load() {
    const { data, error } = await supabase.from("variant_content").select("*");
    if (error) return alert(error.message);
    setRows(data || []);
  }

  async function save(row) {
    const { error } = await supabase
      .from("variant_content")
      .upsert(row, { onConflict: "variant_id" });
    if (error) return alert(error.message);
    setEditingRow(null);
    load();
  }

  async function del(variant_id) {
    if (!confirm("Delete content item?")) return;
    const { error } = await supabase
      .from("variant_content")
      .delete()
      .eq("variant_id", variant_id);
    if (error) return alert(error.message);
    load();
  }

  async function exportCSV() {
    const dataWithNames = rows.map((r) => {
      const variantName =
        variants.find((v) => v.id === r.variant_id)?.name || r.variant_id;
      return { ...r, variant_name: variantName };
    });
    const csv = toCSV(dataWithNames);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "variant_content.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importCSV(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const list = await readCSV(file);

    const payload = list.map((r) => {
      let variantId = r.variant_id;
      if (!variantId && r.variant_name) {
        const match = variants.find(
          (v) => v.name.toLowerCase() === r.variant_name.toLowerCase()
        );
        variantId = match?.id || null;
      }
      return {
        variant_id: variantId,
        features: r.features || "",
        ...[1, 2, 3, 4, 5, 6, 7].reduce((acc, i) => {
          acc[`image${i}_url`] = r[`image${i}_url`] || "";
          return acc;
        }, {}),
      };
    });

    const { error } = await supabase
      .from("variant_content")
      .upsert(payload, { onConflict: "variant_id" });
    if (error) return alert(error.message);
    load();
  }

  const filtered = rows.filter((r) => {
    const variantName =
      variants.find((v) => v.id === r.variant_id)?.name || "";
    return (
      r.features?.toLowerCase().includes(search.toLowerCase()) ||
      variantName.toLowerCase().includes(search.toLowerCase())
    );
  });

  const paginated = filtered.slice((page - 1) * perPage, page * perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Variant Content</h1>
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

      <div className="flex justify-end">
        <input
          type="text"
          placeholder="Search variant or feature..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border rounded px-3 py-2"
        />
      </div>

      <div className="card overflow-x-auto">
        <table className="table w-full">
          <thead>
            <tr>
              <th>Variant</th>
              <th>Features</th>
              {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                <th key={i}>Image{i}</th>
              ))}
              <th className="text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.map((r) =>
              editingRow === r.variant_id ? (
                <tr key={r.variant_id}>
                  <td>
                    <select
                      value={r.variant_id}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((row) =>
                            row.variant_id === r.variant_id
                              ? { ...row, variant_id: e.target.value }
                              : row
                          )
                        )
                      }
                      className="border rounded px-2 py-1"
                    >
                      {variants.map((v) => (
                        <option key={v.id} value={v.id}>
                          {v.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <textarea
                      value={r.features || ""}
                      onChange={(e) =>
                        setRows((prev) =>
                          prev.map((row) =>
                            row.variant_id === r.variant_id
                              ? { ...row, features: e.target.value }
                              : row
                          )
                        )
                      }
                      className="border rounded px-2 py-1 w-full"
                    />
                  </td>
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <td key={i}>
                      <input
                        value={r[`image${i}_url`] || ""}
                        onChange={(e) =>
                          setRows((prev) =>
                            prev.map((row) =>
                              row.variant_id === r.variant_id
                                ? {
                                    ...row,
                                    [`image${i}_url`]: e.target.value,
                                  }
                                : row
                            )
                          )
                        }
                        className="border rounded px-2 py-1 w-full"
                      />
                      {r[`image${i}_url`] && (
                        <img
                          src={r[`image${i}_url`]}
                          alt={`img${i}`}
                          className="h-12 mt-1 rounded"
                        />
                      )}
                    </td>
                  ))}
                  <td className="text-right space-x-2">
                    <button
                      className="btn btn-primary"
                      onClick={() => save(r)}
                    >
                      Save
                    </button>
                    <button
                      className="btn btn-outline"
                      onClick={() => setEditingRow(null)}
                    >
                      Cancel
                    </button>
                  </td>
                </tr>
              ) : (
                <tr key={r.variant_id}>
                  <td>
                    {variants.find((v) => v.id === r.variant_id)?.name ||
                      r.variant_id}
                  </td>
                  <td className="whitespace-pre-wrap">{r.features}</td>
                  {[1, 2, 3, 4, 5, 6, 7].map((i) => (
                    <td key={i}>
                      {r[`image${i}_url`] && (
                        <img
                          src={r[`image${i}_url`]}
                          alt={`img${i}`}
                          className="h-12 rounded"
                        />
                      )}
                    </td>
                  ))}
                  <td className="text-right space-x-2">
                    <button
                      className="btn btn-outline"
                      onClick={() => setEditingRow(r.variant_id)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn btn-outline"
                      onClick={() => del(r.variant_id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )
            )}
            {paginated.length === 0 && (
              <tr>
                <td colSpan={10} className="p-4 text-center text-gray-500">
                  No content yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-center gap-2 mt-4">
        <button
          disabled={page === 1}
          onClick={() => setPage(page - 1)}
          className="btn btn-outline"
        >
          Prev
        </button>
        <span className="px-2 py-1">
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
