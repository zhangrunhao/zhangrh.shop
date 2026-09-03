import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const PNG_SIGNATURE = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

const readPngDimensions = async (url) => {
  const bytes = await readFile(url);
  assert.deepEqual(bytes.subarray(0, 8), PNG_SIGNATURE);
  assert.equal(bytes.subarray(12, 16).toString("ascii"), "IHDR");
  return {
    width: bytes.readUInt32BE(16),
    height: bytes.readUInt32BE(20),
  };
};

test("WebTrace default metadata and resources are local", async () => {
  const html = await readFile(new URL("./index.html", import.meta.url), "utf8");

  assert.match(html, /<html lang="zh-CN">/);
  assert.match(html, /<title>WebTrace - 网站时间追踪器<\/title>/);
  assert.match(
    html,
    /name="description"\s+content="WebTrace 在本机记录已配置网站的打开次数与有效观看时长。"/,
  );
  assert.match(html, /rel="icon"[^>]*href="\.\/assets\/icon-128\.png"/);
  assert.doesNotMatch(html, /<(?:script|link|img)\b[^>]*(?:src|href)="https?:\/\//i);
});

test("WebTrace carries the confirmed icon and synthetic dashboard screenshot", async () => {
  assert.deepEqual(
    await readPngDimensions(new URL("./assets/icon-128.png", import.meta.url)),
    { width: 128, height: 128 },
  );
  assert.deepEqual(
    await readPngDimensions(new URL("./assets/webtrace-dashboard.png", import.meta.url)),
    { width: 1280, height: 800 },
  );
});

test("WebTrace styles include mobile, focus, and reduced-motion safeguards", async () => {
  const css = await readFile(new URL("./styles.css", import.meta.url), "utf8");

  assert.match(css, /@media\s*\([^)]*max-width:\s*390px[^)]*\)/);
  assert.match(css, /:focus-visible/);
  assert.match(css, /@media\s*\(prefers-reduced-motion:\s*reduce\)/);
  assert.match(css, /\.privacy-callout/);
  assert.match(css, /\.policy-page/);
});

test("the complete frontend build includes WebTrace", async () => {
  const packageJson = JSON.parse(
    await readFile(new URL("../../package.json", import.meta.url), "utf8"),
  );

  assert.match(packageJson.scripts["build:all"], /npm run build webtrace/);
});
