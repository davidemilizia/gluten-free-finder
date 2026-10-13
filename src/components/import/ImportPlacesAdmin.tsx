"use client";
import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";

type Candidate = {
  id:number; name:string; type:string; country:string; region:string; province:string; city:string; address:string;
  latitude:number; longitude:number; phone:string; website:string; gf_source_value:string; gf_category:string;
  source_url:string; review_status:string; imported_at:string;
};

export default function ImportPlacesAdmin(){
  const [rows,setRows]=useState<Candidate[]>([]); const [status,setStatus]=useState("pending"); const [q,setQ]=useState("");
  const [loading,setLoading]=useState(true); const [busy,setBusy]=useState<number|null>(null); const [message,setMessage]=useState("");

  const load=useCallback(async()=>{
    setLoading(true); setMessage("");
    const {data:s}=await supabase.auth.getSession(); const token=s.session?.access_token;
    if(!token){setMessage("Sessione amministratore mancante.");setLoading(false);return;}
    const r=await fetch(`/api/admin/import-places?status=${encodeURIComponent(status)}&q=${encodeURIComponent(q)}`,{headers:{Authorization:`Bearer ${token}`}});
    const j=await r.json(); if(!r.ok){setMessage(j.error||"Errore caricamento.");setRows([]);} else setRows(j.candidates||[]); setLoading(false);
  },[status,q]);
  useEffect(()=>{void load()},[load]);

  async function action(id:number,action:string){
    setBusy(id); setMessage(""); const {data:s}=await supabase.auth.getSession();
    const r=await fetch("/api/admin/import-places/action",{method:"POST",headers:{"Content-Type":"application/json",Authorization:`Bearer ${s.session?.access_token||""}`},body:JSON.stringify({id,action})});
    const j=await r.json(); setBusy(null); if(!r.ok){setMessage(j.error||"Operazione non riuscita.");return;}
    setMessage(action==="approve"?`Creato come bozza: ${j.place?.slug}`:"Candidato aggiornato."); await load();
  }

  return <main style={{maxWidth:1200,margin:"0 auto",padding:"28px 18px 60px"}}>
    <Link href="/admin/places">← Admin locali</Link>
    <h1>Importazione massiva locali GF</h1>
    <p>Ogni record importato è un candidato non verificato. L’approvazione crea una bozza non pubblica.</p>
    <div style={{display:"grid",gridTemplateColumns:"2fr 1fr auto",gap:10,alignItems:"end"}}>
      <label>Cerca<input value={q} onChange={e=>setQ(e.target.value)} style={input}/></label>
      <label>Stato<select value={status} onChange={e=>setStatus(e.target.value)} style={input}><option value="pending">Da verificare</option><option value="possible_duplicate">Possibili duplicati</option><option value="approved_as_draft">Approvati come bozza</option><option value="discarded">Scartati</option></select></label>
      <button onClick={()=>void load()} style={button}>Aggiorna</button>
    </div>
    {message&&<div style={{margin:"14px 0",padding:12,border:"1px solid #bbd7c2",background:"#f0fdf4",borderRadius:8}}>{message}</div>}
    {loading?<p>Caricamento...</p>:<div style={{display:"grid",gap:12,marginTop:18}}>{rows.map(r=><article key={r.id} style={card}>
      <div style={{flex:1}}><h2 style={{margin:"0 0 6px"}}>{r.name}</h2><div>{[r.city,r.province,r.region,r.country].filter(Boolean).join(" · ")}</div><div>{r.address||"Indirizzo non disponibile"}</div>
      <small>Tipo: {r.type} · Indicazione OSM: {r.gf_source_value||"n/d"} · Categoria proposta: {r.gf_category}</small>
      <div style={{marginTop:8,display:"flex",gap:12,flexWrap:"wrap"}}>{r.source_url&&<a href={r.source_url} target="_blank" rel="noreferrer">Apri origine OSM</a>}{r.website&&<a href={r.website} target="_blank" rel="noreferrer">Sito</a>}</div></div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",justifyContent:"flex-end"}}>
        {status==="pending"&&<><button disabled={busy===r.id} onClick={()=>void action(r.id,"approve")} style={button}>Approva come bozza</button><button disabled={busy===r.id} onClick={()=>void action(r.id,"duplicate")} style={secondary}>Possibile duplicato</button><button disabled={busy===r.id} onClick={()=>void action(r.id,"discard")} style={danger}>Scarta</button></>}
      </div>
    </article>)}{rows.length===0&&<p>Nessun candidato in questo stato.</p>}</div>}
    <p style={{marginTop:24,fontSize:13,color:"#526"}}>Dati © OpenStreetMap contributors, disponibili sotto ODbL. Verificare sempre direttamente disponibilità GF e rischio contaminazione prima della pubblicazione.</p>
  </main>
}
const input={display:"block",width:"100%",padding:10,marginTop:5,border:"1px solid #b8c7bb",borderRadius:7,boxSizing:"border-box" as const};
const card={display:"flex",justifyContent:"space-between",gap:16,alignItems:"center",padding:16,border:"1px solid #dbe5dc",borderRadius:12,background:"white",flexWrap:"wrap" as const};
const button={padding:"10px 14px",border:0,borderRadius:7,background:"#15803d",color:"white",fontWeight:700,cursor:"pointer"};
const secondary={...button,background:"#475569"}; const danger={...button,background:"#b91c1c"};
