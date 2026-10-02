import { NextRequest, NextResponse } from "next/server";

const NOMINATIM_URL = "https://nominatim.openstreetmap.org/search";
const CACHE_SECONDS = 86400;

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  const countryCode = request.nextUrl.searchParams.get("countrycode")?.trim().toLowerCase();

  if (!query || query.length < 3) {
    return NextResponse.json({ error: "Inserisci almeno 3 caratteri." }, { status: 400 });
  }

  const params = new URLSearchParams({
    q: query,
    format: "jsonv2",
    addressdetails: "1",
    namedetails: "1",
    extratags: "1",
    limit: "5",
    "accept-language": "it,en",
  });
  if (countryCode) params.set("countrycodes", countryCode);

  try {
    const response = await fetch(`${NOMINATIM_URL}?${params.toString()}`, {
      headers: {
        "User-Agent": "GlutenFreeFinder/1.0 (admin place search)",
        "Accept-Language": "it,en;q=0.8",
      },
      next: { revalidate: CACHE_SECONDS },
    });

    if (!response.ok) {
      return NextResponse.json({ error: `Nominatim ${response.status}` }, { status: 502 });
    }

    const data = await response.json();
    const results = data.map((item: any) => ({
      placeId: item.place_id,
      osmType: item.osm_type,
      osmId: item.osm_id,
      name: item.name || item.namedetails?.name || item.display_name?.split(",")[0] || "",
      displayName: item.display_name,
      latitude: Number(item.lat),
      longitude: Number(item.lon),
      type: item.type,
      category: item.category,
      address: item.address ?? {},
     website:
  item.extratags?.website ||
  item.extratags?.["contact:website"] ||
  "",

phone:
  item.extratags?.phone ||
  item.extratags?.["contact:phone"] ||
  "",
    }));

    return NextResponse.json({ results, attribution: "© OpenStreetMap contributors" }, {
      headers: { "Cache-Control": `public, s-maxage=${CACHE_SECONDS}, stale-while-revalidate=604800` },
    });
  } catch {
    return NextResponse.json({ error: "Servizio di ricerca temporaneamente non disponibile." }, { status: 502 });
  }
}
