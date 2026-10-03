import Link from "next/link";
import SearchFilters from "@/components/SearchFilters";
import { supabase } from "@/lib/supabase-browser";

export const dynamic = "force-dynamic";

type SearchParams = Promise<Record<string, string | undefined>>;

export default async function PlacesPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  // Tutti i locali pubblicati alimentano i menu a cascata. Non vengono usate
  // liste geografiche parziali, quindi ogni provincia e comune realmente
  // presente nei locali compare nei filtri.
  const { data: filterPlaces } = await supabase
    .from("places")
    .select("continent,country,region,province,city,type,gf_category")
    .eq("published", true);

  let query = supabase
    .from("places")
    .select("*")
    .eq("published", true)
    .order("name");

  if (params.continent) query = query.eq("continent", params.continent);
  if (params.country) query = query.eq("country", params.country);
  if (params.region) query = query.eq("region", params.region);
  if (params.province) query = query.eq("province", params.province);
  if (params.city) query = query.eq("city", params.city);
  if (params.type) query = query.eq("type", params.type);
  if (params.gf_category) query = query.eq("gf_category", params.gf_category);

  const { data: places, error } = await query;

  return (
    <main style={styles.page}>
      <div style={styles.top}>
        <div>
          <Link href="/">← Home</Link>
          <h1 style={styles.title}>Locali Gluten Free</h1>
          <p style={styles.muted}>Affina la ricerca per territorio, tipologia e affidabilità.</p>
        </div>
        <div style={styles.count}>{places?.length ?? 0}<small> risultati</small></div>
      </div>

      <section style={styles.filters}>
        <SearchFilters places={filterPlaces ?? []} />
      </section>

      {error && <p style={styles.error}>{error.message}</p>}

      <section style={styles.results}>
        {(places ?? []).map((place) => (
          <article key={place.id} style={styles.card}>
            <div>
              <div style={styles.chips}>
                {place.type && <span>{place.type}</span>}
                {place.gf_category && <span>{place.gf_category}</span>}
              </div>
              <h2 style={styles.cardTitle}><Link href={`/places/${place.slug}`}>{place.name}</Link></h2>
              <p style={styles.muted}>{[place.city, place.province, place.region, place.country].filter(Boolean).join(" · ")}</p>
              <p>{place.address}</p>
            </div>
            <Link href={`/places/${place.slug}`} style={styles.open}>Apri la scheda →</Link>
          </article>
        ))}
      </section>
    </main>
  );
}

const styles = {
  page: { maxWidth: 1080, margin: "0 auto", padding: "36px 22px", fontFamily: "Arial,sans-serif" },
  top: { display: "flex", justifyContent: "space-between", gap: 20, alignItems: "end", marginBottom: 24 },
  title: { fontSize: 38, marginBottom: 6 },
  muted: { color: "#64748b" },
  count: { fontSize: 36, fontWeight: 900, color: "#15803d" },
  filters: { padding: 20, border: "1px solid #e2e8f0", borderRadius: 16, background: "#f8fafc", marginBottom: 22 },
  results: { display: "grid", gap: 14 },
  card: { padding: 22, border: "1px solid #e2e8f0", borderRadius: 14, display: "flex", justifyContent: "space-between", alignItems: "center", gap: 18, background: "white" },
  cardTitle: { margin: "8px 0" },
  chips: { display: "flex", gap: 8, color: "#15803d", fontSize: 13, fontWeight: 700 },
  open: { color: "#15803d", fontWeight: 800, textDecoration: "none" },
  error: { color: "#991b1b" },
};
