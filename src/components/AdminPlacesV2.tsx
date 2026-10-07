"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";
import { ITALIAN_PROVINCES } from "@/lib/italian-provinces";
import AdminActivityDashboard from "@/components/admin/AdminActivityDashboard";

type G = { id: number; name: string };
type PlaceAdminRow = {
  id: number;
  slug: string;
  name: string;
  continent: string;
  country: string;
  region: string;
  province: string;
  city: string;
  address: string;
  latitude: number;
  longitude: number;
  type: string;
  gf_category: string;
  phone: string;
  website: string;
  description: string;
  notes: string;
  verified: boolean;
  published: boolean;
  delivery_available: boolean;
  direct_delivery: boolean;
  takeaway_available: boolean;
  just_eat_url: string;
  glovo_url: string;
  too_good_to_go_available: boolean;
  too_good_to_go_url: string;
  is_demo: boolean;
};
type BP = {
  id: string;
  title: string;
  url: string;
  coordinates: number[];
  address: any;
  categories: string[];
};

const EMPTY = {
  name: "",
  slug: "",
  continent: "",
  country: "",
  region: "",
  province: "",
  city: "",
  address: "",
  latitude: 0,
  longitude: 0,
  type: "Ristorante",
  gf_category: "Stato da verificare",
  phone: "",
  website: "",
  description: "",
  notes: "",
  verified: false,
  published: false,
  delivery_available: false,
  direct_delivery: false,
  takeaway_available: false,
  just_eat_url: "",
  glovo_url: "",
  too_good_to_go_available: false,
  too_good_to_go_url: "",
  is_demo: false,
};

const slug = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const pick = (...x: any[]) =>
  x.find((v) => typeof v === "string" && v.trim())?.trim() || "";

const normalizeGeoName = (value: string) =>
  value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim().toLowerCase();

function isoForCountryName(value: string) {
  const x = normalizeGeoName(value);
  const aliases: Record<string,string> = {
    italia: "IT", italy: "IT", netherlands: "NL", nederland: "NL",
    "united states": "US", "stati uniti": "US", poland: "PL", polonia: "PL",
    belgium: "BE", belgio: "BE", france: "FR", francia: "FR",
    germany: "DE", germania: "DE", spain: "ES", spagna: "ES"
  };
  return aliases[x] || "";
}

function provinceCode(s: string) {
  return s.match(/\b\d{5}\s+[^,]+?\s+([A-Z]{2})(?:\b|,)/)?.[1] || "";
}

function cityByAddress(s: string) {
  for (const p of s.split(",").map((x) => x.trim())) {
    const m = p.match(/^\d{4,6}\s+(.+?)(?:\s+[A-Z]{2})?$/);
    if (m) return m[1];
  }
  return "";
}

