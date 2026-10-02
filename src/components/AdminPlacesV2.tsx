"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import type { Place } from "@/types/place";

const COUNTRIES: Record<string, string[]> = {
  Europa: ["Italia"],
};

const REGIONS: Record<string, string[]> = {
  Italia: [
    "Abruzzo", "Basilicata", "Calabria", "Campania", "Emilia-Romagna",
    "Friuli-Venezia Giulia", "Lazio", "Liguria", "Lombardia", "Marche",
    "Molise", "Piemonte", "Puglia", "Sardegna", "Sicilia", "Toscana",
    "Trentino-Alto Adige", "Umbria", "Valle d'Aosta", "Veneto",
  ],
};

const CITIES: Record<string, string[]> = {
  Lazio: ["Roma"], Lombardia: ["Milano"], Campania: ["Napoli"],
  Toscana: ["Firenze"], Piemonte: ["Torino"], "Emilia-Romagna": ["Bologna"],
  Liguria: ["Genova"], Sicilia: ["Palermo"], Puglia: ["Bari"], Veneto: ["Venezia"],
};

const TYPES = ["Ristorante", "Pizzeria", "Pasticceria", "Gelateria", "Bar", "Street Food", "Negozio Specializzato", "Supermercato", "Hotel", "B&B", "Agriturismo", "Altro"];
const GF_LEVELS = ["Stato da verificare", "Gluten Free Certificato", "Gluten Free verificato dalla community", "Disponibilità Gluten Free", "Possibile contaminazione"];

const EMPTY = {
  slug: "", name: "", continent: "Europa", country: "Italia", region: "", city: "",
  type: "Ristorante", gf_category: "Stato da verificare", address: "", latitude: 0,
  longitude: 0, phone: "", website: "", description: "", notes: "", is_demo: false,
  verified: false, published: false, delivery_available: false, direct_delivery: false,
  takeaway_available: false, just_eat_url: "", glovo_url: "", too_good_to_go_available: false,
  too_good_to_go_url: "",
};

function slugify(value: string) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

