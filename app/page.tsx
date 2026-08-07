import { artworks } from "./artworks";

function yearValue(year: string) {
  const value = Number.parseInt(year, 10);
  return Number.isNaN(value) ? Number.NEGATIVE_INFINITY : value;
}

const artworksByDate = [...artworks].sort(
  (a, b) => yearValue(b.year) - yearValue(a.year),
);

function formatDimensions(width: number | null, height: number | null) {
  return width === null || height === null
    ? "Dimensions TBD"
    : `${width} × ${height} in`;
}

export default function Home() {
  return (
    <main className="gallery">
      {artworksByDate.map((artwork, index) => (
        <figure className="artwork" key={artwork.src}>
          <img
            src={artwork.src}
            alt={`${artwork.title} by Hannah Gao`}
            loading={index < 2 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : "auto"}
            decoding="async"
            style={
              artwork.displayScale
                ? { width: `${artwork.displayScale * 100}%` }
                : undefined
            }
          />
          <figcaption className="artwork-details">
            <h2>{artwork.title}</h2>
            <p>
              <span>{artwork.medium}</span>
              <span>{formatDimensions(artwork.width, artwork.height)}</span>
              <span>{artwork.year}</span>
            </p>
          </figcaption>
        </figure>
      ))}
    </main>
  );
}
