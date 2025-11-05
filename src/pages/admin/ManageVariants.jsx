// src/pages/admin/ManageVariants.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { toCSV, readCSV } from "../../utils/csv";

export default function ManageVariants() {
  const [cars, setCars] = useState([]);
  const [fuels, setFuels] = useState([]);
  const [txs, setTxs] = useState([]);
  const [rows, setRows] = useState([]);
  const [form, setForm] = useState({
    car_id:"", name:"", fuel_type_id:"", transmission_id:"", ex_showroom:0, image_url:"", is_published:true, features:""
  });

  useEffect(()=>{ (async ()=>{
    const { data: c } = await supabase.from("car").select("id,name").order("name");
    const { data: f } = await supabase.from("fuel_type").select("id,label");
    const { data: t } = await supabase.from("transmission").select("id,label");
    setCars(c||[]); setFuels(f||[]); setTxs(t||[]);
    load();
  })(); },[]);

  async function load(){
    const { data, error } = await supabase
      .from("model_variant")
      .select("*, car:car_id(name), fuel:fuel_type_id(label), tx:transmission_id(label)")
      .order("created_at", { ascending: false });
    if (error) return alert(error.message);
    setRows((data||[]).map(v=>({
      ...v,
      fuel_label: v.fuel?.label,
      transmission_label: v.tx?.label
    })));
  }

  async function save(){
    const payload = { ...form, ex_showroom: Number(form.ex_showroom||0) };
    if (!payload.car_id || !payload.name) return alert("Car & Variant name required");

    const { error } = await supabase
      .from("model_variant")
      .upsert(payload, { onConflict:"id" });

    if (error) return alert(error.message);

    setForm({ car_id:"", name:"", fuel_type_id:"", transmission_id:"", ex_showroom:0, image_url:"", is_published:true, features:"" });
    load();
  }

  async function edit(r){
    setForm({
      id:r.id,
      car_id:r.car_id,
      name:r.name,
      fuel_type_id:r.fuel_type_id,
      transmission_id:r.transmission_id,
      ex_showroom:r.ex_showroom,
      image_url:r.image_url||"",
      is_published:r.is_published,
      features:r.features || ""
    });
  }

  async function del(id){
    if(!confirm("Delete variant? This will remove related RTO/Schemes/Content.")) return;
    await supabase.from("scheme_rule").delete().eq("variant_id", id);
    await supabase.from("rto_charge").delete().eq("variant_id", id);
    await supabase.from("variant_content").delete().eq("variant_id", id);
    const { error } = await supabase.from("model_variant").delete().eq("id", id);
    if (error) return alert(error.message);
    load();
  }

  /* ✅ Export CSV with names for car, fuel, transmission */
  async function exportCSV(){
    const csv = toCSV(rows.map(r=>({
      id:r.id,
      car: r.car?.name || "",
      name:r.name,
      fuel: r.fuel_label || "",
      transmission: r.transmission_label || "",
      ex_showroom:r.ex_showroom,
      image_url:r.image_url,
      is_published:r.is_published,
      features:r.features
    })));

    const blob = new Blob([csv], { type:"text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href=url; a.download="variants.csv"; a.click();
    URL.revokeObjectURL(url);
  }

  /* ✅ Import CSV with names mapped back to IDs */
  async function importCSV(e){
    const file = e.target.files?.[0]; if(!file) return;
    const list = await readCSV(file);

    const payload = list.map(r=>{
      const car = cars.find(c =>
        c.name.trim().toLowerCase() === r.car?.trim().toLowerCase()
      );
      if(!car){
        console.warn("Car not found:", r.car);
        return null;
      }

      const fuel = fuels.find(f =>
        f.label.trim().toLowerCase() === r.fuel?.trim().toLowerCase()
      );
      if(!fuel){
        console.warn("Fuel type not found:", r.fuel);
        return null;
      }

      const tx = txs.find(t =>
        t.label.trim().toLowerCase() === r.transmission?.trim().toLowerCase()
      );
      if(!tx){
        console.warn("Transmission not found:", r.transmission);
        return null;
      }

      return {
        id:r.id || undefined,
        car_id:car.id, // ✅ map name to ID
        name:r.name,
        fuel_type_id:fuel.id, // ✅
        transmission_id:tx.id, // ✅
        ex_showroom:Number(r.ex_showroom||0),
        image_url:r.image_url || null,
        is_published:String(r.is_published).toLowerCase()!=="false",
        features:r.features||""
      };
    }).filter(Boolean);

    const { error } = await supabase
      .from("model_variant")
      .upsert(payload, { onConflict:"id" });

    if (error) return alert(error.message);
    load();
  }

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <h1 className="text-xl font-semibold">Variants</h1>
        <div className="flex gap-2">
          <button className="btn btn-outline" onClick={exportCSV}>Export CSV</button>
          <label className="btn btn-outline cursor-pointer">
            Import CSV
            <input type="file" className="hidden" accept=".csv" onChange={importCSV}/>
          </label>
        </div>
      </header>

      <div className="card p-4 grid md:grid-cols-4 gap-2">
        <select className="border rounded-xl px-3 py-2" value={form.car_id} onChange={e=>setForm({...form, car_id:e.target.value})}>
          <option value="">Car</option>
          {cars.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
        </select>

        <input className="border rounded-xl px-3 py-2" placeholder="Variant Name"
          value={form.name} onChange={e=>setForm({...form, name:e.target.value})}/>

        <select className="border rounded-xl px-3 py-2" value={form.fuel_type_id} onChange={e=>setForm({...form, fuel_type_id:e.target.value})}>
          <option value="">Fuel</option>
          {fuels.map(f=><option key={f.id} value={f.id}>{f.label}</option>)}
        </select>

        <select className="border rounded-xl px-3 py-2" value={form.transmission_id} onChange={e=>setForm({...form, transmission_id:e.target.value})}>
          <option value="">Transmission</option>
          {txs.map(t=><option key={t.id} value={t.id}>{t.label}</option>)}
        </select>

        <input type="number" className="border rounded-xl px-3 py-2" placeholder="Ex-showroom"
          value={form.ex_showroom} onChange={e=>setForm({...form, ex_showroom:e.target.value})}/>

        <input className="border rounded-xl px-3 py-2 col-span-2" placeholder="Image URL"
          value={form.image_url} onChange={e=>setForm({...form, image_url:e.target.value})}/>

        <textarea className="border rounded-xl px-3 py-2 col-span-full" placeholder="Features (pipe-separated)"
          value={form.features} onChange={e=>setForm({...form, features:e.target.value})}/>

        <label className="text-sm flex items-center gap-2">
          <input type="checkbox" checked={!!form.is_published} onChange={e=>setForm({...form, is_published:e.target.checked})}/>
          Published
        </label>

        <div className="col-span-full">
          <button className="btn btn-primary" onClick={save}>
            {form.id ? "Update" : "Add"} Variant
          </button>
        </div>
      </div>

      <div className="card">
        <table className="table">
          <thead><tr>
            <th>Car</th><th>Name</th><th>Fuel</th><th>Tx</th><th>Ex-showroom</th><th className="text-right">Actions</th>
          </tr></thead>
          <tbody>
          {rows.map(r=>(
            <tr key={r.id}>
              <td>{r.car?.name || r.car_id}</td>
              <td>{r.name}</td>
              <td>{r.fuel_label}</td>
              <td>{r.transmission_label}</td>
              <td>₹{Number(r.ex_showroom||0).toLocaleString()}</td>
              <td className="text-right space-x-2">
                <button className="btn btn-outline" onClick={()=>edit(r)}>Edit</button>
                <button className="btn btn-outline" onClick={()=>del(r.id)}>Delete</button>
              </td>
            </tr>
          ))}
          {rows.length===0 && <tr><td colSpan={6} className="p-4 text-center text-gray-500">No variants yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
