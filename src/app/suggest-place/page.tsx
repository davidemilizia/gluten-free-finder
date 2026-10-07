"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase-browser";

type Result = {
  id: string;
  title: string;
  url?: string;
  coordinates?: number[];
  address?: Record<string, any>;
};

type FormData = {
  external_place_id: string;
  name: string;
  slug: string;
  continent: string;
  country: string;
  country_iso2: string;
  region: string;
  province: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  phone: string;
  website: string;
  place_type: string;
  gf_category: string;
  user_note: string;
};

const empty: FormData = {
  external_place_id: "", name: "", slug: "", continent: "", country: "",
  country_iso2: "", region: "", province: "", city: "", address: "",
  latitude: 0, longitude: 0, phone: "", website: "", place_type: "Ristorante",
  gf_category: "Stato da verificare", user_note: "",
};

const makeSlug = (value: string) => value.toLowerCase().normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "");

function continentFor(code: string) {
  const eu = new Set(["IT","FR","ES","DE","NL","PL","GB","PT","BE","AT","CH","IE","GR","SE","NO","DK","FI","CZ","SK","HU","RO","BG","HR","SI"]);
  const na = new Set(["US","CA","MX"]);
  const sa = new Set(["BR","AR","CL","CO","PE","UY","PY","BO","EC","VE"]);
  const oc = new Set(["AU","NZ","FJ"]);
  const af = new Set(["ZA","MA","TN","EG","DZ","NG","KE"]);
  if (eu.has(code)) return "Europa"; if (na.has(code)) return "America del Nord";
  if (sa.has(code)) return "America del Sud"; if (oc.has(code)) return "Oceania";
  if (af.has(code)) return "Africa"; return "Asia";
}

