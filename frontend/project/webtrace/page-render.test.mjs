import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const configFile = path.join(currentDir, "vite.config.ts");

const withWebTraceModule = async (callback) => {
  const cacheDir = await mkdtemp(path.join(os.tmpdir(), "webtrace-render-test-"));
  let server;

  try {
    server = await createServer({
      appType: "custom",
      cacheDir,
      configFile,
      logLevel: "silent",
      optimizeDeps: { noDiscovery: true, include: [] },
      server: { middlewareMode: true, ws: false },
    });
    const appModule = await server.ssrLoadModule("/app.tsx");
    const contentModule = await server.ssrLoadModule("/content.ts");
    await callback({ ...appModule, ...contentModule });
  } finally {
    await server?.close();
    await rm(cacheDir, { force: true, recursive: true });
  }
};

test("WebTrace home renders one product heading, real screenshot, and stable links", async () => {
  await withWebTraceModule(async ({ HomePage }) => {
    const html = renderToStaticMarkup(createElement(HomePage));

    assert.equal(html.match(/<h1\b/g)?.length, 1);
    assert.match(html, /<h1[^>]*>WebTrace<\/h1>/);
    assert.match(html, /class="[^"]*privacy-callout[^"]*"/);
    assert.match(html, /全部仅保存在本机/);
    assert.match(html, /class="[^"]*steps-grid[^"]*"/);
    assert.match(html, /src="[^"]*webtrace-dashboard\.png"/);
    assert.match(html, /alt="WebTrace 分析页，展示合成网站数据和最近 14 天趋势"/);
    assert.match(html, /href="\/webtrace\/support"/);
    assert.match(html, /href="\/webtrace\/privacy"/);
    assert.match(html, /href="https:\/\/zhangrh\.shop\/hub\/"/);
  });
});

test("WebTrace support renders timing, ordering, deletion, and contact help", async () => {
  await withWebTraceModule(async ({ ContentPage, supportPage }) => {
    const html = renderToStaticMarkup(createElement(ContentPage, { page: supportPage }));

    assert.match(html, /WebTrace 使用支持/);
    assert.match(html, /离开目标网站，再从其他网站重新进入/);
    assert.match(html, /设备未锁屏/);
    assert.match(html, /鼠标长按网站/);
    assert.match(html, /永久删除该网站的全部访问记录/);
    assert.match(html, /href="mailto:zhangrhweb@gmail\.com"/);
    assert.match(html, /href="\/webtrace\/privacy"/);
    assert.doesNotMatch(html, /<form\b/);
  });
});

test("WebTrace privacy renders equivalent English and Chinese policy sections", async () => {
  await withWebTraceModule(async ({ ContentPage, privacyPage }) => {
    const html = renderToStaticMarkup(createElement(ContentPage, { page: privacyPage }));

    assert.match(html, /WebTrace Privacy Policy \/ 隐私政策/);
    assert.match(html, /Effective September 3, 2026/);
    assert.match(html, /stored only in the current Chrome profile on your device/i);
    assert.match(html, /全部仅保存在你设备的当前 Chrome 配置文件中/);
    assert.match(html, /Chrome Web Store User Data Policy/);
    assert.match(html, /Limited Use requirements/);
    assert.match(html, /Last updated: 2026-09-03/);
  });
});

test("WebTrace not-found page stays within the product", async () => {
  await withWebTraceModule(async ({ NotFoundPage }) => {
    const html = renderToStaticMarkup(createElement(NotFoundPage));

    assert.match(html, /WebTrace 页面不存在/);
    assert.match(html, /href="\/webtrace\/"/);
    assert.match(html, /href="\/webtrace\/support"/);
  });
});
