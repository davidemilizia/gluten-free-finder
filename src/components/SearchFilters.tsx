"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

type PlaceOption = {
  continent?: string;
  country?: string;
  region?: string;
  province?: string;
  city?: string;
  type?: string;
  gf_category?: string;
};

type Props = { places?: PlaceOption[] };
type GeoItem = { id: number; name: string };

export default function SearchFilters({ places = [] }: Props) {
  const router = useRouter();
  const sp = useSearchParams();

  // Mantiene i filtri gia presenti basandosi sui dati places passati dalla Home.
  const regions = useMemo(() => unique(places.map(p => p.region)), [places]);
  const types = useMemo(() => unique(places.map(p => p.type)), [places]);
  const gfCategories = useMemo(() => unique(places.map(p => p.gf_category)), [places]);

  const [region, setRegion] = useState(sp.get("region") ?? "");
  const [province, setProvince] = useState(sp.get("province") ?? "");
  const [city, setCity] = useState(sp.get("city") ?? "");
  const [type, setType] = useState(sp.get("type") ?? "");
  const [gfCategory, setGfCategory] = useState(sp.get("gf_category") ?? "");

  const [provinces, setProvinces] = useState<GeoItem[]>([]);
  const [cities, setCities] = useState<GeoItem[]>([]);

  useEffect(() => {
    setProvinces([]);
    setCities([]);
    if (!region) return;
    let cancelled = false;
    void (async () => {
      const { data: r } = await supabase.from("regions").select("id").eq("name", region).maybeSingle();
      if (!r) return;
      const { data } = await supabase.from("provinces").select("id,name").eq("region_id", r.id).eq("active", true).order("name");
      if (!cancelled) setProvinces((data ?? []) as GeoItem[]);
    })();
    return () => { cancelled = true; };
  }, [region]);

  useEffect(() => {
    setCities([]);
    if (!province) return;
    const p = provinces.find(x => x.name === province);
    if (!p) return;
    let cancelled = false;
    void (async () => {
      const { data } = await supabase.from("cities").select("id,name").eq("province_id", p.id).eq("active", true).order("name");
      if (!cancelled) setCities((data ?? []) as GeoItem[]);
    })();
    return () => { cancelled = true; };
  }, [province, provinces]);

  function search() {
    const p = new URLSearchParams();
    if (region) p.set("region", region);
    if (province) p.set("province", province);
    if (city) p.set("city", city);
    if (type) p.set("type", type);
    if (gfCategory) p.set("gf_category", gfCategory);
    router.push(`/places?${p.toString()}`);
  }

  return (
    <div style={grid}>
      <Filter label="Regione" value={region} onChange={v => { setRegion(v); setProvince(""); setCity(""); }} values={regions} empty="Tutte" />
      <Filter label="Città" value={province} onChange={v => { setProvince(v); setCity(""); }} values={provinces.map(x => x.name)} empty="Tutta la provincia" disabled={!region} />
      <Filter label="Comune" value={city} onChange={setCity} values={cities.map(x => x.name)} empty="Tutti i comuni" disabled={!province} />
      {types.length > 0 && <Filter label="Tipologia" value={type} onChange={setType} values={types} empty="Tutte" />}
      {gfCategories.length > 0 && <Filter label="Affidabilità GF" value={gfCategory} onChange={setGfCategory} values={gfCategories} empty="Tutte" />}
      <button type="button" onClick={search} style={button}>Cerca</button>
    </div>
  );
}

function unique(values: Array<string | undefined>) { return [...new Set(values.filter((x): x is string => Boolean(x)))].sort((a,b)=>a.localeCompare(b,"it")); }
function Filter({label,value,onChange,values,empty,disabled=false}:{label:string;value:string;onChange:(v:string)=>void;values:string[];empty:string;disabled?:boolean}) {
  return <label>{label}<select value={value} onChange={e=>onChange(e.target.value)} disabled={disabled} style={input}><option value="">{empty}</option>{values.map(v=><option key={v} value={v}>{v}</option>)}</select></label>;
}
const grid={display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:10,alignItems:"end"};
const input={display:"block",width:"100%",boxSizing:"border-box" as const,padding:9,marginTop:5};
const button={padding:"10px 16px",background:"#15803d",color:"white",border:0,borderRadius:7,fontWeight:700};
