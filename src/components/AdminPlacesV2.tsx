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
function cityByAddress(s:string){for(const p of s.split(",").map(x=>x.trim())){const m=p.match(/^\d{4,6}\s+(.+?)(?:\s+[A-Z]{2})?$/);if(m)return m[1]}return ""}
const EUROPE = new Set(["AL","AD","AT","BY","BE","BA","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IS","IE","IT","XK","LV","LI","LT","LU","MT","MD","MC","ME","NL","MK","NO","PL","PT","RO","RU","SM","RS","SK","SI","ES","SE","CH","TR","UA","GB","VA"]);
const ASIA = new Set(["AF","AM","AZ","BH","BD","BT","BN","KH","CN","GE","IN","ID","IR","IQ","IL","JP","JO","KZ","KW","KG","LA","LB","MY","MV","MN","MM","NP","KP","OM","PK","PS","PH","QA","SA","SG","KR","LK","SY","TW","TJ","TH","TL","TM","AE","UZ","VN","YE"]);
const AFRICA = new Set(["DZ","AO","BJ","BW","BF","BI","CV","CM","CF","TD","KM","CD","CG","CI","DJ","EG","GQ","ER","SZ","ET","GA","GM","GH","GN","GW","KE","LS","LR","LY","MG","MW","ML","MR","MU","MA","MZ","NA","NE","NG","RW","ST","SN","SC","SL","SO","ZA","SS","SD","TZ","TG","TN","UG","ZM","ZW"]);
const NORTH_AMERICA = new Set(["AG","BS","BB","BZ","CA","CR","CU","DM","DO","SV","GD","GT","HT","HN","JM","MX","NI","PA","KN","LC","VC","TT","US"]);
const SOUTH_AMERICA = new Set(["AR","BO","BR","CL","CO","EC","GY","PY","PE","SR","UY","VE"]);
const OCEANIA = new Set(["AU","FJ","KI","MH","FM","NR","NZ","PW","PG","WS","SB","TO","TV","VU"]);
function continentForIso2(value:string){const iso=value.toUpperCase();if(EUROPE.has(iso))return "Europa";if(ASIA.has(iso))return "Asia";if(AFRICA.has(iso))return "Africa";if(NORTH_AMERICA.has(iso))return "America del Nord";if(SOUTH_AMERICA.has(iso))return "America del Sud";if(OCEANIA.has(iso))return "Oceania";return ""}


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
 async function usePlace(p:BP){
  setLoading(true);setMsg("Recupero e sincronizzazione della geografia internazionale...");
  try{
   let d:any=null;try{const r=await fetch(`/api/place-details?id=${encodeURIComponent(p.id)}`),j=await r.json();if(r.ok)d=j.place}catch{}
   const a=d?.postal_address||d?.postalAddress||d?.address||p.address||{};
   const display=pick(a.displayAddress,a.display_address,a.formattedAddress,a.formatted_address,a.streetAddress,a.street_address);
   const coords=d?.coordinates||p.coordinates||[];
   const name=pick(d?.title,p.title);
   const country=pick(a.addressCountry,a.address_country,a.country,a.countryName,a.country_name);
   const iso2=pick(a.addressCountryCode,a.address_country_code,a.countryCode,a.country_code).toUpperCase();
   const city=pick(a.addressLocality,a.address_locality,a.city,a.town,a.village,a.municipality,cityByAddress(display),location);
   const region=pick(a.addressRegion,a.address_region,a.state,a.region,a.adminArea1,city);
   const italianCode=provinceCode(display),italianMeta=ITALIAN_PROVINCES[italianCode];
   const province=pick(a.addressSubregion,a.address_subregion,a.county,a.province,a.adminArea2,italianMeta?.name,city);
   const resolvedRegion=pick(region,italianMeta?.region,province,city);
   let continent=continentForIso2(iso2);

   if(!continent&&country){
    const{data:countryRows}=await supabase.from("countries").select("continent_id,name,iso2").or(`name.ilike.${country},iso2.eq.${iso2||"__"}`).limit(1);
    const continentId=countryRows?.[0]?.continent_id;
    if(continentId){const{data:c}=await supabase.from("continents").select("name").eq("id",continentId).maybeSingle();continent=c?.name||""}
   }

   setForm((x:any)=>({...x,name,slug:slug(name),address:pick(a.streetAddress,a.street_address,display),latitude:coords[0]??0,longitude:coords[1]??0,phone:pick(d?.phone,d?.telephone,d?.contact?.phone),website:pick(d?.url,d?.website,p.url)}));

   // Brave può restituire un indirizzo visuale completo ma non i singoli campi geografici.
   // In quel caso effettuiamo reverse geocoding server-side partendo dalle coordinate.
   let finalIso2=iso2,finalCountry=country,finalCity=city,finalProvince=province,finalRegion=resolvedRegion,finalContinent=continent;
   if((!finalCountry||!finalCity||!finalRegion||!finalProvince||!finalContinent)&&coords.length>=2){
    try{
     const reverseResponse=await fetch(`/api/reverse-geocode?lat=${encodeURIComponent(coords[0])}&lon=${encodeURIComponent(coords[1])}`);
     const reverse=await reverseResponse.json();
     if(reverseResponse.ok){
      // Il reverse geocoding strutturato ha priorita sui fallback ricavati
      // dall'indirizzo visuale, che possono contenere parti del codice postale.
      finalIso2=pick(reverse.country_code,finalIso2).toUpperCase();
      finalCountry=pick(reverse.country,finalCountry);
      finalCity=pick(reverse.city,reverse.town,reverse.village,reverse.municipality,reverse.county,finalCity);
      finalProvince=pick(reverse.county,reverse.province,reverse.state_district,finalCity,finalProvince);
      finalRegion=pick(reverse.state,reverse.region,reverse.state_district,finalProvince,finalRegion);
      finalContinent=pick(continentForIso2(finalIso2),finalContinent);
     }
    }catch{}
   }

   if(!finalContinent||!finalCountry||!finalRegion||!finalProvince||!finalCity){
    setMsg(`Dati applicati, ma la geografia restituita è incompleta. Continente: ${finalContinent||"?"}, Nazione: ${finalCountry||"?"}, Regione: ${finalRegion||"?"}, Provincia: ${finalProvince||"?"}, Località: ${finalCity||"?"}. Completa manualmente prima di pubblicare.`);return
   }

   const{error}=await supabase.rpc("ensure_geography_global",{p_continent:finalContinent,p_country:finalCountry,p_country_iso2:finalIso2||null,p_region:finalRegion,p_province:finalProvince,p_province_code:italianCode||null,p_city:finalCity,p_lat:coords[0]??null,p_lon:coords[1]??null});
   if(error){setMsg(`Dati del locale applicati. Sincronizzazione geografica non riuscita: ${error.message}`);return}
   const synced=await syncGeography(finalContinent,finalCountry,finalRegion,finalProvince,finalCity);
   if(!synced)return;
   setMsg(`Geografia sincronizzata: ${finalContinent} → ${finalCountry} → ${finalRegion} → ${finalProvince} → ${finalCity}. Controlla i valori prima di pubblicare.`);
   setResults([])
  }finally{setLoading(false)}
 }
 async function save(pub:boolean){if(!form.continent||!form.country||!form.region||!form.province||!form.city){setMsg("Completa Continente, Nazione, Regione / Stato, Città / Provincia e Comune / Località.");return}const{error}=await supabase.from("places").insert({...form,published:pub,latitude:Number(form.latitude),longitude:Number(form.longitude)});setMsg(error?error.message:(pub?"Locale pubblicato.":"Locale salvato come bozza."))}
 if(allowed===null)return<main style={page}>Verifica autorizzazioni...</main>;if(!allowed)return<main style={page}>Accesso negato</main>;
 return <main style={page}><Link href="/">← Home</Link><h1>Pannello Admin Locali v2.10.3 internazionale</h1><section style={section}><h2>🌐 Brave Places</h2><div style={grid}><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Nome locale" style={input}/><input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Località facoltativa, es. Amsterdam" style={input}/></div><button onClick={search} style={btn}>{loading?"Ricerca...":"Cerca"}</button>{results.map(x=><article key={x.id} style={card}><div><b>{x.title}</b><div>{x.address?.displayAddress||x.address?.streetAddress}</div></div><button onClick={()=>usePlace(x)} style={btn}>Usa questi dati</button></article>)}</section><section style={section}><h2>Nuovo locale</h2><Field t="Nome"><input value={form.name} onChange={e=>f("name",e.target.value)} style={input}/></Field><Field t="Slug"><input value={form.slug} onChange={e=>f("slug",e.target.value)} style={input}/></Field><div style={geo}><Geo t="Continente" a={continents} v={ids.continent} c={selectContinent}/><Geo t="Nazione" a={countries} v={ids.country} c={selectCountry}/><Geo t="Regione / Stato" a={regions} v={ids.region} c={selectRegion}/><Geo t="Città / Provincia" a={provinces} v={ids.province} c={selectProvince}/><Geo t="Comune / Località" a={cities} v={cities.find(x=>x.name===form.city)?.id} c={id=>f("city",cities.find(x=>x.id===id)?.name||"")}/></div><Field t="Indirizzo"><input value={form.address} onChange={e=>f("address",e.target.value)} style={input}/></Field><div style={grid}><Field t="Latitudine"><input value={form.latitude} onChange={e=>f("latitude",e.target.value)} style={input}/></Field><Field t="Longitudine"><input value={form.longitude} onChange={e=>f("longitude",e.target.value)} style={input}/></Field></div><div style={grid}><Field t="Telefono"><input value={form.phone} onChange={e=>f("phone",e.target.value)} style={input}/></Field><Field t="Sito web"><input value={form.website} onChange={e=>f("website",e.target.value)} style={input}/></Field></div><div style={{display:"flex",gap:10,marginTop:15}}><button onClick={()=>save(false)}>Salva bozza</button><button onClick={()=>save(true)} style={btn}>Pubblica locale</button></div></section>{msg&&<p><b>{msg}</b></p>}</main>}
function Field({t,children}:{t:string;children:any}){return<label style={{fontWeight:700,display:"block",marginTop:10}}>{t}{children}</label>}
function Geo({t,a,v,c}:{t:string;a:G[];v?:number;c:(id:number)=>void}){return<Field t={t}><select value={v||""} onChange={e=>{if(e.target.value)c(Number(e.target.value))}} style={input}><option value="">Seleziona</option>{a.map(x=><option key={x.id} value={x.id}>{x.name}</option>)}</select></Field>}
const page={maxWidth:1100,margin:"0 auto",padding:24},section={padding:20,border:"1px solid #ddd",borderRadius:12,margin:"18px 0"},grid={display:"grid",gridTemplateColumns:"repeat(2,minmax(0,1fr))",gap:12},geo={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10},input={display:"block",width:"100%",boxSizing:"border-box" as const,padding:10,marginTop:5},btn={padding:"10px 16px",background:"#15803d",color:"white",border:0,borderRadius:7,fontWeight:700,marginTop:10},card={padding:12,border:"1px solid #ddd",borderRadius:8,display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:10};
