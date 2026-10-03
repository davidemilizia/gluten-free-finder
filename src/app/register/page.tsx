"use client";

import Link from "next/link";
import { FormEvent, ReactNode, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import { PRIVACY_VERSION, TERMS_VERSION } from "@/lib/legal";

export default function RegisterPage() {
  const [nickname, setNickname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [privacyAcknowledged, setPrivacyAcknowledged] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");

    const cleanNickname = nickname.trim();
    const cleanEmail = email.trim();

    if (cleanNickname.length < 3) {
      setMessage("Il nickname deve contenere almeno 3 caratteri.");
      return;
    }

    if (password.length < 8) {
      setMessage("La password deve contenere almeno 8 caratteri.");
      return;
    }

    if (password !== confirmPassword) {
      setMessage("Le password non coincidono.");
      return;
    }

    if (!privacyAcknowledged || !termsAccepted) {
      setMessage(
        "Per registrarti devi dichiarare di aver letto l'informativa privacy e accettare i Termini e Condizioni."
      );
      return;
    }

    setLoading(true);
    const now = new Date().toISOString();

    const { error } = await supabase.auth.signUp({
      email: cleanEmail,
      password,
      options: {
        data: {
          nickname: cleanNickname,
          privacy_notice_version: PRIVACY_VERSION,
          privacy_acknowledged_at: now,
          terms_version: TERMS_VERSION,
          terms_accepted_at: now,
          marketing_consent: marketingConsent,
          marketing_consent_at: marketingConsent ? now : null,
        },
      },
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage(
      "Registrazione completata. Controlla la tua email se e richiesta la conferma dell'account."
    );
  }

  return (
    <main style={styles.page}>
      <section style={styles.card}>
        <p style={styles.eyebrow}>GLUTEN FREE FINDER</p>
        <h1 style={styles.title}>Crea il tuo account</h1>
        <p style={styles.subtitle}>
          Entra nella community e condividi esperienze utili ad altre persone.
        </p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <Field label="Nickname pubblico *">
            <input
              required
              minLength={3}
              value={nickname}
              onChange={(event) => setNickname(event.target.value)}
              style={styles.input}
              autoComplete="nickname"
            />
            <small style={styles.help}>
              Il nickname potra comparire pubblicamente nelle recensioni. La tua email non sara mostrata pubblicamente.
            </small>
          </Field>

          <Field label="Email *">
            <input
              required
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              style={styles.input}
              autoComplete="email"
            />
          </Field>

          <div style={styles.twoColumns}>
            <Field label="Password *">
              <input
                required
                minLength={8}
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                style={styles.input}
                autoComplete="new-password"
              />
            </Field>

            <Field label="Conferma password *">
              <input
                required
                minLength={8}
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                style={styles.input}
                autoComplete="new-password"
              />
            </Field>
          </div>

          <section style={styles.legalBox}>
            <h2 style={styles.sectionTitle}>Privacy e condizioni</h2>

            <Checkbox
              checked={privacyAcknowledged}
              onChange={setPrivacyAcknowledged}
            >
              <span>
                Dichiaro di aver letto l&apos;
                <Link href="/privacy" target="_blank">
                  Informativa sulla Privacy
                </Link>{" "}
                (versione {PRIVACY_VERSION}). *
              </span>
            </Checkbox>

            <Checkbox checked={termsAccepted} onChange={setTermsAccepted}>
              <span>
                Accetto i{" "}
                <Link href="/terms" target="_blank">
                  Termini e Condizioni di utilizzo
                </Link>{" "}
                (versione {TERMS_VERSION}). *
              </span>
            </Checkbox>
          </section>

          <section style={styles.optionalBox}>
            <h2 style={styles.sectionTitle}>Comunicazioni facoltative</h2>
            <Checkbox checked={marketingConsent} onChange={setMarketingConsent}>
              <span>
                Desidero ricevere via email novita, aggiornamenti e comunicazioni di Gluten Free Finder.
              </span>
            </Checkbox>
            <small style={styles.help}>
              Scelta facoltativa e non preselezionata. Potrai modificarla successivamente dalla pagina account.
            </small>
          </section>

          <button type="submit" disabled={loading} style={styles.button}>
            {loading ? "Registrazione..." : "Crea account"}
          </button>

          {message && <p style={styles.notice}>{message}</p>}
        </form>

        <p style={styles.footerText}>
          Hai gia un account? <Link href="/login">Accedi</Link>
        </p>
      </section>
    </main>
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label style={styles.field}>
      <span>{label}</span>
      {children}
    </label>
  );
}

function Checkbox({
  checked,
  onChange,
  children,
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  children: ReactNode;
}) {
  return (
    <label style={styles.checkboxRow}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        style={styles.checkbox}
      />
      <span>{children}</span>
    </label>
  );
}

const styles = {
  page: {
    maxWidth: 760,
    margin: "0 auto",
    padding: "48px 20px",
    fontFamily: "Arial, sans-serif",
  },
  card: {
    padding: 32,
    border: "1px solid #e2e8f0",
    borderRadius: 18,
    boxShadow: "0 14px 40px rgba(15, 23, 42, 0.06)",
    background: "#ffffff",
  },
  eyebrow: {
    color: "#15803d",
    fontWeight: 900,
    fontSize: 12,
    letterSpacing: 1,
  },
  title: { marginBottom: 8 },
  subtitle: { color: "#64748b", lineHeight: 1.5 },
  form: { display: "grid", gap: 16, marginTop: 24 },
  field: { display: "block", fontWeight: 700 },
  twoColumns: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
    gap: 14,
  },
  input: {
    display: "block",
    width: "100%",
    boxSizing: "border-box" as const,
    padding: 11,
    marginTop: 6,
    border: "1px solid #cbd5e1",
    borderRadius: 8,
  },
  help: { display: "block", marginTop: 6, color: "#64748b", lineHeight: 1.45 },
  legalBox: {
    padding: 18,
    background: "#f8fafc",
    border: "1px solid #e2e8f0",
    borderRadius: 12,
  },
  optionalBox: {
    padding: 18,
    background: "#f0fdf4",
    border: "1px solid #dcfce7",
    borderRadius: 12,
  },
  sectionTitle: { marginTop: 0, fontSize: 18 },
  checkboxRow: {
    display: "flex",
    gap: 10,
    alignItems: "flex-start",
    margin: "12px 0",
    lineHeight: 1.45,
  },
  checkbox: { marginTop: 3 },
  button: {
    padding: 12,
    background: "#15803d",
    color: "white",
    fontWeight: 800,
    border: 0,
    borderRadius: 8,
    cursor: "pointer",
  },
  notice: { padding: 12, background: "#f8fafc", borderRadius: 8 },
  footerText: { color: "#64748b", marginTop: 22 },
};
