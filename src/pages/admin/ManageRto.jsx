import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { toCSV, readCSV } from "../../utils/csv";

export default function ManageRto() {
  const [variants, setVariants] = useState([]);
  const [rows, setRows] = useState([]);
  const [filteredRows, setFilteredRows] = useState([]);

  const [page, setPage] = useState(1);
  const pageSize = 10;

  const [searchTerm, setSearchTerm] = useState("");

  const [editingKey, setEditingKey] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    (async () => {
      const { data: v } = await supabase
        .from("model_variant")
        .select("id,name")
        .order("created_at", { ascending: false });
      setVariants(v || []);
      load();
    })();
  }, []);

  async function load() {
    const { data, error } = await supabase.from("rto_charge").select("*");
    if (error) return alert(error.message);
    setRows(data || []);
  }

  useEffect(() => {
    const lower = searchTerm.toLowerCase();
    const result = rows.filter((r) => {
      const name =
        variants.find((v) => v.id === r.variant_id)?.name || r.variant_id;
      return name.toLowerCase().includes(lower);
    });
    setFilteredRows(result);
    setPage(1);
  }, [rows, searchTerm, variants]);

  async function saveEdit(rowKey) {
    const payload = {
      ...editForm,
      new_registration: Number(editForm.new_registration || 0),
      hypothecation_addition: Number(editForm.hypothecation_addition || 0),
      duplicate_tax_card: Number(editForm.duplicate_tax_card || 0),
      mv_tax: Number(editForm.mv_tax || 0),
      surcharge_mv_tax: Number(editForm.surcharge_mv_tax || 0),
      green_tax: Number(editForm.green_tax || 0), // ✅ Added
      rebate_waiver: Number(editForm.rebate_waiver || 0),
    };

    const { error } = await supabase
      .from("rto_charge")
      .upsert(payload, { onConflict: "variant_id,reg_type" });

    if (error) return alert(error.message);

    setEditingKey(null);
    setEditForm({});
    load();
  }

  async function del(variant_id, reg_type) {
    if (!confirm("Delete this RTO row?")) return;
    const { error } = await supabase
      .from("rto_charge")
      .delete()
      .eq("variant_id", variant_id)
      .eq("reg_type", reg_type);
    if (error) return alert(error.message);
    load();
  }

  /* ✅ Export CSV with green_tax */
  async function exportCSV() {
    const list = rows.map((r) => ({
      variant: variants.find((v) => v.id === r.variant_id)?.name || "",
      reg_type: r.reg_type,
      new_registration: r.new_registration,
      hypothecation_addition: r.hypothecation_addition,
      duplicate_tax_card: r.duplicate_tax_card,
      mv_tax: r.mv_tax,
      surcharge_mv_tax: r.surcharge_mv_tax,
      green_tax: r.green_tax, // ✅ Added
      rebate_waiver: r.rebate_waiver,
    }));

    const csv = toCSV(list);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rto_charge.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  /* ✅ Import CSV with green_tax */
  async function importCSV(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const list = await readCSV(file);

    const payload = list
      .map((r) => {
        const variant = variants.find(
          (v) => v.name.trim().toLowerCase() === r.variant.trim().toLowerCase()
        );
        if (!variant) {
          console.warn(`Variant not found: ${r.variant}`);
          return null;
        }

        return {
          variant_id: variant.id,
          reg_type: r.reg_type,
          new_registration: Number(r.new_registration || 0),
          hypothecation_addition: Number(r.hypothecation_addition || 0),
          duplicate_tax_card: Number(r.duplicate_tax_card || 0),
          mv_tax: Number(r.mv_tax || 0),
          surcharge_mv_tax: Number(r.surcharge_mv_tax || 0),
          green_tax: Number(r.green_tax || 0), // ✅ Added
          rebate_waiver: Number(r.rebate_waiver || 0),
        };
      })
      .filter(Boolean);

    const { error } = await supabase
      .from("rto_charge")
      .upsert(payload, { onConflict: "variant_id,reg_type" });

    if (error) return alert(error.message);
    load();
  }

  const startIdx = (page - 1) * pageSize;
  const currentPageRows = filteredRows.slice(startIdx, startIdx + pageSize);

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap justify-between items-center gap-2">
        <h1 className="text-xl font-semibold">RTO Charges</h1>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search Variant..."
            className="border rounded-xl px-3 py-2"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
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

      <div className="card overflow-auto max-h-[500px]">
        <table className="min-w-full text-sm">
          <thead className="bg-gray-100 sticky top-0 z-10">
            <tr>
              <th className="px-3 py-2 text-left">Variant</th>
              <th className="px-3 py-2 text-left">Registration Type</th>
              <th className="px-3 py-2 text-left">New Registration</th>
              <th className="px-3 py-2 text-left">Hypothecation</th>
              <th className="px-3 py-2 text-left">Duplicate Card</th>
              <th className="px-3 py-2 text-left">MV Tax</th>
              <th className="px-3 py-2 text-left">Surcharge</th>
              <th className="px-3 py-2 text-left">Green Tax</th> {/* ✅ Added */}
              <th className="px-3 py-2 text-left">Rebate</th>
              <th className="px-3 py-2 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {currentPageRows.map((r) => {
              const rowKey = `${r.variant_id}-${r.reg_type}`;
              const isEditing = editingKey === rowKey;

              return (
                <tr key={rowKey} className="border-b">
                  <td className="px-3 py-2">
                    {variants.find((v) => v.id === r.variant_id)?.name ||
                      r.variant_id}
                  </td>
                  <td className="px-3 py-2">{r.reg_type}</td>

                  {[
                    "new_registration",
                    "hypothecation_addition",
                    "duplicate_tax_card",
                    "mv_tax",
                    "surcharge_mv_tax",
                    "green_tax",  // ✅ Added
                    "rebate_waiver",
                  ].map((k) => (
                    <td key={k} className="px-3 py-2">
                      {isEditing ? (
                        <input
                          type="number"
                          className="border rounded px-2 py-1 w-24"
                          value={editForm[k]}
                          onChange={(e) =>
                            setEditForm({ ...editForm, [k]: e.target.value })
                          }
                        />
                      ) : (
                        r[k] || 0
                      )}
                    </td>
                  ))}

                  <td className="px-3 py-2 text-right space-x-2">
                    {isEditing ? (
                      <>
                        <button
                          className="btn btn-primary"
                          onClick={() => saveEdit(rowKey)}
                        >
                          Save
                        </button>
                        <button
                          className="btn btn-outline"
                          onClick={() => setEditingKey(null)}
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="btn btn-outline"
                          onClick={() => {
                            setEditingKey(rowKey);
                            setEditForm(r);
                          }}
                        >
                          Edit
                        </button>
                        <button
                          className="btn btn-outline"
                          onClick={() => del(r.variant_id, r.reg_type)}
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              );
            })}

            {currentPageRows.length === 0 && (
              <tr>
                <td colSpan={10} className="p-4 text-center text-gray-500">
                  No RTO entries found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex justify-between items-center pt-2">
        <span className="text-xs text-gray-500">
          Showing {startIdx + 1}–
          {Math.min(startIdx + pageSize, filteredRows.length)} of{" "}
          {filteredRows.length}
        </span>
        <div className="space-x-2">
          <button
            className="btn btn-outline"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </button>
          <button
            className="btn btn-outline"
            disabled={startIdx + pageSize >= filteredRows.length}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
