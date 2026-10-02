import { NextRequest, NextResponse } from "next/server";

const BRAVE_URL = "https://api.search.brave.com/res/v1/web/search";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.trim();
  if (!query || query.length < 3) {
    return NextResponse.json({ error: "Inserisci almeno 3 caratteri." }, { status: 400 });
  }
  const token = process.env.BRAVE_SEARCH_API_KEY;
  if (!token) {
    return NextResponse.json({ error: "Ricerca Web non configurata." }, { status: 503 });
  }

  const params = new URLSearchParams({ q: query, count: "8", country: "IT", search_lang: "it", safesearch: "strict" });
  try {
    const response = await fetch(`${BRAVE_URL}?${params}`, {
      headers: { Accept: "application/json", "X-Subscription-Token": token },
      cache: "no-store",
    });
    if (!response.ok) {
      return NextResponse.json({ error: `Ricerca Web: errore ${response.status}` }, { status: 502 });
    }
    const json = await response.json();
    const results = (json.web?.results ?? []).map((r: any) => ({
      title: r.title ?? "",
      url: r.url ?? "",
      description: r.description ?? "",
      age: r.age ?? "",
    }));
    return NextResponse.json({ results });
  } catch {
    return NextResponse.json({ error: "Ricerca Web temporaneamente non disponibile." }, { status: 502 });
  }
}
