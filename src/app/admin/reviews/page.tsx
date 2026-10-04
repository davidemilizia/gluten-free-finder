"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

type Review = {
  id: number;
  title: string | null;
  comment: string | null;
  rating: number | null;
  approved: boolean;
  created_at: string;
  user_id?: string | null;
};

type Verification = {
  review_id: number;
  status: "pending" | "verified" | "rejected";
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  const verificationByReview = useMemo(() => {
    return new Map(verifications.map((item) => [item.review_id, item.status]));
  }, [verifications]);

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const { data: adminResult, error: adminError } = await supabase.rpc("is_admin");
    if (adminError || adminResult !== true) {
      setAuthorized(false);
      setLoading(false);
      setMessage(adminError?.message || "Accesso riservato agli amministratori.");
      return;
    }

    setAuthorized(true);

    const [reviewsResult, verificationsResult] = await Promise.all([
      supabase
        .from("reviews")
        .select("id,title,comment,rating,approved,created_at,user_id")
        .eq("approved", false)
        .order("created_at", { ascending: false }),
      supabase
        .from("review_verifications")
        .select("review_id,status"),
    ]);

    if (reviewsResult.error) {
      setMessage(reviewsResult.error.message);
      setReviews([]);
    } else {
      setReviews((reviewsResult.data || []) as Review[]);
    }

    if (verificationsResult.error) {
      setMessage((current) =>
        current
          ? `${current} | Verifiche visita: ${verificationsResult.error.message}`
          : `Verifiche visita: ${verificationsResult.error.message}`
      );
      setVerifications([]);
    } else {
      setVerifications((verificationsResult.data || []) as Verification[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function approve(review: Review) {
    setBusyId(review.id);
    setMessage("");

    const { error } = await supabase
      .from("reviews")
      .update({ approved: true })
      .eq("id", review.id);

    if (error) {
      setMessage(`Impossibile approvare la recensione #${review.id}: ${error.message}`);
    } else {
      setReviews((current) => current.filter((item) => item.id !== review.id));
      setMessage(`Recensione #${review.id} approvata e pubblicata.`);
    }

    setBusyId(null);
  }

  async function remove(review: Review) {
    const confirmed = window.confirm(
      `Eliminare definitivamente la recensione #${review.id} “${review.title || "Senza titolo"}”?`
    );
    if (!confirmed) return;

    setBusyId(review.id);
    setMessage("");

    const { error } = await supabase.from("reviews").delete().eq("id", review.id);

    if (error) {
      setMessage(`Impossibile eliminare la recensione #${review.id}: ${error.message}`);
    } else {
      setReviews((current) => current.filter((item) => item.id !== review.id));
      setMessage(`Recensione #${review.id} eliminata.`);
    }

    setBusyId(null);
  }

  function verificationBadge(reviewId: number) {
    const status = verificationByReview.get(reviewId);
    if (status === "verified") return { label: "Visita verificata", color: "#166534", bg: "#dcfce7" };
    if (status === "pending") return { label: "Prova in attesa", color: "#854d0e", bg: "#fef9c3" };
    if (status === "rejected") return { label: "Prova rifiutata", color: "#991b1b", bg: "#fee2e2" };
    return { label: "Nessuna prova", color: "#475569", bg: "#f1f5f9" };
  }

  return (
    <main style={{ maxWidth: 1000, margin: "0 auto", padding: "30px 18px 60px" }}>
      <nav style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
        <Link href="/admin/places← Pannello Admin</Link>
        <Link href="/admin/review-verifications">Verifiche visita</Link>
      </nav>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" }}>
        <div>
          <h1 style={{ marginBottom: 6 }}>Moderazione recensioni</h1>
          <p style={{ marginTop: 0, color: "#475569" }}>
            Approva o elimina le recensioni non ancora pubblicate.
          </p>
        </div>
        <button onClick={() => void load()} disabled={loading || busyId !== null} style={buttonSecondary}>
          Aggiorna
        </button>
      </div>

      {message && (
        <div role="status" style={{ margin: "18px 0", padding: 12, border: "1px solid #cbd5e1", borderRadius: 8, background: "#f8fafc" }}>
          {message}
        </div>
      )}

      {loading && <p>Caricamento recensioni...</p>}

      {!loading && authorized === false && (
        <p>Accesso negato. Accedi con un profilo amministratore.</p>
      )}

      {!loading && authorized && reviews.length === 0 && (
        <div style={{ marginTop: 24, padding: 24, border: "1px solid #d1fae5", borderRadius: 10, background: "#ecfdf5" }}>
          Nessuna recensione in attesa di approvazione.
        </div>
      )}

      <section style={{ display: "grid", gap: 16, marginTop: 22 }}>
        {reviews.map((review) => {
          const badge = verificationBadge(review.id);
          const date = new Date(review.created_at);
          return (
            <article key={review.id} style={{ border: "1px solid #dbe3ea", borderRadius: 12, padding: 18, background: "#fff", boxShadow: "0 2px 10px rgba(15,23,42,.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, flexWrap: "wrap" }}>
                <div>
                  <div style={{ color: "#64748b", fontSize: 13 }}>Recensione #{review.id}</div>
                  <h2 style={{ margin: "5px 0 8px", fontSize: 21 }}>{review.title || "Senza titolo"}</h2>
                </div>
                <span style={{ alignSelf: "flex-start", padding: "6px 10px", borderRadius: 999, color: badge.color, background: badge.bg, fontWeight: 700, fontSize: 13 }}>
                  {badge.label}
                </span>
              </div>

              <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.55 }}>{review.comment || "Nessun commento."}</p>
              <div style={{ display: "flex", gap: 18, flexWrap: "wrap", color: "#475569", fontSize: 14 }}>
                <span>Valutazione: {review.rating ?? "-"}/5</span>
                <span>Data: {Number.isNaN(date.getTime()) ? review.created_at : date.toLocaleString("it-IT")}</span>
              </div>

              <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginTop: 18 }}>
                <button onClick={() => void approve(review)} disabled={busyId !== null} style={buttonApprove}>
                  {busyId === review.id ? "Operazione..." : "Approva e pubblica"}
                </button>
                <button onClick={() => void remove(review)} disabled={busyId !== null} style={buttonDelete}>
                  Elimina
                </button>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}

const buttonSecondary = {
  padding: "9px 14px",
  border: "1px solid #94a3b8",
  borderRadius: 7,
  background: "#fff",
  cursor: "pointer",
} as const;

const buttonApprove = {
  padding: "10px 15px",
  border: 0,
  borderRadius: 7,
  background: "#15803d",
  color: "#fff",
  fontWeight: 700,
  cursor: "pointer",
} as const;

const buttonDelete = {
  padding: "10px 15px",
  border: "1px solid #dc2626",
  borderRadius: 7,
  background: "#fff",
  color: "#b91c1c",
  fontWeight: 700,
  cursor: "pointer",
} as const;
