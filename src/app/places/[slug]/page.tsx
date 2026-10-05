import Link from "next/link";
import { notFound } from "next/navigation";
import PlaceMap from "@/components/PlaceMap";
import DeliveryServices from "@/components/DeliveryServices";
import SupabaseReviews from "@/components/SupabaseReviews";
import { supabasePublic } from "@/lib/supabase-public";
import type { Place } from "@/types/place";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function Page({ params }: Props) {
  const { slug } = await params;

  const { data } = await supabasePublic
    .from("places")
    .select("*")
    .eq("slug", slug)
    .eq("published", true)
    .maybeSingle();

  if (!data) {
    notFound();
  }

  const place = data as Place;

  return (
    <main style={pageStyle}>
      /places← Torna ai locali</Link>

      <h1>{place.name}</h1>

      <p>
        {place.type} · {place.city}, {place.region}
      </p>

      <p>
        {`/places/${place.slug}/claim`}
          Sei il proprietario o il responsabile? Rivendica questo locale
        </Link>
      </p>

      <section>
        <h2>Informazioni</h2>

        <p>
          <strong>Affidabilità gluten free:</strong> {place.gf_category}
        </p>

        <p>
          <strong>Indirizzo:</strong> {place.address}
        </p>

        <p>{place.description}</p>
      </section>

      <DeliveryServices {...place} />

      <section>
        <h2>Contatti</h2>

        {place.phone ? (
          <p>
            {`tel:${place.phone}`}{place.phone}</a>
          </p>
        ) : (
          <p>Telefono non disponibile.</p>
        )}

        {place.website && (
          <p>
            {place.website}
              Visita il sito
            </a>
          </p>
        )}
      </section>

      <PlaceMap
        latitude={place.latitude}
        longitude={place.longitude}
        name={place.name}
      />

      <SupabaseReviews placeSlug={place.slug} />

      {place.notes && (
        <section>
          <h2>Note</h2>
          <p>{place.notes}</p>
        </section>
      )}
    </main>
  );
}

const pageStyle = {
  maxWidth: "900px",
  margin: "0 auto",
  padding: "32px 20px",
  fontFamily: "Arial, sans-serif",
  lineHeight: 1.6,
};
