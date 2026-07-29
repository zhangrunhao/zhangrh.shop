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
  assert.equal(new Set(data.featuredWorkIds).size, data.featuredWorkIds.length);

  const worksById = new Map(readWorksData().map((work) => [work.id, work]));
  for (const id of data.featuredWorkIds) {
    assert.ok(worksById.has(id));
  }

  assert.equal("featuredArticles" in data, false);

  assert.equal(data.about.paragraphs.length, 1);
  assert.match(data.about.email, /^mailto:/);
  assert.match(data.about.github, /^https:\/\/github\.com\//);
  assert.equal(data.about.aboutLink, "/about");
});

test("home data keeps about copy concise", () => {
  const data = readHomeData();

  for (const paragraph of data.about.paragraphs) {
    assert.ok(paragraph.length <= 42);
  }
});