const EUROPE = new Set([
  "AL", "AD", "AT", "BY", "BE", "BA", "BG", "HR", "CY", "CZ", "DK",
  "EE", "FI", "FR", "DE", "GR", "HU", "IS", "IE", "IT", "XK", "LV",
  "LI", "LT", "LU", "MT", "MD", "MC", "ME", "NL", "MK", "NO", "PL",
  "PT", "RO", "RU", "SM", "RS", "SK", "SI", "ES", "SE", "CH", "TR",
  "UA", "GB", "VA",
]);
const ASIA = new Set([
  "AF", "AM", "AZ", "BH", "BD", "BT", "BN", "KH", "CN", "GE", "IN",
  "ID", "IR", "IQ", "IL", "JP", "JO", "KZ", "KW", "KG", "LA", "LB",
  "MY", "MV", "MN", "MM", "NP", "KP", "OM", "PK", "PS", "PH", "QA",
  "SA", "SG", "KR", "LK", "SY", "TW", "TJ", "TH", "TL", "TM", "AE",
  "UZ", "VN", "YE",
]);
const AFRICA = new Set([
  "DZ", "AO", "BJ", "BW", "BF", "BI", "CV", "CM", "CF", "TD", "KM",
  "CD", "CG", "CI", "DJ", "EG", "GQ", "ER", "SZ", "ET", "GA", "GM",
  "GH", "GN", "GW", "KE", "LS", "LR", "LY", "MG", "MW", "ML", "MR",
  "MU", "MA", "MZ", "NA", "NE", "NG", "RW", "ST", "SN", "SC", "SL",
  "SO", "ZA", "SS", "SD", "TZ", "TG", "TN", "UG", "ZM", "ZW",
]);
const NORTH_AMERICA = new Set([
  "AG", "BS", "BB", "BZ", "CA", "CR", "CU", "DM", "DO", "SV", "GD",
  "GT", "HT", "HN", "JM", "MX", "NI", "PA", "KN", "LC", "VC", "TT",
  "US",
]);
const SOUTH_AMERICA = new Set([
  "AR", "BO", "BR", "CL", "CO", "EC", "GY", "PY", "PE", "SR", "UY", "VE",
]);
const OCEANIA = new Set([
  "AU", "FJ", "KI", "MH", "FM", "NR", "NZ", "PW", "PG", "WS", "SB", "TO",
  "TV", "VU",
]);

function continentForIso2(value: string) {
  const iso = value.toUpperCase();
  if (EUROPE.has(iso)) return "Europa";
  if (ASIA.has(iso)) return "Asia";
  if (AFRICA.has(iso)) return "Africa";
  if (NORTH_AMERICA.has(iso)) return "America del Nord";
  if (SOUTH_AMERICA.has(iso)) return "America del Sud";
  if (OCEANIA.has(iso)) return "Oceania";
  return "";
}

