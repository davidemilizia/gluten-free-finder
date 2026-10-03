"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

export default function AccountPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [nickname, setNickname] = useState("");
  const [ready, setReady] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    void (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) {
        router.replace("/login");
        return;
      }
      setEmail(user.email ?? "");
      setNickname(user.user_metadata?.nickname ?? "");
      setReady(true);
    })();
  }, [router]);

  async function saveNickname() {
    setMessage("");
    const { error } = await supabase.auth.updateUser({
      data: { nickname: nickname.trim() },
    });
    setMessage(error ? error.message : "Nickname salvato.");
  }

  async function logout() {
    await supabase.auth.signOut({ scope: "local" });
    router.replace("/");
    router.refresh();
  }

  async function deleteAccount() {
    if (confirmText !== "ELIMINA" || deleting) return;
    setDeleting(true);
    setMessage("Eliminazione account in corso...");

    try {
      const { data, error: sessionError } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (sessionError || !accessToken) {
        setMessage("Sessione non valida. Accedi di nuovo e riprova.");
        return;
      }

      const endpoint = new URL("/api/account/delete", window.location.origin).toString();
      console.info("[account-delete-ui] POST", endpoint);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          Accept: "application/json",
          "Cache-Control": "no-store",
        },
        cache: "no-store",
      });

      const contentType = response.headers.get("content-type") ?? "";
      const raw = await response.text();
      let payload: { ok?: boolean; error?: string; requestId?: string } = {};

      if (contentType.includes("application/json") && raw) {
        try {
          payload = JSON.parse(raw);
        } catch {
          payload = {};
        }
      }

      console.info("[account-delete-ui] response", {
        endpoint,
        status: response.status,
        contentType,
        payload,
      });

      if (!response.ok || !payload.ok) {
        const detail = payload.error || `HTTP ${response.status}`;
        const requestId = payload.requestId ? ` Riferimento: ${payload.requestId}` : "";
        const nonJson = !contentType.includes("application/json")
          ? " La risposta non era JSON: verifica dominio e routing Vercel."
          : "";
        setMessage(`Eliminazione non riuscita: ${detail}.${requestId}${nonJson}`);
        return;
      }

      // L'utente Auth e stato eliminato sul server. Rimuove anche la sessione locale.
      await supabase.auth.signOut({ scope: "local" });
      try {
        for (const key of Object.keys(window.localStorage)) {
          if (key.startsWith("sb-") && key.endsWith("-auth-token")) {
            window.localStorage.removeItem(key);
          }
        }
      } catch {
        // La pulizia localStorage e best effort; la cancellazione server e gia conclusa.
      }

      window.location.replace("/?account_deleted=1");
    } catch (error) {
      const detail = error instanceof Error ? error.message : "Errore imprevisto.";
      setMessage(`Eliminazione non riuscita: ${detail}`);
    } finally {
      setDeleting(false);
    }
  }

  if (!ready) return <main style={styles.page}>Caricamento...</main>;

  return (
    <main style={styles.page}>
      <Link href="/">← Torna alla homepage</Link>
      <h1>Il mio account</h1>
      <p><strong>Email privata:</strong> {email}</p>

      <label style={styles.label}>
        Nickname pubblico
        <input
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          style={styles.input}
        />
      </label>
      <button onClick={saveNickname} style={styles.greenButton}>Salva nickname</button>

      <section style={styles.section}>
        <h2>Privacy e comunicazioni</h2>
        <p>Gestisci il consenso alle comunicazioni facoltative e consulta i documenti legali.</p>
        <Link href="/account/privacy">Gestisci privacy e comunicazioni →</Link>
        <p><Link href="/privacy">Privacy</Link> · <Link href="/terms">Termini</Link> · <Link href="/cookies">Cookie</Link></p>
      </section>

      <button onClick={logout} style={styles.logoutButton}>Disconnetti</button>

      <section style={styles.dangerSection}>
        <h2>Elimina account</h2>
        <p>
          Puoi richiedere la cancellazione definitiva dell'account. Alcuni dati potranno essere
          conservati soltanto quando necessario per obblighi di legge o altre basi giuridiche applicabili.
        </p>

        {!confirmOpen ? (
          <button onClick={() => { setConfirmOpen(true); setMessage(""); }} style={styles.dangerButton}>
            Elimina il mio account
          </button>
        ) : (
          <div>
            <p><strong>Per confermare scrivi ELIMINA</strong></p>
            <input
              value={confirmText}
              onChange={(event) => setConfirmText(event.target.value)}
              style={styles.input}
              disabled={deleting}
            />
            <div style={styles.actions}>
              <button
                disabled={deleting}
                onClick={() => { setConfirmOpen(false); setConfirmText(""); setMessage(""); }}
              >
                Annulla
              </button>
              <button
                disabled={confirmText !== "ELIMINA" || deleting}
                onClick={deleteAccount}
                style={styles.dangerButton}
              >
                {deleting ? "Eliminazione in corso..." : "Elimina definitivamente"}
              </button>
            </div>
          </div>
        )}
      </section>

      {message && <p style={styles.message}>{message}</p>}
    </main>
  );
}

const styles = {
  page: { maxWidth: 760, margin: "0 auto", padding: 38, fontFamily: "Arial, sans-serif" },
  label: { display: "block", fontWeight: 700 },
  input: { display: "block", width: "100%", boxSizing: "border-box" as const, padding: 10, marginTop: 6 },
  greenButton: { marginTop: 10, width: "100%", padding: 11, background: "#15803d", color: "white", border: 0, borderRadius: 6, fontWeight: 800 },
  logoutButton: { padding: "10px 14px", background: "#c81e1e", color: "white", border: 0, borderRadius: 6, fontWeight: 800 },
  dangerButton: { padding: "10px 14px", background: "#c81e1e", color: "white", border: 0, borderRadius: 6, fontWeight: 800 },
  section: { margin: "24px 0", padding: 18, border: "1px solid #e2e8f0", borderRadius: 12 },
  dangerSection: { marginTop: 28, padding: 18, border: "1px solid #fecaca", background: "#fff7f7", borderRadius: 12 },
  actions: { display: "flex", gap: 10, marginTop: 10 },
  message: { marginTop: 14, padding: 12, background: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: 8, whiteSpace: "pre-wrap" as const },
};
