import type { Artwork } from "./artworks";

export const ARTWORK_GAP_INCHES = 12;
export const STUDIO_STOOL_WIDTH_INCHES = 16;
export const STUDIO_STOOL_HEIGHT_INCHES = 27;

/** The exhibition order is independent of the chronological artwork manifest. */
export const GALLERY_SECTIONS = [
  {
    id: "dontlook",
    title: "2026",
    sources: [
      "/artwork/studio-pic-stanford.jpg",
      "/artwork/DONTLOOK-sketch.jpg",
      "/artwork/DONTLOOKATME.jpg",
    ],
  },
  {
    id: "loose-strings",
    title: "loose strings",
    sources: [
      "/artwork/heritage.jpg",
      "/artwork/unravel.jpg",
      "/artwork/fresh.jpg",
      "/artwork/rising.jpg",
    ],
  },
  {
    id: "girl",
    title: "girl",
    sources: [
      "/artwork/handsoff.jpg",
      "/artwork/blame.jpg",
      "/artwork/the-walls-we-build.jpg",
      "/artwork/anubis-dream.jpg",
    ],
  },
  {
    id: "liminal",
    title: "liminal",
    sources: [
      "/artwork/inside-out.jpg",
      "/artwork/wash.jpg",
      "/artwork/oasis.jpg",
      "/artwork/mirror:rorrim.jpg",
      "/artwork/reflection.jpg",
    ],
  },
  {
    id: "cats-sketches",
    title: "cats, sketches",
    sources: [
      "/artwork/roar.jpg",
      "/artwork/cozy.jpg",
      "/artwork/boots.jpg",
      "/artwork/pick.jpg",
      "/artwork/gotcha.jpg",
      "/artwork/cows.jpg",
      "/artwork/still-life-egg.jpg",
      "/artwork/still-life.jpg",
    ],
  },
] as const;

export type GallerySection = {
  id: string;
  title: string;
  artworks: Artwork[];
  isSalon: boolean;
};

export function makeGallerySections(artworks: Artwork[]): GallerySection[] {
  const bySource = new Map(artworks.map((artwork) => [artwork.src, artwork]));
  return GALLERY_SECTIONS.map((section) => ({
    id: section.id,
    title: section.title,
    artworks: section.sources.flatMap((source) => {
      const artwork = bySource.get(source);
      return artwork ? [artwork] : [];
    }),
    isSalon: section.id === "cats-sketches",
  })).filter((section) => section.artworks.length > 0);
}

export function artworkDisplaySize(artwork: Artwork) {
  // A studio photograph has a display size, without inventing physical metadata.
  if (artwork.src === "/artwork/studio-pic-stanford.jpg") {
    return { width: 22, height: 22 * (4 / 3) };
  }
  return { width: artwork.width ?? 12, height: artwork.height ?? 16 };
}

export function getPixelsPerInch(sections: GallerySection[], width: number, height: number) {
  const sideGutter = Math.max(52, Math.min(84, width * 0.06));
  const rowSections = sections.filter((section) => !section.isSalon);
  const widestWall = Math.max(
    1,
    ...rowSections.map((section) =>
      section.artworks.reduce(
        (sum, artwork, index) =>
          sum + artworkDisplaySize(artwork).width +
          (index > 0 ? ARTWORK_GAP_INCHES : 0),
        0,
      ),
    ),
  );
  const tallestWork = Math.max(
    1,
    ...sections.flatMap((section) =>
      section.artworks.map((artwork) => artworkDisplaySize(artwork).height),
    ),
  );
  return Math.max(
    1,
    Math.min(
      8,
      // Reserve the stool's footprint and a little breathing room at the left.
      (width - sideGutter * 2 - 28) / (widestWall + STUDIO_STOOL_WIDTH_INCHES),
      Math.max(1, height - 280) / tallestWork,
    ),
  );
}
