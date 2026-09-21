type RatingSummaryProps = {
  average: number;
  count: number;
};

export default function RatingSummary({ average, count }: RatingSummaryProps) {
  const rounded = Math.round(average);

  return (
    <section aria-labelledby="rating-title">
      <h2 id="rating-title">Valutazione utenti</h2>
      <p style={{ fontSize: "1.15rem" }}>
        <span aria-label={`${rounded} stelle su 5`}>
          {"★".repeat(rounded)}{"☆".repeat(5 - rounded)}
        </span>{" "}
        <strong>{count > 0 ? average.toFixed(1) : "Nessuna valutazione"}</strong>
      </p>
      <p>{count} {count === 1 ? "recensione approvata" : "recensioni approvate"}</p>
    </section>
  );
}
