import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { existsSync, readFileSync, statSync } from "node:fs";
import test from "node:test";

async function render(pathname = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request(`http://localhost${pathname}`, {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the artwork", async () => {
  const response = await render();
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<title>hannah gao ✶<\/title>/);
  assert.match(html, /class="site-header"/);
  assert.match(html, /href="\/about"/);
  assert.match(html, /src="\/signature\.png"/);
  assert.match(html, /aria-label="View the gallery"/);
  assert.match(html, />gallery<\/button>/);
  assert.match(html, /aria-controls="gallery"/);
  assert.match(html, /aria-pressed="false"/);
  assert.match(html, /class="gallery gallery--editorial"/);
  assert.match(html, /aria-label="Artwork grid"/);
  assert.doesNotMatch(html, /class="gallery gallery--scale"/);
  const imageTags = [
    ...html.matchAll(/<img[^>]+src="(\/artwork\/[^"]+)"[^>]*>/g),
  ];
  const imageSources = imageTags.map((match) => match[1]);
  const gridPreviewSources = [
    ...html.matchAll(/<source[^>]+srcSet="([^"]+)"/g),
  ].map((match) => match[1]);

  assert.equal(imageSources.length, 25);
  assert.equal(new Set(imageSources).size, imageSources.length);
  assert.deepEqual(imageSources, [
    "/artwork/studio-pic-stanford.jpg",
    "/artwork/DONTLOOKATME.jpg",
    "/artwork/DONTLOOK-sketch.jpg",
    "/artwork/unravel.jpg",
    "/artwork/blame.jpg",
    "/artwork/handsoff.jpg",
    "/artwork/rising.jpg",
    "/artwork/heritage.jpg",
    "/artwork/fresh.jpg",
    "/artwork/bastion.jpg",
    "/artwork/anubis-dream.jpg",
    "/artwork/the-walls-we-build.jpg",
    "/artwork/wash.jpg",
    "/artwork/mirror:rorrim.jpg",
    "/artwork/inside-out.jpg",
    "/artwork/reflection.jpg",
    "/artwork/oasis.jpg",
    "/artwork/roar.jpg",
    "/artwork/cozy.jpg",
    "/artwork/boots.jpg",
    "/artwork/cows.jpg",
    "/artwork/pick.jpg",
    "/artwork/gotcha.jpg",
    "/artwork/still-life-egg.jpg",
    "/artwork/still-life.jpg",
  ]);
  assert.deepEqual(gridPreviewSources, [
    "/artwork/editorial/studio-pic-stanford-480.webp",
    "/artwork/editorial/DONTLOOKATME-480.webp",
    "/artwork/grid/DONTLOOK-sketch-640.webp",
    "/artwork/grid/unravel-640.webp",
    "/artwork/grid/blame-640.webp",
    "/artwork/grid/handsoff-640.webp",
    "/artwork/editorial/rising-640.webp",
    "/artwork/editorial/heritage-520.webp",
    "/artwork/grid/fresh-640.webp",
    "/artwork/editorial/bastion-480.webp",
    "/artwork/grid/anubis-dream-640.webp",
    "/artwork/grid/the-walls-we-build-640.webp",
    "/artwork/grid/wash-640.webp",
    "/artwork/grid/mirror:rorrim-640.webp",
    "/artwork/grid/inside-out-640.webp",
    "/artwork/grid/reflection-640.webp",
    "/artwork/grid/oasis-640.webp",
    "/artwork/grid/roar-640.webp",
    "/artwork/editorial/cozy-640.webp",
    "/artwork/grid/boots-640.webp",
    "/artwork/grid/cows-640.webp",
    "/artwork/grid/pick-640.webp",
    "/artwork/grid/gotcha-640.webp",
    "/artwork/grid/still-life-egg-640.webp",
    "/artwork/grid/still-life-640.webp",
  ]);
  assert.equal(
    html.match(/class="artwork-details"/g)?.length,
    imageSources.length,
  );
  assert.equal(
    html.match(/class="artwork editorial-gallery__artwork/g)?.length,
    imageSources.length,
  );
  assert.equal(html.match(/data-gallery-view="grid"/g)?.length, 1);
  assert.deepEqual(
    [...html.matchAll(/data-gallery-index="(\d+)"/g)].map(
      (match) => Number.parseInt(match[1], 10),
    ),
    Array.from({ length: imageSources.length }, (_, index) => index + 1),
  );
  assert.doesNotMatch(html, /data-gallery-page|data-artwork-count/);
  assert.deepEqual(
    [...html.matchAll(/--gallery-entry-delay:(\d+)ms/g)].map((match) =>
      Number.parseInt(match[1], 10),
    ),
    Array.from(
      { length: imageSources.length },
      (_, index) => Math.min(index, 12) * 35,
    ),
  );
  assert.equal(
    html.match(/class="editorial-artwork-trigger"/g)?.length,
    imageSources.length,
  );
  assert.equal(
    html.match(/aria-haspopup="dialog"/g)?.length,
    imageSources.length,
  );
  for (const [tag] of imageTags) {
    assert.match(tag, /width="\d+"/);
    assert.match(tag, /height="\d+"/);
  }
  assert.equal(
    imageTags.filter(([tag]) => tag.includes('loading="eager"')).length,
    1,
  );
  assert.equal(
    imageTags.filter(([tag]) => tag.includes('loading="lazy"')).length,
    24,
  );
  assert.equal(
    imageTags.filter(([tag]) => tag.includes('fetchPriority="high"')).length,
    1,
  );
  assert.equal(
    imageTags.filter(([tag]) => tag.includes('decoding="async"')).length,
    imageSources.length,
  );

  for (const src of imageSources) {
    assert.equal(
      existsSync(new URL(`../public${src}`, import.meta.url)),
      true,
      `${src} should reference an available artwork image`,
    );
  }

  const gridPreviewBytes = gridPreviewSources.reduce((sum, src) => {
    const asset = new URL(`../public${src}`, import.meta.url);
    assert.equal(existsSync(asset), true, `${src} should exist`);
    return sum + statSync(asset).size;
  }, 0);
  assert.equal(gridPreviewBytes, 1_532_088);
  assert.ok(
    gridPreviewBytes < 2 * 1024 * 1024,
    "grid previews should stay below 2 MiB",
  );

  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton|ruler/i);
});

