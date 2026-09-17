import places from "../../../data/places.json";
import Link from "next/link";

export default function PlacesPage() {
  return (
    <main>
      <h1>Locali Gluten Free</h1>

      {places.map((place: any) => (
        <div key={place.id}>
          <h2>
            {`/places/${place.slug}`}
              {place.name}
            </Link>
          </h2>

          <p>{place.address}</p>

          <p>⭐ {place.rating}/5</p>

          <p>{place.description}</p>

          <hr />
        </div>
      ))}
    </main>
  );
}
