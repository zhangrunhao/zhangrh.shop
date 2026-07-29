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

test("Hub resolves supported routes and rejects retired paths", async (t) => {
  const cacheDir = await mkdtemp(path.join(os.tmpdir(), "hub-route-test-"));
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

    const { resolveRoute } = await server.ssrLoadModule("/shared/route.ts");

    await t.test("maps current list routes", () => {
      assert.deepEqual(resolveRoute("/products"), { name: "products" });
      assert.deepEqual(resolveRoute("/articles"), { name: "articles" });
    });

    await t.test("rejects removed content routes", () => {
      for (const pathname of [
        "/ideas",
        "/reviews",
        "/previews",
        "/zhengtian",
      ]) {
        assert.deepEqual(resolveRoute(pathname), { name: "not-found" });
      }
    });

    await t.test("rejects retired work detail paths", () => {
      for (const pathname of [
        "/products/20260619_zhangrh_shop",
        "/products/missing-work",
      ]) {
        assert.deepEqual(resolveRoute(pathname), { name: "not-found" });
      }
    });
  } finally {
    try {
      await server?.close();
    } finally {
      await rm(cacheDir, { force: true, recursive: true });
    }
  }
});
