"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase-browser";

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const confirmed = searchParams.get("confirmed") === "1";

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;

      if (data.session) {
        router.replace("/account");
        return;
      }

      setCheckingSession(false);
    });

    return () => {
      active = false;
    };
  }, [router]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage("");
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMessage(
        "Accesso non riuscito. Controlla email, password e conferma dell'account."
      );
      return;
    }

    router.replace("/account");
    router.refresh();
  }

  if (checkingSession) {
    return (
      <main style={pageStyle}>
        <p>Verifica sessione...</p>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <Link href="/">← Torna alla homepage</Link>
      <h1>Accedi</h1>
      <p>Accedi per gestire il profilo e contribuire alla community.</p>

      {confirmed && (
        <div style={successStyle}>
          Email confermata. Ora puoi accedere al tuo account.
        </div>
      )}

      {errorMessage && <div style={errorStyle}>{errorMessage}</div>}

      <form onSubmit={handleSubmit} style={formStyle}>
        <label style={fieldStyle}>
          Email
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            autoComplete="email"
            style={inputStyle}
          />
        </label>

        <label style={fieldStyle}>
          Password
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            autoComplete="current-password"
            style={inputStyle}
          />
        </label>

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Accesso in corso..." : "Accedi"}
        </button>
      </form>

      <p>
        Non hai un account? <Link href="/register">Registrati</Link>
      </p>
    </main>
  );
}

const pageStyle = {
  maxWidth: "560px",
  margin: "0 auto",
  padding: "40px 20px",
  fontFamily: "Arial, sans-serif",
  lineHeight: 1.6,
};

const formStyle = {
  display: "grid",
  gap: "16px",
  margin: "28px 0",
};

const fieldStyle = {
  display: "grid",
  gap: "6px",
  fontWeight: 700,
};

const inputStyle = {
  minHeight: "42px",
  padding: "8px 10px",
  border: "1px solid #aaa",
  borderRadius: "6px",
  fontSize: "1rem",
};

const buttonStyle = {
  minHeight: "44px",
  border: 0,
  borderRadius: "6px",
  background: "#15803d",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const successStyle = {
  padding: "14px",
  border: "1px solid #86c99a",
  borderRadius: "8px",
  background: "#effaf2",
  color: "#14532d",
};

const errorStyle = {
  padding: "14px",
  border: "1px solid #e4a2a2",
  borderRadius: "8px",
  background: "#fff1f1",
  color: "#7f1d1d",
};
