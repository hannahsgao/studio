"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type KeyboardEvent as ReactKeyboardEvent,
} from "react";
import { ArtworkCaption } from "./artwork-caption";
import type { Artwork } from "./artworks";
import { SiteHeader } from "./site-header";

const TARGET_WORKS_PER_WALL = 7;
const ARTWORK_GAP_INCHES = 14;
const MAX_PIXELS_PER_INCH = 5;
const MIN_LAPTOP_WIDTH = 900;
const LAPTOP_MEDIA_QUERY = `(min-width: ${MIN_LAPTOP_WIDTH}px)`;

type GalleryMode = "standard" | "grid" | "scale";

type GalleryExplorerProps = {
  artworks: Artwork[];
};

type ScaleRoom = {
  artworks: Artwork[];
  widthInches: number;
  heightInches: number;
  yearLabel: string;
};

type RoomPartition = {
  cost: number;
  sizes: number[];
};

function artworkSpan(artworks: Artwork[]) {
  return artworks.reduce(
    (sum, artwork, index) =>
      sum +
      (artwork.width ?? 0) +
      (index > 0 ? ARTWORK_GAP_INCHES : 0),
    0,
  );
}

function balanceRoomSizes(artworks: Artwork[], roomCount: number) {
  const averageCount = artworks.length / roomCount;
  const minCount = Math.max(1, Math.floor(averageCount) - 1);
  const maxCount = Math.ceil(averageCount) + 1;
  const targetSpan =
    (artworks.reduce((sum, artwork) => sum + (artwork.width ?? 0), 0) +
      (artworks.length - roomCount) * ARTWORK_GAP_INCHES) /
    roomCount;
  const memo = new Map<string, RoomPartition | null>();

  const solve = (start: number, roomsLeft: number): RoomPartition | null => {
    const key = `${start}-${roomsLeft}`;
    if (memo.has(key)) return memo.get(key) ?? null;

    const remaining = artworks.length - start;
    if (roomsLeft === 1) {
      if (remaining < minCount || remaining > maxCount) return null;
      const span = artworkSpan(artworks.slice(start));
      return { cost: (span - targetSpan) ** 2, sizes: [remaining] };
    }

    let best: RoomPartition | null = null;
    for (let count = minCount; count <= maxCount; count += 1) {
      const after = remaining - count;
      if (
        after < (roomsLeft - 1) * minCount ||
        after > (roomsLeft - 1) * maxCount
      ) {
        continue;
      }

      const rest = solve(start + count, roomsLeft - 1);
      if (!rest) continue;
      const span = artworkSpan(artworks.slice(start, start + count));
      const candidate = {
        cost: (span - targetSpan) ** 2 + rest.cost,
        sizes: [count, ...rest.sizes],
      };
      if (!best || candidate.cost < best.cost) best = candidate;
    }

    memo.set(key, best);
    return best;
  };

  return solve(0, roomCount)?.sizes ?? [artworks.length];
}

function makeScaleRooms(artworks: Artwork[]): ScaleRoom[] {
  const dimensioned = artworks.filter(
    (artwork) =>
      artwork.width !== null &&
      artwork.height !== null &&
      artwork.scaleView !== false,
  );
  if (dimensioned.length === 0) return [];

  const roomCount = Math.ceil(dimensioned.length / TARGET_WORKS_PER_WALL);
  const roomSizes = balanceRoomSizes(dimensioned, roomCount);
  let start = 0;
  const roomArtworks = roomSizes.map((roomSize) => {
    const group = dimensioned.slice(start, start + roomSize);
    start += roomSize;
    return group;
  });
  const validOverrides = dimensioned.filter(
    (artwork) =>
      artwork.scalePage !== undefined &&
      Number.isInteger(artwork.scalePage) &&
      artwork.scalePage >= 1 &&
      artwork.scalePage <= roomCount,
  );
  const overriddenSources = new Set(
    validOverrides.map((artwork) => artwork.src),
  );
  const chronologicalIndex = new Map(
    dimensioned.map((artwork, index) => [artwork.src, index]),
  );

  for (const group of roomArtworks) {
    const retained = group.filter(
      (artwork) => !overriddenSources.has(artwork.src),
    );
    group.splice(0, group.length, ...retained);
  }

  for (const artwork of validOverrides) {
    roomArtworks[(artwork.scalePage ?? 1) - 1].push(artwork);
  }

  for (const group of roomArtworks) {
    group.sort(
      (a, b) =>
        (chronologicalIndex.get(a.src) ?? 0) -
        (chronologicalIndex.get(b.src) ?? 0),
    );
  }

  return roomArtworks.map((group) => {
    const years = [...new Set(group.map((artwork) => artwork.year))];

    return {
      artworks: group,
      widthInches: artworkSpan(group),
      heightInches: Math.max(
        ...group.map((artwork) => artwork.height ?? 0),
      ),
      yearLabel:
        years.length > 1 ? `${years[0]}—${years.at(-1)}` : years[0] ?? "",
    };
  });
}

