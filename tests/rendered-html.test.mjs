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

function attributeValue(attributes, name) {
  return attributes.match(new RegExp(`(?:^|\\s)${name}="([^"]*)"`))?.[1];
}

function assertRouteNavigation(html, currentPage) {
  const navigation = html.match(
    /<nav[^>]*class="site-navigation"[^>]*>([\s\S]*?)<\/nav>/,
  );
  assert.ok(navigation);

  const routeLinks = [...navigation[1].matchAll(/<a\b([^>]*)>([^<]+)<\/a>/g)]
    .filter((match) => attributeValue(match[1], "class") === "route-link")
    .map((match) => ({
      current: attributeValue(match[1], "aria-current"),
      href: attributeValue(match[1], "href"),
      label: match[2],
    }));

  const expectedLinks = [
    {
      current: currentPage === "about" ? "page" : undefined,
      href: "/about",
      label: "about",
    },
    {
      current: currentPage === "blog" ? "page" : undefined,
      href: "/blog",
      label: "blog",
    },
  ];

  if (currentPage === "gallery") {
    assert.deepEqual(routeLinks, expectedLinks);
    assert.equal(navigation[1].match(/<(?:a|button)\b/g)?.length, 3);
    assert.match(
      navigation[1],
      /<button[^>]*class="gallery-mode-toggle"[^>]*>grid<\/button>/,
    );
    return;
  }

  assert.deepEqual(routeLinks, [
    {
      current: undefined,
      href: "/",
      label: "gallery",
    },
    ...expectedLinks,
  ]);
}

test("server-renders the artwork", async () => {
  const response = await render();
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<title>hannah gao ✶<\/title>/);
  assert.match(
    html,
    /<meta property="og:image" content="https:\/\/hannahgao\.studio\/artwork\/studio-pic\.jpg"\/>/,
  );
  assert.match(
    html,
    /<meta name="twitter:image" content="https:\/\/hannahgao\.studio\/artwork\/studio-pic\.jpg"\/>/,
  );
  assert.match(html, /class="site-header site-header--gallery"/);
  assertRouteNavigation(html, "gallery");
  assert.match(html, /src="\/signature\.png"/);
  assert.match(html, /aria-controls="gallery"/);
  assert.doesNotMatch(html, /aria-pressed=/);
  assert.match(html, /class="gallery gallery--editorial"/);
  assert.match(html, /aria-label="Artwork gallery"/);
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
  assert.match(html, /<title>hannah gao ✶<\/title>/);
  assert.match(html, /class="site-header site-header--about"/);
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
  assertRouteNavigation(html, "about");
});

test("server-renders the blog index", async () => {
  const response = await render("/blog");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<title>hannah gao ✶ \| blog<\/title>/);
  assert.match(html, /aria-label="Blog posts"/);
  assert.match(html, /<h1 class="visually-hidden">Blog<\/h1>/);
  assert.doesNotMatch(html, /class="blog-title">blog<\/h1>/);
  assert.match(html, /class="blog-index-list"/);
  assert.match(html, /href="\/blog\/new-frontiers"/);
  assert.match(html, />new frontiers<\/a>/);
  assert.match(html, />06\.23\.2026<\/time>/);
  assert.match(html, /href="\/blog\/thalassophilia"/);
  assert.match(html, />thalassophilia<\/a>/);
  assert.match(html, />12\.18\.2025<\/time>/);
  assert.doesNotMatch(html, /Many undercurrents and overcurrents have pushed AI/);
  assertRouteNavigation(html, "blog");
});

test("server-renders the new frontiers essay", async () => {
  const response = await render("/blog/new-frontiers");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<title>new frontiers — hannah gao ✶<\/title>/);
  assert.match(html, /<h1 class="blog-title">new frontiers<\/h1>/);
  assert.match(html, /my notes-app musings on the next few years/);
  assert.match(html, /dateTime="2026-06-23">06\.23\.2026<\/time>/);
  assert.match(html, /class="blog-copy"/);
  assert.match(html, /Many undercurrents and overcurrents have pushed AI/);
  assert.match(html, /The most pressing bottleneck for AI is legitimacy\./);
  assert.match(html, /<p>How do we earn back trust\?<\/p>/);
  assert.doesNotMatch(html, /<h2>How do we earn back trust\?<\/h2>/);
  assert.match(html, /America needs a new[\s\S]*frontier\./);
  const blogList = html.match(
    /<ul[^>]*class="blog-list"[^>]*>([\s\S]*?)<\/ul>/,
  );
  assert.ok(blogList);
  assert.equal(blogList[1].match(/<li>/g)?.length, 2);
  assertRouteNavigation(html, "blog");
});

