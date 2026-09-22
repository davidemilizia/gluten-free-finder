"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");

    const cleanNickname = displayName.trim();

    if (cleanNickname.length < 2) {
      setErrorMessage("Il nickname deve contenere almeno 2 caratteri.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("La password deve contenere almeno 8 caratteri.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Le password non coincidono.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          display_name: cleanNickname,
        },
        emailRedirectTo: `${window.location.origin}/login`,
      },
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    setMessage(
      "Registrazione completata. Controlla la tua email e apri il link di conferma."
    );
    setDisplayName("");
    setEmail("");
    setPassword("");
    setConfirmPassword("");
  }

  return (
    <main style={pageStyle}>
      <Link href="/">← Torna alla homepage</Link>

      <h1>Crea il tuo account</h1>
      <p>Registrati per lasciare recensioni, valutazioni e fotografie.</p>

      {message && <div style={successStyle}>{message}</div>}
      {errorMessage && <div style={errorStyle}>{errorMessage}</div>}

      <form onSubmit={handleSubmit} style={formStyle}>
        <label style={fieldStyle}>
          Nickname pubblico
          <input
            type="text"
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            required
            minLength={2}
            maxLength={60}
            autoComplete="nickname"
            style={inputStyle}
          />
          <small style={helpStyle}>
            Il nickname sarà visibile accanto alle recensioni. Non inserire email,
            numero di telefono o altri dati personali.
          </small>
        </label>

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
            minLength={8}
            autoComplete="new-password"
            style={inputStyle}
          />
        </label>

        <label style={fieldStyle}>
          Conferma password
          <input
            type="password"
            value={confirmPassword}
            onChange={(event) => setConfirmPassword(event.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            style={inputStyle}
          />
        </label>

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Registrazione in corso..." : "Registrati"}
        </button>
      </form>

      <p>
        Hai già un account? <Link href="/login">Accedi</Link>
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
  gap: "18px",
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

const helpStyle = {
  color: "#555",
  fontWeight: 400,
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
