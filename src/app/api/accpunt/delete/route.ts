import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function json(body: Record<string, unknown>, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function GET() {
  return json({
    ok: true,
    message: "Account delete API is reachable. Use POST to delete the authenticated account.",
    route: "/api/account/delete",
    serviceRoleConfigured: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  });
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  console.info("[account-delete] request", { requestId });

  try {
    const authorization = request.headers.get("authorization");
    if (!authorization?.startsWith("Bearer ")) {
      console.warn("[account-delete] missing bearer", { requestId });
      return json({ ok: false, requestId, error: "Non autenticato." }, 401);
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const publicKey =
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const serviceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !publicKey || !serviceRole) {
      console.error("[account-delete] env missing", {
        requestId,
        hasUrl: Boolean(supabaseUrl),
        hasPublicKey: Boolean(publicKey),
        hasServiceRole: Boolean(serviceRole),
      });
      return json(
        { ok: false, requestId, error: "Servizio cancellazione non configurato." },
        503
      );
    }

    const accessToken = authorization.slice("Bearer ".length);
    const userClient = createClient(supabaseUrl, publicKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: userResult, error: userError } = await userClient.auth.getUser(accessToken);

    if (userError || !userResult.user) {
      console.warn("[account-delete] invalid session", {
        requestId,
        error: userError?.message,
      });
      return json({ ok: false, requestId, error: "Sessione non valida o scaduta." }, 401);
    }

    const userId = userResult.user.id;
    const admin = createClient(supabaseUrl, serviceRole, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { error: deleteError } = await admin.auth.admin.deleteUser(userId);
    if (deleteError) {
      console.error("[account-delete] delete failed", {
        requestId,
        userId,
        error: deleteError.message,
      });
      return json({ ok: false, requestId, error: deleteError.message }, 500);
    }

    console.info("[account-delete] success", { requestId, userId });
    return json({ ok: true, requestId });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Errore server imprevisto.";
    console.error("[account-delete] unexpected", { requestId, error: message });
    return json({ ok: false, requestId, error: message }, 500);
  }
}
