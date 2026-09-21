import Link from "next/link";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export default async function SupabaseTestPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    return (
      <main style={pageStyle}>
        <h1>Test connessione Supabase</h1>
        <div style={errorStyle}>
          <h2>Configurazione incompleta</h2>
          <p>Una o entrambe le variabili Supabase non sono disponibili.</p>
          <p>Controlla le Environment Variables su Vercel e avvia un nuovo deployment.</p>
        </div>
        <Link href="/">← Torna alla homepage</Link>
      </main>
    );
  }

  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });

  const { count, error } = await supabase
    .from("reviews")
    .select("id", { count: "exact", head: true });

  return (
    <main style={pageStyle}>
      <h1>Test connessione Supabase</h1>

      {error ? (
        <div style={errorStyle}>
          <h2>Connessione non riuscita</h2>
          <p><strong>Messaggio:</strong> {error.message}</p>
          <p><strong>Codice:</strong> {error.code || "non disponibile"}</p>
          <p>Controlla le variabili Vercel, la tabella reviews e le policy RLS.</p>
        </div>
      ) : (
        <div style={successStyle}>
          <h2>Connessione Supabase riuscita</h2>
          <p>L'applicazione riesce a comunicare con il database.</p>
          <p><strong>Tabella verificata:</strong> reviews</p>
          <p><strong>Recensioni pubbliche approvate:</strong> {count ?? 0}</p>
        </div>
      )}

      <section style={infoStyle}>
        <h2>Controlli completati</h2>
        <ul>
          <li>Variabile NEXT_PUBLIC_SUPABASE_URL disponibile</li>
          <li>Variabile NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY disponibile</li>
          <li>Client Supabase inizializzato</li>
          <li>Query alla tabella reviews eseguita</li>
        </ul>
      </section>

      <Link href="/">← Torna alla homepage</Link>
    </main>
  );
}

const pageStyle = {
  maxWidth: "860px",
  margin: "0 auto",
  padding: "40px 20px",
  fontFamily: "Arial, sans-serif",
  lineHeight: 1.6,
};

const successStyle = {
  padding: "22px",
  margin: "24px 0",
  border: "1px solid #86c99a",
  borderRadius: "10px",
  background: "#effaf2",
  color: "#14532d",
};

const errorStyle = {
  padding: "22px",
  margin: "24px 0",
  border: "1px solid #e4a2a2",
  borderRadius: "10px",
  background: "#fff1f1",
  color: "#7f1d1d",
};

const infoStyle = {
  padding: "20px",
  margin: "24px 0",
  border: "1px solid #d6d6d6",
  borderRadius: "10px",
  background: "#fafafa",
};
