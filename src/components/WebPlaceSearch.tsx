"use client";
import { useState } from "react";

type Result = { title:string; url:string; description:string; age?:string };
type Props = { onUseQuery?: (value:string) => void };

export default function WebPlaceSearch({ onUseQuery }: Props) {
  const [query,setQuery]=useState("");
  const [results,setResults]=useState<Result[]>([]);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");

  async function run(){
    const q=query.trim(); if(q.length<3){setError("Inserisci almeno 3 caratteri.");return}
    setLoading(true);setError("");setResults([]);
    try{
      const r=await fetch(`/api/web-search?q=${encodeURIComponent(q)}`);
      const j=await r.json(); if(!r.ok)throw new Error(j.error||"Ricerca non disponibile");
      setResults(j.results??[]);
    }catch(e:any){setError(e.message||"Errore ricerca")}
    finally{setLoading(false)}
  }

  return <section style={box}>
    <h2>🌐 Cerca locale sul Web</h2>
    <p>Usa nome + città, per esempio <strong>Daniele Gourmet Avellino</strong>. Controlla sempre i dati prima della pubblicazione.</p>
    <div style={row}><input value={query} onChange={e=>setQuery(e.target.value)} onKeyDown={e=>{if(e.key==="Enter"){e.preventDefault();run()}}} placeholder="Nome locale + città" style={input}/><button type="button" onClick={run} disabled={loading} style={button}>{loading?"Ricerca...":"Cerca sul Web"}</button></div>
    {error&&<p style={{color:"#b91c1c"}}>{error}</p>}
    <div style={{display:"grid",gap:10,marginTop:14}}>{results.map(r=><article key={r.url} style={card}>
      <div><strong>{r.title}</strong><p style={{margin:"6px 0"}}>{r.description}</p><small>{r.url}</small></div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><a href={r.url} target="_blank" rel="noreferrer" style={link}>Apri fonte</a>{onUseQuery&&<button type="button" onClick={()=>onUseQuery(r.title)} style={button}>Cerca su OSM</button>}</div>
    </article>)}</div>
  </section>
}
const box={padding:20,margin:"18px 0",border:"1px solid #bfdbfe",borderRadius:12,background:"#eff6ff"};
const row={display:"grid",gridTemplateColumns:"minmax(0,2fr) minmax(160px,1fr)",gap:12};
const input={width:"100%",boxSizing:"border-box" as const,padding:10,border:"1px solid #aaa",borderRadius:7,font:"inherit"};
const button={padding:"10px 16px",background:"#1d4ed8",color:"white",border:0,borderRadius:7,fontWeight:700};
const card={padding:14,border:"1px solid #dbeafe",borderRadius:9,background:"white",display:"flex",justifyContent:"space-between",gap:14,alignItems:"center",flexWrap:"wrap" as const};
const link={padding:"9px 12px",background:"white",border:"1px solid #1d4ed8",borderRadius:7,color:"#1d4ed8",textDecoration:"none",fontWeight:700};
