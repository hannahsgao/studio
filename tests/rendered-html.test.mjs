import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import test from "node:test";

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
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
