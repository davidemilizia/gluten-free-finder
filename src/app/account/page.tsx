"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-browser";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [nickname, setNickname] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAccount() {
      const { data, error } = await supabase.auth.getSession();
      if (!active) return;

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      if (!data.session?.user) {
        router.replace("/login");
        return;
      }

      const currentUser = data.session.user;
      setUser(currentUser);

      const { data: profile } = await supabase
        .from("profiles")
        .select("display_name")
        .eq("id", currentUser.id)
        .maybeSingle();

      setNickname(
        profile?.display_name ||
          currentUser.user_metadata?.display_name ||
          ""
      );
      setLoading(false);
    }

    loadAccount();
    return () => {
      active = false;
    };
  }, [router]);

  async function saveNickname(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");

    const cleanNickname = nickname.trim();
    if (!user || cleanNickname.length < 2) {
      setErrorMessage("Il nickname deve contenere almeno 2 caratteri.");
      return;
    }

    setSaving(true);

    const { error: profileError } = await supabase
      .from("profiles")
      .update({ display_name: cleanNickname })
      .eq("id", user.id);

    if (profileError) {
      setSaving(false);
      setErrorMessage(`Errore profilo: ${profileError.message}`);
      return;
    }

    const { error: userError } = await supabase.auth.updateUser({
      data: { display_name: cleanNickname },
    });

    setSaving(false);

    if (userError) {
      setErrorMessage(`Errore account: ${userError.message}`);
      return;
    }

    setSuccessMessage("Nickname salvato correttamente.");
  }

  async function signOut() {
    await supabase.auth.signOut();
    window.location.href = "/login";
  }

  if (loading) {
    return <main style={pageStyle}>Caricamento account...</main>;
  }

  return (
    <main style={pageStyle}>
      <a href="/" style={homeStyle}>← Torna alla homepage</a>
      <h1>Il mio account</h1>

      <p><strong>Email privata:</strong> {user?.email}</p>

      <form onSubmit={saveNickname} style={formStyle}>
        <label htmlFor="nickname"><strong>Nickname pubblico</strong></label>
        <input
          id="nickname"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          required
          minLength={2}
          maxLength={60}
          style={inputStyle}
        />
        <small>
          Sarà visibile accanto alle recensioni. L&apos;email non viene pubblicata.
        </small>

        <button type="submit" disabled={saving} style={saveStyle}>
          {saving ? "Salvataggio..." : "Salva nickname"}
        </button>
      </form>

      {successMessage && <p style={successStyle}>{successMessage}</p>}
      {errorMessage && <p style={errorStyle}>{errorMessage}</p>}

      <button type="button" onClick={signOut} style={logoutStyle}>
        Disconnetti
      </button>
    </main>
  );
}

const pageStyle = {
  maxWidth: "720px",
  margin: "0 auto",
  padding: "40px 20px",
  fontFamily: "Arial, sans-serif",
  lineHeight: 1.6,
};
const homeStyle = { color: "#15803d", fontWeight: 700 };
const formStyle = { display: "grid", gap: "10px", marginTop: "24px" };
const inputStyle = {
  width: "100%",
  boxSizing: "border-box" as const,
  padding: "10px",
  border: "1px solid #aaa",
  borderRadius: "6px",
};
const saveStyle = {
  minHeight: "42px",
  border: 0,
  borderRadius: "6px",
  background: "#15803d",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};
const logoutStyle = {
  marginTop: "24px",
  minHeight: "42px",
  padding: "0 18px",
  border: 0,
  borderRadius: "6px",
  background: "#b91c1c",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};
const successStyle = { color: "#166534", fontWeight: 700 };
const errorStyle = { color: "#b91c1c", fontWeight: 700 };