export default function AdminPlacesV2() {
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [form, setForm] = useState<any>(EMPTY);
  const [continents, setContinents] = useState<G[]>([]);
  const [countries, setCountries] = useState<G[]>([]);
  const [regions, setRegions] = useState<G[]>([]);
  const [provinces, setProvinces] = useState<G[]>([]);
  const [cities, setCities] = useState<G[]>([]);
  const [ids, setIds] = useState<any>({});
  const [q, setQ] = useState("");
  const [location, setLocation] = useState("");
  const [results, setResults] = useState<BP[]>([]);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const searchParams = useSearchParams();
  const [places, setPlaces] = useState<PlaceAdminRow[]>([]);
  const [placeSearch, setPlaceSearch] = useState("");
  const [placeFilter, setPlaceFilter] = useState<"all" | "draft" | "published">("all");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingOriginalSlug, setEditingOriginalSlug] = useState("");

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.auth.getSession();
      if (!s.session) {
        setAllowed(false);
        return;
      }

      const { data: a } = await supabase.rpc("is_admin");
      setAllowed(a === true);

      if (a === true) {
        const { data } = await supabase
          .from("continents")
          .select("id,name")
          .eq("active", true)
          .order("name");
        setContinents((data ?? []) as G[]);
        await loadPlaces(searchParams.get("edit") || undefined);
      }
    })();
  }, []);

  const f = (k: string, v: any) =>
    setForm((x: any) => ({ ...x, [k]: v }));

  async function selectContinent(id: number) {
    setIds({ continent: id });
    const x = continents.find((v) => v.id === id);
    f("continent", x?.name || "");
    const { data } = await supabase
      .from("countries")
      .select("id,name")
      .eq("continent_id", id)
      .eq("active", true)
      .order("name");
    setCountries((data ?? []) as G[]);
    setRegions([]);
    setProvinces([]);
    setCities([]);
  }

  async function selectCountry(id: number) {
    setIds((x: any) => ({ ...x, country: id }));
    const x = countries.find((v) => v.id === id);
    f("country", x?.name || "");
    const { data } = await supabase
      .from("regions")
      .select("id,name")
      .eq("country_id", id)
      .eq("active", true)
      .order("name");
    setRegions((data ?? []) as G[]);
    setProvinces([]);
    setCities([]);
  }

  async function selectRegion(id: number) {
    setIds((x: any) => ({ ...x, region: id }));
    const x = regions.find((v) => v.id === id);
    f("region", x?.name || "");
    const { data } = await supabase
      .from("provinces")
      .select("id,name")
      .eq("region_id", id)
      .eq("active", true)
      .order("name");
    setProvinces((data ?? []) as G[]);
    setCities([]);
  }

  async function selectProvince(id: number) {
    setIds((x: any) => ({ ...x, province: id }));
    const x = provinces.find((v) => v.id === id);
    f("province", x?.name || "");
    const { data } = await supabase
      .from("cities")
      .select("id,name")
      .eq("province_id", id)
      .eq("active", true)
      .order("name");
    setCities((data ?? []) as G[]);
  }

  async function syncGeography(continentName:string,countryName:string,countryIso2:string,regionName:string,provinceName:string,cityName:string) {
    let countryRow:any=null;
    const iso=(countryIso2 || isoForCountryName(countryName)).toUpperCase();
    if(iso){const q=await supabase.from("countries").select("id,name,continent_id,iso2").eq("iso2",iso).maybeSingle();if(q.error){setMsg(q.error.message);return false}countryRow=q.data}
    if(!countryRow){const q=await supabase.from("countries").select("id,name,continent_id,iso2").eq("active",true);if(q.error){setMsg(q.error.message);return false}countryRow=(q.data??[]).find((x:any)=>normalizeGeoName(x.name)===normalizeGeoName(countryName))}
    if(!countryRow){setMsg(`Nazione ${countryName} non trovata.`);return false}
    const cq=await supabase.from("continents").select("id,name").eq("id",countryRow.continent_id).maybeSingle();if(cq.error||!cq.data){setMsg(cq.error?.message||`Continente ${continentName} non trovato.`);return false}const continentRow=cq.data;
    const countriesQ=await supabase.from("countries").select("id,name").eq("continent_id",continentRow.id).eq("active",true).order("name");
    const regionsQ=await supabase.from("regions").select("id,name").eq("country_id",countryRow.id).eq("active",true).order("name");if(regionsQ.error){setMsg(regionsQ.error.message);return false}
    const regionList=(regionsQ.data??[]) as G[];const regionRow=regionList.find(x=>normalizeGeoName(x.name)===normalizeGeoName(regionName));if(!regionRow){setMsg(`Regione ${regionName} non trovata.`);return false}
    const provincesQ=await supabase.from("provinces").select("id,name").eq("region_id",regionRow.id).eq("active",true).order("name");if(provincesQ.error){setMsg(provincesQ.error.message);return false}
    const provinceList=(provincesQ.data??[]) as G[];const provinceRow=provinceList.find(x=>normalizeGeoName(x.name)===normalizeGeoName(provinceName));if(!provinceRow){setMsg(`Città / Provincia ${provinceName} non trovata.`);return false}
    const citiesQ=await supabase.from("cities").select("id,name").eq("province_id",provinceRow.id).eq("active",true).order("name");if(citiesQ.error){setMsg(citiesQ.error.message);return false}
    const cityList=(citiesQ.data??[]) as G[];const cityRow=cityList.find(x=>normalizeGeoName(x.name)===normalizeGeoName(cityName));if(!cityRow){setMsg(`Comune / Località ${cityName} non trovato.`);return false}
    setContinents((current)=>current.length?current:[continentRow]);setCountries((countriesQ.data??[]) as G[]);setRegions(regionList);setProvinces(provinceList);setCities(cityList);setIds({continent:continentRow.id,country:countryRow.id,region:regionRow.id,province:provinceRow.id});
    setForm((current:any)=>({...current,continent:continentRow.name,country:countryRow.name,region:regionRow.name,province:provinceRow.name,city:cityRow.name}));
    return true;
  }

  async function loadPlaces(openSlug?: string) {
    const { data, error } = await supabase.from("places").select("*").order("name");
    if (error) { setMsg(error.message); return; }
    const list=(data??[]) as PlaceAdminRow[]; setPlaces(list);
    if(openSlug){const row=list.find(x=>x.slug===openSlug);if(row) await editPlace(row)}
  }

  async function editPlace(row: PlaceAdminRow) {
    setEditingId(row.id);setEditingOriginalSlug(row.slug);setMsg("");
    setForm({...EMPTY,...row});
    const iso=isoForCountryName(row.country);
    await supabase.rpc("ensure_geography_global",{p_continent:row.continent,p_country:row.country,p_country_iso2:iso||null,p_region:row.region,p_province:row.province||row.city,p_province_code:null,p_city:row.city,p_lat:row.latitude,p_lon:row.longitude});
    await syncGeography(row.continent,row.country,iso,row.region,row.province||row.city,row.city);
    window.scrollTo({top:0,behavior:"smooth"});
  }

  function resetEditor(){setEditingId(null);setEditingOriginalSlug("");setForm(EMPTY);setIds({});setCountries([]);setRegions([]);setProvinces([]);setCities([]);setMsg("")}

  async function search() {
    setLoading(true);
    setMsg("");
    try {
      const r = await fetch(
        `/api/place-search?q=${encodeURIComponent(q)}&location=${encodeURIComponent(location)}`
      );
      const j = await r.json();
      if (!r.ok) {
        setMsg(j.error || "Ricerca non disponibile");
        return;
      }
      setResults(j.results ?? []);
    } finally {
      setLoading(false);
    }
  }

  async function usePlace(p: BP) {
    setLoading(true);
    setMsg("Recupero e sincronizzazione della geografia internazionale...");

    try {
      let d: any = null;
      try {
        const r = await fetch(`/api/place-details?id=${encodeURIComponent(p.id)}`);
        const j = await r.json();
        if (r.ok) d = j.place;
      } catch {}

      const a = d?.postal_address || d?.postalAddress || d?.address || p.address || {};
      const display = pick(
        a.displayAddress,
        a.display_address,
        a.formattedAddress,
        a.formatted_address,
        a.streetAddress,
        a.street_address
      );
      const coords = d?.coordinates || p.coordinates || [];
      const name = pick(d?.title, p.title);
      const country = pick(
        a.addressCountry,
        a.address_country,
        a.country,
        a.countryName,
        a.country_name
      );
      const iso2 = pick(
        a.addressCountryCode,
        a.address_country_code,
        a.countryCode,
        a.country_code
      ).toUpperCase();
      const city = pick(
        a.addressLocality,
        a.address_locality,
        a.city,
        a.town,
        a.village,
        a.municipality,
        cityByAddress(display),
        location
      );
      const region = pick(
        a.addressRegion,
        a.address_region,
        a.state,
        a.region,
        a.adminArea1,
        city
      );
      const italianCode = provinceCode(display);
      const italianMeta = ITALIAN_PROVINCES[italianCode];
      const province = pick(
        a.addressSubregion,
        a.address_subregion,
        a.county,
        a.province,
        a.adminArea2,
        italianMeta?.name,
        city
      );
      const resolvedRegion = pick(region, italianMeta?.region, province, city);
      let continent = continentForIso2(iso2);

      if (!continent && country) {
        const { data: countryRows } = await supabase
          .from("countries")
          .select("continent_id,name,iso2")
          .or(`name.ilike.${country},iso2.eq.${iso2 || "__"}`)
          .limit(1);
        const continentId = countryRows?.[0]?.continent_id;
        if (continentId) {
          const { data: c } = await supabase
            .from("continents")
            .select("name")
            .eq("id", continentId)
            .maybeSingle();
          continent = c?.name || "";
        }
      }

      setForm((x: any) => ({
        ...x,
        name,
        slug: slug(name),
        address: pick(a.streetAddress, a.street_address, display),
        latitude: coords[0] ?? 0,
        longitude: coords[1] ?? 0,
        phone: pick(d?.phone, d?.telephone, d?.contact?.phone),
        website: pick(d?.url, d?.website, p.url),
      }));

      let finalIso2 = iso2;
      let finalCountry = country;
      let finalCity = city;
      let finalProvince = province;
      let finalRegion = resolvedRegion;
      let finalContinent = continent;

      if (
        (!finalCountry ||
          !finalCity ||
          !finalRegion ||
          !finalProvince ||
          !finalContinent) &&
        coords.length >= 2
      ) {
        try {
          const reverseResponse = await fetch(
            `/api/reverse-geocode?lat=${encodeURIComponent(coords[0])}&lon=${encodeURIComponent(coords[1])}`
          );
          const reverse = await reverseResponse.json();

          if (reverseResponse.ok) {
            finalIso2 = pick(reverse.country_code, finalIso2).toUpperCase();
            finalCountry = pick(reverse.country, finalCountry);
            finalCity = pick(
              reverse.city,
              reverse.town,
              reverse.village,
              reverse.municipality,
              reverse.county,
              finalCity
            );
            finalProvince = pick(
              reverse.county,
              reverse.province,
              reverse.state_district,
              finalCity,
              finalProvince
            );
            finalRegion = pick(
              reverse.state,
              reverse.region,
              reverse.state_district,
              finalProvince,
              finalRegion
            );
            finalContinent = pick(
              continentForIso2(finalIso2),
              finalContinent
            );
          }
        } catch {}
      }

      if (
        !finalContinent ||
        !finalCountry ||
        !finalRegion ||
        !finalProvince ||
        !finalCity
      ) {
        setMsg(
          `Dati applicati, ma la geografia restituita è incompleta. Continente: ${finalContinent || "?"}, Nazione: ${finalCountry || "?"}, Regione: ${finalRegion || "?"}, Provincia: ${finalProvince || "?"}, Località: ${finalCity || "?"}. Completa manualmente prima di pubblicare.`
        );
        return;
      }

      const { error } = await supabase.rpc("ensure_geography_global", {
        p_continent: finalContinent,
        p_country: finalCountry,
        p_country_iso2: finalIso2 || null,
        p_region: finalRegion,
        p_province: finalProvince,
        p_province_code: italianCode || null,
        p_city: finalCity,
        p_lat: coords[0] ?? null,
        p_lon: coords[1] ?? null,
      });

      if (error) {
        setMsg(
          `Dati del locale applicati. Sincronizzazione geografica non riuscita: ${error.message}`
        );
        return;
      }

      const synced = await syncGeography(
        finalContinent, finalCountry, finalIso2, finalRegion, finalProvince, finalCity
      );
      if (!synced) return;

      setMsg(
        `Geografia sincronizzata: ${finalContinent} → ${finalCountry} → ${finalRegion} → ${finalProvince} → ${finalCity}. Controlla i valori prima di pubblicare.`
      );
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  async function save(pub: boolean) {
    if(!form.name||!form.slug||!form.continent||!form.country||!form.region||!form.province||!form.city){setMsg("Completa nome, slug e tutta la geografia.");return}
    setLoading(true);setMsg("");
    const payload={...form,published:pub,latitude:Number(form.latitude),longitude:Number(form.longitude)};
    const result=editingId
      ? await supabase.from("places").update(payload).eq("id",editingId)
      : await supabase.from("places").insert(payload);
    setLoading(false);
    if(result.error){setMsg(result.error.message);return}
    setMsg(editingId ? (pub?"Locale aggiornato e pubblicato.":"Bozza aggiornata.") : (pub?"Locale pubblicato.":"Locale salvato come bozza."));
    await loadPlaces();
    if(!editingId) resetEditor();
  }

  if (allowed === null) {
    return <main style={page}>Verifica autorizzazioni...</main>;
  }

  if (!allowed) {
    return <main style={page}>Accesso negato</main>;
  }

  return (
    <main style={page}>
      <Link href="/">← Home</Link>

      <h1>Pannello Admin Locali v2.15 bozze e modifica</h1>

      <AdminActivityDashboard />

      <section style={section}>
        <h2>🌐 Brave Places</h2>

        <div style={grid}>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Nome locale"
            style={input}
          />
          <input
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="Località facoltativa, es. Amsterdam"
            style={input}
          />
        </div>

        <button onClick={search} style={btn}>
          {loading ? "Ricerca..." : "Cerca"}
        </button>

        {results.map((x) => (
          <article key={x.id} style={card}>
            <div>
              <b>{x.title}</b>
              <div>{x.address?.displayAddress || x.address?.streetAddress}</div>
            </div>
            <button onClick={() => usePlace(x)} style={btn}>
              Usa questi dati
            </button>
          </article>
        ))}
      </section>

      <section style={section}>
        <h2>{editingId ? `Modifica locale: ${form.name}` : "Nuovo locale"}</h2>

        <Field t="Nome">
          <input
            value={form.name}
            onChange={(e) => f("name", e.target.value)}
            style={input}
          />
        </Field>

        <Field t="Slug">
          <input
            value={form.slug}
            onChange={(e) => f("slug", e.target.value)}
            style={input}
          />
        </Field>

        <div style={geo}>
          <Geo
            t="Continente"
            a={continents}
            v={ids.continent}
            c={selectContinent}
          />
          <Geo
            t="Nazione"
            a={countries}
            v={ids.country}
            c={selectCountry}
          />
          <Geo
            t="Regione / Stato"
            a={regions}
            v={ids.region}
            c={selectRegion}
          />
          <Geo
            t="Città / Provincia"
            a={provinces}
            v={ids.province}
            c={selectProvince}
          />
          <Geo
            t="Comune / Località"
            a={cities}
            v={cities.find((x) => x.name === form.city)?.id}
            c={(id) =>
              f("city", cities.find((x) => x.id === id)?.name || "")
            }
          />
        </div>

        <div style={grid}>
          <Field t="Tipologia"><select value={form.type} onChange={(e)=>f("type",e.target.value)} style={input}><option>Ristorante</option><option>Pizzeria</option><option>Pasticceria</option><option>Bar</option><option>Negozio Specializzato</option><option>Hotel</option><option>Altro</option></select></Field>
          <Field t="Affidabilità GF"><select value={form.gf_category} onChange={(e)=>f("gf_category",e.target.value)} style={input}><option>Stato da verificare</option><option>Disponibilità Gluten Free</option><option>Gluten Free verificato dalla community</option><option>Gluten Free Certificato</option></select></Field>
        </div>

        <Field t="Descrizione pubblica"><textarea rows={4} value={form.description} onChange={(e)=>f("description",e.target.value)} style={input}/></Field>
        <Field t="Note amministratore"><textarea rows={3} value={form.notes} onChange={(e)=>f("notes",e.target.value)} style={input}/></Field>

        <Field t="Indirizzo">
          <input
            value={form.address}
            onChange={(e) => f("address", e.target.value)}
            style={input}
          />
        </Field>

        <div style={grid}>
          <Field t="Latitudine">
            <input
              value={form.latitude}
              onChange={(e) => f("latitude", e.target.value)}
              style={input}
            />
          </Field>
          <Field t="Longitudine">
            <input
              value={form.longitude}
              onChange={(e) => f("longitude", e.target.value)}
              style={input}
            />
          </Field>
        </div>

        <div style={grid}>
          <Field t="Telefono">
            <input
              value={form.phone}
              onChange={(e) => f("phone", e.target.value)}
              style={input}
            />
          </Field>
          <Field t="Sito web">
            <input
              value={form.website}
              onChange={(e) => f("website", e.target.value)}
              style={input}
            />
          </Field>
        </div>

        <div style={{ display: "flex", gap: 10, marginTop: 15 }}>
          <button onClick={() => save(false)} disabled={loading}>{editingId ? "Aggiorna bozza" : "Salva bozza"}</button>
          <button onClick={() => save(true)} style={btn} disabled={loading}>{editingId ? "Aggiorna e pubblica" : "Pubblica locale"}</button>
          {editingId && <button onClick={resetEditor}>Annulla modifica</button>}
        </div>
      </section>

      <section style={section}>
        <h2>Gestione locali</h2>
        <div style={grid}>
          <input value={placeSearch} onChange={(e)=>setPlaceSearch(e.target.value)} placeholder="Cerca nome, città o slug" style={input}/>
          <select value={placeFilter} onChange={(e)=>setPlaceFilter(e.target.value as any)} style={input}>
            <option value="all">Tutti</option><option value="draft">Bozze</option><option value="published">Pubblicati</option>
          </select>
        </div>
        <div style={{display:"grid",gap:10,marginTop:15}}>
          {places.filter((row)=>{
            const matches=!placeSearch.trim()||`${row.name} ${row.city} ${row.slug}`.toLowerCase().includes(placeSearch.toLowerCase());
            const status=placeFilter==="all"||(placeFilter==="draft"?!row.published:row.published);return matches&&status;
          }).map((row)=><article key={row.id} style={card}>
            <div><b>{row.name}</b><div>{row.city} · {row.province} · {row.region}</div><small>{row.published?"Pubblicato":"Bozza"} · {row.verified?"Verificato":"Da verificare"}</small></div>
            <div style={{display:"flex",gap:8,flexWrap:"wrap"}}><button onClick={()=>editPlace(row)}>Modifica</button>{row.published&&<Link href={`/places/${row.slug}`} target="_blank">Apri</Link>}{!row.published&&<button onClick={async()=>{await editPlace(row);setMsg("Bozza caricata. Controlla i dati e premi Aggiorna e pubblica.")}}>Carica bozza</button>}</div>
          </article>)}
        </div>
      </section>

      {msg && (
        <p>
          <b>{msg}</b>
        </p>
      )}
    </main>
  );
}

function Field({ t, children }: { t: string; children: any }) {
  return (
    <label style={{ fontWeight: 700, display: "block", marginTop: 10 }}>
      {t}
      {children}
    </label>
  );
}

function Geo({
  t,
  a,
  v,
  c,
}: {
  t: string;
  a: G[];
  v?: number;
  c: (id: number) => void;
}) {
  return (
    <Field t={t}>
      <select
        value={v || ""}
        onChange={(e) => {
          if (e.target.value) c(Number(e.target.value));
        }}
        style={input}
      >
        <option value="">Seleziona</option>
        {a.map((x) => (
          <option key={x.id} value={x.id}>
            {x.name}
          </option>
        ))}
      </select>
    </Field>
  );
}

const page = { maxWidth: 1100, margin: "0 auto", padding: 24 };
const section = {
  padding: 20,
  border: "1px solid #ddd",
  borderRadius: 12,
  margin: "18px 0",
};
const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(2,minmax(0,1fr))",
  gap: 12,
};
const geo = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(160px,1fr))",
  gap: 10,
};
const input = {
  display: "block",
  width: "100%",
  boxSizing: "border-box" as const,
  padding: 10,
  marginTop: 5,
};
const btn = {
  padding: "10px 16px",
  background: "#15803d",
  color: "white",
  border: 0,
  borderRadius: 7,
  fontWeight: 700,
  marginTop: 10,
};
const card = {
  padding: 12,
  border: "1px solid #ddd",
  borderRadius: 8,
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  marginTop: 10,
};
