import Link from "next/link";
import places from "../../../data/places.json";

type PlacesPageProps = {
  searchParams: Promise<{
    continent?: string;
    country?: string;
    region?: string;
    city?: string;
    type?: string;
  }>;
};

export default async function PlacesPage({ searchParams }: PlacesPageProps) {
  const filters = await searchParams;

  const filteredPlaces = places.filter((place) => {
    return (
      (!filters.continent || place.continent === filters.continent) &&
      (!filters.country || place.country === filters.country) &&
      (!filters.region || place.region === filters.region) &&
      (!filters.city || place.city === filters.city) &&
      (!filters.type || place.type === filters.type)
    );
  });

  const activeFilters = [
    filters.continent,
    filters.country,
    filters.region,
    filters.city,
    filters.type,
  ].filter(Boolean);

  return (
    <main
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "40px 20px",
        fontFamily: "Arial, sans-serif",
        lineHeight: 1.6,
      }}
    >
      <Link href="/">← Torna alla ricerca</Link>

      <h1>Locali Gluten Free</h1>

      {activeFilters.length > 0 && (
        <p>
          <strong>Filtri:</strong> {activeFilters.join(" · ")}
        </p>
      )}

      <p>
        <strong>Locali trovati:</strong> {filteredPlaces.length}
      </p>

      {activeFilters.length > 0 && (
        <p>
          <Link href="/places">Azzera i filtri</Link>
        </p>
      )}

      {filteredPlaces.length === 0 ? (
        <section
          style={{
            padding: "24px",
            border: "1px solid #ddd",
            borderRadius: "8px",
            background: "#fafafa",
          }}
        >
          <h2>Nessun locale trovato</h2>
          <p>Prova a modificare o azzerare i filtri di ricerca.</p>
          <Link href="/">Modifica la ricerca</Link>
        </section>
      ) : (
        <div style={{ display: "grid", gap: "18px" }}>
          {filteredPlaces.map((place) => (
            <article
              key={place.id}
              style={{
                padding: "20px",
                border: "1px solid #d6d6d6",
                borderRadius: "8px",
              }}
            >
              <h2 style={{ marginTop: 0, marginBottom: "6px" }}>
                <Link href={`/places/${place.slug}`}>{place.name}</Link>
              </h2>

              <p style={{ margin: "4px 0" }}>
                {place.type} · {place.city}, {place.region}
              </p>
              <p style={{ margin: "4px 0" }}>{place.address}</p>
              <p style={{ margin: "4px 0" }}>
                <strong>Affidabilità gluten free:</strong> {place.gfCategory}
              </p>
              <p style={{ margin: "4px 0" }}>
                <strong>Consegna:</strong>{" "}
                {place.deliveryAvailable ? "Disponibile" : "Non disponibile"}
              </p>
              <p style={{ margin: "4px 0" }}>
                <strong>Ritiro:</strong>{" "}
                {place.takeawayAvailable ? "Disponibile" : "Non disponibile"}
              </p>
              <p>{place.description}</p>

              <Link href={`/places/${place.slug}`}>Apri la scheda →</Link>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}
