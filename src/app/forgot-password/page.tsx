"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    setErrorMessage("");

    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    setLoading(false);

    if (error) {
      setErrorMessage("Non è stato possibile inviare l'email. Riprova tra qualche minuto.");
      return;
    }

    setMessage(
      "Se l'indirizzo è associato a un account, riceverai un link per impostare una nuova password. Controlla anche Spam, Posta indesiderata e Promozioni."
    );
  }

  return (
    <main style={pageStyle}>
      <Link href="/login">← Torna all'accesso</Link>
      <section style={cardStyle}>
        <h1>Password dimenticata</h1>
        <p>
          Inserisci l'indirizzo email usato per la registrazione. Ti invieremo un link sicuro per scegliere una nuova password.
        </p>

        {message && <div style={successStyle}>{message}</div>}
        {errorMessage && <div style={errorStyle}>{errorMessage}</div>}

        <form onSubmit={handleSubmit} style={formStyle}>
          <label style={fieldStyle}>
            Email
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              style={inputStyle}
            />
          </label>

          <button type="submit" disabled={loading} style={buttonStyle}>
            {loading ? "Invio in corso..." : "Invia link di recupero"}
          </button>
        </form>
      </section>
    </main>
  );
}

const pageStyle = { maxWidth: 620, margin: "0 auto", padding: "42px 20px", fontFamily: "Arial, sans-serif", lineHeight: 1.6 };
const cardStyle = { marginTop: 24, padding: 24, border: "1px solid #d6d6d6", borderRadius: 12, background: "#fff" };
const formStyle = { display: "grid", gap: 18, marginTop: 24 };
const fieldStyle = { display: "grid", gap: 7, fontWeight: 700 };
const inputStyle = { minHeight: 42, padding: "8px 10px", border: "1px solid #aaa", borderRadius: 7, fontSize: "1rem" };
const buttonStyle = { minHeight: 44, border: 0, borderRadius: 7, background: "#15803d", color: "white", fontWeight: 700, cursor: "pointer" };
const successStyle = { marginTop: 18, padding: 14, border: "1px solid #86c99a", borderRadius: 8, background: "#effaf2", color: "#14532d" };
const errorStyle = { marginTop: 18, padding: 14, border: "1px solid #e4a2a2", borderRadius: 8, background: "#fff1f1", color: "#7f1d1d" };
