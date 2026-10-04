"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

type DashboardCounts = {
  pendingReviews: number;
  pendingVerifications: number;
};

const initialCounts: DashboardCounts = {
  pendingReviews: 0,
  pendingVerifications: 0,
};

export default function AdminActivityDashboard() {
  const [counts, setCounts] = useState<DashboardCounts>(initialCounts);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadCounts = useCallback(async () => {
    setLoading(true);
    setError("");

    const { data: isAdmin, error: adminError } = await supabase.rpc("is_admin");
    if (adminError || isAdmin !== true) {
      setError(adminError?.message || "Accesso riservato agli amministratori.");
      setLoading(false);
      return;
    }

    const [reviewsResult, verificationsResult] = await Promise.all([
      supabase
        .from("reviews")
        .select("id", { count: "exact", head: true })
        .eq("approved", false),
      supabase
        .from("review_verifications")
        .select("id", { count: "exact", head: true })
        .eq("status", "pending"),
    ]);

    const messages: string[] = [];
    if (reviewsResult.error) messages.push(`Recensioni: ${reviewsResult.error.message}`);
    if (verificationsResult.error) messages.push(`Verifiche: ${verificationsResult.error.message}`);

    setCounts({
      pendingReviews: reviewsResult.count ?? 0,
      pendingVerifications: verificationsResult.count ?? 0,
    });
    setError(messages.join(" | "));
    setLoading(false);
  }, []);

  useEffect(() => {
    void loadCounts();
  }, [loadCounts]);

  return (
    <section style={styles.wrapper} aria-labelledby="admin-activity-title">
      <div style={styles.headingRow}>
        <div>
          <h2 id="admin-activity-title" style={styles.title}>Attività amministrative</h2>
          <p style={styles.subtitle}>Controlla recensioni e prove di visita dal pannello principale.</p>
        </div>
        <button type="button" onClick={() => void loadCounts()} disabled={loading} style={styles.refreshButton}>
          {loading ? "Aggiornamento..." : "Aggiorna"}
        </button>
      </div>

      {error && <div role="alert" style={styles.error}>{error}</div>}

      <div style={styles.grid}>
        <article style={styles.card}>
          <div style={styles.cardTop}>
            <div>
              <div style={styles.eyebrow}>MODERAZIONE</div>
              <h3 style={styles.cardTitle}>Recensioni da approvare</h3>
            </div>
            <span style={counts.pendingReviews > 0 ? styles.counterActive : styles.counterIdle}>
              {loading ? "…" : counts.pendingReviews}
            </span>
          </div>
          <p style={styles.cardText}>Approva, pubblica oppure elimina le nuove recensioni.</p>
          <Link href="/admin/reviews" style={styles.primaryLink}>Gestisci recensioni</Link>
        </article>

        <article style={styles.card}>
          <div style={styles.cardTop}>
            <div>
              <div style={styles.eyebrow}>PROVE DI VISITA</div>
              <h3 style={styles.cardTitle}>Verifiche in attesa</h3>
            </div>
            <span style={counts.pendingVerifications > 0 ? styles.counterWarning : styles.counterIdle}>
              {loading ? "…" : counts.pendingVerifications}
            </span>
          </div>
          <p style={styles.cardText}>Apri le prove private e verifica o rifiuta la visita.</p>
          <Link href="/admin/review-verifications" style={styles.secondaryLink}>Gestisci verifiche</Link>
        </article>
      </div>
    </section>
  );
}

const styles = {
  wrapper: { margin: "0 0 22px", padding: 18, border: "1px solid #d9e2e8", borderRadius: 12, background: "#f8fbf9" },
  headingRow: { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 14, flexWrap: "wrap" as const },
  title: { margin: 0, fontSize: 21 },
  subtitle: { margin: "5px 0 0", color: "#52606d", fontSize: 14 },
  refreshButton: { padding: "8px 13px", border: "1px solid #8795a1", borderRadius: 7, background: "white", cursor: "pointer" },
  error: { marginTop: 14, padding: 10, border: "1px solid #fecaca", borderRadius: 7, background: "#fef2f2", color: "#991b1b", fontSize: 14 },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: 14, marginTop: 16 },
  card: { padding: 17, border: "1px solid #d8e1e7", borderRadius: 10, background: "white", boxShadow: "0 2px 8px rgba(15, 23, 42, .04)" },
  cardTop: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12 },
  eyebrow: { color: "#64748b", fontSize: 11, fontWeight: 800, letterSpacing: ".06em" },
  cardTitle: { margin: "5px 0 0", fontSize: 18 },
  cardText: { color: "#52606d", lineHeight: 1.45, minHeight: 42 },
  counterActive: { minWidth: 34, height: 34, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 999, background: "#dcfce7", color: "#166534", fontWeight: 800 },
  counterWarning: { minWidth: 34, height: 34, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 999, background: "#fef3c7", color: "#92400e", fontWeight: 800 },
  counterIdle: { minWidth: 34, height: 34, display: "inline-flex", alignItems: "center", justifyContent: "center", borderRadius: 999, background: "#eef2f6", color: "#475569", fontWeight: 800 },
  primaryLink: { display: "inline-block", padding: "9px 13px", borderRadius: 7, background: "#15803d", color: "white", fontWeight: 700, textDecoration: "none" },
  secondaryLink: { display: "inline-block", padding: "9px 13px", borderRadius: 7, border: "1px solid #15803d", color: "#166534", fontWeight: 700, textDecoration: "none" },
} as const;
