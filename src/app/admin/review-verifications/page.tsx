"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

type Row = {
  id: number;
  review_id: number;
  proof_path: string;
  status: "pending" | "verified" | "rejected";
  created_at: string;
  review?: { title?: string; comment?: string; rating?: number; approved?: boolean } | null;
};

export default function ReviewVerificationsPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const [message, setMessage] = useState("");
  const [busyId, setBusyId] = useState<number | null>(null);

  async function load() {
    const { data, error } = await supabase
      .from("review_verifications")
      .select("id,review_id,proof_path,status,created_at")
      .order("created_at", { ascending: false });
    if (error) return setMessage(error.message);

    const enriched = await Promise.all((data ?? []).map(async (row) => {
      const { data: review } = await supabase.from("reviews").select("title,comment,rating,approved").eq("id", row.review_id).maybeSingle();
      return { ...row, review } as Row;
    }));
    setRows(enriched);
  }

  useEffect(() => { void load(); }, []);

  async function openProof(row: Row) {
    const { data, error } = await supabase.storage.from("review-proofs").createSignedUrl(row.proof_path, 300);
    if (error) return setMessage(error.message);
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  }

  async function setVerification(row: Row, status: "verified" | "rejected") {
    setBusyId(row.id);
    const { data } = await supabase.auth.getSession();
    const { error } = await supabase.from("review_verifications").update({
      status,
      reviewed_at: new Date().toISOString(),
      reviewed_by: data.session?.user.id ?? null,
    }).eq("id", row.id);
    setMessage(error ? error.message : status === "verified" ? "Visita verificata." : "Prova rifiutata.");
    setBusyId(null);
    if (!error) await load();
  }

  async function setApproved(row: Row, approved: boolean) {
    setBusyId(row.id);
    const { error } = await supabase.from("reviews").update({ approved }).eq("id", row.review_id);
    setMessage(error ? error.message : approved ? "Recensione approvata e pubblicata." : "Recensione rimossa dalla pubblicazione.");
    setBusyId(null);
    if (!error) await load();
  }

  async function verifyAndPublish(row: Row) {
    setBusyId(row.id);
    const { data } = await supabase.auth.getSession();
    const verificationResult = await supabase.from("review_verifications").update({
      status: "verified",
      reviewed_at: new Date().toISOString(),
      reviewed_by: data.session?.user.id ?? null,
    }).eq("id", row.id);
    if (verificationResult.error) { setBusyId(null); return setMessage(verificationResult.error.message); }
    const reviewResult = await supabase.from("reviews").update({ approved: true }).eq("id", row.review_id);
    setBusyId(null);
    setMessage(reviewResult.error ? reviewResult.error.message : "Visita verificata e recensione pubblicata.");
    if (!reviewResult.error) await load();
  }

  return (
    <main style={{ maxWidth: 960, margin: "0 auto", padding: 30 }}>
      <h1>Verifiche recensioni</h1>
      <p>Verifica della visita e approvazione del contenuto sono controlli separati.</p>
      {rows.map((row) => (
        <article key={row.id} style={card}>
          <h2>Recensione #{row.review_id}</h2>
          <p><strong>{row.review?.title}</strong> · {row.review?.rating ?? 0}/5</p>
          <p>{row.review?.comment}</p>
          <p>Visita: <strong>{row.status}</strong> · Recensione: <strong>{row.review?.approved ? "pubblicata" : "in moderazione"}</strong></p>
          <div style={actions}>
            <button disabled={busyId === row.id} onClick={() => void openProof(row)}>Apri prova privata</button>
            <button disabled={busyId === row.id} onClick={() => void setVerification(row, "verified")}>✓ Verifica visita</button>
            <button disabled={busyId === row.id} onClick={() => void setApproved(row, true)}>✓ Approva recensione</button>
            <button disabled={busyId === row.id} onClick={() => void verifyAndPublish(row)} style={primary}>✓ Verifica e pubblica</button>
            <button disabled={busyId === row.id} onClick={() => void setVerification(row, "rejected")}>✕ Rifiuta prova</button>
            {row.review?.approved && <button disabled={busyId === row.id} onClick={() => void setApproved(row, false)}>Rimuovi pubblicazione</button>}
          </div>
        </article>
      ))}
      {rows.length === 0 && <p>Nessuna verifica presente.</p>}
      {message && <p><strong>{message}</strong></p>}
    </main>
  );
}

const card = { padding: 18, border: "1px solid #ddd", borderRadius: 10, margin: "12px 0" };
const actions = { display: "flex", gap: 8, flexWrap: "wrap" as const };
const primary = { background: "#15803d", color: "white", border: 0, borderRadius: 5, padding: "7px 10px", fontWeight: 700 };
