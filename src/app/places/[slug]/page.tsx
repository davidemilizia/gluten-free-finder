import Link from "next/link";
import { notFound } from "next/navigation";
import PlaceMap from "@/components/PlaceMap";
import PhotoGallery from "@/components/PhotoGallery";
import SupabaseReviews from "@/components/SupabaseReviews";
import places from "../../../../data/places.json";
import photos from "../../../../data/photos.json";

type PlacePageProps = {
  params: Promise<{ slug: string }>;
};

export default async function PlaceDetailPage({ params }: PlacePageProps) {
  const { slug } = await params;
  const place = places.find((item) => item.slug === slug);

  if (!place) notFound();

  const placePhotos = photos.filter(
    (photo) => photo.placeSlug === slug && photo.approved
  );

  return (
    <main style={pageStyle}>
      <Link href="/places">← Torna all'elenco dei locali</Link>

      <h1 style={{ marginTop: "28px", marginBottom: "8px" }}>{place.name}</h1>
      <p style={{ marginTop: 0, color: "#555" }}>
        {place.type} · {place.city}, {place.region}
      </p>

      <section>
        <h2>Informazioni</h2>
        <p><strong>Continente:</strong> {place.continent}</p>
        <p><strong>Nazione:</strong> {place.country}</p>
        <p><strong>Regione:</strong> {place.region}</p>
        <p><strong>Città:</strong> {place.city}</p>
        <p><strong>Tipologia:</strong> {place.type}</p>
        <p><strong>Affidabilità gluten free:</strong> {place.gfCategory}</p>
        <p><strong>Indirizzo:</strong> {place.address}</p>
        <p><strong>Descrizione:</strong> {place.description}</p>
      </section>

      <section>
        <h2>Contatti</h2>
        {place.phone ? (
          <p><strong>Telefono:</strong> <a href={`tel:${place.phone}`}>{place.phone}</a></p>
        ) : (
          <p>Telefono non disponibile.</p>
        )}
        {place.website ? (
          <p><strong>Sito web:</strong> <a href={place.website} target="_blank" rel="noreferrer">Visita il sito</a></p>
        ) : (
          <p>Sito web non disponibile.</p>
        )}
      </section>

      <PlaceMap latitude={place.latitude} longitude={place.longitude} name={place.name} />
      <PhotoGallery photos={placePhotos} placeName={place.name} />
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
