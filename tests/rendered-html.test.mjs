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
  assert.match(html, />to scale<\/button>/);
  assert.match(html, /aria-controls="gallery"/);
  const imageTags = [
    ...html.matchAll(/<img[^>]+src="(\/artwork\/[^"]+)"[^>]*>/g),
  ];
  const imageSources = imageTags.map((match) => match[1]);

  assert.equal(imageSources.length, 27);
  assert.equal(new Set(imageSources).size, imageSources.length);
  assert.deepEqual(imageSources.slice(0, 4), [
    "/artwork/editorial/rising-640.webp",
    "/artwork/editorial/heritage-520.webp",
    "/artwork/editorial/bastion-480.webp",
    "/artwork/editorial/cozy-640.webp",
  ]);
  assert.equal(
    html.match(/class="artwork-details"/g)?.length,
    imageSources.length,
  );
  assert.equal(
    html.match(/class="artwork editorial-gallery__artwork"/g)?.length,
    imageSources.length,
  );
  assert.deepEqual(
    [...html.matchAll(/data-artwork-count="(\d+)"/g)].map((match) =>
      Number.parseInt(match[1], 10),
    ),
    [4, 4, 4, 4, 4, 4, 3],
  );

  for (const [tag] of imageTags) {
    assert.match(tag, /width="\d+"/);
    assert.match(tag, /height="\d+"/);
  }
  assert.equal(
    imageTags.filter(([tag]) => tag.includes('loading="eager"')).length,
    4,
  );
  assert.equal(
    imageTags.filter(([tag]) => tag.includes('loading="lazy"')).length,
    23,
  );
  assert.equal(
    imageTags.filter(([tag]) => tag.includes('fetchPriority="high"')).length,
    1,
  );

  for (const src of imageSources) {
    assert.equal(
      existsSync(new URL(`../public${src}`, import.meta.url)),
      true,
      `${src} should reference an available artwork image`,
    );
  }

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
    "/artwork/editorial/rising-640.webp",
    "/artwork/editorial/heritage-520.webp",
    "/artwork/editorial/bastion-480.webp",
    "/artwork/editorial/cozy-640.webp",
  ];
  const environmentSources = [
    "/gallery/windowlight.webp",
    "/gallery/plaster-grain.webp",
    "/gallery/floor-grain.webp",
    "/gallery/studio-stool@1x.webp",
    "/gallery/studio-stool@2x.webp",
  ];
  const editorialHashes = {
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

  assert.equal(byteTotal(editorialSources), 333_522);
  assert.equal(byteTotal(environmentSources), 67_546);

  for (const [src, expected] of Object.entries(editorialHashes)) {
    const bytes = readFileSync(new URL(`../public${src}`, import.meta.url));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), expected);
  }

  const galleryStyles = readFileSync(
    new URL("../app/globals.css", import.meta.url),
    "utf8",
  );
  const buildConfig = readFileSync(
    new URL("../vite.config.ts", import.meta.url),
    "utf8",
  );

  assert.match(galleryStyles, /url\("\/gallery\/windowlight\.webp"\)/);
  assert.doesNotMatch(galleryStyles, /mix-blend-mode|mask-image/);
  assert.doesNotMatch(buildConfig, /openai|sites/i);
});
