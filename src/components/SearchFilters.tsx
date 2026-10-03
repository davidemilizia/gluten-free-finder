"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

type PlaceOption = {
  continent?: string | null;
  country?: string | null;
  region?: string | null;
  province?: string | null;
  city?: string | null;
  type?: string | null;
  gf_category?: string | null;
};

type Props = { places?: PlaceOption[] };

function clean(value?: string | null) {
  return value?.trim() ?? "";
}

function unique(values: Array<string | null | undefined>) {
  return [...new Set(values.map(clean).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "it")
  );
}

export default function SearchFilters({ places = [] }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [continent, setContinent] = useState(searchParams.get("continent") ?? "");
  const [country, setCountry] = useState(searchParams.get("country") ?? "");
  const [region, setRegion] = useState(searchParams.get("region") ?? "");
  const [province, setProvince] = useState(searchParams.get("province") ?? "");
  const [city, setCity] = useState(searchParams.get("city") ?? "");
  const [type, setType] = useState(searchParams.get("type") ?? "");
  const [gfCategory, setGfCategory] = useState(
    searchParams.get("gf_category") ?? ""
  );

  // Le opzioni sono costruite dai locali pubblicati. In questo modo Milano,
  // Torino, Avellino e ogni nuova provincia/comune compaiono anche se le
  // tabelle geografiche di supporto non sono ancora completamente popolate.
  const continents = useMemo(
    () => unique(places.map((place) => place.continent)),
    [places]
  );

  const countries = useMemo(
    () =>
      unique(
        places
          .filter((place) => !continent || clean(place.continent) === continent)
          .map((place) => place.country)
      ),
    [places, continent]
  );

  const regions = useMemo(
    () =>
      unique(
        places
          .filter(
            (place) =>
              (!continent || clean(place.continent) === continent) &&
              (!country || clean(place.country) === country)
          )
          .map((place) => place.region)
      ),
    [places, continent, country]
  );

  const provinces = useMemo(
    () =>
      unique(
        places
          .filter(
            (place) =>
              (!continent || clean(place.continent) === continent) &&
              (!country || clean(place.country) === country) &&
              (!region || clean(place.region) === region)
          )
          .map((place) => place.province)
      ),
    [places, continent, country, region]
  );

  const cities = useMemo(
    () =>
      unique(
        places
          .filter(
            (place) =>
              (!continent || clean(place.continent) === continent) &&
              (!country || clean(place.country) === country) &&
              (!region || clean(place.region) === region) &&
              (!province || clean(place.province) === province)
          )
          .map((place) => place.city)
      ),
    [places, continent, country, region, province]
  );

  const types = useMemo(() => unique(places.map((place) => place.type)), [places]);
  const gfCategories = useMemo(
    () => unique(places.map((place) => place.gf_category)),
    [places]
  );

  // Se un valore presente nella URL non è più compatibile con il livello
  // precedente, viene azzerato invece di lasciare menu incoerenti.
  useEffect(() => {
    if (country && !countries.includes(country)) {
      setCountry("");
      setRegion("");
      setProvince("");
      setCity("");
    }
  }, [countries, country]);

  useEffect(() => {
    if (region && !regions.includes(region)) {
      setRegion("");
      setProvince("");
      setCity("");
    }
  }, [regions, region]);

  useEffect(() => {
    if (province && !provinces.includes(province)) {
      setProvince("");
      setCity("");
    }
  }, [provinces, province]);

  useEffect(() => {
    if (city && !cities.includes(city)) setCity("");
  }, [cities, city]);

  function search() {
    const params = new URLSearchParams();
    if (continent) params.set("continent", continent);
    if (country) params.set("country", country);
    if (region) params.set("region", region);
    if (province) params.set("province", province);
    if (city) params.set("city", city);
    if (type) params.set("type", type);
    if (gfCategory) params.set("gf_category", gfCategory);
    router.push(`/places?${params.toString()}`);
  }

  return (
    <div style={styles.grid}>
      <Filter label="Continente" value={continent} values={continents} empty="Tutti" onChange={(value) => {
        setContinent(value); setCountry(""); setRegion(""); setProvince(""); setCity("");
      }} />
      <Filter label="Nazione" value={country} values={countries} empty="Tutte" disabled={!continent && continents.length > 0} onChange={(value) => {
        setCountry(value); setRegion(""); setProvince(""); setCity("");
      }} />
      <Filter label="Regione" value={region} values={regions} empty="Tutte" disabled={!country && countries.length > 0} onChange={(value) => {
        setRegion(value); setProvince(""); setCity("");
      }} />
      <Filter label="Città / Provincia" value={province} values={provinces} empty="Tutte" disabled={!region} onChange={(value) => {
        setProvince(value); setCity("");
      }} />
      <Filter label="Comune" value={city} values={cities} empty="Tutti" disabled={!province} onChange={setCity} />
      <Filter label="Tipologia" value={type} values={types} empty="Tutte" onChange={setType} />
      <Filter label="Affidabilità GF" value={gfCategory} values={gfCategories} empty="Tutte" onChange={setGfCategory} />
      <button type="button" onClick={search} style={styles.button}>Cerca locali</button>
    </div>
  );
}

function Filter({ label, value, values, empty, onChange, disabled = false }: {
  label: string;
  value: string;
  values: string[];
  empty: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <label style={styles.label}>
      {label}
      <select value={value} onChange={(event) => onChange(event.target.value)} disabled={disabled} style={styles.select}>
        <option value="">{empty}</option>
        {values.map((item) => <option key={item} value={item}>{item}</option>)}
      </select>
    </label>
  );
}

const styles = {
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit,minmax(155px,1fr))", gap: 12, alignItems: "end" },
  label: { fontWeight: 700, fontSize: 14 },
  select: { display: "block", width: "100%", boxSizing: "border-box" as const, padding: "11px 10px", marginTop: 6, border: "1px solid #cbd5e1", borderRadius: 8, background: "white" },
  button: { padding: "12px 18px", border: 0, borderRadius: 8, background: "#15803d", color: "white", fontWeight: 800, cursor: "pointer" },
};
