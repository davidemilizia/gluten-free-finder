"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";

type Props = { reviewId: number };
type Photo = { id: number; storage_path: string; url: string };

export default function PublicReviewMedia({ reviewId }: Props) {
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    let active = true;
    void (async () => {
      const [photoResult, verificationResult] = await Promise.all([
        supabase.from("review_photos").select("id,storage_path").eq("review_id", reviewId).order("sort_order"),
        supabase.from("review_verifications").select("id").eq("review_id", reviewId).eq("status", "verified").maybeSingle(),
      ]);
      if (!active) return;
      if (!photoResult.error) {
        setPhotos((photoResult.data ?? []).map((photo) => ({
          ...photo,
          url: supabase.storage.from("review-photos").getPublicUrl(photo.storage_path).data.publicUrl,
        })));
      }
      setVerified(Boolean(verificationResult.data));
    })();
    return () => { active = false; };
  }, [reviewId]);

  if (!verified && photos.length === 0) return null;

  return (
    <div style={{ marginTop: 12 }}>
      {verified && <span style={badge}>✓ Visita verificata</span>}
      {photos.length > 0 && (
        <div style={gallery}>
          {photos.map((photo) => (
            <a key={photo.id} href={photo.url} target="_blank" rel="noreferrer">
              <img src={photo.url} alt="Foto pubblica della recensione" style={image} loading="lazy" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
}

const badge = { display: "inline-block", padding: "5px 9px", borderRadius: 999, background: "#dcfce7", color: "#166534", fontWeight: 700, fontSize: 14 };
const gallery = { display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 10, marginTop: 10 };
const image = { width: "100%", height: 130, objectFit: "cover" as const, borderRadius: 8, border: "1px solid #e5e7eb" };
