import assert from "node:assert/strict";
import fs from "node:fs";
import { mkdtemp, readdir, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { build, createServer } from "vite";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const configFile = path.join(currentDir, "vite.config.ts");
const iconNames = [
  "create",
  "join",
  "bot",
  "help",
  "back",
  "sword",
  "shield",
  "heart",
  "hp",
  "alert",
  "deck",
  "discard",
];

const listFiles = async (directory) => {
  const entries = await readdir(directory, { withFileTypes: true });
  const nestedFiles = await Promise.all(
    entries.map(async (entry) => {
      const entryPath = path.join(directory, entry.name);
      return entry.isDirectory() ? listFiles(entryPath) : [entryPath];
    }),
  );

  return nestedFiles.flat();
};

test("CardGame renders every semantic icon as a local decorative SVG", async () => {
  const cacheDir = await mkdtemp(
    path.join(os.tmpdir(), "cardgame-icons-test-"),
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

    const { CardgameIcon } = await server.ssrLoadModule(
      "/components/icons.tsx",
    );

    for (const name of iconNames) {
      const html = renderToStaticMarkup(
        createElement(CardgameIcon, {
          className: "test-icon",
          name,
        }),
      );

      assert.match(html, /^<svg\b/);
      assert.ok(html.includes('class="test-icon"'));
      assert.ok(html.includes('aria-hidden="true"'));
      assert.ok(html.includes('viewBox="0 0 24 24"'));
      assert.ok(html.includes("currentColor"));
      assert.doesNotMatch(html, /https?:/i);
    }
  } finally {
    try {
      await server?.close();
    } finally {
      await rm(cacheDir, { force: true, recursive: true });
    }
  }
});

test("CardGame source uses local icons and declares a relative SVG favicon", () => {
  const appSource = fs.readFileSync(path.join(currentDir, "app.tsx"), "utf8");
  const htmlSource = fs.readFileSync(
    path.join(currentDir, "index.html"),
    "utf8",
  );

  assert.doesNotMatch(appSource, /figma\.com\/api\/mcp\/asset/i);
  assert.doesNotMatch(appSource, /const\s+ICON_[A-Z_]+\s*=\s*["']https?:/);
  assert.doesNotMatch(appSource, /iconUrl/);
  assert.match(
    htmlSource,
    /<link\s+rel=["']icon["'][^>]*href=["']\.\/favicon\.svg["'][^>]*>/i,
  );
  assert.equal(fs.existsSync(path.join(currentDir, "favicon.svg")), true);
});

test("CardGame production output contains its favicon and no Figma assets", async () => {
  const temporaryRoot = await mkdtemp(
    path.join(os.tmpdir(), "cardgame-build-test-"),
  );
  const cacheDir = path.join(temporaryRoot, "cache");
  const outDir = path.join(temporaryRoot, "dist");

  try {
    await build({
      cacheDir,
      configFile,
      logLevel: "silent",
      build: {
        emptyOutDir: true,
        outDir,
      },
    });

    const outputFiles = await listFiles(outDir);
    const textOutput = (
      await Promise.all(
        outputFiles
          .filter((filePath) => /\.(?:css|html|js|svg)$/.test(filePath))
          .map((filePath) => readFile(filePath, "utf8")),
      )
    ).join("\n");
    const builtHtml = await readFile(path.join(outDir, "index.html"), "utf8");
    const faviconHref = builtHtml.match(
      /<link\s+rel=["']icon["'][^>]*href=["']([^"']+)["'][^>]*>/i,
    )?.[1];

    assert.doesNotMatch(textOutput, /figma\.com\/api\/mcp\/asset/i);
    assert.ok(faviconHref);
    assert.doesNotMatch(faviconHref, /^https?:/i);
    assert.notEqual(faviconHref, "/favicon.ico");
    assert.match(faviconHref, /favicon[^/"']*\.svg(?:$|\?)/);
    assert.ok(
      outputFiles.some((filePath) => path.basename(filePath).includes("favicon")),
    );
  } finally {
    await rm(temporaryRoot, { force: true, recursive: true });
  }
});
