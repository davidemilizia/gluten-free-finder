"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";
import { ITALIAN_PROVINCES } from "@/lib/italian-provinces";

type G = { id: number; name: string };
type BP = { id: string; title: string; url: string; coordinates: number[]; address: any; categories: string[] };

const EMPTY = {name:"",slug:"",continent:"",country:"",region:"",province:"",city:"",address:"",latitude:0,longitude:0,type:"Ristorante",gf_category:"Stato da verificare",phone:"",website:"",description:"",notes:"",verified:false,published:false,delivery_available:false,direct_delivery:false,takeaway_available:false,just_eat_url:"",glovo_url:"",too_good_to_go_available:false,too_good_to_go_url:"",is_demo:false};
const slug=(s:string)=>s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"");
const pick=(...x:any[])=>x.find(v=>typeof v==="string"&&v.trim())?.trim()||"";
function provinceCode(s:string){return s.match(/\b\d{5}\s+[^,]+?\s+([A-Z]{2})(?:\b|,)/)?.[1]||""}
function cityByAddress(s:string){for(const p of s.split(",").map(x=>x.trim())){const m=p.match(/^\d{5}\s+(.+?)(?:\s+[A-Z]{2})?$/);if(m)return m[1]}return ""}

export default function AdminPlacesV2(){
 const[allowed,setAllowed]=useState<boolean|null>(null),[form,setForm]=useState<any>(EMPTY),[continents,setContinents]=useState<G[]>([]),[countries,setCountries]=useState<G[]>([]),[regions,setRegions]=useState<G[]>([]),[provinces,setProvinces]=useState<G[]>([]),[cities,setCities]=useState<G[]>([]),[ids,setIds]=useState<any>({}),[q,setQ]=useState(""),[location,setLocation]=useState(""),[results,setResults]=useState<BP[]>([]),[msg,setMsg]=useState(""),[loading,setLoading]=useState(false);
 useEffect(()=>{(async()=>{const{data:s}=await supabase.auth.getSession();if(!s.session){setAllowed(false);return}const{data:a}=await supabase.rpc("is_admin");setAllowed(a===true);if(a===true){const{data}=await supabase.from("continents").select("id,name").eq("active",true).order("name");setContinents((data??[])as G[])}})()},[]);
 const f=(k:string,v:any)=>setForm((x:any)=>({...x,[k]:v}));
 async function selectContinent(id:number){setIds({continent:id});const x=continents.find(v=>v.id===id);f("continent",x?.name||"");const{data}=await supabase.from("countries").select("id,name").eq("continent_id",id).eq("active",true).order("name");setCountries((data??[])as G[]);setRegions([]);setProvinces([]);setCities([])}
 async function selectCountry(id:number){setIds((x:any)=>({...x,country:id}));const x=countries.find(v=>v.id===id);f("country",x?.name||"");const{data}=await supabase.from("regions").select("id,name").eq("country_id",id).eq("active",true).order("name");setRegions((data??[])as G[]);setProvinces([]);setCities([])}
 async function selectRegion(id:number){setIds((x:any)=>({...x,region:id}));const x=regions.find(v=>v.id===id);f("region",x?.name||"");const{data}=await supabase.from("provinces").select("id,name").eq("region_id",id).eq("active",true).order("name");setProvinces((data??[])as G[]);setCities([])}
 async function selectProvince(id:number){setIds((x:any)=>({...x,province:id}));const x=provinces.find(v=>v.id===id);f("province",x?.name||"");const{data}=await supabase.from("cities").select("id,name").eq("province_id",id).eq("active",true).order("name");setCities((data??[])as G[])}
 async function syncGeography(continentName:string,countryName:string,regionName:string,provinceName:string,cityName:string){
  const { data: continentRow, error: continentError } = await supabase.from("continents").select("id,name").eq("name",continentName).maybeSingle();
  if(continentError){setMsg(`Errore continente: ${continentError.message}`);return false}
  if(!continentRow){setMsg(`Continente ${continentName} non trovato.`);return false}

  const { data: countryRows, error: countryError } = await supabase.from("countries").select("id,name").eq("continent_id",continentRow.id).eq("active",true).order("name");
  if(countryError){setMsg(`Errore nazioni: ${countryError.message}`);return false}
  const countryList=(countryRows??[]) as G[];
  const countryRow=countryList.find(x=>x.name.toLowerCase()===countryName.toLowerCase());
  if(!countryRow){setMsg(`Nazione ${countryName} non trovata.`);return false}

  const { data: regionRows, error: regionError } = await supabase.from("regions").select("id,name").eq("country_id",countryRow.id).eq("active",true).order("name");
  if(regionError){setMsg(`Errore regioni: ${regionError.message}`);return false}
  const regionList=(regionRows??[]) as G[];
  const regionRow=regionList.find(x=>x.name.toLowerCase()===regionName.toLowerCase());
  if(!regionRow){setMsg(`Regione ${regionName} non trovata.`);return false}

  const { data: provinceRows, error: provinceError } = await supabase.from("provinces").select("id,name").eq("region_id",regionRow.id).eq("active",true).order("name");
  if(provinceError){setMsg(`Errore città / province: ${provinceError.message}`);return false}
  const provinceList=(provinceRows??[]) as G[];
  const provinceRow=provinceList.find(x=>x.name.toLowerCase()===provinceName.toLowerCase());
  if(!provinceRow){setMsg(`Città / Provincia ${provinceName} non trovata.`);return false}

  const { data: cityRows, error: cityError } = await supabase.from("cities").select("id,name").eq("province_id",provinceRow.id).eq("active",true).order("name");
  if(cityError){setMsg(`Errore comuni: ${cityError.message}`);return false}
  const cityList=(cityRows??[]) as G[];
  const cityRow=cityList.find(x=>x.name.toLowerCase()===cityName.toLowerCase());
  if(!cityRow){setMsg(`Comune / Località ${cityName} non trovato.`);return false}

  // Aggiornamento atomico degli elenchi, degli ID selezionati e dei valori salvati nel form.
  setCountries(countryList);
  setRegions(regionList);
  setProvinces(provinceList);
  setCities(cityList);
  setIds({continent:continentRow.id,country:countryRow.id,region:regionRow.id,province:provinceRow.id});
  setForm((current:any)=>({...current,continent:continentName,country:countryName,region:regionName,province:provinceName,city:cityRow.name}));
  return true;
 }
 async function search(){setLoading(true);setMsg("");try{const r=await fetch(`/api/place-search?q=${encodeURIComponent(q)}&location=${encodeURIComponent(location)}`),j=await r.json();if(!r.ok){setMsg(j.error||"Ricerca non disponibile");return}setResults(j.results??[])}finally{setLoading(false)}}
 async function usePlace(p:BP){let d:any=null;try{const r=await fetch(`/api/place-details?id=${encodeURIComponent(p.id)}`),j=await r.json();if(r.ok)d=j.place}catch{}const a=d?.postal_address||d?.postalAddress||d?.address||p.address||{},display=pick(a.displayAddress,a.display_address,a.streetAddress,a.street_address),code=provinceCode(display),meta=ITALIAN_PROVINCES[code],city=pick(a.addressLocality,a.address_locality,a.city,cityByAddress(display),location.replace(/\bitalia\b/i,"").trim()),region=pick(a.addressRegion,a.address_region,meta?.region),province=meta?.name||"",coords=d?.coordinates||p.coordinates||[],name=pick(d?.title,p.title);setForm((x:any)=>({...x,name,slug:slug(name),address:pick(a.streetAddress,a.street_address,display),latitude:coords[0]??0,longitude:coords[1]??0,phone:pick(d?.phone,d?.telephone,d?.contact?.phone),website:pick(d?.url,d?.website,p.url)}));if(!city||!region||!province){setMsg("Dati del locale applicati. Completa manualmente Città / Provincia e Comune.");return}const{error}=await supabase.rpc("ensure_geography_v25",{p_continent:"Europa",p_country:"Italia",p_country_iso2:"IT",p_region:region,p_province:province,p_province_code:code,p_city:city,p_lat:coords[0]??null,p_lon:coords[1]??null});if(error){setMsg(error.message);return}
  const synced=await syncGeography("Europa","Italia",region,province,city);
  if(!synced)return;
  setMsg("Geografia sincronizzata: Europa → Italia → Regione → Città / Provincia → Comune.");
  setResults([])}
 async function save(pub:boolean){if(!form.region||!form.province||!form.city){setMsg("Completa Regione, Città / Provincia e Comune.");return}const{error}=await supabase.from("places").insert({...form,published:pub,latitude:Number(form.latitude),longitude:Number(form.longitude)});setMsg(error?error.message:(pub?"Locale pubblicato.":"Locale salvato come bozza."))}
 if(allowed===null)return<main style={page}>Verifica autorizzazioni...</main>;if(!allowed)return<main style={page}>Accesso negato</main>;
 return <main style={page}><Link href="/">← Home</Link><h1>Pannello Admin Locali v2.5.3</h1><section style={section}><h2>🌐 Brave Places</h2><div style={grid}><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Nome locale" style={input}/><input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Comune, es. Atripalda Italia" style={input}/></div><button onClick={search} style={btn}>{loading?"Ricerca...":"Cerca"}</button>{results.map(x=><article key={x.id} style={card}><div><b>{x.title}</b><div>{x.address?.displayAddress||x.address?.streetAddress}</div></div><button onClick={()=>usePlace(x)} style={btn}>Usa questi dati</button></article>)}</section><section style={section}><h2>Nuovo locale</h2><Field t="Nome"><input value={form.name} onChange={e=>f("name",e.target.value)} style={input}/></Field><Field t="Slug"><input value={form.slug} onChange={e=>f("slug",e.target.value)} style={input}/></Field><div style={geo}><Geo t="Continente" a={continents} v={ids.continent} c={selectContinent}/><Geo t="Nazione" a={countries} v={ids.country} c={selectCountry}/><Geo t="Regione / Stato" a={regions} v={ids.region} c={selectRegion}/><Geo t="Città / Provincia" a={provinces} v={ids.province} c={selectProvince}/><Geo t="Comune / Località" a={cities} v={cities.find(x=>x.name===form.city)?.id} c={id=>f("city",cities.find(x=>x.id===id)?.name||"")}/></div><Field t="Indirizzo"><input value={form.address} onChange={e=>f("address",e.target.value)} style={input}/></Field><div style={grid}><Field t="Latitudine"><input value={form.latitude} onChange={e=>f("latitude",e.target.value)} style={input}/></Field><Field t="Longitudine"><input value={form.longitude} onChange={e=>f("longitude",e.target.value)} style={input}/></Field></div><div style={grid}><Field t="Telefono"><input value={form.phone} onChange={e=>f("phone",e.target.value)} style={input}/></Field><Field t="Sito web"><input value={form.website} onChange={e=>f("website",e.target.value)} style={input}/></Field></div><div style={{display:"flex",gap:10,marginTop:15}}><button onClick={()=>save(false)}>Salva bozza</button><button onClick={()=>save(true)} style={btn}>Pubblica locale</button></div></section>{msg&&<p><b>{msg}</b></p>}</main>}
function Field({t,children}:{t:string;children:any}){return<label style={{fontWeight:700,display:"block",marginTop:10}}>{t}{children}</label>}
function Geo({t,a,v,c}:{t:string;a:G[];v?:number;c:(id:number)=>void}){return<Field t={t}><select value={v||""} onChange={e=>{if(e.target.value)c(Number(e.target.value))}} style={input}><option value="">Seleziona</option>{a.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>}
const page={maxWidth:1100,margin:"0 auto",padding:24},section={padding:20,border:"1px solid #ddd",borderRadius:12,margin:"18px 0"},grid={display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12},geo={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10},input={display:"block",width:"100%",boxSizing:"border-box" as const,padding:10,marginTop:5},btn={padding:"10px 16px",background:"#15803d",color:"white",border:0,borderRadius:7,fontWeight:700,marginTop:10},card={padding:12,border:"1px solid #ddd",borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10};
