import assert from "node:assert/strict";
import { access, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const configFile = path.join(currentDir, "vite.config.ts");

const escapeRegExp = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test("How-to page renders the confirmed related links", async () => {
  const cacheDir = await mkdtemp(
    path.join(os.tmpdir(), "shotmarker-how-to-render-test-"),
  );
  let server;

  try {
    server = await createServer({
      appType: "custom",
      cacheDir,
      configFile,
      logLevel: "silent",
      optimizeDeps: {
        noDiscovery: true,
        include: [],
      },
      server: {
        middlewareMode: true,
        ws: false,
      },
    });

    const { HowToPage } = await server.ssrLoadModule("/app.tsx");
    const { HOW_TO_RELATED_LINKS } = await server.ssrLoadModule("/content.ts");

    assert.equal(typeof HowToPage, "function");
    assert.deepEqual(HOW_TO_RELATED_LINKS, [
      {
        title: "ShotMarker Support",
        description: "获取使用帮助、反馈问题。",
        href: "/shotmarker/support",
      },
      {
        title: "Privacy Policy",
        description: "查看 ShotMarker 隐私政策。",
        href: "/shotmarker/privacy",
      },
      {
        title: "zhangrh.shop",
        description: "返回 zhangrh.shop 作品主页。",
        href: "https://zhangrh.shop/hub/",
      },
    ]);

    const html = renderToStaticMarkup(createElement(HowToPage));

    assert.match(html, /<h2 id="how-to-related-links-title">相关链接<\/h2>/);

    const stepArticles = html.match(
      /<article class="how-to-step">[\s\S]*?<\/article>/g,
    );
    assert.equal(stepArticles?.length, 3);
    const thirdStep = stepArticles[2];
    assert.match(thirdStep, /<div class="how-to-visual trio">/);
    assert.equal(thirdStep.match(/<img\b/g)?.length, 3);
    assert.match(thirdStep, /iphone-highlight-ready\.png/);
    assert.match(thirdStep, /iphone-highlight-generate\.png/);
    assert.match(
      thirdStep,
      /<img[^>]*src="[^"]*iphone-highlight-job-completed\.png"[^>]*alt="iPhone 首页的集锦任务，显示已完成状态和播放、保存、删除入口"[^>]*>/,
    );

    for (const link of HOW_TO_RELATED_LINKS) {
      const anchor = html.match(
        new RegExp(
          `<a[^>]*href="${escapeRegExp(link.href)}"[^>]*>[\\s\\S]*?<\\/a>`,
        ),
      )?.[0];

      assert.ok(anchor);
      assert.ok(anchor.includes(link.title));
      assert.ok(anchor.includes(link.description));
      assert.doesNotMatch(anchor, /\starget=/);
    }
  } finally {
    try {
      await server?.close();
    } finally {
      await rm(cacheDir, { force: true, recursive: true });
      await assert.rejects(
        access(cacheDir),
        (error) => error?.code === "ENOENT",
      );
    }
  }
});
