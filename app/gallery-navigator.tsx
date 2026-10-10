"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import type { Artwork } from "./artworks";
import type { GallerySection } from "./gallery-sections";

const PREVIEW_HALF_WIDTH = 76;
const PREVIEW_VIEWPORT_GUTTER = 16;

type GalleryNavigatorProps = {
  sections: GallerySection[];
  sectionIndex: number;
  selectedSource: string | null;
  getPreviewSource: (artwork: Artwork) => string;
  imageSizes: Record<string, { width: number; height: number }>;
  onSelect: (artwork: Artwork, sectionIndex: number) => void;
};

export function GalleryNavigator({
  sections,
  sectionIndex,
  selectedSource,
  getPreviewSource,
  imageSizes,
  onSelect,
}: GalleryNavigatorProps) {
  const navigatorRef = useRef<HTMLElement>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [preview, setPreview] = useState<{
    artwork: Artwork;
    x: number;
  } | null>(null);
  const artworkCount = sections.reduce(
    (count, section) => count + section.artworks.length,
    0,
  );
  const currentSource = selectedSource ?? sections[sectionIndex]?.artworks[0]?.src;

  useEffect(() => {
    setPreview(null);
  }, [sectionIndex]);

  const clearPreview = () => {
    setPreview(null);
  };

  const showPreview = (
    artwork: Artwork,
    button: HTMLButtonElement,
  ) => {
    const bounds = navigatorRef.current?.getBoundingClientRect();
    if (!bounds) return;
    const bar = button.getBoundingClientRect();
    const edge = PREVIEW_HALF_WIDTH + PREVIEW_VIEWPORT_GUTTER;
    const x = Math.max(
      edge,
      Math.min(window.innerWidth - edge, bar.left + bar.width / 2),
    ) - bounds.left;
    setPreview({ artwork, x });
  };

  let artworkIndex = 0;

  return (
    <nav
      ref={navigatorRef}
      className={`gallery-navigator${preview ? " gallery-navigator--previewing" : ""}`}
      aria-label="Gallery artwork navigation"
      onPointerLeave={clearPreview}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) clearPreview();
      }}
    >
      <div
        className="gallery-navigator__preview"
        aria-hidden="true"
        style={{
          "--preview-x": `${preview?.x ?? PREVIEW_HALF_WIDTH}px`,
        } as CSSProperties}
      >
        {preview && (
          <>
            <img
              src={getPreviewSource(preview.artwork)}
              width={imageSizes[preview.artwork.src]?.width}
              height={imageSizes[preview.artwork.src]?.height}
              alt=""
              decoding="async"
              draggable="false"
            />
            <span className="gallery-navigator__preview-title">{preview.artwork.title}</span>
            <span className="gallery-navigator__preview-year">{preview.artwork.year}</span>
          </>
        )}
      </div>

      <div className="gallery-navigator__rail">
        {sections.map((section, index) => (
          <div
            className={`gallery-navigator__group${index === sectionIndex ? " gallery-navigator__group--current" : ""}`}
            role="group"
            aria-label={section.title}
            aria-current={index === sectionIndex ? "step" : undefined}
            key={section.id}
          >
            {section.artworks.map((artwork) => {
              const buttonIndex = artworkIndex++;
              const isSelected = artwork.src === currentSource;
              const isPreviewed = preview?.artwork.src === artwork.src;
              return (
                <button
                  ref={(element) => {
                    buttonRefs.current[buttonIndex] = element;
                  }}
                  className={`gallery-navigator__bar${
                    isPreviewed ? " gallery-navigator__bar--previewed" : ""
                  }`}
                  key={artwork.src}
                  type="button"
                  aria-label={`View ${artwork.title} in ${section.title}`}
                  aria-current={isSelected ? "true" : undefined}
                  aria-controls={`gallery-section-${section.id}`}
                  tabIndex={isPreviewed || (!preview && isSelected) ? 0 : -1}
                  onPointerEnter={(event) => {
                    showPreview(artwork, event.currentTarget);
                  }}
                  onFocus={(event) => {
                    if (event.currentTarget.matches(":focus-visible")) {
                      showPreview(artwork, event.currentTarget);
                    }
                  }}
                  onKeyDown={(event) => {
                    let next: number | null = null;
                    if (event.key === "ArrowRight") next = buttonIndex + 1;
                    if (event.key === "ArrowLeft") next = buttonIndex - 1;
                    if (event.key === "Home") next = 0;
                    if (event.key === "End") next = artworkCount - 1;
                    if (event.key === "Escape") clearPreview();
                    if (next !== null) {
                      event.preventDefault();
                      const bounded = Math.max(0, Math.min(artworkCount - 1, next));
                      buttonRefs.current[bounded]?.focus();
                    }
                  }}
                  onClick={() => {
                    onSelect(artwork, index);
                    clearPreview();
                  }}
                >
                  <svg
                    className="gallery-navigator__tick"
                    viewBox="0 0 2 56"
                    width="2"
                    height="56"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <path d="M1 55.5V.5" pathLength="56" />
                  </svg>
                </button>
              );
            })}
            <span className="gallery-navigator__section-title" aria-hidden="true">
              {section.title}
            </span>
          </div>
        ))}
      </div>

      <span className="visually-hidden">
        Use left and right arrows to preview artworks, then Enter to select one.
        Scroll the gallery or use its arrow keys to move between sections.
      </span>
    </nav>
  );
}
