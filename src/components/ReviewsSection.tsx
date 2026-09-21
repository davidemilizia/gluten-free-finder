type Review = {
  id: number;
  userName: string;
  rating: number;
  title: string;
  comment: string;
  createdAt: string;
  approved: boolean;
  isDemo?: boolean;
};

type ReviewsSectionProps = {
  reviews: Review[];
};

export default function ReviewsSection({ reviews }: ReviewsSectionProps) {
  return (
    <section aria-labelledby="reviews-title">
      <h2 id="reviews-title">Recensioni</h2>

      {reviews.length === 0 ? (
        <p>Non sono ancora presenti recensioni approvate.</p>
      ) : (
        <div style={{ display: "grid", gap: "16px" }}>
          {reviews.map((review) => (
            <article
              key={review.id}
              style={{
                padding: "18px",
                border: "1px solid #d6d6d6",
                borderRadius: "10px",
                background: "#fff",
              }}
            >
              <p style={{ marginTop: 0 }}>
                <strong>{review.title}</strong>
                {review.isDemo && (
                  <span style={{ marginLeft: "8px", color: "#866500" }}>
                    Dato di prova
                  </span>
                )}
              </p>
              <p aria-label={`${review.rating} stelle su 5`}>
                {"★".repeat(review.rating)}{"☆".repeat(5 - review.rating)}
              </p>
              <p>{review.comment}</p>
              <small>
                {review.userName} · {review.createdAt}
              </small>
            </article>
          ))}
        </div>
      )}

      <p style={{ marginTop: "18px", color: "#555" }}>
        L'inserimento di nuove recensioni sarà disponibile dopo l'attivazione del login utenti e del database.
      </p>
    </section>
  );
}
