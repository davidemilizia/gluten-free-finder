import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

function env() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !publishable || !secret) throw new Error("Variabili Supabase mancanti.");
  return { url, publishable, secret };
}

async function authorizeAdmin(request: NextRequest) {
  const token = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) return { error: NextResponse.json({ error: "Sessione mancante." }, { status: 401 }) };

  const { url, publishable, secret } = env();
  const publicClient = createClient(url, publishable, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: userData, error: userError } = await publicClient.auth.getUser(token);
  if (userError || !userData.user) {
    return { error: NextResponse.json({ error: "Sessione non valida." }, { status: 401 }) };
  }

  const { data: isAdmin, error: adminError } = await publicClient.rpc("is_admin");
  if (adminError || isAdmin !== true) {
    return { error: NextResponse.json({ error: "Accesso riservato agli amministratori." }, { status: 403 }) };
  }

  const admin = createClient(url, secret, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return { admin, currentUser: userData.user };
}

export async function GET(request: NextRequest) {
  try {
    const authorized = await authorizeAdmin(request);
    if ("error" in authorized) return authorized.error;
    const { admin } = authorized;

    const [authResult, profilesResult, reviewsResult, legalResult] = await Promise.all([
      admin.auth.admin.listUsers({ page: 1, perPage: 1000 }),
      admin.from("profiles").select("id,display_name,role,account_status"),
      admin.from("reviews").select("user_id"),
      admin.from("legal_acceptances").select("user_id,marketing_consent"),
    ]);

    if (authResult.error) throw authResult.error;
    if (profilesResult.error) throw profilesResult.error;

    const profiles = new Map((profilesResult.data ?? []).map((p) => [p.id, p]));
    const reviewCounts = new Map<string, number>();
    for (const review of reviewsResult.data ?? []) {
      reviewCounts.set(review.user_id, (reviewCounts.get(review.user_id) ?? 0) + 1);
    }
    const marketing = new Map((legalResult.data ?? []).map((x) => [x.user_id, Boolean(x.marketing_consent)]));

    const users = authResult.data.users.map((user) => {
      const profile = profiles.get(user.id);
      return {
        id: user.id,
        email: user.email ?? "",
        emailConfirmed: Boolean(user.email_confirmed_at),
        createdAt: user.created_at,
        lastSignInAt: user.last_sign_in_at ?? null,
        displayName: profile?.display_name ?? user.user_metadata?.display_name ?? "Utente registrato",
        role: profile?.role ?? "user",
        accountStatus: profile?.account_status ?? "pending",
        reviewCount: reviewCounts.get(user.id) ?? 0,
        marketingConsent: marketing.get(user.id) ?? false,
      };
    });

    return NextResponse.json({ users });
  } catch (error: unknown) {
    const candidate = error as { message?: string; details?: string; hint?: string; code?: string };
    const message =
      candidate?.message ||
      candidate?.details ||
      (error instanceof Error ? error.message : "Errore caricamento utenti.");

    console.error("/api/admin/users", error);

    return NextResponse.json(
      {
        error: message,
        code: candidate?.code ?? null,
        hint: candidate?.hint ?? null,
      },
      { status: 500 }
    );
  }
}