test("server-renders the thalassophilia essay", async () => {
  const response = await render("/blog/thalassophilia");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<title>thalassophilia — hannah gao ✶<\/title>/);
  assert.match(html, /<h1 class="blog-title">thalassophilia<\/h1>/);
  assert.match(html, /on escaping the cornfields/);
  assert.match(html, /dateTime="2025-12-18">12\.18\.2025<\/time>/);
  assert.match(html, /src="\/blog\/thalassophilia\.webp"/);
  assert.equal(
    existsSync(
      new URL("../public/blog/thalassophilia.webp", import.meta.url),
    ),
    true,
  );
  assert.equal(html.match(/class="blog-section-number"/g)?.length, 7);
  assert.match(html, /Lately I’ve been restless as ever\./);
  assert.match(html, /I will choose again and again to dive\./);
  assertRouteNavigation(html, "blog");
});

test("scale gallery previews stay lightweight", () => {
  const manifest = readFileSync(
    new URL("../app/artworks.ts", import.meta.url),
    "utf8",
  );
  const scaleSources = [
    ...manifest.matchAll(/scaleSrc: "(\/artwork\/scale\/[^"]+)"/g),
  ].map((match) => match[1]);

  assert.doesNotMatch(manifest, /tiedup|Tied Up/i);
  assert.equal(scaleSources.length, 23);
  assert.equal(new Set(scaleSources).size, scaleSources.length);

  const totalBytes = scaleSources.reduce((sum, src) => {
    const asset = new URL(`../public${src}`, import.meta.url);
    assert.equal(existsSync(asset), true, `${src} should exist`);
    return sum + statSync(asset).size;
  }, 0);

  assert.equal(totalBytes, 325_658);
  assert.ok(totalBytes < 1024 * 1024, "scale previews should stay below 1 MiB");
});

test("editorial gallery assets stay faithful and lightweight", () => {
  const editorialSources = [
    "/artwork/editorial/studio-pic-stanford-480.webp",
    "/artwork/editorial/DONTLOOKATME-480.webp",
    "/artwork/editorial/rising-640.webp",
    "/artwork/editorial/heritage-520.webp",
    "/artwork/editorial/bastion-480.webp",
    "/artwork/editorial/cozy-640.webp",
  ];
  const environmentSources = [
    "/gallery/plaster-grain.webp",
    "/gallery/studio-stool@1x.webp",
    "/gallery/studio-stool@2x.webp",
    "/gallery/windowlight.svg",
  ];
  const editorialHashes = {
    "/artwork/editorial/studio-pic-stanford-480.webp":
      "37daa954eda762f330ff13f695e13444dc247d3d4e5b11b1fa74b8b7b48c2fb4",
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

  assert.ok(
    byteTotal(editorialSources) < 512 * 1024,
    "editorial previews should stay below 512 KiB",
  );
  assert.ok(
    byteTotal(environmentSources) < 100 * 1024,
    "gallery decorations should stay below 100 KiB",
  );

  for (const [src, expected] of Object.entries(editorialHashes)) {
    const bytes = readFileSync(new URL(`../public${src}`, import.meta.url));
    assert.equal(createHash("sha256").update(bytes).digest("hex"), expected);
  }
});

test("every page advertises available favicon assets", async () => {
  const expectedIcons = [
    { rel: "icon", href: "/favicon.ico", sizes: "16x16 32x32 48x48 64x64" },
    { rel: "icon", href: "/favicon.png", sizes: "192x192" },
    { rel: "apple-touch-icon", href: "/apple-touch-icon.png", sizes: "180x180" },
  ];

  for (const pathname of [
    "/",
    "/about",
    "/blog",
    "/blog/new-frontiers",
    "/blog/thalassophilia",
  ]) {
    const response = await render(pathname);
    assert.equal(response.status, 200);
    const html = await response.text();
    const icons = [...html.matchAll(/<link\b([^>]*)>/g)]
      .filter(([, attributes]) =>
        ["icon", "apple-touch-icon"].includes(attributeValue(attributes, "rel")),
      )
      .map(([, attributes]) => ({
        rel: attributeValue(attributes, "rel"),
        href: new URL(
          attributeValue(attributes, "href"),
          "https://hannahgao.studio",
        ).pathname,
        sizes: attributeValue(attributes, "sizes"),
      }));
    assert.deepEqual(
      icons,
      expectedIcons,
      `${pathname} should inherit the site icons`,
    );
  }

  for (const { href } of expectedIcons) {
    const bytes = readFileSync(new URL(`../public${href}`, import.meta.url));
    assert.ok(bytes.length < 20 * 1024, `${href} should stay below 20 KiB`);
    if (href.endsWith(".png")) {
      assert.equal(bytes.subarray(0, 8).toString("hex"), "89504e470d0a1a0a");
      const size = href === "/favicon.png" ? 192 : 180;
      assert.equal(bytes.readUInt32BE(16), size);
      assert.equal(bytes.readUInt32BE(20), size);
    } else {
      assert.equal(bytes.readUInt16LE(0), 0);
      assert.equal(bytes.readUInt16LE(2), 1);
      assert.equal(bytes.readUInt16LE(4), 4);
    }
  }
});
