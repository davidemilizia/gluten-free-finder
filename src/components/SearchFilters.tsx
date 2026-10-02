"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

type GeoItem = { id: number; name: string };
type PlaceOption = {
  continent?: string;
  country?: string;
  region?: string;
  province?: string;
  city?: string;
  type?: string;
};

type Props = {
  // Compatibilita con la Home esistente, che continua a passare places={searchPlaces}.
  places?: PlaceOption[];
};

export default function SearchFilters({ places = [] }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [regions, setRegions] = useState<GeoItem[]>([]);
  const [provinces, setProvinces] = useState<GeoItem[]>([]);
  const [cities, setCities] = useState<GeoItem[]>([]);

  const [region, setRegion] = useState(searchParams.get("region") ?? "");
  const [province, setProvince] = useState(searchParams.get("province") ?? "");
  const [city, setCity] = useState(searchParams.get("city") ?? "");

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const { data } = await supabase
        .from("regions")
        .select("id,name")
        .eq("active", true)
        .order("name");
      if (!cancelled) setRegions((data ?? []) as GeoItem[]);
    })();
    return () => { cancelled = true; };
  }, [places]);

  useEffect(() => {
    let cancelled = false;
    setProvinces([]);
    setCities([]);
    if (!region) return;

    void (async () => {
      const { data: regionRow } = await supabase
        .from("regions")
        .select("id")
        .eq("name", region)
        .maybeSingle();
      if (!regionRow) return;

      const { data } = await supabase
        .from("provinces")
        .select("id,name")
        .eq("region_id", regionRow.id)
        .eq("active", true)
        .order("name");
      if (!cancelled) setProvinces((data ?? []) as GeoItem[]);
    })();
    return () => { cancelled = true; };
  }, [region]);

  useEffect(() => {
    let cancelled = false;
    setCities([]);
    if (!province) return;

    const selectedProvince = provinces.find((x) => x.name === province);
    if (!selectedProvince) return;

    void (async () => {
      const { data } = await supabase
        .from("cities")
        .select("id,name")
        .eq("province_id", selectedProvince.id)
        .eq("active", true)
        .order("name");
      if (!cancelled) setCities((data ?? []) as GeoItem[]);
    })();
    return () => { cancelled = true; };
  }, [province, provinces]);

  function search() {
    const params = new URLSearchParams();
    if (region) params.set("region", region);
    if (province) params.set("province", province);
    if (city) params.set("city", city);
    router.push(`/places?${params.toString()}`);
  }

  return (
    <div style={grid}>
      <label>
        Regione
        <Select
          value={region}
          onChange={(value) => {
            setRegion(value);
            setProvince("");
            setCity("");
          }}
          items={regions}
          empty="Tutte"
        />
      </label>

      <label>
        Città
        <Select
          value={province}
          onChange={(value) => {
            setProvince(value);
            setCity("");
          }}
          items={provinces}
          empty="Tutta la provincia"
          disabled={!region}
        />
      </label>

      <label>
        Comune
        <Select
          value={city}
          onChange={setCity}
          items={cities}
          empty="Tutti i comuni"
          disabled={!province}
        />
      </label>

      <button type="button" onClick={search} style={button}>Cerca</button>
    </div>
  );
}

function Select({ value, onChange, items, empty, disabled = false }: {
  value: string;
  onChange: (value: string) => void;
  items: GeoItem[];
  empty: string;
  disabled?: boolean;
}) {
  return (
    <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} style={input}>
      <option value="">{empty}</option>
      {items.map((item) => <option key={item.id} value={item.name}>{item.name}</option>)}
    </select>
  );
}

const grid = { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(180px,1fr))", gap: 10, alignItems: "end" };
const input = { display: "block", width: "100%", padding: 9, marginTop: 4, boxSizing: "border-box" as const };
const button = { padding: "10px 16px", background: "#15803d", color: "white", border: 0, borderRadius: 7, fontWeight: 700 };
