import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function clients(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
  const userClient = createClient(url, process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false },
  });
  const admin = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!, { auth: { persistSession: false } });
  return { userClient, admin, token };
}

export async function GET(req: NextRequest) {
  try {
    const { userClient, admin, token } = clients(req);
    if (!token) return NextResponse.json({ error: "Sessione mancante." }, { status: 401 });
    const { data: userData } = await userClient.auth.getUser(token);
    if (!userData.user) return NextResponse.json({ error: "Sessione non valida." }, { status: 401 });
    const { data: profile } = await admin.from("profiles").select("role,account_status").eq("id", userData.user.id).maybeSingle();
    if (profile?.role !== "admin" || profile?.account_status !== "active") return NextResponse.json({ error: "Accesso negato." }, { status: 403 });
    const status = req.nextUrl.searchParams.get("status") || "pending";
    const search = req.nextUrl.searchParams.get("q")?.trim() || "";
    let query = admin.from("place_import_candidates").select("*").eq("review_status", status).order("imported_at", { ascending: false }).limit(300);
    if (search) query = query.or(`name.ilike.%${search}%,city.ilike.%${search}%,province.ilike.%${search}%,country.ilike.%${search}%`);
    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ candidates: data ?? [] });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Errore caricamento importazioni." }, { status: 500 });
  }
}
