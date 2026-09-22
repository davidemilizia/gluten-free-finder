"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase-browser";

type ReviewFormProps = {
  placeSlug: string;
  onReviewSubmitted?: () => void;
};

type ExistingReview = {
  id: number;
  rating: number;
  title: string;
  comment: string;
  approved: boolean;
};

export default function ReviewForm({
  placeSlug,
  onReviewSubmitted,
}: ReviewFormProps) {
  const [user, setUser] = useState<User | null>(null);
  const [existingReview, setExistingReview] = useState<ExistingReview | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let active = true;

    async function loadUserAndReview() {
      const { data: sessionData } = await supabase.auth.getSession();
      if (!active) return;

      const currentUser = sessionData.session?.user ?? null;
      setUser(currentUser);

      if (!currentUser) {
        setCheckingSession(false);
        return;
      }

      const { data, error } = await supabase
        .from("reviews")
        .select("id, rating, title, comment, approved")
        .eq("place_slug", placeSlug)
        .eq("user_id", currentUser.id)
        .maybeSingle();

      if (!active) return;

      if (error) {
        setErrorMessage(error.message);
      } else if (data) {
        setExistingReview(data);
      }

      setCheckingSession(false);
    }

    loadUserAndReview();

    return () => {
      active = false;
    };
  }, [placeSlug]);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    setErrorMessage("");

    if (!user) {
      setErrorMessage("Devi accedere prima di inviare una recensione.");
      return;
    }

    setLoading(true);

    const { data, error } = await supabase
      .from("reviews")
      .insert({
        place_slug: placeSlug,
        user_id: user.id,
        rating,
        title: title.trim(),
        comment: comment.trim(),
      })
      .select("id, rating, title, comment, approved")
      .single();

    setLoading(false);

    if (error) {
      if (error.code === "23505") {
        setErrorMessage("Hai già inviato una recensione per questo locale.");
      } else {
        setErrorMessage(error.message);
      }
      return;
    }

    setExistingReview(data);
    setTitle("");
    setComment("");
    setRating(5);
    setMessage("Recensione inviata correttamente.");
    onReviewSubmitted?.();
  }

  if (checkingSession) {
    return <p>Verifica recensione dell&apos;utente...</p>;
  }

  if (!user) {
    return (
      <section style={boxStyle}>
        <h2>Lascia una recensione</h2>
        <p>
          Per pubblicare una valutazione devi prima <Link href="/login">accedere</Link>{" "}
          oppure <Link href="/register">registrarti</Link>.
        </p>
      </section>
    );
  }

  if (existingReview) {
    return (
      <section style={boxStyle}>
        <h2>La tua recensione</h2>
        <p aria-label={`${existingReview.rating} stelle su 5`}>
          {"★".repeat(existingReview.rating)}
          {"☆".repeat(5 - existingReview.rating)}
        </p>
        <h3>{existingReview.title}</h3>
        <p>{existingReview.comment}</p>
        <p style={existingReview.approved ? approvedStyle : pendingStyle}>
          {existingReview.approved
            ? "Recensione approvata e pubblicata."
            : "Recensione inviata e in attesa di approvazione."}
        </p>
        <p>Ogni utente può inserire una sola recensione per locale.</p>
      </section>
    );
  }

  return (
    <section style={boxStyle}>
      <h2>Lascia una recensione</h2>
      <p>La recensione sarà controllata prima della pubblicazione.</p>

      {message && <div style={successStyle}>{message}</div>}
      {errorMessage && <div style={errorStyle}>{errorMessage}</div>}

      <form onSubmit={handleSubmit} style={formStyle}>
        <label style={fieldStyle}>
          Valutazione
          <select
            value={rating}
            onChange={(event) => setRating(Number(event.target.value))}
            style={inputStyle}
          >
            <option value={5}>5 stelle</option>
            <option value={4}>4 stelle</option>
            <option value={3}>3 stelle</option>
            <option value={2}>2 stelle</option>
            <option value={1}>1 stella</option>
          </select>
        </label>

        <label style={fieldStyle}>
          Titolo
          <input
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            minLength={3}
            maxLength={100}
            required
            style={inputStyle}
          />
        </label>

        <label style={fieldStyle}>
          Recensione
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            minLength={10}
            maxLength={2000}
            required
            rows={6}
            style={inputStyle}
          />
        </label>

        <button type="submit" disabled={loading} style={buttonStyle}>
          {loading ? "Invio in corso..." : "Invia recensione"}
        </button>
      </form>
    </section>
  );
}

const boxStyle = {
  padding: "20px",
  margin: "28px 0",
  border: "1px solid #d6d6d6",
  borderRadius: "10px",
  background: "#fafafa",
};
const formStyle = { display: "grid", gap: "16px" };
const fieldStyle = { display: "grid", gap: "6px", fontWeight: 700 };
const inputStyle = {
  padding: "10px",
  border: "1px solid #aaa",
  borderRadius: "6px",
  font: "inherit",
};
const buttonStyle = {
  minHeight: "44px",
  border: 0,
  borderRadius: "6px",
  background: "#15803d",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};
const successStyle = {
  padding: "14px",
  border: "1px solid #86c99a",
  borderRadius: "8px",
  background: "#effaf2",
  color: "#14532d",
};
const errorStyle = {
  padding: "14px",
  border: "1px solid #e4a2a2",
  borderRadius: "8px",
  background: "#fff1f1",
  color: "#7f1d1d",
};
const approvedStyle = { color: "#166534", fontWeight: 700 };
const pendingStyle = { color: "#92400e", fontWeight: 700 };