function getPixelsPerInch(rooms: ScaleRoom[]) {
  const sideGutter = Math.max(52, Math.min(84, window.innerWidth * 0.06));
  const availableWidth = window.innerWidth - sideGutter * 2;
  const availableHeight = window.innerHeight - 250;
  const widestRoom = Math.max(...rooms.map((room) => room.widthInches));
  const tallestWork = Math.max(...rooms.map((room) => room.heightInches));

  return Math.max(
    1,
    Math.min(
      MAX_PIXELS_PER_INCH,
      availableWidth / widestRoom,
      availableHeight / tallestWork,
    ),
  );
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

function getGridPreviewSrc(artwork: Artwork) {
  return artwork.src
    .replace(/^\/artwork\//, "/artwork/grid/")
    .replace(/\.[^/.]+$/, ".webp");
}

function FocusedArtworkImage({
  artwork,
  previewSrc,
}: {
  artwork: Artwork;
  previewSrc: string;
}) {
  const [displaySrc, setDisplaySrc] = useState(previewSrc);

  useEffect(() => {
    setDisplaySrc(previewSrc);
    if (previewSrc === artwork.src) return;

    let cancelled = false;
    const fullResolutionImage = new Image();
    fullResolutionImage.decoding = "async";
    fullResolutionImage.src = artwork.src;

    void fullResolutionImage.decode().then(
      () => {
        if (!cancelled) setDisplaySrc(artwork.src);
      },
      () => {
        if (
          !cancelled &&
          fullResolutionImage.complete &&
          fullResolutionImage.naturalWidth > 0
        ) {
          setDisplaySrc(artwork.src);
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [artwork.src, previewSrc]);

  return (
    <img
      src={displaySrc}
      alt={`${artwork.title} by Hannah Gao`}
      decoding="async"
    />
  );
}

export function GalleryExplorer({ artworks }: GalleryExplorerProps) {
  const rooms = useMemo(() => makeScaleRooms(artworks), [artworks]);
  const galleryRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const pendingFocusRef = useRef<"toggle" | "gallery" | null>(null);
  const galleryModeRef = useRef<GalleryMode>("standard");
  const wheelLockRef = useRef(false);
  const wheelResetRef = useRef<number | null>(null);
  const focusedCloseRef = useRef<HTMLButtonElement>(null);
  const focusedTriggerRef = useRef<HTMLButtonElement | null>(null);
  const focusedCloseTimerRef = useRef<number | null>(null);
  const [galleryMode, setGalleryMode] = useState<GalleryMode>("standard");
  const [roomIndex, setRoomIndex] = useState(0);
  const [pixelsPerInch, setPixelsPerInch] = useState(4);
  const [activeArtwork, setActiveArtwork] = useState<Artwork | null>(null);
  const [focusedArtwork, setFocusedArtwork] = useState<Artwork | null>(null);
  const [focusedPreviewSrc, setFocusedPreviewSrc] = useState<string | null>(
    null,
  );
  const [isFocusClosing, setIsFocusClosing] = useState(false);
  const isScaleMode = galleryMode === "scale";
  const isGridMode = galleryMode === "grid";
  const isAlternateMode = galleryMode !== "standard";
  const isBodyScrollLocked = isScaleMode || focusedArtwork !== null;

  const openFocusedArtwork = useCallback(
    (artwork: Artwork, previewSrc: string, trigger: HTMLButtonElement) => {
      focusedTriggerRef.current = trigger;
      setFocusedPreviewSrc(previewSrc);
      setFocusedArtwork(artwork);
    },
    [],
  );

  const closeFocusedArtwork = useCallback(() => {
    if (isFocusClosing) return;

    const finish = () => {
      setFocusedArtwork(null);
      setFocusedPreviewSrc(null);
      setIsFocusClosing(false);
      focusedCloseTimerRef.current = null;
      window.requestAnimationFrame(() => {
        focusedTriggerRef.current?.focus({ preventScroll: true });
      });
    };
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      finish();
      return;
    }

    setIsFocusClosing(true);
    focusedCloseTimerRef.current = window.setTimeout(finish, 240);
  }, [isFocusClosing]);

  const setRoom = useCallback(
    (nextRoom: number) => {
      const boundedRoom = Math.min(rooms.length - 1, Math.max(0, nextRoom));
      setRoomIndex(boundedRoom);
      setActiveArtwork(null);
      setFocusedArtwork(null);
    },
    [rooms.length],
  );

  const commitGalleryMode = useCallback(
    (next: GalleryMode) => {
      if (next === "scale") {
        setPixelsPerInch(getPixelsPerInch(rooms));
        setRoomIndex(0);
        setActiveArtwork(null);
      } else {
        if (focusedCloseTimerRef.current !== null) {
          window.clearTimeout(focusedCloseTimerRef.current);
          focusedCloseTimerRef.current = null;
        }
        setFocusedArtwork(null);
        setFocusedPreviewSrc(null);
        setIsFocusClosing(false);
        focusedTriggerRef.current = null;
      }
      galleryModeRef.current = next;
      setGalleryMode(next);
    },
    [rooms],
  );

  const updateGalleryMode = useCallback(
    (next: GalleryMode) => {
      if (next === galleryModeRef.current) return;
      commitGalleryMode(next);
    },
    [commitGalleryMode],
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
    if (!isScaleMode) return;

    document.body.classList.add("scale-gallery-is-open");
    galleryRef.current?.focus({ preventScroll: true });

    return () => {
      document.body.classList.remove("scale-gallery-is-open");
    };
  }, [isScaleMode]);

  useEffect(() => {
    if (!focusedArtwork) return;
    window.requestAnimationFrame(() => {
      focusedCloseRef.current?.focus({ preventScroll: true });
    });
  }, [focusedArtwork]);

  useEffect(() => {
    if (galleryMode !== "standard" || pendingFocusRef.current === null) return;

    const target = pendingFocusRef.current;
    pendingFocusRef.current = null;
    window.requestAnimationFrame(() => {
      if (target === "toggle") toggleRef.current?.focus();
      else galleryRef.current?.focus({ preventScroll: true });
    });
  }, [galleryMode]);

  useEffect(() => {
    const media = window.matchMedia(LAPTOP_MEDIA_QUERY);
    const handleWidthChange = (event: MediaQueryListEvent) => {
      const activeMode = galleryModeRef.current;
      const isModeOutsideItsViewport = event.matches
        ? activeMode === "grid"
        : activeMode === "scale";

      if (isModeOutsideItsViewport) {
        pendingFocusRef.current = "gallery";
        commitGalleryMode("standard");
      }
    };

    media.addEventListener("change", handleWidthChange);
    return () => media.removeEventListener("change", handleWidthChange);
  }, [commitGalleryMode]);

  useEffect(() => {
    if (!isScaleMode) return;

    const handleResize = () => setPixelsPerInch(getPixelsPerInch(rooms));
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isScaleMode, rooms]);

  useEffect(() => {
    if (!isScaleMode) return;
    const gallery = galleryRef.current;
    if (!gallery) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      if (wheelLockRef.current) return;

      const delta =
        Math.abs(event.deltaX) > Math.abs(event.deltaY)
          ? event.deltaX
          : event.deltaY;
      if (Math.abs(delta) < 24) return;

      wheelLockRef.current = true;
      setRoom(roomIndex + (delta > 0 ? 1 : -1));
      if (wheelResetRef.current !== null) {
        window.clearTimeout(wheelResetRef.current);
      }
      wheelResetRef.current = window.setTimeout(() => {
        wheelLockRef.current = false;
        wheelResetRef.current = null;
      }, 720);
    };

    gallery.addEventListener("wheel", handleWheel, { passive: false });
    return () => gallery.removeEventListener("wheel", handleWheel);
  }, [isScaleMode, roomIndex, setRoom]);

  useEffect(
    () => () => {
      if (wheelResetRef.current !== null) {
        window.clearTimeout(wheelResetRef.current);
      }
      if (focusedCloseTimerRef.current !== null) {
        window.clearTimeout(focusedCloseTimerRef.current);
      }
    },
    [],
  );

  const handleKeyDown = (event: ReactKeyboardEvent<HTMLElement>) => {
    if (!isScaleMode) return;

    if (event.key === "Escape") {
      event.preventDefault();
      pendingFocusRef.current = "toggle";
      updateGalleryMode("standard");
      return;
    }

    if (event.key === "ArrowRight" || event.key === "PageDown") {
      event.preventDefault();
      setRoom(roomIndex + 1);
      return;
    }

    if (event.key === "ArrowLeft" || event.key === "PageUp") {
      event.preventDefault();
      setRoom(roomIndex - 1);
      return;
    }

    if (event.key === "Home") {
      event.preventDefault();
      setRoom(0);
      return;
    }

    if (event.key === "End") {
      event.preventDefault();
      setRoom(rooms.length - 1);
    }
  };

  const renderGridArtwork = (artwork: Artwork, index: number) => {
    const gridPreviewSrc = getGridPreviewSrc(artwork);

    return (
      <figure className="artwork" key={artwork.src}>
        <button
          className="grid-artwork-trigger"
          type="button"
          aria-label={`Focus ${artworkLabel(artwork)}`}
          onClick={(event) =>
            openFocusedArtwork(artwork, gridPreviewSrc, event.currentTarget)
          }
        >
          <img
            src={gridPreviewSrc}
            alt=""
            loading={index < 2 ? "eager" : "lazy"}
            fetchPriority={index === 0 ? "high" : "auto"}
            decoding="async"
          />
        </button>
        <ArtworkCaption artwork={artwork} />
      </figure>
    );
  };

  const currentRoom = rooms[roomIndex];
  const trackStyle = {
    transform: `translateX(${-roomIndex * 100}%)`,
  } satisfies CSSProperties;

  return (
    <div
      className={`gallery-experience${
        isGridMode ? " gallery-experience--grid" : ""
      }${focusedArtwork ? " gallery-experience--focus" : ""}`}
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
            aria-pressed={isAlternateMode}
            aria-label={
              isAlternateMode ? "Return to the standard gallery" : undefined
            }
            onClick={() => {
              if (isAlternateMode) {
                updateGalleryMode("standard");
                return;
              }

              updateGalleryMode(
                window.matchMedia(LAPTOP_MEDIA_QUERY).matches
                  ? "scale"
                  : "grid",
              );
            }}
          >
            {isAlternateMode ? (
              "standard"
            ) : (
              <>
                <span className="gallery-mode-label--mobile">grid</span>
                <span className="gallery-mode-label--desktop">to scale</span>
              </>
            )}
          </button>
        }
      />

      <main
        id="gallery"
        ref={galleryRef}
        className={`gallery${
          isScaleMode ? " gallery--scale" : isGridMode ? " gallery--grid" : ""
        }`}
        tabIndex={-1}
        inert={focusedArtwork !== null}
        aria-hidden={focusedArtwork ? true : undefined}
        aria-label={
          isScaleMode
            ? "Artworks shown at relative scale"
            : isGridMode
              ? "Artworks shown in a grid"
              : undefined
        }
        onKeyDown={handleKeyDown}
      >
        {isScaleMode ? (
          <div
            className="scale-gallery-track"
            style={trackStyle}
          >
            {rooms.map((room, index) => (
              <section
                className="scale-gallery-room"
                key={`${room.yearLabel}-${index}`}
                aria-label={`Gallery wall ${index + 1} of ${rooms.length}, ${room.yearLabel}`}
                aria-hidden={index !== roomIndex}
                inert={index !== roomIndex}
              >
                <div
                  className="scale-gallery-wall"
                  style={{ gap: ARTWORK_GAP_INCHES * pixelsPerInch }}
                >
                  {room.artworks.map((artwork) => (
                    <figure className="scale-artwork" key={artwork.src}>
                      <button
                        type="button"
                        aria-label={`Focus ${artworkLabel(artwork)}`}
                        style={{
                          width: (artwork.width ?? 0) * pixelsPerInch,
                          height: (artwork.height ?? 0) * pixelsPerInch,
                        }}
                        onFocus={() => setActiveArtwork(artwork)}
                        onPointerEnter={() => setActiveArtwork(artwork)}
                        onClick={(event) => {
                          openFocusedArtwork(
                            artwork,
                            artwork.scaleSrc ?? artwork.src,
                            event.currentTarget,
                          );
                        }}
                      >
                        <img
                          src={artwork.scaleSrc ?? artwork.src}
                          alt=""
                          loading={
                            Math.abs(index - roomIndex) <= 1 ? "eager" : "lazy"
                          }
                          fetchPriority={index === roomIndex ? "high" : "low"}
                          decoding="async"
                        />
                      </button>
                    </figure>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : isGridMode ? (
          <>
            {[0, 1].map((columnIndex) => (
              <div className="grid-artwork-column" key={columnIndex}>
                {artworks.map((artwork, index) =>
                  index % 2 === columnIndex
                    ? renderGridArtwork(artwork, index)
                    : null,
                )}
              </div>
            ))}
          </>
        ) : (
          artworks.map((artwork, index) => {
            const loading = index < 2 ? "eager" : "lazy";
            const fetchPriority = index === 0 ? "high" : "auto";

            return (
              <figure className="artwork" key={artwork.src}>
                <img
                  src={artwork.src}
                  alt={`${artwork.title} by Hannah Gao`}
                  loading={loading}
                  fetchPriority={fetchPriority}
                  decoding="async"
                  style={
                    artwork.displayScale
                      ? { width: `${artwork.displayScale * 100}%` }
                      : undefined
                  }
                />
                <ArtworkCaption artwork={artwork} />
              </figure>
            );
          })
        )}

        {isScaleMode && (
          <>
            <div className="scale-gallery-status">
              {activeArtwork ? (
                <>
                  <strong>{activeArtwork.title}</strong>
                  <span>
                    {[activeArtwork.medium,
                      activeArtwork.width !== null &&
                      activeArtwork.height !== null
                        ? `${activeArtwork.width} × ${activeArtwork.height} in`
                        : null,
                      activeArtwork.year]
                      .filter(Boolean)
                      .join(" · ")}
                  </span>
                </>
              ) : (
                <>
                  <strong>{currentRoom.yearLabel}</strong>
                  <span>scroll or use arrow keys</span>
                </>
              )}
            </div>

            <nav
              className="scale-gallery-controls"
              aria-label="Gallery wall navigation"
            >
              <button
                type="button"
                aria-label="Previous gallery wall"
                disabled={roomIndex === 0}
                onClick={() => setRoom(roomIndex - 1)}
              >
                <svg
                  className="scale-gallery-chevron"
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M10.25 3.5 5.75 8l4.5 4.5" />
                </svg>
              </button>
              <span>
                {String(roomIndex + 1).padStart(2, "0")} /{" "}
                {String(rooms.length).padStart(2, "0")}
              </span>
              <button
                type="button"
                aria-label="Next gallery wall"
                disabled={roomIndex === rooms.length - 1}
                onClick={() => setRoom(roomIndex + 1)}
              >
                <svg
                  className="scale-gallery-chevron"
                  viewBox="0 0 16 16"
                  aria-hidden="true"
                  focusable="false"
                >
                  <path d="M5.75 3.5 10.25 8l-4.5 4.5" />
                </svg>
              </button>
            </nav>
          </>
        )}
      </main>

      {focusedArtwork && focusedPreviewSrc && (
        <section
          className={`focused-artwork-overlay${
            isFocusClosing ? " focused-artwork-overlay--closing" : ""
          }`}
          role="dialog"
          aria-modal="true"
          aria-label={`${focusedArtwork.title} focused view`}
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
              artwork={focusedArtwork}
              previewSrc={focusedPreviewSrc}
            />
            <ArtworkCaption artwork={focusedArtwork} />
          </figure>
        </section>
      )}

      <p className="visually-hidden" aria-live="polite">
        {focusedArtwork
          ? `${focusedArtwork.title} focused. Press Escape to close.`
          : isScaleMode
            ? activeArtwork
              ? `${activeArtwork.title}. Wall ${roomIndex + 1} of ${rooms.length}, ${currentRoom.yearLabel}.`
              : `Wall ${roomIndex + 1} of ${rooms.length}, ${currentRoom.yearLabel}.`
            : isGridMode
              ? "Grid gallery opened."
              : "Standard gallery opened."}
      </p>
    </div>
  );
}
