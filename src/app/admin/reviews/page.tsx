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
  user_id: string | null;
};

type Verification = {
  id: number;
  review_id: number;
  proof_path: string;
  status: "pending" | "verified" | "rejected";
  reviewed_at?: string | null;
};

type ReviewMedia = {
  id: number;
  review_id: number;
  storage_path: string;
};

type Author = {
  id: string;
  display_name: string | null;
};

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [media, setMedia] = useState<ReviewMedia[]>([]);
  const [authors, setAuthors] = useState<Author[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [message, setMessage] = useState("");
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  const verificationByReview = useMemo(
    () => new Map(verifications.map((item) => [item.review_id, item])),
    [verifications]
  );

  const mediaByReview = useMemo(() => {
    const map = new Map<number, ReviewMedia[]>();
    for (const item of media) {
      const current = map.get(item.review_id) ?? [];
      current.push(item);
      map.set(item.review_id, current);
    }
    return map;
  }, [media]);

  const authorById = useMemo(
    () => new Map(authors.map((item) => [item.id, item.display_name || "Utente registrato"])),
    [authors]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setMessage("");

    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) {
      setAuthorized(false);
      setLoading(false);
      return;
    }

    const { data: adminResult, error: adminError } = await supabase.rpc("is_admin");
    if (adminError || adminResult !== true) {
      setAuthorized(false);
      setLoading(false);
      setMessage(adminError?.message || "Accesso riservato agli amministratori.");
      return;
    }

    setAuthorized(true);

    const reviewsResult = await supabase
      .from("reviews")
      .select("id,title,comment,rating,approved,created_at,user_id")
      .eq("approved", false)
      .order("created_at", { ascending: false });

    if (reviewsResult.error) {
      setMessage(reviewsResult.error.message);
      setReviews([]);
      setLoading(false);
      return;
    }

    const reviewRows = (reviewsResult.data ?? []) as Review[];
    setReviews(reviewRows);

    const reviewIds = reviewRows.map((item) => item.id);
    const userIds = [...new Set(reviewRows.map((item) => item.user_id).filter(Boolean))] as string[];

    if (!reviewIds.length) {
      setVerifications([]);
      setMedia([]);
      setAuthors([]);
      setLoading(false);
      return;
    }

    const [verificationsResult, mediaResult, authorsResult] = await Promise.all([
      supabase
        .from("review_verifications")
        .select("id,review_id,proof_path,status,reviewed_at")
        .in("review_id", reviewIds),
      supabase
        .from("review_media")
        .select("id,review_id,storage_path")
        .in("review_id", reviewIds)
        .order("id", { ascending: true }),
      userIds.length
        ? supabase.from("profiles").select("id,display_name").in("id", userIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (verificationsResult.error) {
      setMessage((current) =>
        current
          ? `${current} | Prove private: ${verificationsResult.error.message}`
          : `Prove private: ${verificationsResult.error.message}`
      );
      setVerifications([]);
    } else {
      setVerifications((verificationsResult.data ?? []) as Verification[]);
    }

    if (mediaResult.error) {
      setMessage((current) =>
        current
          ? `${current} | Foto: ${mediaResult.error.message}`
          : `Foto: ${mediaResult.error.message}`
      );
      setMedia([]);
    } else {
      setMedia((mediaResult.data ?? []) as ReviewMedia[]);
    }

    if (authorsResult.error) {
      setMessage((current) =>
        current
          ? `${current} | Autori: ${authorsResult.error.message}`
          : `Autori: ${authorsResult.error.message}`
      );
      setAuthors([]);
    } else {
      setAuthors((authorsResult.data ?? []) as Author[]);
    }

    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function openPublicPhoto(item: ReviewMedia) {
    setMessage("");
    const { data } = supabase.storage.from("review-media").getPublicUrl(item.storage_path);
    if (!data.publicUrl) {
      setMessage("Impossibile aprire la fotografia.");
      return;
    }
    window.open(data.publicUrl, "_blank", "noopener,noreferrer");
  }

  async function openProof(verification: Verification) {
    setMessage("");
    const { data, error } = await supabase.storage
      .from("review-proofs")
      .createSignedUrl(verification.proof_path, 300);

    if (error) {
      setMessage(`Impossibile aprire la prova privata: ${error.message}`);
      return;
    }

    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function setVerification(
    review: Review,
    verification: Verification,
    status: "verified" | "rejected"
  ) {
    setBusyId(review.id);
    setMessage("");

    const { data } = await supabase.auth.getSession();
    const { error } = await supabase
      .from("review_verifications")
      .update({
        status,
        reviewed_at: new Date().toISOString(),
        reviewed_by: data.session?.user.id ?? null,
      })
      .eq("id", verification.id);

    setBusyId(null);
    setMessage(
      error
        ? `Impossibile aggiornare la prova: ${error.message}`
        : status === "verified"
          ? "Prova verificata. La visita è certificata."
          : "Prova rifiutata."
    );

    if (!error) await load();
  }

  async function approve(review: Review) {
    setBusyId(review.id);
    setMessage("");

    const { error } = await supabase
      .from("reviews")
      .update({ approved: true })
      .eq("id", review.id);

    setBusyId(null);
    setMessage(
      error
        ? `Impossibile approvare la recensione #${review.id}: ${error.message}`
        : `Recensione #${review.id} approvata e pubblicata.`
    );

    if (!error) await load();
  }

  async function verifyAndPublish(review: Review, verification: Verification) {
    setBusyId(review.id);
    setMessage("");

    const { data } = await supabase.auth.getSession();
    const verificationResult = await supabase
      .from("review_verifications")
      .update({
        status: "verified",
        reviewed_at: new Date().toISOString(),
        reviewed_by: data.session?.user.id ?? null,
      })
      .eq("id", verification.id);

    if (verificationResult.error) {
      setBusyId(null);
      setMessage(`Impossibile verificare la prova: ${verificationResult.error.message}`);
      return;
    }

    const reviewResult = await supabase
      .from("reviews")
      .update({ approved: true })
      .eq("id", review.id);

    setBusyId(null);
    setMessage(
      reviewResult.error
        ? `Prova verificata, ma pubblicazione non riuscita: ${reviewResult.error.message}`
        : `Recensione #${review.id}: visita verificata e contenuto pubblicato.`
    );

    await load();
  }

  async function remove(review: Review) {
    const confirmed = window.confirm(
      `Eliminare definitivamente la recensione #${review.id} “${review.title || "Senza titolo"}”?`
    );
    if (!confirmed) return;

    setBusyId(review.id);
    setMessage("");

    const { error } = await supabase.from("reviews").delete().eq("id", review.id);

    setBusyId(null);
    setMessage(
      error
        ? `Impossibile eliminare la recensione #${review.id}: ${error.message}`
        : `Recensione #${review.id} eliminata.`
    );

    if (!error) await load();
  }

  function verificationBadge(verification?: Verification) {
    if (verification?.status === "verified") {
      return { label: "Visita verificata", color: "#166534", bg: "#dcfce7" };
    }
    if (verification?.status === "pending") {
      return { label: "Prova in attesa", color: "#854d0e", bg: "#fef9c3" };
    }
    if (verification?.status === "rejected") {
      return { label: "Prova rifiutata", color: "#991b1b", bg: "#fee2e2" };
    }
    return { label: "Nessuna prova", color: "#475569", bg: "#f1f5f9" };
  }

  if (!loading && authorized === false) {
    return (
      <main style={pageStyle}>
        <h1>Accesso negato</h1>
        <p>Questa pagina è riservata agli amministratori.</p>
      </main>
    );
  }

  return (
    <main style={pageStyle}>
      <nav style={{ display: "flex", gap: 14, flexWrap: "wrap", marginBottom: 18 }}>
        <Link href="/admin/places">← Pannello Admin</Link>
        <Link href="/admin/review-verifications">Verifiche visita</Link>
      </nav>

      <div style={headingRow}>
        <div>
          <h1 style={{ marginBottom: 6 }}>Moderazione recensioni</h1>
          <p style={{ marginTop: 0, color: "#475569" }}>
            Controlla autore, fotografie pubbliche e prova privata prima della pubblicazione.
          </p>
        </div>
        <button onClick={() => void load()} disabled={loading || busyId !== null} style={buttonSecondary}>
          Aggiorna
        </button>
      </div>

      {message && <div role="status" style={messageStyle}>{message}</div>}
      {loading && <p>Caricamento recensioni...</p>}

      {!loading && authorized && reviews.length === 0 && (
        <div style={emptyStyle}>Nessuna recensione in attesa di approvazione.</div>
      )}

      <section style={{ display: "grid", gap: 16, marginTop: 22 }}>
        {reviews.map((review) => {
          const verification = verificationByReview.get(review.id);
          const photos = mediaByReview.get(review.id) ?? [];
          const badge = verificationBadge(verification);
          const date = new Date(review.created_at);
          const author = review.user_id
            ? authorById.get(review.user_id) || "Utente registrato"
            : "Autore non disponibile";

          return (
            <article key={review.id} style={cardStyle}>
              <div style={headingRow}>
                <div>
                  <div style={{ color: "#64748b", fontSize: 13 }}>Recensione #{review.id}</div>
                  <h2 style={{ margin: "5px 0 8px", fontSize: 21 }}>
                    {review.title || "Senza titolo"}
                  </h2>
                  <p style={{ margin: "4px 0", color: "#334155" }}>
                    Autore: <strong>{author}</strong>
                  </p>
                </div>
                <span style={{ ...badgeStyle, color: badge.color, background: badge.bg }}>
                  {badge.label}
                </span>
              </div>

              <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.55 }}>
                {review.comment || "Nessun commento."}
              </p>

              <div style={metadataStyle}>
                <span>Valutazione: {review.rating ?? "-"}/5</span>
                <span>
                  Data: {Number.isNaN(date.getTime()) ? review.created_at : date.toLocaleString("it-IT")}
                </span>
              </div>

              <section style={subsectionStyle}>
                <h3 style={{ marginTop: 0 }}>Fotografie pubbliche ({photos.length})</h3>
                {photos.length === 0 ? (
                  <p style={{ color: "#64748b" }}>Nessuna fotografia pubblica caricata.</p>
                ) : (
                  <div style={photoGridStyle}>
                    {photos.map((photo, index) => (
                      <button
                        key={photo.id}
                        type="button"
                        onClick={() => void openPublicPhoto(photo)}
                        style={photoButtonStyle}
                      >
                        Apri foto {index + 1}
                      </button>
                    ))}
                  </div>
                )}
              </section>

              <section style={subsectionStyle}>
                <h3 style={{ marginTop: 0 }}>Prova privata della visita</h3>
                {!verification ? (
                  <p style={{ color: "#64748b" }}>Nessuna prova privata collegata alla recensione.</p>
                ) : (
                  <>
                    <p>
                      Stato: <strong>{verification.status}</strong>
                    </p>
                    <div style={actionsStyle}>
                      <button
                        disabled={busyId !== null}
                        onClick={() => void openProof(verification)}
                        style={buttonSecondary}
                      >
                        Apri scontrino/prova
                      </button>
                      <button
                        disabled={busyId !== null}
                        onClick={() => void setVerification(review, verification, "verified")}
                        style={buttonVerify}
                      >
                        ✓ Certifica prova
                      </button>
                      <button
                        disabled={busyId !== null}
                        onClick={() => void setVerification(review, verification, "rejected")}
                        style={buttonReject}
                      >
                        ✕ Rifiuta prova
                      </button>
                    </div>
                  </>
                )}
              </section>

              <div style={{ ...actionsStyle, marginTop: 18 }}>
                <button onClick={() => void approve(review)} disabled={busyId !== null} style={buttonApprove}>
                  {busyId === review.id ? "Operazione..." : "Approva e pubblica"}
                </button>

                {verification && (
                  <button
                    onClick={() => void verifyAndPublish(review, verification)}
                    disabled={busyId !== null}
                    style={buttonVerifyAndPublish}
                  >
                    ✓ Certifica e pubblica
                  </button>
                )}

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

const pageStyle = { maxWidth: 1000, margin: "0 auto", padding: "30px 18px 60px" };
const headingRow = { display: "flex", alignItems: "center", justifyContent: "space-between", gap: 16, flexWrap: "wrap" as const };
const actionsStyle = { display: "flex", gap: 10, flexWrap: "wrap" as const };
const metadataStyle = { display: "flex", gap: 18, flexWrap: "wrap" as const, color: "#475569", fontSize: 14 };
const cardStyle = { border: "1px solid #dbe3ea", borderRadius: 12, padding: 18, background: "#fff", boxShadow: "0 2px 10px rgba(15,23,42,.05)" };
const subsectionStyle = { marginTop: 18, padding: 14, border: "1px solid #e2e8f0", borderRadius: 9, background: "#f8fafc" };
const photoGridStyle = { display: "flex", gap: 10, flexWrap: "wrap" as const };
const photoButtonStyle = { padding: "9px 12px", border: "1px solid #0284c7", borderRadius: 7, background: "#fff", color: "#0369a1", cursor: "pointer", fontWeight: 700 };
const badgeStyle = { alignSelf: "flex-start", padding: "6px 10px", borderRadius: 999, fontWeight: 700, fontSize: 13 };
const messageStyle = { margin: "18px 0", padding: 12, border: "1px solid #cbd5e1", borderRadius: 8, background: "#f8fafc" };
const emptyStyle = { marginTop: 24, padding: 24, border: "1px solid #d1fae5", borderRadius: 10, background: "#ecfdf5" };
const buttonSecondary = { padding: "9px 14px", border: "1px solid #94a3b8", borderRadius: 7, background: "#fff", cursor: "pointer" } as const;
const buttonApprove = { padding: "10px 15px", border: 0, borderRadius: 7, background: "#15803d", color: "#fff", fontWeight: 700, cursor: "pointer" } as const;
const buttonVerify = { padding: "9px 14px", border: 0, borderRadius: 7, background: "#0f766e", color: "#fff", fontWeight: 700, cursor: "pointer" } as const;
const buttonVerifyAndPublish = { padding: "10px 15px", border: 0, borderRadius: 7, background: "#166534", color: "#fff", fontWeight: 700, cursor: "pointer" } as const;
const buttonReject = { padding: "9px 14px", border: "1px solid #dc2626", borderRadius: 7, background: "#fff", color: "#b91c1c", fontWeight: 700, cursor: "pointer" } as const;
const buttonDelete = { padding: "10px 15px", border: "1px solid #dc2626", borderRadius: 7, background: "#fff", color: "#b91c1c", fontWeight: 700, cursor: "pointer" } as const;
