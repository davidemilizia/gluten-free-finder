import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

function n(v: string) { return (v || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim(); }

export async function POST(req: NextRequest) {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
    const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") || "";
    const uc = createClient(url, publishable, { global: { headers: { Authorization: `Bearer ${token}` } }, auth: { persistSession: false } });
    const admin = createClient(url, service, { auth: { persistSession: false } });
    const { data: u } = await uc.auth.getUser(token);
    if (!u.user) return NextResponse.json({ error: "Sessione non valida." }, { status: 401 });
    const { data: p } = await admin.from("profiles").select("role,account_status").eq("id", u.user.id).maybeSingle();
    if (p?.role !== "admin" || p?.account_status !== "active") return NextResponse.json({ error: "Accesso negato." }, { status: 403 });
    const body = await req.json();
    const id = Number(body.id); const action = String(body.action || "");
    const { data: c, error } = await admin.from("place_import_candidates").select("*").eq("id", id).single();
    if (error || !c) return NextResponse.json({ error: error?.message || "Candidato non trovato." }, { status: 404 });
    if (action === "discard") {
      await admin.from("place_import_candidates").update({ review_status: "discarded", reviewed_at: new Date().toISOString(), reviewed_by: u.user.id }).eq("id", id);
      return NextResponse.json({ ok: true });
    }
    if (action === "duplicate") {
      await admin.from("place_import_candidates").update({ review_status: "possible_duplicate", duplicate_of: body.duplicateOf || null, reviewed_at: new Date().toISOString(), reviewed_by: u.user.id }).eq("id", id);
      return NextResponse.json({ ok: true });
    }
    if (action === "approve") {
      const baseSlug = c.slug || n(c.name).replace(/ /g, "-");
      let slug = baseSlug; let suffix = 2;
      while (true) {
        const { data: existing } = await admin.from("places").select("id").eq("slug", slug).maybeSingle();
        if (!existing) break; slug = `${baseSlug}-${suffix++}`;
      }
      const payload = {
        slug, name: c.name, continent: c.continent || "", country: c.country || "", region: c.region || "", province: c.province || "", city: c.city || "",
        address: c.address || "", latitude: c.latitude || 0, longitude: c.longitude || 0, type: c.type || "Altro", gf_category: c.gf_category || "Stato da verificare",
        phone: c.phone || "", website: c.website || "", description: "", notes: `Importato da ${c.source_name}. Fonte: ${c.source_url || "n/d"}. Indicazione GF: ${c.gf_source_value || "n/d"}. Da verificare prima della pubblicazione.`,
        verified: false, published: false, delivery_available: !!c.delivery_available, direct_delivery: false, takeaway_available: !!c.takeaway_available,
        just_eat_url: "", glovo_url: "", too_good_to_go_available: false, too_good_to_go_url: "", is_demo: false,
      };
      const { data: place, error: pe } = await admin.from("places").insert(payload).select("id,slug").single();
      if (pe) return NextResponse.json({ error: pe.message }, { status: 400 });
      await admin.from("place_import_candidates").update({ review_status: "approved_as_draft", approved_place_id: place.id, reviewed_at: new Date().toISOString(), reviewed_by: u.user.id }).eq("id", id);
      return NextResponse.json({ ok: true, place });
    }
    return NextResponse.json({ error: "Azione non valida." }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "Errore operazione import." }, { status: 500 });
  }
}
