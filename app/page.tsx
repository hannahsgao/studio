import { artworks } from "./artworks";
import { GalleryExplorer } from "./gallery-explorer";

function yearValue(year: string) {
  const value = Number.parseInt(year, 10);
  return Number.isNaN(value) ? Number.NEGATIVE_INFINITY : value;
}

const artworksByDate = artworks
  .filter((artwork) => artwork.placement !== "about")
  .sort((a, b) => yearValue(b.year) - yearValue(a.year));

export default function Home() {
  return <GalleryExplorer artworks={artworksByDate} />;
}
