import assert from "node:assert/strict";
import { existsSync } from "node:fs";
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
  const imageSources = [...html.matchAll(/<img[^>]+src="(\/artwork\/[^"]+)"/g)].map(
    (match) => match[1],
  );

  assert.ok(imageSources.length > 0);
  assert.equal(
    html.match(/class="artwork-details"/g)?.length,
    imageSources.length,
  );

  for (const src of imageSources) {
    assert.equal(
      existsSync(new URL(`../public${src}`, import.meta.url)),
      true,
      `${src} should reference an available artwork image`,
    );
  }

  assert.doesNotMatch(html, /codex-preview|react-loading-skeleton/i);
});

test("server-renders the about page", async () => {
  const response = await render("/about");
  assert.equal(response.status, 200);

  const html = await response.text();
  assert.match(html, /<title>about — hannah gao ✶<\/title>/);
  assert.match(html, /src="\/artwork\/studio-pic\.jpg"/);
  assert.match(html, /class="about-copy"/);
  assert.match(html, /class="about-list"/);
  assert.equal(html.match(/<li>/g)?.length, 4);
  assert.match(html, /<em>micro<\/em>/);
  assert.match(html, /href="mailto:hannahgaoart@gmail\.com"/);
  assert.match(html, /class="artwork-details"/);
  assert.match(html, /href="\/"/);
  assert.match(html, />gallery<\/a>/);
});
