import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { build } from "vite";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const configFile = path.join(currentDir, "vite.config.ts");

test("Analytics production build uses the /analytics/ public base", async () => {
  const temporaryRoot = await mkdtemp(
    path.join(os.tmpdir(), "analytics-build-test-"),
  );
  const outDir = path.join(temporaryRoot, "dist");

  try {
    await build({
      cacheDir: path.join(temporaryRoot, "cache"),
      configFile,
      logLevel: "silent",
      build: { emptyOutDir: true, outDir },
    });

    const html = await readFile(path.join(outDir, "index.html"), "utf8");
    assert.match(html, /(?:src|href)="\/analytics\/static\//);
    assert.match(html, /href="\/analytics\/static\/favicon[^\"]*\.svg"/);
    assert.doesNotMatch(html, /(?:src|href)="\/static\//);
  } finally {
    await rm(temporaryRoot, { force: true, recursive: true });
  }
});
