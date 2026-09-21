"use client";

import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/lib/supabase-browser";
import RatingSummary from "@/components/RatingSummary";
import ReviewForm from "@/components/ReviewForm";

type PublicReview = {
  id: number;
  rating: number;
  title: string;
  comment: string;
  created_at: string;
};

type SupabaseReviewsProps = {
  placeSlug: string;
};

export default function SupabaseReviews({ placeSlug }: SupabaseReviewsProps) {
  const [reviews, setReviews] = useState<PublicReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const loadReviews = useCallback(async () => {
    setLoading(true);
    setErrorMessage("");

    const { data, error } = await supabase
      .from("reviews")
      .select("id, rating, title, comment, created_at")
      .eq("place_slug", placeSlug)
      .eq("approved", true)
      .order("created_at", { ascending: false });

    if (error) {
      setErrorMessage(error.message);
      setLoading(false);
      return;
    }

    setReviews(data ?? []);
    setLoading(false);
  }, [placeSlug]);

  useEffect(() => {
    loadReviews();
  }, [loadReviews]);

  const average = reviews.length
    ? reviews.reduce((total, review) => total + review.rating, 0) / reviews.length
    : 0;

  return (
    <>
      <RatingSummary average={average} count={reviews.length} />

      <section aria-labelledby="reviews-title">
        <h2 id="reviews-title">Recensioni approvate</h2>

        {loading && <p>Caricamento recensioni...</p>}
        {errorMessage && <p style={{ color: "#7f1d1d" }}>{errorMessage}</p>}

        {!loading && !errorMessage && reviews.length === 0 && (
          <p>Non sono ancora presenti recensioni approvate.</p>
        )}

        <div style={{ display: "grid", gap: "16px" }}>
          {reviews.map((review) => (
            <article key={review.id} style={reviewStyle}>
              <h3>{review.title}</h3>
              <p aria-label={`${review.rating} stelle su 5`}>
                {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
              </p>
              <p>{review.comment}</p>
              <small>
                {new Intl.DateTimeFormat("it-IT", {
                  day: "2-digit",
                  month: "2-digit",
                  year: "numeric",
                }).format(new Date(review.created_at))}
              </small>
            </article>
          ))}
        </div>
      </section>

      <ReviewForm placeSlug={placeSlug} onReviewSubmitted={loadReviews} />
    </>
  );
}

const reviewStyle = {
  padding: "18px",
  border: "1px solid #d6d6d6",
  borderRadius: "10px",
  background: "#fff",
};
