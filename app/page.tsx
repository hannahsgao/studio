import { artworks } from "./artworks";

export default function Home() {
  return (
    <main className="gallery">
      {artworks.map((artwork, index) => (
        <figure className="artwork" key={artwork.src}>
          <img
            src={artwork.src}
            alt={
              artwork.title
                ? `${artwork.title} by Hannah Gao`
                : `Artwork ${index + 1} by Hannah Gao`
            }
            width={artwork.width}
            height={artwork.height}
            loading={index < 2 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : "auto"}
            decoding="async"
          />
        </figure>
      ))}
    </main>
  );
}
