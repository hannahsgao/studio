import type { Artwork } from "./artworks";

type ArtworkCaptionProps = {
  artwork: Artwork;
};

export function ArtworkCaption({ artwork }: ArtworkCaptionProps) {
  const hasDimensions = artwork.width !== null && artwork.height !== null;

  return (
    <figcaption className="artwork-details">
      <h2>{artwork.title}</h2>
      <p>
        {artwork.medium && <span>{artwork.medium}</span>}
        {hasDimensions && (
          <span>
            {artwork.width} × {artwork.height} in
          </span>
        )}
        <span>{artwork.year}</span>
      </p>
    </figcaption>
  );
}
