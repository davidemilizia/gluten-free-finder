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

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login");
        return;
      }
      setUser(data.user);
      setLoading(false);
    });
  }, [router]);

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  if (loading) {
    return <main style={pageStyle}><p>Caricamento account...</p></main>;
  }

  return (
    <main style={pageStyle}>
      <Link href="/">← Torna alla homepage</Link>
      <h1>Il mio account</h1>

      <section style={cardStyle}>
        <p><strong>Nome:</strong> {user?.user_metadata?.display_name || "Non indicato"}</p>
        <p><strong>Email:</strong> {user?.email}</p>
        <p><strong>Email confermata:</strong> {user?.email_confirmed_at ? "Sì" : "No"}</p>
      </section>

      <p>Le funzioni per recensioni, fotografie e preferiti saranno collegate in questa area.</p>

      <button type="button" onClick={signOut} style={buttonStyle}>
        Disconnetti
      </button>
    </main>
  );
}

const pageStyle = { maxWidth: "720px", margin: "0 auto", padding: "40px 20px", fontFamily: "Arial, sans-serif", lineHeight: 1.6 };
const cardStyle = { padding: "20px", margin: "24px 0", border: "1px solid #d6d6d6", borderRadius: "10px", background: "#fafafa" };
const buttonStyle = { minHeight: "44px", padding: "0 20px", border: 0, borderRadius: "6px", background: "#b91c1c", color: "white", fontWeight: 700, cursor: "pointer" };
