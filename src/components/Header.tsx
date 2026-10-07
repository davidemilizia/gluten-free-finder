"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-browser";
import SuggestPlaceLink from "@/components/SuggestPlaceLink";

export default function Header() {
  const [user, setUser] = useState<User | null>(null);
  const [admin, setAdmin] = useState(false);

  useEffect(() => {
    let active = true;

    async function sync() {
      const { data } = await supabase.auth.getSession();
      if (!active) return;

      const currentUser = data.session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const { data: isAdmin, error } = await supabase.rpc("is_admin");
        if (!active) return;
        setAdmin(!error && isAdmin === true);
      } else {
        setAdmin(false);
      }
    }

    void sync();

    const { data: listener } = supabase.auth.onAuthStateChange(() => {
      void sync();
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <header style={head}>
      <div style={inner}>
        <Link href="/" style={brand}>
          🍃 Gluten Free Finder
        </Link>

        <nav style={nav} aria-label="Navigazione principale">
          <Link href="/">Home</Link>
          <Link href="/places">Locali</Link>

          {admin && (
            <>
              <Link href="/admin/places">Admin locali</Link>
              <Link href="/admin/reviews">Recensioni</Link>
              <Link href="/admin/users" style={adminButton}>
                Utenti
              </Link>
              <Link href="/admin/notifications">Notifiche</Link>
            </>
          )}

          {user ? (
            <Link href="/account">Il mio account</Link>
          ) : (
            <>
              <Link href="/login">Accedi</Link>
              <Link href="/register" style={button}>
                Registrati
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

const head = {
  borderBottom: "1px solid #ddd",
  background: "white",
  position: "sticky" as const,
  top: 0,
  zIndex: 100,
};

const inner = {
  maxWidth: "1200px",
  minHeight: "68px",
  margin: "0 auto",
  padding: "0 20px",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: "20px",
  flexWrap: "wrap" as const,
};

const brand = {
  color: "#15803d",
  fontWeight: 800,
  textDecoration: "none",
  whiteSpace: "nowrap" as const,
};

const nav = {
  display: "flex",
  gap: "14px",
  alignItems: "center",
  flexWrap: "wrap" as const,
};

const button = {
  padding: "9px 14px",
  background: "#15803d",
  color: "white",
  borderRadius: "7px",
  textDecoration: "none",
};

const adminButton = {
  padding: "8px 12px",
  background: "#ecfdf5",
  color: "#166534",
  border: "1px solid #86efac",
  borderRadius: "7px",
  textDecoration: "none",
  fontWeight: 700,
};
