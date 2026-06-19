import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const hubRoot = path.resolve(currentDir, "..");

const readHubFile = (relativePath) =>
  fs.readFileSync(path.join(hubRoot, relativePath), "utf8");

const readJson = (relativePath) =>
  JSON.parse(readHubFile(relativePath));

test("header navigation shows works, articles, and about me tabs only", () => {
  const constants = readHubFile("shared/constants.ts");

  assert.match(constants, /label: "作品"/);
  assert.match(constants, /label: "文章"/);
  assert.match(constants, /label: "关于我"/);
  assert.match(constants, /to: "\/articles"/);
  assert.doesNotMatch(constants, /label: "产品"/);
  assert.doesNotMatch(constants, /label: "想法"/);
  assert.doesNotMatch(constants, /label: "复盘"/);
  assert.doesNotMatch(constants, /label: "关于"/);
  assert.doesNotMatch(constants, /to: "\/ideas"/);
  assert.doesNotMatch(constants, /to: "\/reviews"/);
});

test("works and article list pages use the new page names", () => {
  const productsPage = readHubFile("pages/products-page.tsx");
  const articlesPage = readHubFile("pages/articles-page.tsx");

  assert.match(productsPage, />\s*作品\s*</);
  assert.match(articlesPage, />\s*文章\s*</);
  assert.doesNotMatch(productsPage, />\s*产品\s*</);
  assert.doesNotMatch(articlesPage, />\s*想法\s*</);
});

test("works and article lists have placeholder test data", () => {
  const products = readJson("data/products.json");
  const articles = readJson("data/articles.json");

  assert.ok(products.length >= 3);
  assert.ok(articles.length >= 3);
});

test("article route uses /articles and old content paths are removed", () => {
  const app = readHubFile("app.tsx");
  const route = readHubFile("shared/route.ts");
  const tracking = readHubFile("shared/tracking.ts");

  assert.match(route, /path === "\/articles"/);
  assert.match(route, /name: "articles"/);
  assert.match(app, /route\.name === "articles"/);
  assert.match(tracking, /\| "articles"/);

  assert.doesNotMatch(route, /path === "\/ideas"/);
  assert.doesNotMatch(route, /path === "\/reviews"/);
  assert.doesNotMatch(route, /path === "\/previews"/);
  assert.doesNotMatch(app, /ReviewsPage/);
});