export default function AdminPlacesV2() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [places, setPlaces] = useState<Place[]>([]);
  const [form, setForm] = useState<any>(EMPTY);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [slugTouched, setSlugTouched] = useState(false);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  async function loadPlaces() {
    const { data, error } = await supabase.from("places").select("*").order("name");
    if (error) setMessage(error.message);
    else setPlaces((data ?? []) as Place[]);
  }

  useEffect(() => {
    (async () => {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) { setAllowed(false); return; }
      const { data, error } = await supabase.rpc("is_admin");
      const ok = !error && data === true;
      setAllowed(ok);
      if (ok) await loadPlaces();
    })();
  }, []);

  const filtered = useMemo(() => places.filter((p) => {
    const q = search.toLowerCase().trim();
    const matchesText = !q || [p.name, p.city, p.region, p.type].some(v => v?.toLowerCase().includes(q));
    const matchesStatus = status === "all" || (status === "published" && p.published) ||
      (status === "draft" && !p.published) || (status === "verified" && p.verified) ||
      (status === "unverified" && !p.verified);
    return matchesText && matchesStatus;
  }), [places, search, status]);

  function setField(key: string, value: any) { setForm((f: any) => ({ ...f, [key]: value })); }
  function setName(value: string) { setForm((f: any) => ({ ...f, name: value, slug: slugTouched ? f.slug : slugify(value) })); }
  function reset() { setForm(EMPTY); setEditingId(null); setSlugTouched(false); setMessage(""); window.scrollTo({ top: 0, behavior: "smooth" }); }
  function edit(p: Place) { setForm(p); setEditingId(p.id); setSlugTouched(true); setMessage(""); window.scrollTo({ top: 0, behavior: "smooth" }); }

  async function save(event: FormEvent, publish: boolean) {
    event.preventDefault(); setMessage(""); setSaving(true);
    const payload = { ...form, published: publish, latitude: Number(form.latitude), longitude: Number(form.longitude) };
    delete payload.id; delete payload.created_at; delete payload.updated_at;
    const result = editingId
      ? await supabase.from("places").update(payload).eq("id", editingId)
      : await supabase.from("places").insert(payload);
    setSaving(false);
    if (result.error) { setMessage(result.error.message); return; }
    setMessage(publish ? "Locale salvato e pubblicato." : "Locale salvato come bozza.");
    setForm(EMPTY); setEditingId(null); setSlugTouched(false); await loadPlaces();
  }

  async function remove(p: Place) {
    if (!window.confirm(`Eliminare definitivamente ${p.name}?`)) return;
    const { error } = await supabase.from("places").delete().eq("id", p.id);
    if (error) setMessage(error.message); else await loadPlaces();
  }

  if (allowed === null) return <main style={pageStyle}>Verifica autorizzazioni...</main>;
  if (!allowed) return <main style={pageStyle}><h1>Accesso negato</h1><Link href="/">Torna alla home</Link></main>;

  return <main style={pageStyle}>
    <Link href="/">← Home</Link>
    <h1>Pannello Admin Locali v2</h1>
    <p>Inserisci i dati manualmente. La ricerca online e l'autocomplete dell'indirizzo saranno collegati nella fase Google Places.</p>

    <form onSubmit={(e) => save(e, form.published)}>
      <Section title={editingId ? "Modifica locale" : "Nuovo locale"}>
        <Field label="Nome locale"><input value={form.name} onChange={e => setName(e.target.value)} required style={input}/></Field>
        <Field label="Slug"><input value={form.slug} onChange={e => {setSlugTouched(true);setField("slug",e.target.value)}} required style={input}/></Field>
        <div style={grid4}>
          <Field label="Continente"><select value={form.continent} onChange={e=>{setField("continent",e.target.value);setField("country","");setField("region","");setField("city","")}} style={input}>{Object.keys(COUNTRIES).map(x=><option key={x}>{x}</option>)}</select></Field>
          <Field label="Nazione"><select value={form.country} onChange={e=>{setField("country",e.target.value);setField("region","");setField("city","")}} style={input}><option value="">Seleziona</option>{(COUNTRIES[form.continent]??[]).map(x=><option key={x}>{x}</option>)}</select></Field>
          <Field label="Regione"><select value={form.region} onChange={e=>{setField("region",e.target.value);setField("city","")}} style={input}><option value="">Seleziona</option>{(REGIONS[form.country]??[]).map(x=><option key={x}>{x}</option>)}</select></Field>
          <Field label="Città"><select value={form.city} onChange={e=>setField("city",e.target.value)} style={input}><option value="">Seleziona</option>{(CITIES[form.region]??[]).map(x=><option key={x}>{x}</option>)}</select></Field>
        </div>
        <Field label="Indirizzo"><input value={form.address} onChange={e=>setField("address",e.target.value)} required style={input} placeholder="Autocomplete online nella fase 2"/></Field>
        <div style={grid2}><Field label="Latitudine"><input type="number" step="any" value={form.latitude} onChange={e=>setField("latitude",e.target.value)} required style={input}/></Field><Field label="Longitudine"><input type="number" step="any" value={form.longitude} onChange={e=>setField("longitude",e.target.value)} required style={input}/></Field></div>
      </Section>

      <Section title="Informazioni Gluten Free">
        <div style={grid2}><Field label="Tipologia"><select value={form.type} onChange={e=>setField("type",e.target.value)} style={input}>{TYPES.map(x=><option key={x}>{x}</option>)}</select></Field><Field label="Affidabilità"><select value={form.gf_category} onChange={e=>setField("gf_category",e.target.value)} style={input}>{GF_LEVELS.map(x=><option key={x}>{x}</option>)}</select></Field></div>
        <Checkbox label="Locale verificato" checked={form.verified} onChange={v=>setField("verified",v)}/>
      </Section>

      <Section title="Contatti e servizi">
        <div style={grid2}><Field label="Telefono"><input value={form.phone} onChange={e=>setField("phone",e.target.value)} style={input}/></Field><Field label="Sito web"><input value={form.website} onChange={e=>setField("website",e.target.value)} style={input}/></Field></div>
        <Checkbox label="Consegna a domicilio" checked={form.delivery_available} onChange={v=>setField("delivery_available",v)}/>
        <Checkbox label="Consegna diretta" checked={form.direct_delivery} onChange={v=>setField("direct_delivery",v)}/>
        <Checkbox label="Ritiro al locale" checked={form.takeaway_available} onChange={v=>setField("takeaway_available",v)}/>
        <Field label="URL Just Eat"><input value={form.just_eat_url} onChange={e=>setField("just_eat_url",e.target.value)} style={input}/></Field>
        <Field label="URL Glovo"><input value={form.glovo_url} onChange={e=>setField("glovo_url",e.target.value)} style={input}/></Field>
        <Checkbox label="Too Good To Go" checked={form.too_good_to_go_available} onChange={v=>setField("too_good_to_go_available",v)}/>
        {form.too_good_to_go_available && <Field label="URL Too Good To Go"><input value={form.too_good_to_go_url} onChange={e=>setField("too_good_to_go_url",e.target.value)} style={input}/></Field>}
      </Section>

      <Section title="Testi e pubblicazione">
        <Field label="Descrizione pubblica"><textarea rows={5} value={form.description} onChange={e=>setField("description",e.target.value)} style={input}/></Field>
        <Field label="Note amministratore"><textarea rows={4} value={form.notes} onChange={e=>setField("notes",e.target.value)} style={input}/></Field>
        <Checkbox label="Attività dimostrativa" checked={form.is_demo} onChange={v=>setField("is_demo",v)}/>
        <div style={actions}><button type="button" disabled={saving} onClick={(e:any)=>save(e,false)} style={draftButton}>Salva come bozza</button><button type="button" disabled={saving} onClick={(e:any)=>save(e,true)} style={publishButton}>{editingId?"Salva e pubblica":"Pubblica locale"}</button>{editingId&&<button type="button" onClick={reset} style={cancelButton}>Annulla</button>}</div>
      </Section>
    </form>
    {message && <p style={{fontWeight:700}}>{message}</p>}

    <section style={{marginTop:"36px"}}><h2>Gestione locali</h2><div style={toolbar}><input placeholder="Cerca locale, città, regione..." value={search} onChange={e=>setSearch(e.target.value)} style={input}/><select value={status} onChange={e=>setStatus(e.target.value)} style={input}><option value="all">Tutti</option><option value="published">Pubblicati</option><option value="draft">Bozze</option><option value="verified">Verificati</option><option value="unverified">Da verificare</option></select></div><p>{filtered.length} locali</p><div style={{display:"grid",gap:"12px"}}>{filtered.map(p=><article key={p.id} style={card}><div><strong>{p.name}</strong><div>{p.city}, {p.region} · {p.type}</div><small>{p.published?"🟢 Pubblicato":"⚪ Bozza"} · {p.verified?"✅ Verificato":"🟠 Da verificare"}</small></div><div style={actions}><Link href={`/places/${p.slug}`}>Apri</Link><button onClick={()=>edit(p)}>Modifica</button><button onClick={()=>remove(p)} style={{color:"#b91c1c"}}>Elimina</button></div></article>)}</div></section>
  </main>;
}

