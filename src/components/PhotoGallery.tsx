type Photo = {
  id: number;
  imageUrl: string;
  caption?: string;
  userName?: string;
  approved: boolean;
};

type PhotoGalleryProps = {
  photos: Photo[];
  placeName: string;
};

export default function PhotoGallery({ photos, placeName }: PhotoGalleryProps) {
  return (
    <section aria-labelledby="photos-title">
      <h2 id="photos-title">Fotografie</h2>

      {photos.length === 0 ? (
        <p>Non sono ancora presenti fotografie approvate.</p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: "14px",
          }}
        >
          {photos.map((photo) => (
            <figure key={photo.id} style={{ margin: 0 }}>
              <img
                src={photo.imageUrl}
                alt={photo.caption || `Fotografia di ${placeName}`}
                loading="lazy"
                style={{
                  width: "100%",
                  height: "220px",
                  objectFit: "cover",
                  borderRadius: "10px",
                }}
              />
              {(photo.caption || photo.userName) && (
                <figcaption style={{ marginTop: "6px" }}>
                  {photo.caption}
                  {photo.userName && ` · ${photo.userName}`}
                </figcaption>
              )}
            </figure>
          ))}
        </div>
      )}

      <p style={{ marginTop: "18px", color: "#555" }}>
        Il caricamento delle fotografie sarà disponibile dopo l'attivazione del login utenti e dello spazio di archiviazione.
      </p>
    </section>
  );
}