export default function SuggestPlacePage() {
  const [authorized, setAuthorized] = useState<boolean | null>(null);
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [results, setResults] = useState<Result[]>([]);
  const [form, setForm] = useState<FormData>(empty);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => { void (async () => {
    const { data: session } = await supabase.auth.getSession();
    if (!session.session) return setAuthorized(false);
    const { data } = await supabase.rpc("get_my_account_status");
    const row = Array.isArray(data) ? data[0] : data;
    setAuthorized(row?.account_status === "active");
  })(); }, []);

  async function search() {
    setBusy(true); setMessage("");
    try {
      const response = await fetch(`/api/place-search?q=${encodeURIComponent(q)}&location=${encodeURIComponent(location)}`);
      const json = await response.json();
      if (!response.ok) return setMessage(json.error || "Ricerca non disponibile.");
      setResults(json.results || []);
    } finally { setBusy(false); }
  }

  async function useResult(result: Result) {
    setBusy(true); setMessage("");
    try {
      let details: any = result;
      const detailResponse = await fetch(`/api/place-details?id=${encodeURIComponent(result.id)}`);
      if (detailResponse.ok) details = (await detailResponse.json()).place || result;
      const coords = details.coordinates || result.coordinates || [];
      let reverse: any = {};
      if (coords.length >= 2) {
        const rr = await fetch(`/api/reverse-geocode?lat=${coords[0]}&lon=${coords[1]}`);
        if (rr.ok) reverse = await rr.json();
      }
      const a = details.postal_address || details.postalAddress || details.address || result.address || {};
      const name = details.title || result.title || "";
      const iso2 = String(reverse.country_code || a.countryCode || a.country_code || "").toUpperCase();
      const city = reverse.city || reverse.town || reverse.village || reverse.municipality || a.addressLocality || "";
      const region = reverse.state || reverse.region || a.addressRegion || "";
      const province = reverse.county || reverse.province || city;
      const display = a.streetAddress || a.street_address || a.displayAddress || a.display_address || reverse.display_name || "";
      setForm({
        ...empty, external_place_id: result.id, name, slug: makeSlug(name),
        continent: iso2 ? continentFor(iso2) : "", country: reverse.country || a.country || "",
        country_iso2: iso2, region, province, city, address: display,
        latitude: Number(coords[0] || 0), longitude: Number(coords[1] || 0),
        phone: details.phone || details.telephone || "", website: details.url || details.website || result.url || "",
      });
      setResults([]);
      setMessage("Dati recuperati. Controllali e completa la motivazione prima dell'invio.");
    } finally { setBusy(false); }
  }

  async function submit(event: FormEvent) {
    event.preventDefault(); setBusy(true); setMessage("");
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setBusy(false); return setMessage("Accedi prima di inviare il suggerimento."); }
    const { error } = await supabase.from("place_suggestions").insert({ ...form, user_id: user.id });
    setBusy(false);
    if (error) return setMessage(error.message);
    setForm(empty); setQ(""); setLocation("");
    setMessage("Suggerimento inviato. Il locale sarà controllato dagli amministratori prima della pubblicazione.");
  }

  if (authorized === null) return <main style={page}>Verifica account...</main>;
  if (!authorized) return <main style={page}><h1>Suggerisci un locale</h1><p>Devi accedere con un account approvato.</p><Link href="/login">Accedi</Link></main>;

  return <main style={page}>
    <Link href="/">← Home</Link>
    <h1>Suggerisci un locale</h1>
    <p>Il suggerimento non viene pubblicato automaticamente. Gli amministratori controlleranno i dati.</p>
    <section style={box}><h2>Cerca il locale online</h2>
      <div style={grid}><input value={q} onChange={e=>setQ(e.target.value)} placeholder="Nome locale"/><input value={location} onChange={e=>setLocation(e.target.value)} placeholder="Località facoltativa"/></div>
      <button onClick={search} disabled={busy || q.trim().length < 2}>Cerca</button>
      {results.map(r=><article key={r.id} style={result}><div><strong>{r.title}</strong><br/>{r.address?.displayAddress || r.address?.streetAddress}</div><button onClick={()=>useResult(r)}>Usa questi dati</button></article>)}
    </section>
    <form onSubmit={submit} style={box}>
      <h2>Dati proposti</h2>
      <div style={grid}>
        <Field label="Nome"><input required value={form.name} onChange={e=>setForm({...form,name:e.target.value,slug:makeSlug(e.target.value)})}/></Field>
        <Field label="Slug"><input required value={form.slug} onChange={e=>setForm({...form,slug:e.target.value})}/></Field>
        <Field label="Continente"><input value={form.continent} onChange={e=>setForm({...form,continent:e.target.value})}/></Field>
        <Field label="Nazione"><input value={form.country} onChange={e=>setForm({...form,country:e.target.value})}/></Field>
        <Field label="Regione / Stato"><input value={form.region} onChange={e=>setForm({...form,region:e.target.value})}/></Field>
        <Field label="Città / Provincia"><input value={form.province} onChange={e=>setForm({...form,province:e.target.value})}/></Field>
        <Field label="Comune / Località"><input value={form.city} onChange={e=>setForm({...form,city:e.target.value})}/></Field>
        <Field label="Indirizzo"><input value={form.address} onChange={e=>setForm({...form,address:e.target.value})}/></Field>
        <Field label="Tipologia"><select value={form.place_type} onChange={e=>setForm({...form,place_type:e.target.value})}><option>Ristorante</option><option>Pizzeria</option><option>Pasticceria</option><option>Bar</option><option>Negozio Specializzato</option><option>Hotel</option><option>Altro</option></select></Field>
        <Field label="Affidabilità GF"><select value={form.gf_category} onChange={e=>setForm({...form,gf_category:e.target.value})}><option>Stato da verificare</option><option>Disponibilità Gluten Free</option><option>Gluten Free verificato dalla community</option></select></Field>
      </div>
      <Field label="Perché consigli questo locale?"><textarea required minLength={10} rows={5} value={form.user_note} onChange={e=>setForm({...form,user_note:e.target.value})}/></Field>
      <button disabled={busy}>{busy ? "Invio..." : "Invia suggerimento"}</button>
    </form>
    {message && <p><strong>{message}</strong></p>}
  </main>;
}

function Field({label,children}:{label:string;children:React.ReactNode}) { return <label style={{display:"grid",gap:5,fontWeight:700}}>{label}{children}</label>; }
const page={maxWidth:1000,margin:"0 auto",padding:30};
const box={border:"1px solid #ddd",borderRadius:12,padding:20,margin:"18px 0",display:"grid",gap:14};
const grid={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(230px,1fr))",gap:12};
const result={display:"flex",justifyContent:"space-between",gap:12,border:"1px solid #ddd",padding:12,borderRadius:8};
