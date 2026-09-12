export default function HomePage() {
  return (
    <main
      style={{
        maxWidth: "1200px",
        margin: "0 auto",
        padding: "40px",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ color: "#15803d" }}>
        🍃 Gluten Free Finder
      </h1>

      <p
        style={{
          fontSize: "18px",
          marginBottom: "30px",
        }}
      >
        Trova locali e negozi sicuri per celiaci
        in tutto il mondo.
      </p>

      <hr />

      <h2>Ricerca</h2>

      <p>🌍 Continente</p>

      <p>🌎 Nazione</p>

      <p>📍 Regione</p>

      <p>🏙️ Città</p>

      <p>🍽️ Tipologia</p>

      <button
        style={{
          backgroundColor: "#15803d",
          color: "white",
          padding: "10px 20px",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
        }}
      >
        CERCA
      </button>

      <hr
        style={{
          marginTop: "40px",
          marginBottom: "40px",
        }}
      />

      <h2>Statistiche</h2>

      <p>📍 Locali registrati: 1</p>
      <p>⭐ Recensioni: 0</p>
      <p>👥 Utenti iscritti: 0</p>

      <hr
        style={{
          marginTop: "40px",
          marginBottom: "40px",
        }}
      />

      <h2>Ultimo locale inserito</h2>

      <p>
        ✅ <strong>Mama Eat Roma</strong>
      </p>

      <p>Via di San Cosimato 7</p>

      <p>Roma</p>
    </main>
  );
}
