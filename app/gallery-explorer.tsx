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
import { flushSync } from "react-dom";
import { ArtworkCaption } from "./artwork-caption";
import type { Artwork } from "./artworks";
import { SiteHeader } from "./site-header";

const TARGET_WORKS_PER_WALL = 7;
const ARTWORK_GAP_INCHES = 14;
const MAX_PIXELS_PER_INCH = 5;
const MIN_LAPTOP_WIDTH = 900;

type GalleryExplorerProps = {
  artworks: Artwork[];
};

type ScaleRoom = {
  artworks: Artwork[];
  widthInches: number;
  heightInches: number;
  yearLabel: string;
};

type DocumentWithViewTransition = Document & {
  startViewTransition?: (update: () => void) => {
    finished: Promise<void>;
  };
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

export function GalleryExplorer({ artworks }: GalleryExplorerProps) {
  const rooms = useMemo(() => makeScaleRooms(artworks), [artworks]);
  const galleryRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const transitionRef = useRef(false);
  const pendingModeRef = useRef<boolean | null>(null);
  const pendingFocusRef = useRef<"toggle" | "gallery" | null>(null);
  const scaleModeRef = useRef(false);
  const wheelLockRef = useRef(false);
  const wheelResetRef = useRef<number | null>(null);
  const [isScaleMode, setIsScaleMode] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [roomIndex, setRoomIndex] = useState(0);
  const [pixelsPerInch, setPixelsPerInch] = useState(4);
  const [activeArtwork, setActiveArtwork] = useState<Artwork | null>(null);

  const setRoom = useCallback(
    (nextRoom: number) => {
      const boundedRoom = Math.min(rooms.length - 1, Math.max(0, nextRoom));
      setRoomIndex(boundedRoom);
      setActiveArtwork(null);
    },
    [rooms.length],
  );

  const commitScaleMode = useCallback(
    (next: boolean) => {
      if (next) {
        setPixelsPerInch(getPixelsPerInch(rooms));
        setRoomIndex(0);
        setActiveArtwork(null);
      }
      scaleModeRef.current = next;
      setIsScaleMode(next);
    },
    [rooms],
  );

  const finishTransition = useCallback(() => {
    transitionRef.current = false;
    document.documentElement.classList.remove("gallery-view-transition");

    const pendingMode = pendingModeRef.current;
    pendingModeRef.current = null;
    if (pendingMode !== null && pendingMode !== scaleModeRef.current) {
      commitScaleMode(pendingMode);
    }
  }, [commitScaleMode]);

  const updateScaleMode = useCallback(
    (next: boolean) => {
      if (transitionRef.current) {
        pendingModeRef.current = next;
        return;
      }
      if (next === scaleModeRef.current) return;

      const commit = () => commitScaleMode(next);

      const reduceMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;

      if (reduceMotion) {
        commit();
        return;
      }

      const transitionDocument = document as DocumentWithViewTransition;
      if (transitionDocument.startViewTransition) {
        transitionRef.current = true;
        document.documentElement.classList.add("gallery-view-transition");
        const transition = transitionDocument.startViewTransition(() => {
          flushSync(commit);
        });
        transition.finished.finally(finishTransition);
        return;
      }

      transitionRef.current = true;
      setIsFading(true);
      window.setTimeout(() => {
        flushSync(commit);
        window.requestAnimationFrame(() => {
          setIsFading(false);
          window.setTimeout(() => {
            finishTransition();
          }, 420);
        });
      }, 180);
    },
    [commitScaleMode, finishTransition],
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
        pendingModeRef.current = null;
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
    transform: `translate3d(${-roomIndex * 100}%, 0, 0)`,
  } satisfies CSSProperties;

  return (
    <div className="gallery-experience">
      <SiteHeader
        currentPage="gallery"
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
        className={`gallery${isScaleMode ? " gallery--scale" : ""}${
          isFading ? " gallery--fading" : ""
        }`}
        tabIndex={-1}
        aria-label={isScaleMode ? "Artworks shown at relative scale" : undefined}
        onKeyDown={handleKeyDown}
      >
        {isScaleMode ? (
          <div className="scale-gallery-track" style={trackStyle}>
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
                    <figure
                      className="scale-artwork"
                      key={artwork.src}
                      role="group"
                      tabIndex={0}
                      aria-label={artworkLabel(artwork)}
                      style={{
                        width: (artwork.width ?? 0) * pixelsPerInch,
                        height: (artwork.height ?? 0) * pixelsPerInch,
                      }}
                      onFocus={() => setActiveArtwork(artwork)}
                      onPointerEnter={() => setActiveArtwork(artwork)}
                    >
                      <img
                        src={artwork.src}
                        alt=""
                        loading={
                          Math.abs(index - roomIndex) <= 1 ? "eager" : "lazy"
                        }
                        fetchPriority={index === roomIndex ? "high" : "low"}
                        decoding="async"
                      />
                    </figure>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : (
          artworks.map((artwork, index) => (
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
              <ArtworkCaption artwork={artwork} />
            </figure>
          ))
        )}

        {isScaleMode && (
          <>
            <div className="scale-gallery-ruler" aria-hidden="true">
              <span
                className="scale-gallery-ruler__line"
                style={{ width: 12 * pixelsPerInch }}
              />
              <span>12 in</span>
            </div>

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
                ←
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
                →
              </button>
            </nav>
          </>
        )}
      </main>

      <p className="visually-hidden" aria-live="polite">
        {isScaleMode
          ? activeArtwork
            ? `${activeArtwork.title}. Wall ${roomIndex + 1} of ${rooms.length}, ${currentRoom.yearLabel}.`
            : `Wall ${roomIndex + 1} of ${rooms.length}, ${currentRoom.yearLabel}.`
          : "Standard gallery opened."}
      </p>
    </div>
  );
}