function Section({title,children}:{title:string;children:React.ReactNode}){return <section style={section}><h2>{title}</h2><div style={{display:"grid",gap:"14px"}}>{children}</div></section>}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label style={{fontWeight:700}}>{label}{children}</label>}
function Checkbox({label,checked,onChange}:{label:string;checked:boolean;onChange:(v:boolean)=>void}){return <label><input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}/> {label}</label>}
const pageStyle={maxWidth:"1100px",margin:"0 auto",padding:"32px 20px",fontFamily:"Arial, sans-serif",lineHeight:1.5};const section={padding:"20px",margin:"18px 0",border:"1px solid #d6d6d6",borderRadius:"12px",background:"#fff"};const input={display:"block",width:"100%",boxSizing:"border-box" as const,padding:"10px",marginTop:"5px",border:"1px solid #aaa",borderRadius:"7px",font:"inherit"};const grid2={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(240px,1fr))",gap:"14px"};const grid4={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(180px,1fr))",gap:"14px"};const actions={display:"flex",gap:"10px",alignItems:"center",flexWrap:"wrap" as const};const draftButton={padding:"11px 16px",border:"1px solid #15803d",background:"white",color:"#15803d",borderRadius:"7px",fontWeight:700};const publishButton={padding:"11px 16px",border:0,background:"#15803d",color:"white",borderRadius:"7px",fontWeight:700};const cancelButton={padding:"11px 16px",border:"1px solid #aaa",background:"white",borderRadius:"7px"};const toolbar={display:"grid",gridTemplateColumns:"2fr 1fr",gap:"12px"};const card={padding:"16px",border:"1px solid #ddd",borderRadius:"10px",display:"flex",justifyContent:"space-between",gap:"16px",alignItems:"center",flexWrap:"wrap" as const};
