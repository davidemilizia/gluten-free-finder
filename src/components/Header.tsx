"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-browser";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (!active) return;
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <header style={headerStyle}>
      <div style={innerStyle}>
        <Link href="/" style={brandStyle}>
          🍃 Gluten Free Finder
        </Link>

        <nav aria-label="Navigazione principale" style={navStyle}>
          <Link href="/" style={linkStyle}>Home</Link>
          <Link href="/places" style={linkStyle}>Locali</Link>

          {!loading && !user && (
            <div style={authLinksStyle}>
              <Link href="/login" style={loginStyle}>Accedi</Link>
              <Link href="/register" style={registerStyle}>Registrati</Link>
            </div>
          )}

          {!loading && user && (
            <Link href="/account" style={accountStyle}>
              Il mio account
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

const headerStyle = {
  borderBottom: "1px solid #d9e5dc",
  background: "#ffffff",
  position: "sticky" as const,
  top: 0,
  zIndex: 100,
};

const innerStyle = {
  maxWidth: "1100px",
  minHeight: "68px",
  margin: "0 auto",
  padding: "0 20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "24px",
  flexWrap: "wrap" as const,
};

const brandStyle = {
  color: "#15803d",
  fontWeight: 800,
  fontSize: "1.15rem",
  textDecoration: "none",
};

const navStyle = {
  display: "flex",
  alignItems: "center",
  justifyContent: "flex-end",
  gap: "16px",
  flexWrap: "wrap" as const,
};

const authLinksStyle = {
  display: "flex",
  alignItems: "center",
  gap: "10px",
};

const linkStyle = {
  color: "#1f2937",
  textDecoration: "none",
  fontWeight: 600,
};

const loginStyle = {
  color: "#15803d",
  textDecoration: "none",
  fontWeight: 700,
};

const registerStyle = {
  padding: "9px 15px",
  borderRadius: "7px",
  background: "#15803d",
  color: "#ffffff",
  textDecoration: "none",
  fontWeight: 700,
};

const accountStyle = {
  padding: "9px 15px",
  borderRadius: "7px",
  background: "#effaf2",
  color: "#15803d",
  textDecoration: "none",
  fontWeight: 700,
  border: "1px solid #9bd3aa",
};
