import { useEffect, useMemo, useState } from "react";
import { supabase } from "../../../lib/supabase";
import Papa from "papaparse";

const PAGE_SIZE = 20;

export default function ManageOdDiscounts() {
  const [companies, setCompanies] = useState([]);
  const [variants, setVariants] = useState([]);
  const [discounts, setDiscounts] = useState([]); // {company_id, variant_id, discount_percent}
  const [selectedCompany, setSelectedCompany] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadCompanies();
    loadVariants();
  }, []);

  useEffect(() => {
    if (selectedCompany) loadDiscounts(selectedCompany);
  }, [selectedCompany]);

  async function loadCompanies() {
    const { data, error } = await supabase.from("insurance_company").select("id,name");
    if (error) return alert(error.message);
    setCompanies(data || []);
  }

  async function loadVariants() {
    const { data, error } = await supabase.from("model_variant").select("id,name").order("name");
    if (error) return alert(error.message);
    setVariants(data || []);
  }

  async function loadDiscounts(companyId) {
    const { data, error } = await supabase
      .from("insurance_od_discount")
      .select("variant_id,discount_percent")
      .eq("company_id", companyId);
    if (error) return alert(error.message);
    setDiscounts(data || []);
  }

  function getDiscount(variantId) {
    return discounts.find((d) => d.variant_id === variantId)?.discount_percent || 0;
  }

  function setDiscount(variantId, val) {
    setDiscounts((prev) => {
      const exists = prev.find((d) => d.variant_id === variantId);
      if (exists) {
        return prev.map((d) =>
          d.variant_id === variantId ? { ...d, discount_percent: val } : d
        );
      }
      return [...prev, { variant_id: variantId, discount_percent: val }];
    });
  }

  async function saveAll() {
    if (!selectedCompany) return alert("Select a company first.");
    setSaving(true);
    const payload = discounts.map((d) => ({
      company_id: selectedCompany,
      variant_id: d.variant_id,
      discount_percent: d.discount_percent,
    }));
    const { error } = await supabase
      .from("insurance_od_discount")
      .upsert(payload, { onConflict: "company_id,variant_id" });
    setSaving(false);
    if (error) return alert(error.message);
    alert("Saved all discounts.");
  }

  function exportCSV() {
    if (!selectedCompany) return alert("Select company first.");
    const company = companies.find((c) => c.id === selectedCompany)?.name || "";
    const rows = variants.map((v) => ({
      company,
      variant: v.name,
      discount_percent: getDiscount(v.id),
    }));
    const csv = Papa.unparse(rows);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `od_discounts_${company}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importCSV(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async ({ data }) => {
        if (!selectedCompany) return alert("Select company first.");
        const byVariant = Object.fromEntries(
          variants.map((v) => [v.name.trim().toLowerCase(), v.id])
        );
        const payload = [];
        for (const row of data) {
          const vId = byVariant[row.variant?.trim().toLowerCase()];
          if (vId) {
            payload.push({
              company_id: selectedCompany,
              variant_id: vId,
              discount_percent: Number(row.discount_percent) || 0,
            });
          }
        }
        if (!payload.length) return alert("No valid rows found in CSV.");
        const { error } = await supabase
          .from("insurance_od_discount")
          .upsert(payload, { onConflict: "company_id,variant_id" });
        if (error) return alert(error.message);
        await loadDiscounts(selectedCompany);
        alert("Imported successfully.");
      },
    });
  }

  // filter + paginate
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return variants;
    return variants.filter((v) => v.name.toLowerCase().includes(q));
  }, [variants, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const start = (page - 1) * PAGE_SIZE;
  const rows = filtered.slice(start, start + PAGE_SIZE);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Manage OD Discounts</h3>

      <div className="flex gap-4 items-center">
        <select
          value={selectedCompany}
          onChange={(e) => setSelectedCompany(e.target.value)}
          className="border rounded px-3 py-2"
        >
          <option value="">Select Company</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search variant…"
          className="border rounded px-3 py-2"
        />

        <button onClick={exportCSV} className="btn btn-outline">
          Export
        </button>
        <label className="btn btn-outline cursor-pointer">
          Import
          <input type="file" accept=".csv" className="hidden" onChange={importCSV} />
        </label>
        <button onClick={saveAll} disabled={saving} className="btn btn-primary">
          {saving ? "Saving…" : "Save All"}
        </button>
      </div>

      {/* Table */}
      {selectedCompany ? (
        <div className="card overflow-x-auto">
          <table className="table w-full">
            <thead>
              <tr>
                <th className="w-2/3">Variant</th>
                <th className="w-1/3">OD Discount %</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((v) => (
                <tr key={v.id}>
                  <td>{v.name}</td>
                  <td>
                    <input
                      type="number"
                      value={getDiscount(v.id)}
                      onChange={(e) =>
                        setDiscount(v.id, Number(e.target.value) || 0)
                      }
                      className="border rounded px-2 py-1 w-24"
                    />
                  </td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={2} className="text-center p-4 text-gray-500">
                    No variants found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="text-gray-500">Select a company to view variants.</p>
      )}

      {/* Pagination */}
      {selectedCompany && (
        <div className="flex justify-center items-center gap-3">
          <button
            className="btn btn-outline"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >
            Prev
          </button>
          <div className="text-sm">
            Page {page} of {totalPages}
          </div>
          <button
            className="btn btn-outline"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