test("server-renders the about page", async () => {
  const response = await render("/about");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<title>about — hannah gao ✶<\/title>/);
  assert.match(html, /src="\/artwork\/studio-pic\.jpg"/);
  assert.match(html, /class="about-copy"/);
  const aboutList = html.match(
    /<ul[^>]*class="about-list"[^>]*>([\s\S]*?)<\/ul>/,
  );
  assert.ok(aboutList);
  assert.equal(aboutList[1].match(/<li>/g)?.length, 4);
  assert.match(html, /<em>micro<\/em>/);
  assert.match(
    html,
    /href="https:\/\/www\.tiktok\.com\/@yurtyobain\/video\/7093691695052918062\?is_from_webapp=1&amp;sender_device=pc"/,
  );
  assert.match(html, /href="mailto:hannahgaoart@gmail\.com"/);
  assert.match(html, /class="artwork-details"/);
  assert.match(html, /href="\/"/);
  assert.match(html, />gallery<\/a>/);
});

test("scale gallery previews stay lightweight", () => {
  const manifest = readFileSync(
    new URL("../app/artworks.ts", import.meta.url),
    "utf8",
  );
  const scaleSources = [
    ...manifest.matchAll(/scaleSrc: "(\/artwork\/scale\/[^"]+)"/g),
  ].map((match) => match[1]);

  assert.equal(scaleSources.length, 24);
  assert.equal(new Set(scaleSources).size, scaleSources.length);

  const totalBytes = scaleSources.reduce((sum, src) => {
    const asset = new URL(`../public${src}`, import.meta.url);
    assert.equal(existsSync(asset), true, `${src} should exist`);
    return sum + statSync(asset).size;
  }, 0);

  assert.equal(totalBytes, 444_818);
  assert.ok(totalBytes < 1024 * 1024, "scale previews should stay below 1 MiB");
});

