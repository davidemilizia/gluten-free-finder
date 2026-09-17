import places from "../../../data/places.json";

export default function PlacesPage() {
  return (
    <main>
      <h1>Locali Gluten Free</h1>

      {places.map((place: any) => (
        <div key={place.id}>
          <h2>{place.name}</h2>

          <p>{place.address}</p>

          <p>⭐ {place.rating}/5</p>

          <p>{place.description}</p>

          <hr />
        </div>
      ))}
    </main>
  );
}
