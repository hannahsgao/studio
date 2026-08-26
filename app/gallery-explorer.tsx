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
const EDITORIAL_WORKS_PER_ROOM = 4;

const FEATURED_EDITORIAL_SOURCES = [
  "/artwork/rising.jpg",
  "/artwork/heritage.jpg",
  "/artwork/bastion.jpg",
  "/artwork/cozy.jpg",
] as const;

const EDITORIAL_PREVIEWS: Record<
  (typeof FEATURED_EDITORIAL_SOURCES)[number],
  { src: string; width: number; height: number }
> = {
  "/artwork/rising.jpg": {
    src: "/artwork/editorial/rising-640.webp",
    width: 640,
    height: 1246,
  },
  "/artwork/heritage.jpg": {
    src: "/artwork/editorial/heritage-520.webp",
    width: 520,
    height: 682,
  },
  "/artwork/bastion.jpg": {
    src: "/artwork/editorial/bastion-480.webp",
    width: 480,
    height: 611,
  },
  "/artwork/cozy.jpg": {
    src: "/artwork/editorial/cozy-640.webp",
    width: 640,
    height: 466,
  },
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
  "/artwork/fresh-closeup.jpg": { width: 1500, height: 2000 },
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
  "/artwork/tiedup.jpg": { width: 990, height: 2000 },
  "/artwork/unravel.jpg": { width: 1341, height: 2000 },
  "/artwork/wash.jpg": { width: 1984, height: 2000 },
};

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

type GalleryReferenceObject = {
  id: string;
  nominalWidthInches: number;
  nominalHeightInches: number;
  editorialImage1x: string;
  editorialImage2x: string;
  calibratedImage1x: string;
  calibratedImage2x: string;
};

