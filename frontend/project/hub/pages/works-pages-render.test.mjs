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
    const { FEATURED_WORKS, WORKS } = await server.ssrLoadModule(
      "/shared/data.ts",
    );

    await t.test("ProductsPage renders accessible work cards in data order", () => {
      const html = renderToStaticMarkup(createElement(ProductsPage));
      const cards = [...html.matchAll(/<article\b[\s\S]*?<\/article>/g)].map(
        (match) => match[0],
      );

      assert.equal(cards.length, WORKS.length);

      for (const [index, work] of WORKS.entries()) {
        const card = cards[index];
        const statusLabel = work.status === "active" ? "Active" : "Archived";

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
