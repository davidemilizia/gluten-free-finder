import Link from "next/link";
import { notFound } from "next/navigation";
import PlaceMap from "@/components/PlaceMap";
import PhotoGallery from "@/components/PhotoGallery";
import SupabaseReviews from "@/components/SupabaseReviews";
import DeliveryServices from "@/components/DeliveryServices";
import places from "../../../../data/places.json";
import photos from "../../../../data/photos.json";

type Props={params:Promise<{slug:string}>};
export default async function PlaceDetailPage({params}:Props){
 const {slug}=await params; const place=places.find(item=>item.slug===slug); if(!place)notFound();
 const placePhotos=photos.filter(photo=>photo.placeSlug===slug&&photo.approved);
 return <main style={pageStyle}>
  <Link href="/places">← Torna all'elenco dei locali</Link>
  <h1>{place.name}</h1><p>{place.type} · {place.city}, {place.region}</p>
  <section><h2>Informazioni</h2><p><strong>Affidabilità gluten free:</strong> {place.gfCategory}</p><p><strong>Indirizzo:</strong> {place.address}</p><p><strong>Descrizione:</strong> {place.description}</p></section>
  <DeliveryServices deliveryAvailable={place.deliveryAvailable} directDelivery={place.directDelivery} takeawayAvailable={place.takeawayAvailable} deliveryServices={place.deliveryServices} tooGoodToGoAvailable={place.tooGoodToGoAvailable} tooGoodToGoUrl={place.tooGoodToGoUrl}/>
  <section><h2>Contatti</h2>{place.phone?<p><strong>Telefono:</strong> <a href={`tel:${place.phone}`}>{place.phone}</a></p>:<p>Telefono non disponibile.</p>}{place.website?<p><a href={place.website} target="_blank" rel="noreferrer">Visita il sito</a></p>:<p>Sito web non disponibile.</p>}</section>
  <PlaceMap latitude={place.latitude} longitude={place.longitude} name={place.name}/>
  <PhotoGallery photos={placePhotos} placeName={place.name}/>
  <SupabaseReviews placeSlug={place.slug}/>
  {place.notes&&<section><h2>Note</h2><p>{place.notes}</p></section>}
 </main>;
}
const pageStyle={maxWidth:"900px",margin:"0 auto",padding:"32px 20px",fontFamily:"Arial, sans-serif",lineHeight:1.6};
