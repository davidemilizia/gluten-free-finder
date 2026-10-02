import { NextRequest, NextResponse } from "next/server";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/reverse";
const CACHE_SECONDS = 86400;

export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get("lat");
  const lon = request.nextUrl.searchParams.get("lon");
  if (!lat || !lon || Number.isNaN(Number(lat)) || Number.isNaN(Number(lon))) {
    return NextResponse.json({ error: "Coordinate non valide." }, { status: 400 });
  }

  const params = new URLSearchParams({
    lat,
    lon,
    format: "jsonv2",
    addressdetails: "1",
    "accept-language": "it,en",
  });

  try {
    const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      headers: {
        "User-Agent": "GlutenFreeFinder/1.0 (admin reverse geocoding)",
        "Accept-Language": "it,en;q=0.8",
      },
      next: { revalidate: CACHE_SECONDS },
    });
    if (!response.ok) return NextResponse.json({ error: `Nominatim ${response.status}` }, { status: 502 });
    const item = await response.json();
    return NextResponse.json({
      displayName: item.display_name,
      latitude: Number(item.lat),
      longitude: Number(item.lon),
      address: item.address ?? {},
      attribution: "© OpenStreetMap contributors",
    }, { headers: { "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=604800` } });
  } catch {
    return NextResponse.json({ error: "Servizio di geocodifica temporaneamente non disponibile." }, { status: 502 });
  }
}
