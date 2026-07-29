import assert from "node:assert/strict";
import { mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { createServer } from "vite";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(currentDir, "..");
const configFile = path.join(projectRoot, "vite.config.ts");

test("Hub resolves work assets through Vite", async (t) => {
  const cacheDir = await mkdtemp(
    path.join(os.tmpdir(), "hub-work-assets-test-"),
  );
  let server;

  try {
    server = await createServer({
      appType: "custom",
      cacheDir,
      configFile,
      logLevel: "silent",
      server: {
        middlewareMode: true,
        ws: false,
      },
    });

    const { resolveWorkAsset } = await server.ssrLoadModule(
      "/shared/work-assets.ts",
    );
    const { FEATURED_WORKS, HOME } = await server.ssrLoadModule(
      "/shared/data.ts",
    );

    await t.test("resolves every real cover to its matching Vite URL", () => {
      const coverPaths = [
        "works/20260517_shotmarker/cover.webp",
        "works/20260729_cardgame/cover.svg",
      ];

      for (const coverPath of coverPaths) {
        const assetUrl = resolveWorkAsset(coverPath);
        assert.equal(typeof assetUrl, "string");
        assert.ok(assetUrl.length > 0);
        assert.ok(
          decodeURIComponent(assetUrl).includes(coverPath) ||
            assetUrl.startsWith("data:image/svg+xml"),
        );
      }
    });

    await t.test("reports the original path for a missing asset", () => {
      const missingPath = "works/missing/cover.png";

      assert.throws(
        () => resolveWorkAsset(missingPath),
        (error) =>
          error instanceof Error &&
          error.message.includes("Work asset not found") &&
          error.message.includes(missingPath),
      );
    });

    await t.test("rejects non-canonical work asset paths", () => {
      const invalidPaths = [
        "/works/example/cover.png",
        String.raw`works\example\cover.png`,
        "works/./example/cover.png",
        "works/example/../cover.png",
        "works/example/",
      ];

      for (const invalidPath of invalidPaths) {
        assert.throws(
          () => resolveWorkAsset(invalidPath),
          (error) =>
            error instanceof Error &&
            error.message.includes("Invalid work asset path") &&
            error.message.includes(invalidPath),
        );
      }
    });

    await t.test("preserves the configured featured work order", () => {
      assert.deepEqual(
        FEATURED_WORKS.map((work) => work.id),
        HOME.featuredWorkIds,
      );
    });
  } finally {
    try {
      await server?.close();
    } finally {
      await rm(cacheDir, { force: true, recursive: true });
    }
  }
});
