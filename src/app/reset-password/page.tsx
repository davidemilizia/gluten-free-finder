"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

export default function ResetPasswordPage() {
  const [ready, setReady] = useState(false);
  const [validRecovery, setValidRecovery] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function initialize() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setValidRecovery(Boolean(data.session));
      setReady(true);
    }

    void initialize();

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "PASSWORD_RECOVERY" || session) {
        setValidRecovery(true);
        setReady(true);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");

    if (password.length < 8) {
      setErrorMessage("La password deve contenere almeno 8 caratteri.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Le password non coincidono.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage("Password aggiornata correttamente. Ora puoi accedere con la nuova password.");
    setPassword("");
    setConfirmPassword("");
    await supabase.auth.signOut();
  }

  if (!ready) {
    return <main style={pageStyle}><p>Verifica del link di recupero...</p></main>;
  }

  if (!validRecovery && !message) {
    return (
      <main style={pageStyle}>
        <section style={cardStyle}>
          <h1>Link non valido o scaduto</h1>
          <p>Richiedi un nuovo link per recuperare la password.</p>
          <Link href="/forgot-password">Richiedi un nuovo link</Link>
        </section>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <section style={cardStyle}>
        <h1>Imposta una nuova password</h1>
        <p>Scegli una password di almeno 8 caratteri.</p>

        {message && (
          <div style={successStyle}>
            {message}<br />
            <Link href="/login">Vai alla pagina di accesso</Link>
          </div>
        )}
        {errorMessage && <div style={errorStyle}>{errorMessage}</div>}

        {!message && (
          <form onSubmit={handleSubmit} style={formStyle}>
            <label style={fieldStyle}>
              Nuova password
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                style={inputStyle}
              />
            </label>

            <label style={fieldStyle}>
              Conferma nuova password
              <input
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                style={inputStyle}
              />
            </label>

            <button type="submit" disabled={loading} style={buttonStyle}>
              {loading ? "Aggiornamento..." : "Aggiorna password"}
            </button>
          </form>
        )}
      </section>
    </main>
  );
}

const pageStyle = { maxWidth: 620, margin: "0 auto", padding: "42px 20px", fontFamily: "Arial, sans-serif", lineHeight: 1.6 };
const cardStyle = { padding: 24, border: "1px solid #d6d6d6", borderRadius: 12, background: "#fff" };
const formStyle = { display: "grid", gap: 18, marginTop: 24 };
const fieldStyle = { display: "grid", gap: 7, fontWeight: 700 };
const inputStyle = { minHeight: 42, padding: "8px 10px", border: "1px solid #aaa", borderRadius: 7, fontSize: "1rem" };
const buttonStyle = { minHeight: 44, border: 0, borderRadius: 7, background: "#15803d", color: "white", fontWeight: 700, cursor: "pointer" };
const successStyle = { marginTop: 18, padding: 14, border: "1px solid #86c99a", borderRadius: 8, background: "#effaf2", color: "#14532d" };
const errorStyle = { marginTop: 18, padding: 14, border: "1px solid #e4a2a2", borderRadius: 8, background: "#fff1f1", color: "#7f1d1d" };
