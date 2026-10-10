"use client";

import {
  useCallback,
  useEffect,
  useEffectEvent,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { ArtworkCaption } from "./artwork-caption";
import type { Artwork } from "./artworks";
import { SiteHeader } from "./site-header";
import {
  ARTWORK_GAP_INCHES,
  GALLERY_SECTIONS,
  STUDIO_STOOL_HEIGHT_INCHES,
  STUDIO_STOOL_WIDTH_INCHES,
  artworkDisplaySize,
  getPixelsPerInch,
  makeGallerySections,
} from "./gallery-sections";
import { GalleryNavigator } from "./gallery-navigator";
import { createWheelNavigation } from "./gallery-input";

const MIN_LAPTOP_WIDTH = 900;
const LAPTOP_MEDIA_QUERY = `(min-width: ${MIN_LAPTOP_WIDTH}px)`;

type GalleryMode = "editorial" | "grid" | "scale";
const EDITORIAL_ORDER = GALLERY_SECTIONS.flatMap((section) => section.sources);

const GRID_PREVIEWS: Record<string, string> = {
  "/artwork/studio-pic-stanford.jpg":
    "/artwork/editorial/studio-pic-stanford-480.webp",
  "/artwork/DONTLOOKATME.jpg":
    "/artwork/editorial/DONTLOOKATME-480.webp",
  "/artwork/DONTLOOK-sketch.jpg":
    "/artwork/grid/DONTLOOK-sketch-640.webp",
  "/artwork/unravel.jpg": "/artwork/grid/unravel-640.webp",
  "/artwork/blame.jpg": "/artwork/grid/blame-640.webp",
  "/artwork/handsoff.jpg": "/artwork/grid/handsoff-640.webp",
  "/artwork/rising.jpg": "/artwork/editorial/rising-640.webp",
  "/artwork/heritage.jpg": "/artwork/editorial/heritage-520.webp",
  "/artwork/fresh.jpg": "/artwork/grid/fresh-640.webp",
  "/artwork/bastion.jpg": "/artwork/editorial/bastion-480.webp",
  "/artwork/anubis-dream.jpg": "/artwork/grid/anubis-dream-640.webp",
  "/artwork/the-walls-we-build.jpg":
    "/artwork/grid/the-walls-we-build-640.webp",
  "/artwork/wash.jpg": "/artwork/grid/wash-640.webp",
  "/artwork/mirror:rorrim.jpg": "/artwork/grid/mirror:rorrim-640.webp",
  "/artwork/inside-out.jpg": "/artwork/grid/inside-out-640.webp",
  "/artwork/reflection.jpg": "/artwork/grid/reflection-640.webp",
  "/artwork/oasis.jpg": "/artwork/grid/oasis-640.webp",
  "/artwork/roar.jpg": "/artwork/grid/roar-640.webp",
  "/artwork/cozy.jpg": "/artwork/editorial/cozy-640.webp",
  "/artwork/boots.jpg": "/artwork/grid/boots-640.webp",
  "/artwork/cows.jpg": "/artwork/grid/cows-640.webp",
  "/artwork/pick.jpg": "/artwork/grid/pick-640.webp",
  "/artwork/gotcha.jpg": "/artwork/grid/gotcha-640.webp",
  "/artwork/still-life-egg.jpg":
    "/artwork/grid/still-life-egg-640.webp",
  "/artwork/still-life.jpg": "/artwork/grid/still-life-640.webp",
};

const EDITORIAL_IMAGE_SIZES: Record<
  string,
  { width: number; height: number }
> = {
  "/artwork/DONTLOOK-sketch.jpg": { width: 1500, height: 2000 },
  "/artwork/DONTLOOKATME.jpg": { width: 1399, height: 2000 },
  "/artwork/anubis-dream.jpg": { width: 1589, height: 2000 },
  "/artwork/bastion.jpg": { width: 1572, height: 2000 },
  "/artwork/blame.jpg": { width: 2000, height: 1999 },
  "/artwork/boots.jpg": { width: 1521, height: 2000 },
  "/artwork/cows.jpg": { width: 2000, height: 1988 },
  "/artwork/cozy.jpg": { width: 2000, height: 1457 },
  "/artwork/fresh.jpg": { width: 1321, height: 2000 },
  "/artwork/gotcha.jpg": { width: 2000, height: 1500 },
  "/artwork/handsoff.jpg": { width: 2000, height: 1984 },
  "/artwork/heritage.jpg": { width: 1526, height: 2000 },
  "/artwork/inside-out.jpg": { width: 2000, height: 1977 },
  "/artwork/mirror:rorrim.jpg": { width: 2000, height: 1933 },
  "/artwork/oasis.jpg": { width: 1500, height: 2000 },
  "/artwork/pick.jpg": { width: 1506, height: 2000 },
  "/artwork/reflection.jpg": { width: 1996, height: 2000 },
  "/artwork/rising.jpg": { width: 1027, height: 2000 },
  "/artwork/roar.jpg": { width: 1612, height: 2000 },
  "/artwork/still-life-egg.jpg": { width: 1500, height: 2000 },
  "/artwork/still-life.jpg": { width: 2000, height: 1416 },
  "/artwork/studio-pic-stanford.jpg": { width: 1500, height: 2000 },
  "/artwork/the-walls-we-build.jpg": { width: 1970, height: 2000 },
  "/artwork/unravel.jpg": { width: 1341, height: 2000 },
  "/artwork/wash.jpg": { width: 1984, height: 2000 },
};

type GalleryExplorerProps = {
  artworks: Artwork[];
};

function scalePreviewSource(artwork: Artwork) {
  return artwork.scaleSrc ?? GRID_PREVIEWS[artwork.src] ?? artwork.src;
}

function artworkLabel(artwork: Artwork) {
  return [
    artwork.title,
    artwork.medium,
    artwork.width !== null && artwork.height !== null
      ? `${artwork.width} by ${artwork.height} inches`
      : null,
    artwork.year,
  ]
    .filter(Boolean)
    .join(", ");
}

function orderEditorialArtworks(artworks: Artwork[]) {
  const artworkBySource = new Map(
    artworks.map((artwork) => [artwork.src, artwork]),
  );
  if (artworkBySource.size !== artworks.length) {
    throw new Error("Editorial gallery requires unique artwork sources.");
  }

  const ordered = EDITORIAL_ORDER.flatMap((source) => {
    const artwork = artworkBySource.get(source);
    if (!artwork) return [];
    artworkBySource.delete(source);
    return [artwork];
  });

  return [...ordered, ...artworkBySource.values()];
}

function GalleryArchitecture() {
  return (
    <div className="gallery-architecture" aria-hidden="true">
      <div className="gallery-architecture__wall" />
      <div className="gallery-architecture__light" />
    </div>
  );
}

function ScaleReference({ pixelsPerInch }: { pixelsPerInch: number }) {
  return (
    <figure
      className="scale-gallery-reference"
      style={{
        width: STUDIO_STOOL_WIDTH_INCHES * pixelsPerInch,
        height: STUDIO_STOOL_HEIGHT_INCHES * pixelsPerInch,
      }}
      role="img"
      aria-label="Studio stool scale reference, 27 inches tall"
    >
      <img
        src="/gallery/studio-stool@1x.webp"
        srcSet="/gallery/studio-stool@1x.webp 1x, /gallery/studio-stool@2x.webp 2x"
        width="128"
        height="216"
        alt=""
        decoding="async"
        draggable="false"
      />
    </figure>
  );
}

type EditorialArtworkProps = {
  artwork: Artwork;
  artworkIndex: number;
  eagerCount: number;
  onOpenArtwork: (
    artwork: Artwork,
    previewSrc: string,
    trigger: HTMLButtonElement,
  ) => void;
};

function EditorialArtwork({
  artwork,
  artworkIndex,
  eagerCount,
  onOpenArtwork,
}: EditorialArtworkProps) {
  const imageSize = EDITORIAL_IMAGE_SIZES[artwork.src];
  const previewSrc =
    GRID_PREVIEWS[artwork.src] ?? artwork.scaleSrc ?? artwork.src;
  if (!imageSize) {
    throw new Error(
      `Editorial gallery is missing image dimensions for ${artwork.src}.`,
    );
  }

  return (
    <figure
      className="artwork editorial-gallery__artwork"
      data-gallery-index={artworkIndex + 1}
      style={
        {
          "--gallery-entry-delay": `${Math.min(artworkIndex, 12) * 35}ms`,
          "--artwork-aspect-ratio": imageSize.width / imageSize.height,
        } as CSSProperties
      }
    >
      <button
        className="editorial-artwork-trigger"
        type="button"
        aria-haspopup="dialog"
        aria-label={`Focus ${artworkLabel(artwork)}`}
        onClick={(event) => {
          const currentSrc =
            event.currentTarget.querySelector("img")?.currentSrc;
          const currentPath = currentSrc
            ? new URL(currentSrc, window.location.href).pathname
            : previewSrc;

          onOpenArtwork(
            artwork,
            currentPath === artwork.src
              ? artwork.src
              : currentSrc || previewSrc,
            event.currentTarget,
          );
        }}
      >
        <picture>
          {previewSrc !== artwork.src && <source srcSet={previewSrc} />}
          <img
            src={artwork.src}
            width={imageSize.width}
            height={imageSize.height}
            alt=""
            loading={artworkIndex < eagerCount ? "eager" : "lazy"}
            fetchPriority={artworkIndex === 0 ? "high" : "auto"}
            decoding="async"
          />
        </picture>
      </button>
      <ArtworkCaption artwork={artwork} />
    </figure>
  );
}

function EditorialGallery({
  artworks,
  mode,
  onOpenArtwork,
}: {
  artworks: Artwork[];
  mode: Exclude<GalleryMode, "scale">;
  onOpenArtwork: EditorialArtworkProps["onOpenArtwork"];
}) {
  const renderArtwork = (artwork: Artwork, artworkIndex: number) => (
    <EditorialArtwork
      artwork={artwork}
      artworkIndex={artworkIndex}
      eagerCount={mode === "grid" ? 2 : 1}
      key={artwork.src}
      onOpenArtwork={onOpenArtwork}
    />
  );

  if (mode === "grid") {
    return (
      <div className="compact-gallery">
        <div className="compact-gallery__grid" data-gallery-view="compact-grid">
          {artworks.map(renderArtwork)}
        </div>
      </div>
    );
  }

  return (
    <div className="editorial-gallery">
      <div className="editorial-gallery__grid" data-gallery-view="grid">
        {artworks.map(renderArtwork)}
      </div>
    </div>
  );
}

function FocusedArtworkImage({
  artwork,
  previewSrc,
}: {
  artwork: Artwork;
  previewSrc: string;
}) {
  const imageSize = EDITORIAL_IMAGE_SIZES[artwork.src];
  const hasSeparateFullResolution = previewSrc !== artwork.src;
  const [isFullResolutionReady, setIsFullResolutionReady] = useState(
    !hasSeparateFullResolution,
  );

  return (
    <div
      className={`focused-artwork-image${
        isFullResolutionReady ? " focused-artwork-image--ready" : ""
      }`}
      role="img"
      aria-label={`${artwork.title} by Hannah Gao`}
    >
      <img
        className="focused-artwork-image__preview"
        src={previewSrc}
        width={imageSize?.width}
        height={imageSize?.height}
        alt=""
        decoding="async"
      />
      {hasSeparateFullResolution && (
        <img
          className="focused-artwork-image__full"
          src={artwork.src}
          width={imageSize?.width}
          height={imageSize?.height}
          alt=""
          decoding="async"
          onLoad={(event) => {
            const fullResolutionImage = event.currentTarget;
            const revealFullResolution = () => setIsFullResolutionReady(true);
            void fullResolutionImage
              .decode()
              .then(revealFullResolution, revealFullResolution);
          }}
        />
      )}
    </div>
  );
}

export function GalleryExplorer({ artworks }: GalleryExplorerProps) {
  const sections = useMemo(() => makeGallerySections(artworks), [artworks]);
  const editorialArtworks = useMemo(
    () => orderEditorialArtworks(artworks),
    [artworks],
  );
  const galleryRef = useRef<HTMLElement>(null);
  const experienceRef = useRef<HTMLDivElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const touchOriginRef = useRef<{ x: number; y: number } | null>(null);
  const focusedCloseRef = useRef<HTMLButtonElement>(null);
  const focusedTriggerRef = useRef<HTMLButtonElement | null>(null);
  const focusedCloseTimerRef = useRef<number | null>(null);
  const [isLaptop, setIsLaptop] = useState(false);
  const [galleryView, setGalleryView] = useState<"gallery" | "grid">("gallery");
  const [sectionIndex, setSectionIndex] = useState(0);
  const [pixelsPerInch, setPixelsPerInch] = useState(4);
  const [selectedSource, setSelectedSource] = useState<string | null>(null);
  const [focusedView, setFocusedView] = useState<{
    artwork: Artwork;
    previewSrc: string;
  } | null>(null);
  const [isFocusClosing, setIsFocusClosing] = useState(false);
  const galleryMode: GalleryMode =
    isLaptop && galleryView === "gallery"
      ? "scale"
      : !isLaptop && galleryView === "grid" ? "grid" : "editorial";
  const isScaleMode = galleryMode === "scale";
  const isGridMode = galleryMode === "grid";
  const focusedArtwork = focusedView?.artwork ?? null;
  const isBodyScrollLocked = isScaleMode || focusedArtwork !== null;
  const selectedArtwork = sections[sectionIndex]?.artworks.find(
    (artwork) => artwork.src === selectedSource,
  );
  const wheelNavigation = useMemo(createWheelNavigation, [
    isScaleMode,
    focusedArtwork,
  ]);

  const clearFocusedView = useCallback(() => {
    if (focusedCloseTimerRef.current !== null) {
      window.clearTimeout(focusedCloseTimerRef.current);
      focusedCloseTimerRef.current = null;
    }
    setFocusedView(null);
    setIsFocusClosing(false);
  }, []);

  const openFocusedArtwork = useCallback(
    (artwork: Artwork, previewSrc: string, trigger: HTMLButtonElement) => {
      focusedTriggerRef.current = trigger;
      setFocusedView({ artwork, previewSrc });
    },
    [],
  );

  const closeFocusedArtwork = useCallback(() => {
    if (focusedCloseTimerRef.current !== null) return;
    const finish = () => {
      setFocusedView(null);
      setIsFocusClosing(false);
      focusedCloseTimerRef.current = null;
    };
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      finish();
      return;
    }
    setIsFocusClosing(true);
    focusedCloseTimerRef.current = window.setTimeout(finish, 360);
  }, []);

  const goToSection = useCallback(
    (next: number) => {
      const bounded = Math.min(sections.length - 1, Math.max(0, next));
      if (bounded === sectionIndex || bounded < 0) return;
      if (galleryRef.current?.contains(document.activeElement)) {
        galleryRef.current.focus({ preventScroll: true });
      }
      setSectionIndex(bounded);
      setSelectedSource(null);
    },
    [sections.length, sectionIndex],
  );

  useEffect(() => {
    if (!isBodyScrollLocked) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isBodyScrollLocked]);

  useEffect(() => {
    const focusTarget = focusedArtwork
      ? focusedCloseRef.current
      : focusedTriggerRef.current;
    if (!focusTarget) return;

    if (!focusedArtwork) focusedTriggerRef.current = null;
    const frame = window.requestAnimationFrame(() => {
      focusTarget.focus({ preventScroll: true });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [focusedArtwork]);

  useLayoutEffect(() => {
    const media = window.matchMedia(LAPTOP_MEDIA_QUERY);
    let focusFrame = 0;
    setIsLaptop(media.matches);
    const handleWidthChange = (event: MediaQueryListEvent) => {
      setIsLaptop(event.matches);
      setGalleryView("gallery");
      setSectionIndex(0);
      setSelectedSource(null);
      focusedTriggerRef.current = null;
      clearFocusedView();
      window.cancelAnimationFrame(focusFrame);
      focusFrame = window.requestAnimationFrame(() => {
        galleryRef.current?.focus({ preventScroll: true });
      });
    };
    media.addEventListener("change", handleWidthChange);
    return () => {
      media.removeEventListener("change", handleWidthChange);
      window.cancelAnimationFrame(focusFrame);
    };
  }, [clearFocusedView]);

  useLayoutEffect(() => {
    if (!isScaleMode) return;
    let frame = 0;
    const updateScale = () => {
      setPixelsPerInch(
        getPixelsPerInch(sections, window.innerWidth, window.innerHeight),
      );
    };
    const handleResize = () => {
      window.cancelAnimationFrame(frame);
      frame = window.requestAnimationFrame(updateScale);
    };
    updateScale();
    window.addEventListener("resize", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.cancelAnimationFrame(frame);
    };
  }, [isScaleMode, sections]);

  const handleWheel = useEffectEvent((event: WheelEvent) => {
    if (event.ctrlKey) return;
    event.preventDefault();
    const step = wheelNavigation(event, window.innerHeight);
    if (step !== 0) goToSection(sectionIndex + step);
  });

  useEffect(() => {
    if (!isScaleMode || focusedArtwork) return;
    const gallery = experienceRef.current;
    if (!gallery) return;
    const listener = (event: WheelEvent) => handleWheel(event);
    gallery.addEventListener("wheel", listener, { passive: false });
    return () => gallery.removeEventListener("wheel", listener);
  }, [isScaleMode, focusedArtwork]);

  useEffect(() => () => {
    if (focusedCloseTimerRef.current !== null) {
      window.clearTimeout(focusedCloseTimerRef.current);
    }
  }, []);

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (!isScaleMode) return;

    if (event.key === "Escape") {
      event.preventDefault();
      setGalleryView("grid");
      toggleRef.current?.focus({ preventScroll: true });
      return;
    }

    if (event.key === "ArrowRight" || event.key === "PageDown") {
      event.preventDefault();
      goToSection(sectionIndex + 1);
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "PageUp") {
      event.preventDefault();
      goToSection(sectionIndex - 1);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      goToSection(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      goToSection(sections.length - 1);
    }
  };

  const trackStyle = {
    transform: `translateX(${-sectionIndex * 100}%)`,
  } satisfies CSSProperties;
  const galleryToggleLabel =
    galleryView === "gallery" ? "grid" : "gallery";

  return (
    <div
      ref={experienceRef}
      className={`gallery-experience${
        isScaleMode ? " gallery-experience--scale" : ""
      }${
        galleryView === "grid" ? " gallery-experience--grid" : ""
      }${focusedArtwork ? " gallery-experience--focus" : ""}`}
      onClickCapture={() => setSelectedSource(null)}
    >
      <SiteHeader
        currentPage="gallery"
        isInert={focusedArtwork !== null}
        galleryControl={
          <button
            ref={toggleRef}
            className="gallery-mode-toggle"
            type="button"
            aria-controls="gallery"
            aria-label={`Switch to ${galleryToggleLabel} view`}
            onClick={() => {
              setGalleryView(galleryToggleLabel);
              setSectionIndex(0);
              setSelectedSource(null);
              if (galleryToggleLabel === "gallery" && isLaptop) {
                galleryRef.current?.focus({ preventScroll: true });
              }
            }}
          >
            {galleryToggleLabel}
          </button>
        }
      />

      <main
        id="gallery"
        ref={galleryRef}
        className={`gallery${
          isScaleMode
            ? " gallery--scale"
            : isGridMode
              ? " gallery--grid"
              : " gallery--editorial"
        }`}
        tabIndex={-1}
        inert={focusedArtwork !== null}
        aria-hidden={focusedArtwork ? true : undefined}
        aria-label={
          isScaleMode
            ? "Artworks shown at relative scale"
            : isGridMode
              ? "Artworks shown in a compact grid"
              : galleryView === "grid"
                ? "Artwork grid"
                : "Artwork gallery"
        }
        onKeyDown={handleKeyDown}
        style={isScaleMode ? {
          "--studio-stool-width": `${STUDIO_STOOL_WIDTH_INCHES * pixelsPerInch}px`,
        } as CSSProperties : undefined}
        onTouchStart={(event) => {
          const touch = event.touches[0];
          if (isScaleMode && touch) {
            touchOriginRef.current = { x: touch.clientX, y: touch.clientY };
          }
        }}
        onTouchEnd={(event) => {
          const touch = event.changedTouches[0];
          const origin = touchOriginRef.current;
          touchOriginRef.current = null;
          if (!isScaleMode || !origin || !touch) return;
          const dx = touch.clientX - origin.x;
          const dy = touch.clientY - origin.y;
          if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
            goToSection(sectionIndex + (dx < 0 ? 1 : -1));
          }
        }}
      >
        {isScaleMode && <GalleryArchitecture />}

        {isScaleMode ? (
          <div className="scale-gallery-track" style={trackStyle}>
            {sections.map((section, index) => (
              <section
                className={`scale-gallery-room${section.isSalon ? " scale-gallery-room--salon" : ""}`}
                id={`gallery-section-${section.id}`}
                key={section.id}
                aria-label={`${section.title}, section ${index + 1} of ${sections.length}`}
                aria-hidden={index !== sectionIndex}
                inert={index !== sectionIndex}
              >
                <div
                  className="scale-gallery-wall"
                  style={{
                    gap: (section.isSalon ? 5.5 : ARTWORK_GAP_INCHES) * pixelsPerInch,
                  }}
                >
                  {section.artworks.map((artwork) => (
                    <figure
                      className={`scale-artwork${
                        selectedSource === artwork.src ? " scale-artwork--selected" : ""
                      }`}
                      key={artwork.src}
                    >
                      <button
                        type="button"
                        aria-haspopup="dialog"
                        aria-label={`Focus ${artworkLabel(artwork)}`}
                        style={{
                          width: artworkDisplaySize(artwork).width * pixelsPerInch,
                          height: artworkDisplaySize(artwork).height * pixelsPerInch,
                        }}
                        onPointerEnter={() => {
                          if (selectedSource && selectedSource !== artwork.src) {
                            setSelectedSource(null);
                          }
                        }}
                        onClick={(event) =>
                          openFocusedArtwork(
                            artwork,
                            scalePreviewSource(artwork),
                            event.currentTarget,
                          )
                        }
                      >
                        <img
                          src={scalePreviewSource(artwork)}
                          alt=""
                          loading={
                            Math.abs(index - sectionIndex) <= 1 ? "eager" : "lazy"
                          }
                          fetchPriority={index === sectionIndex ? "high" : "low"}
                          decoding="async"
                        />
                      </button>
                      <figcaption
                        className="scale-artwork-title"
                        aria-hidden="true"
                      >
                        <span className="scale-artwork-title__name">
                          {artwork.title}
                        </span>
                        <span className="scale-artwork-title__details">
                          {[
                            artwork.medium,
                            artwork.width !== null && artwork.height !== null
                              ? `${artwork.width} × ${artwork.height} in`
                              : null,
                            artwork.year,
                          ]
                            .filter(Boolean)
                            .join(" · ")}
                        </span>
                      </figcaption>
                    </figure>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          <EditorialGallery
            mode={isGridMode ? "grid" : "editorial"}
            artworks={editorialArtworks}
            onOpenArtwork={openFocusedArtwork}
          />
        )}

        {isScaleMode && <ScaleReference pixelsPerInch={pixelsPerInch} />}
      </main>

      {isScaleMode && (
        <div
          inert={focusedArtwork !== null}
          aria-hidden={focusedArtwork ? true : undefined}
        >
          <GalleryNavigator
            sections={sections}
            sectionIndex={sectionIndex}
            selectedSource={selectedSource}
            getPreviewSource={scalePreviewSource}
            imageSizes={EDITORIAL_IMAGE_SIZES}
            onSelect={(artwork, nextSectionIndex) => {
              goToSection(nextSectionIndex);
              setSelectedSource(artwork.src);
            }}
          />
        </div>
      )}

      {focusedView && (
        <section
          className={`focused-artwork-overlay${
            isFocusClosing ? " focused-artwork-overlay--closing" : ""
          }`}
          role="dialog"
          aria-modal="true"
          aria-label={`${focusedView.artwork.title} focused view`}
          onPointerDown={(event) => {
            if (event.target === event.currentTarget) closeFocusedArtwork();
          }}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              event.preventDefault();
              closeFocusedArtwork();
            } else if (event.key === "Tab") {
              event.preventDefault();
              focusedCloseRef.current?.focus();
            }
          }}
        >
          <button
            ref={focusedCloseRef}
            className="focused-artwork-close"
            type="button"
            aria-label="Close focused artwork"
            disabled={isFocusClosing}
            onClick={closeFocusedArtwork}
          >
            close
          </button>

          <figure className="focused-artwork">
            <FocusedArtworkImage
              key={focusedView.artwork.src}
              artwork={focusedView.artwork}
              previewSrc={focusedView.previewSrc}
            />
            <ArtworkCaption artwork={focusedView.artwork} />
          </figure>
        </section>
      )}

      <p className="visually-hidden" aria-live="polite">
        {focusedArtwork
          ? `${focusedArtwork.title} focused. Press Escape to close.`
          : isScaleMode
            ? selectedArtwork
              ? `${selectedArtwork.title}. ${sections[sectionIndex]?.title}, section ${sectionIndex + 1} of ${sections.length}.`
              : `${sections[sectionIndex]?.title}, section ${sectionIndex + 1} of ${sections.length}.`
            : isGridMode || galleryView === "grid"
              ? "Artwork grid opened."
              : "Gallery opened."}
      </p>
    </div>
  );
}
