"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-browser";

export default function AccountPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSession() {
      try {
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

        setUser(data.session.user);
        setLoading(false);
      } catch {
        if (!active) return;
        setErrorMessage("Impossibile verificare la sessione. Ricarica la pagina.");
        setLoading(false);
      }
    }

    loadSession();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!active) return;

        if (session?.user) {
          setUser(session.user);
          setLoading(false);
        } else {
          setUser(null);
          router.replace("/login");
        }
      }
    );

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  async function signOut() {
    setErrorMessage("");
    const { error } = await supabase.auth.signOut();

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  if (loading) {
    return (
      <main style={pageStyle}>
        <p>Caricamento account...</p>
      </main>
    );
  }

  if (errorMessage) {
    return (
      <main style={pageStyle}>
        <h1>Il mio account</h1>
        <div style={errorStyle}>{errorMessage}</div>
        <p><Link href="/login">Torna all'accesso</Link></p>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <Link href="/">← Torna alla homepage</Link>
      <h1>Il mio account</h1>

      <section style={cardStyle}>
        <p>
          <strong>Nome:</strong>{" "}
          {user?.user_metadata?.display_name || "Non indicato"}
        </p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p>
          <strong>Email confermata:</strong>{" "}
          {user?.email_confirmed_at ? "Sì" : "No"}
        </p>
      </section>

      <p>
        Le funzioni per recensioni, fotografie e preferiti saranno collegate in
        questa area.
      </p>

      <button type="button" onClick={signOut} style={buttonStyle}>
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

const cardStyle = {
  padding: "20px",
  margin: "24px 0",
  border: "1px solid #d6d6d6",
  borderRadius: "10px",
  background: "#fafafa",
};

const errorStyle = {
  padding: "14px",
  margin: "20px 0",
  border: "1px solid #e4a2a2",
  borderRadius: "8px",
  background: "#fff1f1",
  color: "#7f1d1d",
};

const buttonStyle = {
  minHeight: "44px",
  padding: "0 20px",
  border: 0,
  borderRadius: "6px",
  background: "#b91c1c",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};
