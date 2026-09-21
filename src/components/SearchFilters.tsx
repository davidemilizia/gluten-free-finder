"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type SearchPlace = {
  continent: string;
  country: string;
  region: string;
  city: string;
  type: string;
};

type SearchFiltersProps = {
  places: SearchPlace[];
};

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "it")
  );
}

export default function SearchFilters({ places }: SearchFiltersProps) {
  const router = useRouter();
  const [continent, setContinent] = useState("");
  const [country, setCountry] = useState("");
  const [region, setRegion] = useState("");
  const [city, setCity] = useState("");
  const [type, setType] = useState("");

  const continents = useMemo(
    () => unique(places.map((place) => place.continent)),
    [places]
  );

  const countries = useMemo(
    () =>
      unique(
        places
          .filter((place) => !continent || place.continent === continent)
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
              (!continent || place.continent === continent) &&
              (!country || place.country === country)
          )
          .map((place) => place.region)
      ),
    [places, continent, country]
  );

  const cities = useMemo(
    () =>
      unique(
        places
          .filter(
            (place) =>
              (!continent || place.continent === continent) &&
              (!country || place.country === country) &&
              (!region || place.region === region)
          )
          .map((place) => place.city)
      ),
    [places, continent, country, region]
  );

  const types = useMemo(
    () =>
      unique(
        places
          .filter(
            (place) =>
              (!continent || place.continent === continent) &&
              (!country || place.country === country) &&
              (!region || place.region === region) &&
              (!city || place.city === city)
          )
          .map((place) => place.type)
      ),
    [places, continent, country, region, city]
  );

  function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const params = new URLSearchParams();

    if (continent) params.set("continent", continent);
    if (country) params.set("country", country);
    if (region) params.set("region", region);
    if (city) params.set("city", city);
    if (type) params.set("type", type);

    const query = params.toString();
    router.push(query ? `/places?${query}` : "/places");
  }

  const fieldStyle = {
    display: "grid",
    gap: "6px",
  } as const;

  const inputStyle = {
    minHeight: "42px",
    padding: "8px 10px",
    border: "1px solid #b8b8b8",
    borderRadius: "6px",
    background: "white",
  } as const;

  return (
    <form onSubmit={submitSearch}>
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "16px",
        }}
      >
        <label style={fieldStyle}>
          Continente
          <select
            value={continent}
            style={inputStyle}
            onChange={(event) => {
              setContinent(event.target.value);
              setCountry("");
              setRegion("");
              setCity("");
              setType("");
            }}
          >
            <option value="">Tutti</option>
            {continents.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label style={fieldStyle}>
          Nazione
          <select
            value={country}
            style={inputStyle}
            onChange={(event) => {
              setCountry(event.target.value);
              setRegion("");
              setCity("");
              setType("");
            }}
          >
            <option value="">Tutte</option>
            {countries.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label style={fieldStyle}>
          Regione
          <select
            value={region}
            style={inputStyle}
            onChange={(event) => {
              setRegion(event.target.value);
              setCity("");
              setType("");
            }}
          >
            <option value="">Tutte</option>
            {regions.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label style={fieldStyle}>
          Città
          <select
            value={city}
            style={inputStyle}
            onChange={(event) => {
              setCity(event.target.value);
              setType("");
            }}
          >
            <option value="">Tutte</option>
            {cities.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>

        <label style={fieldStyle}>
          Tipologia
          <select
            value={type}
            style={inputStyle}
            onChange={(event) => setType(event.target.value)}
          >
            <option value="">Tutte</option>
            {types.map((item) => (
              <option key={item} value={item}>{item}</option>
            ))}
          </select>
        </label>
      </div>

      <button
        type="submit"
        style={{
          marginTop: "20px",
          padding: "11px 22px",
          border: 0,
          borderRadius: "6px",
          background: "#15803d",
          color: "white",
          fontWeight: 700,
          cursor: "pointer",
        }}
      >
        CERCA
      </button>
    </form>
  );
}
