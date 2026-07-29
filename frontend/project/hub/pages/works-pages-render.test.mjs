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
const projectRoot = path.resolve(currentDir, "..");
const configFile = path.join(projectRoot, "vite.config.ts");

const escapeRegExp = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const assertNoNestedAnchors = (html) => {
  let depth = 0;

  for (const match of html.matchAll(/<a\b|<\/a>/g)) {
    if (match[0] === "</a>") {
      depth -= 1;
      assert.ok(depth >= 0);
      continue;
    }

    depth += 1;
    assert.ok(depth <= 1);
  }

  assert.equal(depth, 0);
};

test("Hub work pages render the Work contract", async (t) => {
  const cacheDir = await mkdtemp(
    path.join(os.tmpdir(), "hub-works-pages-render-test-"),
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

    const { ProductsPage } = await server.ssrLoadModule(
      "/pages/products-page.tsx",
    );
    const { HomePage } = await server.ssrLoadModule("/pages/home-page.tsx");
    const { WorkStatusBadge } = await server.ssrLoadModule(
      "/components/work-card.tsx",
    );
    const { FEATURED_WORKS, WORKS } = await server.ssrLoadModule(
      "/shared/data.ts",
    );
    const { ARTICLES } = await server.ssrLoadModule("/shared/articles.ts");

    await t.test("WorkStatusBadge renders every supported status", () => {
      const expectations = {
        active: {
          label: "Active",
          classTokens: ["bg-emerald-50", "border-emerald-200", "text-emerald-700"],
        },
        paused: {
          label: "Paused",
          classTokens: ["bg-amber-50", "border-amber-200", "text-amber-700"],
        },
        archived: {
          label: "Archived",
          classTokens: ["bg-neutral-100", "border-neutral-300", "text-neutral-600"],
        },
      };

      for (const [status, expectation] of Object.entries(expectations)) {
        const html = renderToStaticMarkup(
          createElement(WorkStatusBadge, { status }),
        );

        assert.ok(html.includes(`>${expectation.label}</span>`));
        for (const classToken of expectation.classTokens) {
          assert.ok(html.includes(classToken));
        }
      }
    });

    await t.test("ProductsPage renders accessible work cards in data order", () => {
      const html = renderToStaticMarkup(createElement(ProductsPage));
      const cards = [...html.matchAll(/<article\b[\s\S]*?<\/article>/g)].map(
        (match) => match[0],
      );

      assert.equal(cards.length, WORKS.length);

      for (const [index, work] of WORKS.entries()) {
        const card = cards[index];
        const statusLabels = {
          active: "Active",
          paused: "Paused",
          archived: "Archived",
        };
        const statusLabel = statusLabels[work.status];

        assert.match(
          card,
          new RegExp(`<h2[^>]*>${escapeRegExp(work.name)}</h2>`),
        );
        assert.ok(card.includes(`href="${work.link}"`));
        assert.ok(card.includes('target="_blank"'));
        assert.ok(card.includes('rel="noreferrer"'));
        assert.ok(card.includes(`aria-label="查看 ${work.name}"`));
        assert.ok(card.includes(`src="${work.coverImage}"`));
        assert.match(card, /<img\b[^>]*alt=""/);
        assert.ok(card.includes(statusLabel));
        assert.ok(card.includes("查看作品"));
      }
    });

    await t.test("HomePage renders linked featured cards without nested links", () => {
      const html = renderToStaticMarkup(createElement(HomePage));
      let previousLinkIndex = -1;

      for (const work of FEATURED_WORKS) {
        const link = `href="${work.link}"`;
        const linkIndex = html.indexOf(link);

        assert.ok(linkIndex > previousLinkIndex);
        assert.equal(html.split(link).length - 1, 1);

        const closingAnchorIndex = html.indexOf("</a>", linkIndex);
        assert.ok(closingAnchorIndex > linkIndex);
        assert.ok(
          html.slice(linkIndex, closingAnchorIndex).includes(work.name),
        );
        assert.ok(
          html.slice(linkIndex, closingAnchorIndex).includes('target="_blank"'),
        );
        assert.ok(
          html.slice(linkIndex, closingAnchorIndex).includes('rel="noreferrer"'),
        );

        previousLinkIndex = linkIndex;
      }

      assertNoNestedAnchors(html);
    });

    await t.test("HomePage renders the latest generated articles in order", () => {
      const html = renderToStaticMarkup(createElement(HomePage));
      let previousLinkIndex = -1;

      for (const article of ARTICLES.slice(0, 3)) {
        const link = `href="/articles/${article.id}"`;
        const linkIndex = html.indexOf(link);

        assert.ok(linkIndex > previousLinkIndex);
        assert.ok(
          html
            .slice(linkIndex, html.indexOf("</a>", linkIndex))
            .includes(article.name),
        );

        previousLinkIndex = linkIndex;
      }
    });

    await t.test("HomePage renders an empty state without generated articles", () => {
      const html = renderToStaticMarkup(
        createElement(HomePage, { articles: [] }),
      );

      assert.ok(html.includes("没有已发布的文章。"));
      assert.ok(!html.includes("Hub 首页设计：个人能力展示页"));
      assert.ok(!html.includes("zhangrh.shop 项目说明：Hub、发布和项目边界"));
    });
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
