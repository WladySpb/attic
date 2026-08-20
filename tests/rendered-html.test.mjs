import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function render(path = "/") {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);
  return worker.fetch(new Request(new URL(path, "http://localhost/"), { headers: { accept: "text/html" } }), {
    ASSETS: { fetch: async () => new Response("Not found", { status: 404 }) },
  }, { waitUntil() {}, passThroughOnException() {} });
}

test("server-renders the Attic shell and social metadata", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);
  const html = await response.text();
  assert.match(html, /<title>Wlady&#x27;s Attic<\/title>/i);
  assert.match(html, /aria-label="English"/);
  assert.match(html, /aria-label="Russian"/);
  assert.doesNotMatch(html, /Language availability is shown for every story|Доступность языка указана для каждой истории/);
  assert.match(html, /Books written together with AI/);
  assert.match(html, /Stories live a little longer in the attic/);
  assert.match(html, /property="og:image" content="http:\/\/localhost:3000\/og.png"/);
  assert.doesNotMatch(html, /codex-preview|loading skeleton|react-loading-skeleton/i);
});

test("publication dataset exposes the agreed 16 + 1 + 2 units", async () => {
  const catalog = JSON.parse(await readFile(new URL("../public/data/catalog.v1.json", import.meta.url), "utf8"));
  assert.deepEqual(catalog.languages, ["en", "ru"]);
  assert.equal(catalog.titles.length, 3);
  const counts = Object.fromEntries(catalog.titles.map((title) => [title.slug, title.availability.en.unit_count]));
  assert.deepEqual(counts, { interstellar_spectators: 2, rebirth_and_die_another_way: 16, reborn_as_llm: 1 });
});

test("a shareable episode URL server-renders localized content and SEO metadata", async () => {
  const path = "/ru/interstellar-spectators/chronicles/barbenheimer-collapse-of-objectivity";
  const response = await render(path);
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /<title>Барбенгеймер и крах объективности · Чердачок Влади<\/title>/);
  assert.match(html, /<h1>Барбенгеймер и крах объективности<\/h1>/);
  assert.match(html, /rel="canonical" href="http:\/\/localhost:3000\/ru\/interstellar-spectators\/chronicles\/barbenheimer-collapse-of-objectivity"/);
  assert.match(html, /hreflang="en"/);
  assert.match(html, /hreflang="ru"/);
});

test("publication emits stable composite slug paths", async () => {
  const detail = JSON.parse(await readFile(new URL("../public/data/titles/interstellar_spectators.v1.json", import.meta.url), "utf8"));
  assert.deepEqual(detail.units[0].slug_path, ["chronicles", "barbenheimer-collapse-of-objectivity"]);
  assert.deepEqual(detail.units[1].slug_path, ["chronicles", "scheduled-eclipse"]);
});

test("client keeps unavailable translations visible without a link", async () => {
  const source = await readFile(new URL("../app/AtticLibrary.tsx", import.meta.url), "utf8");
  assert.match(source, /const disabled = !availability\?\.clickable/);
  assert.match(source, /if \(disabled\) return <article/);
  assert.match(source, /if \(!available\) return <div className="unit disabled"/);
  assert.match(source, /const languageOptions = unit \? unit\.languages : catalog\.languages/);
});

test("cover artwork uses one crop ratio across cards and title pages", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  const catalog = JSON.parse(await readFile(new URL("../public/data/catalog.v1.json", import.meta.url), "utf8"));
  assert.match(css, /\.book-card-art \{ aspect-ratio:16\/7;/);
  assert.match(css, /\.title-art \{ aspect-ratio:16\/7;/);
  assert.equal(catalog.titles.find((title) => title.slug === "reborn_as_llm")?.artwork?.key, "reborn-as-llm/cover-v1.png");
});

test("long fenced code lines wrap without changing publication sources", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.reader-body pre \{[^}]*overflow-wrap:anywhere;[^}]*white-space:pre-wrap;[^}]*word-break:break-word;/);
  assert.match(css, /\.reader-body pre code \{[^}]*white-space:inherit;/);
});

test("a terminal single chapter links back to the library", async () => {
  const response = await render("/ru/reborn-as-llm/season-01/episode-01/chapter-001");
  assert.equal(response.status, 200);
  const html = await response.text();
  assert.match(html, /class="chapter-nav single"/);
  assert.match(html, /<a href="\/ru">←\s*(?:<!-- -->)?Библиотека<\/a>/);
});