test("editorial gallery assets stay faithful and lightweight", () => {
  const editorialSources = [
    "/artwork/editorial/studio-pic-stanford-480.webp",
    "/artwork/editorial/DONTLOOK-sketch-320.webp",
    "/artwork/editorial/DONTLOOKATME-480.webp",
    "/artwork/editorial/rising-640.webp",
    "/artwork/editorial/heritage-520.webp",
    "/artwork/editorial/bastion-480.webp",
    "/artwork/editorial/cozy-640.webp",
  ];
  const environmentSources = [
    "/gallery/plaster-grain.webp",
  ];
  const editorialHashes = {
    "/artwork/editorial/studio-pic-stanford-480.webp":
      "37daa954eda762f330ff13f695e13444dc247d3d4e5b11b1fa74b8b7b48c2fb4",
    "/artwork/editorial/DONTLOOK-sketch-320.webp":
      "1a19730a5397f1667b874c3804f112ad8ef2d585d274f5b015a8623efe6fb371",
    "/artwork/editorial/DONTLOOKATME-480.webp":
      "42fdce7843de68a3e2a0bf93ac23f036b80b9595c1a1501ef166f75e764c8857",
    "/artwork/editorial/rising-640.webp":
      "f31d222d73eebd09e78845a7e5fe7caf09327ecb356b0b82b446f1736a57b8fb",
    "/artwork/editorial/heritage-520.webp":
      "56540325058a1bc24bf3ddac2fca4d86941c9561fee76e871ec2f8f703b0bfb3",
    "/artwork/editorial/bastion-480.webp":
      "9ea2f26587734e4542383ced045e118a722d26417af0b03c3f78820fe143db66",
    "/artwork/editorial/cozy-640.webp":
      "a92aabc07fa83ecdafda2e6575b255894673b6188117b1f4db158055179b8e1c",
  };

  const byteTotal = (sources) =>
    sources.reduce((sum, src) => {
      const asset = new URL(`../public${src}`, import.meta.url);
      assert.equal(existsSync(asset), true, `${src} should exist`);
      return sum + statSync(asset).size;
    }, 0);

  assert.equal(byteTotal(editorialSources), 413_388);
  assert.equal(byteTotal(environmentSources), 1_844);

  for (const [src, expected] of Object.entries(editorialHashes)) {
    const bytes = readFileSync(new URL(`../public${src}`, import.meta.url));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), expected);
  }

  const galleryStyles = readFileSync(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  const gallerySource = readFileSync(
    new URL("../app/gallery-explorer.tsx", import.meta.url),
    "utf8",
  );
  const buildConfig = readFileSync(
    new URL("../vite.config.ts", import.meta.url),
    "utf8",
  );

  assert.doesNotMatch(galleryStyles, /windowlight\.webp/);
  assert.doesNotMatch(
    galleryStyles,
    /gallery-architecture__floor|gallery-floor-height|floor-grain\.webp/,
  );
  assert.doesNotMatch(gallerySource, /gallery-architecture__floor/);
  assert.match(galleryStyles, /\.gallery-architecture__light::before/);
  assert.match(galleryStyles, /ellipse 76% 68% at 14% 10%/);
  assert.match(galleryStyles, /\.editorial-gallery__grid\s*{/);
  assert.match(galleryStyles, /grid-template-columns: repeat\(3,/);
  assert.match(galleryStyles, /@keyframes gallery-grid-item-in/);
  assert.match(galleryStyles, /\.focused-artwork-image__full/);
  assert.doesNotMatch(galleryStyles, /scroll-snap-type|cursor: zoom-in/);
  assert.match(
    gallerySource,
    /const \[isScaleMode, setIsScaleMode\] = useState\(false\)/,
  );
  assert.match(gallerySource, /Grid opened\./);
  assert.match(gallerySource, /\{isScaleMode \? "grid" : "gallery"\}/);
  assert.match(gallerySource, /className="scale-gallery-track"/);
  assert.match(gallerySource, /className="scale-gallery-room"/);
  assert.match(gallerySource, /aria-modal="true"/);
  assert.doesNotMatch(
    gallerySource,
    /editorial-gallery__room|settleToNearestPage|settleThreshold|scrollend/,
  );
  assert.doesNotMatch(galleryStyles, /mix-blend-mode|mask-image/);
  assert.doesNotMatch(buildConfig, /openai|sites/i);
});