const STUDIO_STOOL: GalleryReferenceObject = {
  id: "stanford-studio-stool",
  nominalWidthInches: 16,
  nominalHeightInches: 27,
  editorialImage1x: "/gallery/studio-stool@1x.webp",
  editorialImage2x: "/gallery/studio-stool@2x.webp",
  calibratedImage1x: "/gallery/studio-stool-scale@1x.webp",
  calibratedImage2x: "/gallery/studio-stool-scale@2x.webp",
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

function makeEditorialRooms(artworks: Artwork[]) {
  const artworksBySource = new Map(
    artworks.map((artwork) => [artwork.src, artwork]),
  );
  const featured = FEATURED_EDITORIAL_SOURCES.flatMap((source) => {
    const artwork = artworksBySource.get(source);
    return artwork ? [artwork] : [];
  });
  const featuredSources = new Set(featured.map((artwork) => artwork.src));
  const ordered = [
    ...featured,
    ...artworks.filter((artwork) => !featuredSources.has(artwork.src)),
  ];

  if (
    ordered.length !== artworks.length ||
    new Set(ordered.map((artwork) => artwork.src)).size !== artworks.length
  ) {
    throw new Error("Editorial gallery requires unique artwork sources.");
  }

  return Array.from(
    { length: Math.ceil(ordered.length / EDITORIAL_WORKS_PER_ROOM) },
    (_, roomIndex) =>
      ordered.slice(
        roomIndex * EDITORIAL_WORKS_PER_ROOM,
        (roomIndex + 1) * EDITORIAL_WORKS_PER_ROOM,
      ),
  );
}

function GalleryArchitecture() {
  return (
    <div className="gallery-architecture" aria-hidden="true">
      <div className="gallery-architecture__wall" />
      <div className="gallery-architecture__light" />
      <div className="gallery-architecture__floor" />
    </div>
  );
}

function EditorialGallery({
  artworks,
  referenceObject,
}: {
  artworks: Artwork[];
  referenceObject: GalleryReferenceObject | null;
}) {
  const rooms = makeEditorialRooms(artworks);

  return (
    <div className="editorial-gallery">
      {referenceObject && (
        <div
          className="editorial-gallery__reference"
          aria-hidden="true"
          style={
            {
              aspectRatio: `${referenceObject.nominalWidthInches} / ${referenceObject.nominalHeightInches}`,
              "--reference-image-1x": `url("${referenceObject.editorialImage1x}")`,
              "--reference-image-2x": `url("${referenceObject.editorialImage2x}")`,
            } as CSSProperties
          }
        />
      )}

      <div className="editorial-gallery__rooms">
        {rooms.map((room, roomIndex) => (
          <section
            className="editorial-gallery__room"
            key={`editorial-room-${roomIndex + 1}`}
            aria-label={`Editorial gallery room ${roomIndex + 1} of ${rooms.length}`}
            data-artwork-count={room.length}
          >
            <div className="editorial-gallery__paintings">
              {room.map((artwork, artworkIndex) => {
                const preview =
                  EDITORIAL_PREVIEWS[
                    artwork.src as keyof typeof EDITORIAL_PREVIEWS
                  ];
                const imageSize =
                  preview ?? EDITORIAL_IMAGE_SIZES[artwork.src];

                if (!imageSize) {
                  throw new Error(
                    `Editorial gallery is missing image dimensions for ${artwork.src}.`,
                  );
                }

                return (
                  <figure
                    className="artwork editorial-gallery__artwork"
                    key={artwork.src}
                  >
                    <img
                      src={preview?.src ?? artwork.src}
                      width={imageSize.width}
                      height={imageSize.height}
                      alt={`${artwork.title} by Hannah Gao`}
                      loading={roomIndex === 0 ? "eager" : "lazy"}
                      fetchPriority={
                        roomIndex === 0 && artworkIndex === 0 ? "high" : "auto"
                      }
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
              })}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function FocusedArtworkImage({ artwork }: { artwork: Artwork }) {
  const previewSrc = artwork.scaleSrc ?? artwork.src;
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
  const scaleModeRef = useRef(false);
  const wheelLockRef = useRef(false);
  const wheelResetRef = useRef<number | null>(null);
  const focusedCloseRef = useRef<HTMLButtonElement>(null);
  const focusedTriggerRef = useRef<HTMLButtonElement | null>(null);
  const focusedCloseTimerRef = useRef<number | null>(null);
  const [isScaleMode, setIsScaleMode] = useState(false);
  const [roomIndex, setRoomIndex] = useState(0);
  const [pixelsPerInch, setPixelsPerInch] = useState(4);
  const [activeArtwork, setActiveArtwork] = useState<Artwork | null>(null);
  const [focusedArtwork, setFocusedArtwork] = useState<Artwork | null>(null);
  const [isFocusClosing, setIsFocusClosing] = useState(false);

  const closeFocusedArtwork = useCallback(() => {
    if (isFocusClosing) return;

    const finish = () => {
      setFocusedArtwork(null);
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

  const commitScaleMode = useCallback(
    (next: boolean) => {
      if (next) {
        setPixelsPerInch(getPixelsPerInch(rooms));
        setRoomIndex(0);
        setActiveArtwork(null);
      } else {
        if (focusedCloseTimerRef.current !== null) {
          window.clearTimeout(focusedCloseTimerRef.current);
          focusedCloseTimerRef.current = null;
        }
        setFocusedArtwork(null);
        setIsFocusClosing(false);
        focusedTriggerRef.current = null;
      }
      scaleModeRef.current = next;
      setIsScaleMode(next);
    },
    [rooms],
  );

  const updateScaleMode = useCallback(
    (next: boolean) => {
      if (next === scaleModeRef.current) return;
      commitScaleMode(next);
    },
    [commitScaleMode],
  );

  useEffect(() => {
    if (!isScaleMode) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.body.classList.add("scale-gallery-is-open");
    galleryRef.current?.focus({ preventScroll: true });

    return () => {
      document.body.style.overflow = previousOverflow;
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
    if (isScaleMode || pendingFocusRef.current === null) return;

    const target = pendingFocusRef.current;
    pendingFocusRef.current = null;
    window.requestAnimationFrame(() => {
      if (target === "toggle") toggleRef.current?.focus();
      else galleryRef.current?.focus({ preventScroll: true });
    });
  }, [isScaleMode]);

  useEffect(() => {
    const media = window.matchMedia(`(min-width: ${MIN_LAPTOP_WIDTH}px)`);
    const handleWidthChange = (event: MediaQueryListEvent) => {
      if (!event.matches && scaleModeRef.current) {
        pendingFocusRef.current = "gallery";
        commitScaleMode(false);
      }
    };

    media.addEventListener("change", handleWidthChange);
    return () => media.removeEventListener("change", handleWidthChange);
  }, [commitScaleMode]);

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
      updateScaleMode(false);
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

  const currentRoom = rooms[roomIndex];
  const trackStyle = {
    transform: `translateX(${-roomIndex * 100}%)`,
  } satisfies CSSProperties;

  return (
    <div
      className={`gallery-experience${
        focusedArtwork ? " gallery-experience--focus" : ""
      }`}
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
            aria-pressed={isScaleMode}
            aria-label={
              isScaleMode
                ? "Return to the standard gallery"
                : "View all artworks to scale"
            }
            onClick={() => updateScaleMode(!isScaleMode)}
          >
            {isScaleMode ? "standard" : "to scale"}
          </button>
        }
      />

      <main
        id="gallery"
        ref={galleryRef}
        className={`gallery${
          isScaleMode ? " gallery--scale" : " gallery--editorial"
        }`}
        tabIndex={-1}
        inert={focusedArtwork !== null}
        aria-hidden={focusedArtwork ? true : undefined}
        aria-label={isScaleMode ? "Artworks shown at relative scale" : undefined}
        onKeyDown={handleKeyDown}
      >
        <GalleryArchitecture />

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
                          focusedTriggerRef.current = event.currentTarget;
                          setFocusedArtwork(artwork);
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
        ) : (
          <EditorialGallery artworks={artworks} referenceObject={STUDIO_STOOL} />
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

      {isScaleMode && focusedArtwork && (
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
            <FocusedArtworkImage artwork={focusedArtwork} />
            <ArtworkCaption artwork={focusedArtwork} />
          </figure>
        </section>
      )}

      <p className="visually-hidden" aria-live="polite">
        {isScaleMode
          ? focusedArtwork
            ? `${focusedArtwork.title} focused. Press Escape to close.`
            : activeArtwork
            ? `${activeArtwork.title}. Wall ${roomIndex + 1} of ${rooms.length}, ${currentRoom.yearLabel}.`
            : `Wall ${roomIndex + 1} of ${rooms.length}, ${currentRoom.yearLabel}.`
          : "Standard gallery opened."}
      </p>
    </div>
  );
}
