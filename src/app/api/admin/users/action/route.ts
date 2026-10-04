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

type ActionBody = {
  userId?: string;
  id?: string;
  action?: "approve" | "reject" | "suspend" | "reactivate" | "promote" | "demote";
};

export async function POST(request: NextRequest) {
  try {
    const authorized = await authorizeAdmin(request);
    if ("error" in authorized) return authorized.error;
    const { admin, currentUser } = authorized;

    const body = (await request.json()) as ActionBody;
    const targetId = body.userId || body.id;
    if (!targetId || !body.action) {
      return NextResponse.json({ error: "Dati azione mancanti." }, { status: 400 });
    }
    const selfAction = targetId === currentUser.id;

    if (selfAction && ["suspend", "reject", "demote"].includes(body.action)) {
      return NextResponse.json(
        { error: "Non puoi sospendere, rifiutare o declassare il tuo account amministratore." },
        { status: 400 }
      );
    }

    if (body.action === "demote") {
      const { data: admins, error } = await admin
        .from("profiles")
        .select("id")
        .eq("role", "admin")
        .eq("account_status", "active");
      if (error) throw error;
      if ((admins ?? []).length <= 1) {
        return NextResponse.json({ error: "Non puoi revocare l'ultimo amministratore attivo." }, { status: 400 });
      }
    }

    const updates: Record<string, string> = {};
    if (body.action === "approve" || body.action === "reactivate") updates.account_status = "active";
    if (body.action === "reject") updates.account_status = "rejected";
    if (body.action === "suspend") updates.account_status = "suspended";
    if (body.action === "promote") {
      updates.role = "admin";
      updates.account_status = "active";
    }
    if (body.action === "demote") updates.role = "user";

    const { error: updateError } = await admin
      .from("profiles")
      .update(updates)
      .eq("id", targetId);
    if (updateError) throw updateError;

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Operazione non riuscita." },
      { status: 500 }
    );
  }
}
