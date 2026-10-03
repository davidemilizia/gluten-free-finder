"use client";

import { ChangeEvent, useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

type Props = { reviewId: number; userId: string; onDone?: () => void };
type Photo = { id: number; storage_path: string; sort_order: number; url: string };
type Verification = { status: "pending" | "verified" | "rejected"; proof_path: string };

const MAX_PHOTOS = 5;
const MAX_BYTES = 5 * 1024 * 1024;
const PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const PROOF_TYPES = [...PHOTO_TYPES, "application/pdf"];

export default function ReviewEvidence({ reviewId, userId, onDone }: Props) {
  const [existing, setExisting] = useState<Photo[]>([]);
  const [verification, setVerification] = useState<Verification | null>(null);
  const [photos, setPhotos] = useState<File[]>([]);
  const [proof, setProof] = useState<File | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const photoInput = useRef<HTMLInputElement>(null);
  const proofInput = useRef<HTMLInputElement>(null);

  const remaining = Math.max(0, MAX_PHOTOS - existing.length);

  useEffect(() => { void load(); }, [reviewId]);

  async function load() {
    const [photoResult, verificationResult] = await Promise.all([
      supabase.from("review_photos").select("id,storage_path,sort_order").eq("review_id", reviewId).order("sort_order"),
      supabase.from("review_verifications").select("status,proof_path").eq("review_id", reviewId).maybeSingle(),
    ]);

    if (photoResult.error) setMessage(photoResult.error.message);
    else {
      setExisting((photoResult.data ?? []).map((item) => ({
        ...item,
        url: supabase.storage.from("review-photos").getPublicUrl(item.storage_path).data.publicUrl,
      })));
    }
    if (!verificationResult.error) setVerification(verificationResult.data as Verification | null);
  }

  function selectPhotos(event: ChangeEvent<HTMLInputElement>) {
    const selected = Array.from(event.target.files ?? []);
    if (selected.length > remaining) {
      setMessage(`Puoi aggiungere ancora ${remaining} foto. Il limite complessivo è ${MAX_PHOTOS}.`);
      event.target.value = "";
      return;
    }
    if (selected.some((file) => file.size > MAX_BYTES || !PHOTO_TYPES.includes(file.type))) {
      setMessage("Sono ammesse solo immagini JPG, PNG o WEBP fino a 5 MB.");
      event.target.value = "";
      return;
    }
    const unique = selected.filter((file, index, all) =>
      all.findIndex((other) => other.name === file.name && other.size === file.size && other.lastModified === file.lastModified) === index
    );
    setPhotos(unique);
    setMessage("");
  }

  function selectProof(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    if (file && (file.size > MAX_BYTES || !PROOF_TYPES.includes(file.type))) {
      setMessage("La prova deve essere JPG, PNG, WEBP o PDF e non superare 5 MB.");
      event.target.value = "";
      return;
    }
    setProof(file);
    setMessage("");
  }

  function safeName(file: File) {
    const clean = file.name.toLowerCase().replace(/[^a-z0-9._-]+/g, "-");
    return `${file.size}-${file.lastModified}-${clean}`;
  }

  async function upload() {
    if (busy || (!photos.length && !proof)) return;
    setBusy(true);
    setMessage("");
    try {
      for (let index = 0; index < photos.length; index += 1) {
        const file = photos[index];
        const path = `${userId}/${reviewId}/${safeName(file)}`;
        const uploadResult = await supabase.storage.from("review-photos").upload(path, file, {
          contentType: file.type,
          upsert: false,
        });
        if (uploadResult.error) {
          if (uploadResult.error.message.toLowerCase().includes("already exists")) continue;
          throw uploadResult.error;
        }
        const insertResult = await supabase.from("review_photos").insert({
          review_id: reviewId,
          user_id: userId,
          storage_path: path,
          sort_order: existing.length + index,
        });
        if (insertResult.error) {
          await supabase.storage.from("review-photos").remove([path]);
          throw insertResult.error;
        }
      }

      if (proof && !verification) {
        const path = `${userId}/${reviewId}/${safeName(proof)}`;
        const uploadResult = await supabase.storage.from("review-proofs").upload(path, proof, {
          contentType: proof.type,
          upsert: false,
        });
        if (uploadResult.error) throw uploadResult.error;
        const insertResult = await supabase.from("review_verifications").insert({
          review_id: reviewId,
          user_id: userId,
          proof_path: path,
          status: "pending",
        });
        if (insertResult.error) {
          await supabase.storage.from("review-proofs").remove([path]);
          throw insertResult.error;
        }
      }

      setPhotos([]);
      setProof(null);
      if (photoInput.current) photoInput.current.value = "";
      if (proofInput.current) proofInput.current.value = "";
      await load();
      setMessage("Allegati caricati correttamente.");
      onDone?.();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Errore durante il caricamento.");
    } finally {
      setBusy(false);
    }
  }

  async function removePhoto(photo: Photo) {
    if (busy) return;
    setBusy(true);
    const storageResult = await supabase.storage.from("review-photos").remove([photo.storage_path]);
    if (storageResult.error) setMessage(storageResult.error.message);
    else {
      const deleteResult = await supabase.from("review_photos").delete().eq("id", photo.id).eq("user_id", userId);
      setMessage(deleteResult.error ? deleteResult.error.message : "Foto rimossa.");
      if (!deleteResult.error) { await load(); onDone?.(); }
    }
    setBusy(false);
  }

  return (
    <section style={styles.box}>
      <h3>Foto e verifica della visita</h3>
      {existing.length > 0 && (
        <div style={styles.gallery}>
          {existing.map((photo) => (
            <figure key={photo.id} style={styles.figure}>
              <img src={photo.url} alt="Foto della recensione" style={styles.image} />
              <button type="button" disabled={busy} onClick={() => void removePhoto(photo)} style={styles.remove}>
                Rimuovi
              </button>
            </figure>
          ))}
        </div>
      )}

      <label style={styles.label}>
        Foto pubbliche, massimo {MAX_PHOTOS} complessive. Disponibili: {remaining}
        <input ref={photoInput} disabled={busy || remaining === 0} type="file" multiple accept="image/jpeg,image/png,image/webp" onChange={selectPhotos} />
      </label>
      {photos.length > 0 && <p>{photos.length} nuove foto selezionate.</p>}

      <hr />
      <label style={styles.label}>
        Prova privata della visita, facoltativa
        <input ref={proofInput} disabled={busy || Boolean(verification)} type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={selectProof} />
      </label>
      <p style={styles.note}>La prova non sarà pubblicata ed è accessibile soltanto per la verifica.</p>
      {verification && <p><strong>Stato prova: {verification.status}</strong></p>}

      <button type="button" disabled={busy || (!photos.length && !proof)} onClick={() => void upload()}>
        {busy ? "Operazione in corso..." : "Carica allegati"}
      </button>
      {message && <p><strong>{message}</strong></p>}
    </section>
  );
}

const styles = {
  box: { padding: 16, border: "1px solid #ddd", borderRadius: 10, marginTop: 16 },
  gallery: { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(130px,1fr))", gap: 10, marginBottom: 16 },
  figure: { margin: 0 },
  image: { width: "100%", height: 110, objectFit: "cover" as const, borderRadius: 8 },
  remove: { width: "100%", marginTop: 5 },
  label: { display: "grid", gap: 8, margin: "12px 0" },
  note: { color: "#64748b", fontSize: 13 },
};
