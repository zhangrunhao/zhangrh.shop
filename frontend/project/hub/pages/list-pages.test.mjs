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

test("works list preserves WORKS order and renders WorkCard", () => {
  const productsPage = readHubFile("pages/products-page.tsx");

  assert.match(productsPage, /import \{ WorkCard \} from "\.\.\/components\/work-card";/);
  assert.match(productsPage, /import \{ WORKS \} from "\.\.\/shared\/data";/);
  assert.match(productsPage, /\{WORKS\.map\(\(work\) => \(/);
  assert.match(productsPage, /<WorkCard key=\{work\.id\} work=\{work\} \/>/);
  assert.doesNotMatch(productsPage, /useMemo/);
  assert.doesNotMatch(productsPage, /sortByDateDesc/);
});

test("work card uses the Work contract and resolved cover", () => {
  const workCard = readHubFile("components/work-card.tsx");

  assert.match(workCard, /import type \{ Work, WorkStatus \} from "\.\.\/types";/);
  assert.match(workCard, /Record<WorkStatus, string>/);
  assert.match(workCard, /export const WorkStatusBadge/);
  assert.match(workCard, /export const WorkCard = \(\{ work \}: \{ work: Work \}\)/);
  assert.match(workCard, /src=\{work\.coverImage\}/);
  assert.match(workCard, /alt=""/);
  assert.match(workCard, /<h2[^>]*>\s*\{work\.name\}\s*<\/h2>/);
  assert.match(workCard, /to=\{work\.link\}/);
  assert.match(workCard, /ariaLabel=\{`查看 \$\{work\.name\}`\}/);
  assert.match(workCard, />\s*查看作品\s*<ArrowIcon \/>/);
  assert.doesNotMatch(workCard, /resolveImageUrl/);
  assert.doesNotMatch(workCard, /currentVersion/);
  assert.doesNotMatch(workCard, /currentVersionCommitDate/);
  assert.doesNotMatch(workCard, /ProductDetailMeta/);
});

test("work detail and app titles find works by ID", () => {
  const app = readHubFile("app.tsx");
  const productDetailPage = readHubFile("pages/product-detail-page.tsx");

  assert.match(app, /import \{ WORKS \} from "\.\/shared\/data";/);
  assert.match(app, /WORKS\.find\(\(item\) => item\.id === route\.productId\)/);
  assert.match(app, /const work = WORKS\.find/);
  assert.match(productDetailPage, /import \{ WORKS \} from "\.\.\/shared\/data";/);
  assert.match(
    productDetailPage,
    /const work = WORKS\.find\(\(item\) => item\.id === productId\)/,
  );
  assert.match(productDetailPage, /src=\{work\.coverImage\}/);
  assert.match(productDetailPage, /<WorkStatusBadge status=\{work\.status\} \/>/);
  assert.match(
    productDetailPage,
    /<ArrowIcon className="size-3\.5 rotate-180" \/>/,
  );

  for (const source of [app, productDetailPage]) {
    assert.doesNotMatch(source, /\bPRODUCTS\b/);
  }
  assert.doesNotMatch(productDetailPage, /resolveImageUrl/);
  assert.doesNotMatch(productDetailPage, /currentVersion/);
  assert.doesNotMatch(productDetailPage, /currentVersionCommitDate/);
  assert.doesNotMatch(productDetailPage, /ProductDetailMeta/);
});

test("migrated work consumers do not import the legacy Product contract", () => {
  const sources = [
    readHubFile("components/work-card.tsx"),
    readHubFile("pages/home-page.tsx"),
    readHubFile("pages/products-page.tsx"),
    readHubFile("pages/product-detail-page.tsx"),
    readHubFile("app.tsx"),
  ];

  for (const source of sources) {
    assert.doesNotMatch(source, /import[^;]*\bProduct(?:Status)?\b[^;]*from/);
  }
});

test("works and article lists have placeholder test data", () => {
  const works = readJson("data/works.json");
  const articles = readJson("data/articles.json");

  assert.ok(works.length >= 3);
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
