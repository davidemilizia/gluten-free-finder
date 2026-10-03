import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const lat = request.nextUrl.searchParams.get("lat");
  const lon = request.nextUrl.searchParams.get("lon");
  if (!lat || !lon || !Number.isFinite(Number(lat)) || !Number.isFinite(Number(lon))) {
    return NextResponse.json({ error: "Coordinate non valide" }, { status: 400 });
  }

  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lon);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("accept-language", "en");
  url.searchParams.set("zoom", "18");

  const response = await fetch(url, {
    headers: {
      "User-Agent": "GlutenFreeFinder/2.10.1 (admin reverse geocoding)",
      Accept: "application/json",
    },
    cache: "no-store",
  });
  if (!response.ok) {
    return NextResponse.json({ error: "Reverse geocoding non disponibile" }, { status: 502 });
  }

  const data = await response.json();
  return NextResponse.json({
    display_name: data.display_name ?? "",
    country_code: data.address?.country_code ?? "",
    country: data.address?.country ?? "",
    state: data.address?.state ?? "",
    region: data.address?.region ?? "",
    state_district: data.address?.state_district ?? "",
    province: data.address?.province ?? "",
    county: data.address?.county ?? "",
    city: data.address?.city ?? "",
    town: data.address?.town ?? "",
    village: data.address?.village ?? "",
    municipality: data.address?.municipality ?? "",
  });
}
