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

type GalleryMode = "editorial" | "grid" | "scale";
const EDITORIAL_PAGES = [
  {
    id: "studio-and-dontlook",
    sources: [
      "/artwork/studio-pic-stanford.jpg",
      "/artwork/DONTLOOKATME.jpg",
      "/artwork/DONTLOOK-sketch.jpg",
    ],
  },
  {
    id: "unravel-through-fresh",
    sources: [
      "/artwork/unravel.jpg",
      "/artwork/blame.jpg",
      "/artwork/handsoff.jpg",
      "/artwork/rising.jpg",
      "/artwork/heritage.jpg",
      "/artwork/fresh.jpg",
    ],
  },
  {
    id: "bastion-through-wash",
    sources: [
      "/artwork/bastion.jpg",
      "/artwork/anubis-dream.jpg",
      "/artwork/the-walls-we-build.jpg",
      "/artwork/wash.jpg",
    ],
  },
  {
    id: "mirror-through-oasis",
    sources: [
      "/artwork/mirror:rorrim.jpg",
      "/artwork/inside-out.jpg",
      "/artwork/reflection.jpg",
      "/artwork/oasis.jpg",
    ],
  },
  {
    id: "small-works-and-still-lifes",
    sources: [
      "/artwork/roar.jpg",
      "/artwork/cozy.jpg",
      "/artwork/boots.jpg",
      "/artwork/cows.jpg",
      "/artwork/pick.jpg",
      "/artwork/gotcha.jpg",
      "/artwork/still-life-egg.jpg",
      "/artwork/still-life.jpg",
    ],
  },
] as const;

const EDITORIAL_OMITTED_SOURCES = new Set(["/artwork/tiedup.jpg"]);

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

type EditorialPage = {
  id: string;
  artworks: Artwork[];
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

function makeEditorialPages(artworks: Artwork[]) {
  const artworkBySource = new Map(
    artworks.map((artwork) => [artwork.src, artwork]),
  );
  if (artworkBySource.size !== artworks.length) {
    throw new Error("Editorial gallery requires unique artwork sources.");
  }

  const assignedSources = new Set<string>();
  const pages: EditorialPage[] = EDITORIAL_PAGES.map((page) => ({
    id: page.id,
    artworks: page.sources.flatMap((source) => {
      const artwork = artworkBySource.get(source);
      if (!artwork) return [];
      assignedSources.add(source);
      return [artwork];
    }),
  })).filter((page) => page.artworks.length > 0);
  const unassigned = artworks.filter(
    (artwork) =>
      !assignedSources.has(artwork.src) &&
      !EDITORIAL_OMITTED_SOURCES.has(artwork.src),
  );

  if (unassigned.length > 0) {
    pages.push({ id: "additional-works", artworks: unassigned });
  }

  return pages;
}

function GalleryArchitecture() {
  return (
    <div className="gallery-architecture" aria-hidden="true">
      <div className="gallery-architecture__wall" />
      <div className="gallery-architecture__light" />
    </div>
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
  pages,
  mode,
  onOpenArtwork,
}: {
  pages: EditorialPage[];
  mode: Exclude<GalleryMode, "scale">;
  onOpenArtwork: EditorialArtworkProps["onOpenArtwork"];
}) {
  const galleryArtworks = pages.flatMap((page) => page.artworks);
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
          {galleryArtworks.map(renderArtwork)}
        </div>
      </div>
    );
  }

  return (
    <div className="editorial-gallery">
      <div className="editorial-gallery__grid" data-gallery-view="grid">
        {galleryArtworks.map(renderArtwork)}
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

  useEffect(() => {
    setIsFullResolutionReady(!hasSeparateFullResolution);
  }, [artwork.src, hasSeparateFullResolution, previewSrc]);

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
            const revealFullResolution = () => {
              window.requestAnimationFrame(() => {
                window.requestAnimationFrame(() => {
                  setIsFullResolutionReady(true);
                });
              });
            };
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
  const rooms = useMemo(() => makeScaleRooms(artworks), [artworks]);
  const editorialPages = useMemo(
    () => makeEditorialPages(artworks),
    [artworks],
  );
  const galleryRef = useRef<HTMLElement>(null);
  const toggleRef = useRef<HTMLButtonElement>(null);
  const pendingFocusRef = useRef<"toggle" | "gallery" | null>(null);
  const galleryModeRef = useRef<GalleryMode>("editorial");
  const wheelLockRef = useRef(false);
  const wheelResetRef = useRef<number | null>(null);
  const focusedCloseRef = useRef<HTMLButtonElement>(null);
  const focusedTriggerRef = useRef<HTMLButtonElement | null>(null);
  const focusedCloseTimerRef = useRef<number | null>(null);
  const [galleryMode, setGalleryMode] =
    useState<GalleryMode>("editorial");
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
  const isAlternateMode = galleryMode !== "editorial";
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
    };
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (reduceMotion) {
      finish();
      return;
    }

    setIsFocusClosing(true);
    focusedCloseTimerRef.current = window.setTimeout(finish, 360);
  }, [isFocusClosing]);

  const setRoom = useCallback(
    (nextRoom: number) => {
      const boundedRoom = Math.min(rooms.length - 1, Math.max(0, nextRoom));
      setRoomIndex(boundedRoom);
      setActiveArtwork(null);
      setFocusedArtwork(null);
      setFocusedPreviewSrc(null);
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

  useEffect(() => {
    if (galleryMode !== "editorial" || pendingFocusRef.current === null) return;

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
        commitGalleryMode("editorial");
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
      updateGalleryMode("editorial");
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
              isScaleMode
                ? "Return to the artwork grid"
                : isGridMode
                  ? "Return to the editorial gallery"
                  : undefined
            }
            onClick={() => {
              if (isAlternateMode) {
                updateGalleryMode("editorial");
                return;
              }

              updateGalleryMode(
                window.matchMedia(LAPTOP_MEDIA_QUERY).matches
                  ? "scale"
                  : "grid",
              );
            }}
          >
            {isScaleMode ? (
              "grid"
            ) : isGridMode ? (
              "standard"
            ) : (
              <>
                <span className="gallery-mode-label--mobile">grid</span>
                <span className="gallery-mode-label--desktop">gallery</span>
              </>
            )}
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
              : "Artwork grid"
        }
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
                        aria-haspopup="dialog"
                        aria-label={`Focus ${artworkLabel(artwork)}`}
                        style={{
                          width: (artwork.width ?? 0) * pixelsPerInch,
                          height: (artwork.height ?? 0) * pixelsPerInch,
                        }}
                        onFocus={() => setActiveArtwork(artwork)}
                        onPointerEnter={() => setActiveArtwork(artwork)}
                        onClick={(event) =>
                          openFocusedArtwork(
                            artwork,
                            artwork.scaleSrc ?? artwork.src,
                            event.currentTarget,
                          )
                        }
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
          <EditorialGallery
            mode={isGridMode ? "grid" : "editorial"}
            pages={editorialPages}
            onOpenArtwork={openFocusedArtwork}
          />
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
              key={focusedArtwork.src}
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
              ? "Compact grid opened."
              : "Editorial gallery opened."}
      </p>
    </div>
  );
}
