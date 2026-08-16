import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const hubRoot = path.resolve(currentDirectory, "..");

const readHubFile = (relativePath) =>
  fs.readFileSync(path.join(hubRoot, relativePath), "utf8");

test("article detail page renders generated content by numeric id", () => {
  const detailPage = readHubFile("pages/article-detail-page.tsx");

  assert.match(detailPage, /ARTICLES\.find/);
  assert.match(detailPage, /article\.id === articleId/);
  assert.match(detailPage, /article\.name/);
  assert.match(detailPage, /article\.publishDate/);
  assert.match(detailPage, /dangerouslySetInnerHTML/);
  assert.match(detailPage, /article\.contentHtml/);
  assert.match(detailPage, /<NotFoundPage \/>/);
  assert.doesNotMatch(detailPage, /slug/);
});

test("article detail tracks only after matching content is available", () => {
  const detailPage = readHubFile("pages/article-detail-page.tsx");

  assert.match(detailPage, /useEffect/);
  assert.match(
    detailPage,
    /if \(!article\) \{\s*return;\s*\}\s*trackHubEvent\("article_detail_page_load"\)/s,
  );
  assert.match(detailPage, /if \(!article\) \{\s*return <NotFoundPage \/>;\s*\}/s);
});

test("article detail route requires exactly six digits", () => {
  const route = readHubFile("shared/route.ts");

  assert.match(route, /\^\\\/articles\\\/\(\\d\{6\}\)\$/);
  assert.match(route, /articleId:/);
});
