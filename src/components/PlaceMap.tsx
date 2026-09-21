type PlaceMapProps = {
  latitude: number;
  longitude: number;
  name: string;
};

export default function PlaceMap({
  latitude,
  longitude,
  name,
}: PlaceMapProps) {
  const delta = 0.01;
  const left = longitude - delta;
  const right = longitude + delta;
  const bottom = latitude - delta;
  const top = latitude + delta;

  const mapUrl =
    `https://www.openstreetmap.org/export/embed.html` +
    `?bbox=${left},${bottom},${right},${top}` +
    `&layer=mapnik&marker=${latitude},${longitude}`;

  const directionsUrl =
    `https://www.openstreetmap.org/directions` +
    `?to=${latitude},${longitude}`;

  return (
    <section aria-labelledby="map-title">
      <h2 id="map-title">Mappa</h2>

      <div
        style={{
          overflow: "hidden",
          border: "1px solid #d6d6d6",
          borderRadius: "10px",
          background: "#f5f5f5",
        }}
      >
        <iframe
          title={`Mappa di ${name}`}
          src={mapUrl}
          width="100%"
          height="420"
          style={{ display: "block", border: 0 }}
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <p style={{ marginTop: "12px" }}>
        <a href={directionsUrl} target="_blank" rel="noreferrer">
          Apri la posizione su OpenStreetMap →
        </a>
      </p>
    </section>
  );
}
