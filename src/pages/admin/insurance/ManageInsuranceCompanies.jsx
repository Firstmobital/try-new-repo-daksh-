// src/pages/admin/insurance/ManageInsuranceCompanies.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../../lib/supabase";
import Papa from "papaparse";

export default function ManageInsuranceCompanies() {
  const [companies, setCompanies] = useState([]);
  const [newName, setNewName] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const perPage = 20;

  useEffect(() => { load(); }, []);

  async function load() {
    const { data, error } = await supabase.from("insurance_company").select("*").order("name");
    if (error) return alert(error.message);
    setCompanies(data || []);
  }

  async function add() {
    if (!newName) return alert("Enter company name");
    const { error } = await supabase.from("insurance_company").insert([{ name: newName }]);
    if (error) return alert(error.message);
    setNewName(""); load();
  }

  async function update(c) {
    const { error } = await supabase.from("insurance_company").update({ name: c.name }).eq("id", c.id);
    if (error) return alert(error.message);
    load();
  }

  async function del(id) {
    if (!confirm("Delete company?")) return;
    const { error } = await supabase.from("insurance_company").delete().eq("id", id);
    if (error) return alert(error.message);
    load();
  }

  function exportCSV() {
    const csv = Papa.unparse(companies);
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "insurance_companies.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  async function importCSV(e) {
    const file = e.target.files?.[0]; if (!file) return;
    Papa.parse(file, {
      header: true,
      complete: async (res) => {
        const { error } = await supabase.from("insurance_company").upsert(res.data, { onConflict: "id" });
        if (error) return alert(error.message);
        load();
      }
    });
  }

  const filtered = companies.filter(c => c.name.toLowerCase().includes(search.toLowerCase()));
  const paginated = filtered.slice((page-1)*perPage, page*perPage);
  const totalPages = Math.ceil(filtered.length / perPage);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Insurance Companies</h2>

      <div className="flex gap-2">
        <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="New Company Name" className="border rounded px-2 py-1"/>
        <button onClick={add} className="btn btn-primary">Add</button>
        <button onClick={exportCSV} className="btn btn-outline">Export</button>
        <label className="btn btn-outline cursor-pointer">Import
          <input type="file" className="hidden" accept=".csv" onChange={importCSV}/>
        </label>
      </div>

      <input placeholder="Search company…" value={search} onChange={e=>setSearch(e.target.value)} className="border rounded px-2 py-1 w-full"/>

      <table className="table w-full mt-4">
        <thead><tr><th>Name</th><th>Actions</th></tr></thead>
        <tbody>
          {paginated.map(c=>(
            <tr key={c.id}>
              <td>
                <input value={c.name} onChange={e=>{
                  setCompanies(prev=>prev.map(x=>x.id===c.id?{...x,name:e.target.value}:x))
                }} className="border rounded px-2 py-1 w-full"/>
              </td>
              <td className="space-x-2">
                <button onClick={()=>update(c)} className="btn btn-primary">Save</button>
                <button onClick={()=>del(c.id)} className="btn btn-outline">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-center gap-2 mt-2">
        <button disabled={page===1} onClick={()=>setPage(p=>p-1)} className="btn btn-outline">Prev</button>
        <span>Page {page} of {totalPages||1}</span>
        <button disabled={page===totalPages} onClick={()=>setPage(p=>p+1)} className="btn btn-outline">Next</button>
      </div>
    </div>
  );
}
