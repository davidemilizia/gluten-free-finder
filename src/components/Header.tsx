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
        const { data: isAdmin } = await supabase.rpc("is_admin");

        if (!active) return;
        setAdmin(isAdmin === true);
      } else {
        setAdmin(false);
      }
    }

    void sync();

    const { data: authListener } = supabase.auth.onAuthStateChange(() => {
      void sync();
    });

    return () => {
      active = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  return (
    <header style={headerStyle}>
      <div style={innerStyle}>
        <Link href="/" style={brandStyle}>
          🍃 Gluten Free Finder
        </Link>

        <nav style={navStyle}>
          <Link href="/">Home</Link>
          <Link href="/places">Locali</Link>

          {user && <SuggestPlaceLink />}

          {admin && (
            <>
              <Link href="/admin/places">Admin locali</Link>
              <Link href="/admin/reviews">Recensioni</Link>
              <Link href="/admin/users">Utenti</Link>
              <Link href="/admin/place-suggestions">Suggerimenti</Link>
              <Link href="/admin/notifications">Notifiche</Link>
            </>
          )}

          {user ? (
            <Link href="/account">Il mio account</Link>
          ) : (
            <>
              <Link href="/login">Accedi</Link>
              <Link href="/register" style={registerButtonStyle}>
                Registrati
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

const headerStyle = {
  borderBottom: "1px solid #ddd",
  background: "white",
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
  gap: "20px",
  flexWrap: "wrap" as const,
};

const brandStyle = {
  color: "#15803d",
  fontWeight: 800,
  textDecoration: "none",
};

const navStyle = {
  display: "flex",
  gap: "16px",
  alignItems: "center",
  flexWrap: "wrap" as const,
};

const registerButtonStyle = {
  padding: "9px 14px",
  background: "#15803d",
  color: "white",
  borderRadius: "7px",
  textDecoration: "none",
};
