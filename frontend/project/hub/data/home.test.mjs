import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const homeDataPath = path.join(currentDir, "home.json");
const worksDataPath = path.join(currentDir, "works.json");

const readHomeData = () => JSON.parse(fs.readFileSync(homeDataPath, "utf8"));
const readWorksData = () => JSON.parse(fs.readFileSync(worksDataPath, "utf8"));

test("home data matches the Hub landing page brief", () => {
  const data = readHomeData();

  assert.equal("featuredWorks" in data, false);
  assert.ok(Array.isArray(data.featuredWorkIds));
  assert.deepEqual(data.featuredWorkIds, [
    "20260619_zhangrh_shop",
    "20260205_card_game",
    "20260517_shotmarker",
  ]);
  assert.equal(new Set(data.featuredWorkIds).size, data.featuredWorkIds.length);

  const worksById = new Map(readWorksData().map((work) => [work.id, work]));
  const featuredWorks = data.featuredWorkIds.map((id) => worksById.get(id));
  assert.ok(featuredWorks.every(Boolean));
  assert.deepEqual(
    featuredWorks.map((work) => work.id),
    data.featuredWorkIds,
  );

  assert.ok(data.featuredArticles.length >= 3);
  for (const article of data.featuredArticles) {
    assert.equal(typeof article.title, "string");
    assert.ok(article.title.length > 0);
    assert.equal(typeof article.summary, "string");
    assert.ok(article.summary.length > 0);
    assert.match(article.date, /^\d{4}-\d{2}-\d{2}$/);
    assert.equal("tags" in article, false);
  }

  assert.equal(data.about.paragraphs.length, 1);
  assert.match(data.about.email, /^mailto:/);
  assert.match(data.about.github, /^https:\/\/github\.com\//);
  assert.equal(data.about.aboutLink, "/about");
});

test("home data keeps card copy concise", () => {
  const data = readHomeData();

  for (const article of data.featuredArticles) {
    assert.ok(article.summary.length <= 28);
  }

  for (const paragraph of data.about.paragraphs) {
    assert.ok(paragraph.length <= 42);
  }
});
