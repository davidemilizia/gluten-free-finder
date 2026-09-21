import Link from "next/link";
import { notFound } from "next/navigation";
import places from "../../../../data/places.json";

type PlacePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function PlaceDetailPage({ params }: PlacePageProps) {
  const { slug } = await params;
  const place = places.find((item) => item.slug === slug);

  if (!place) {
    notFound();
  }

  return (
    <main
      style={{
        maxWidth: "900px",
        margin: "0 auto",
        padding: "32px 20px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <Link href="/places">← Torna all’elenco dei locali</Link>

      <h1 style={{ marginTop: "28px" }}>{place.name}</h1>

      <p>
        <strong>Indirizzo:</strong> {place.address}
      </p>

      <p>
        <strong>Valutazione:</strong> ⭐ {place.rating}/5
      </p>

      <p>
        <strong>Descrizione:</strong> {place.description}
      </p>

      {place.phone && (
        <p>
          <strong>Telefono:</strong>{" "}
          <a href={`tel:${place.phone}`}>{place.phone}</a>
        </p>
      )}

      {place.website && (
        <p>
          <strong>Sito web:</strong>{" "}
          <a href={place.website} target="_blank" rel="noreferrer">
            Visita il sito
          </a>
        </p>
      )}

      <p>
        <strong>Coordinate:</strong> {place.latitude}, {place.longitude}
      </p>
    </main>
  );
}
