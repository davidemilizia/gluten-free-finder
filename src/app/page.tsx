import Link from "next/link";
import SearchFilters from "@/components/SearchFilters";
import places from "../../data/places.json";

export default function HomePage() {
  const latestPlace = places.at(-1);

  return (
    <main
      style={{
        maxWidth: "960px",
        margin: "0 auto",
        padding: "48px 20px",
        fontFamily: "Arial, sans-serif",
        lineHeight: 1.6,
      }}
    >
      <header>
        <h1 style={{ color: "#15803d", marginBottom: "4px" }}>
          🍃 Gluten Free Finder
        </h1>
        <p>Trova locali e negozi sicuri per celiaci in tutto il mondo.</p>
      </header>

      <hr style={{ margin: "24px 0" }} />

      <section>
        <h2>Ricerca</h2>
        <SearchFilters places={places} />
      </section>

      <hr style={{ margin: "32px 0" }} />

      <section>
        <h2>Statistiche</h2>
        <p>📍 Locali registrati: {places.length}</p>
        <p>⭐ Recensioni: dati gestiti tramite Supabase</p>
        <p>👥 Community registrata</p>
      </section>

      {latestPlace && (
        <>
          <hr style={{ margin: "32px 0" }} />
          <section>
            <h2>Ultimo locale inserito</h2>
            <h3 style={{ marginBottom: "4px" }}>
              <Link href={`/places/${latestPlace.slug}`}>{latestPlace.name}</Link>
            </h3>
            <p style={{ margin: "4px 0" }}>
              {latestPlace.type} · {latestPlace.city}, {latestPlace.region}
            </p>
            <p style={{ margin: "4px 0" }}>
              Consegna: {latestPlace.deliveryAvailable ? "Disponibile" : "Non disponibile"}
            </p>
            <Link href={`/places/${latestPlace.slug}`}>Vedi scheda →</Link>
          </section>
        </>
      )}

      <p style={{ marginTop: "32px" }}>
        <Link href="/places">Vedi tutti i locali</Link>
      </p>
    </main>
  );
}
