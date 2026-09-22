import Link from "next/link";
import SearchFilters from "@/components/SearchFilters";
import { supabasePublic } from "@/lib/supabase-public";
import type { Place } from "@/types/place";

export const dynamic = "force-dynamic";
export default async function HomePage(){
 const {data}=await supabasePublic.from("places").select("*").eq("published",true).order("created_at",{ascending:true});
 const places=(data??[]) as Place[]; const latest=places.at(-1);
 const searchPlaces=places.map(p=>({continent:p.continent,country:p.country,region:p.region,city:p.city,type:p.type}));
 return <main style={pageStyle}><h1 style={{color:"#15803d"}}>🍃 Gluten Free Finder</h1><p>Trova locali e negozi sicuri per celiaci.</p><hr/><h2>Ricerca</h2><SearchFilters places={searchPlaces}/><hr/><h2>Statistiche</h2><p>📍 Locali registrati: {places.length}</p>{latest&&<section><h2>Ultimo locale inserito</h2><h3><Link href={`/places/${latest.slug}`}>{latest.name}</Link></h3><p>{latest.type} · {latest.city}, {latest.region}</p></section>}<p><Link href="/places">Vedi tutti i locali</Link></p></main>;
}
const pageStyle={maxWidth:"960px",margin:"0 auto",padding:"48px 20px",fontFamily:"Arial, sans-serif",lineHeight:1.6};
