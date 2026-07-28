import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const worksDataPath = path.join(currentDir, "works.json");
const assetsDirectory = path.resolve(currentDir, "..", "assets");
const workIdPattern = /^\d{8}_[a-z0-9]+(?:_[a-z0-9]+)*$/;

const readWorksData = () => JSON.parse(fs.readFileSync(worksDataPath, "utf8"));

test("works data uses the Hub work contract", () => {
  const works = readWorksData();
  const ids = new Set();

  for (const work of works) {
    assert.deepEqual(
      Object.keys(work).sort(),
      ["coverImage", "id", "link", "name", "status", "summary"],
    );
    assert.match(work.id, workIdPattern);
    assert.equal(ids.has(work.id), false);
    ids.add(work.id);

    for (const field of ["name", "summary", "coverImage", "link"]) {
      assert.equal(typeof work[field], "string");
      assert.ok(work[field].trim().length > 0);
    }

    assert.match(work.status, /^(active|archived)$/);
    assert.doesNotMatch(work.coverImage, /^https?:\/\//);
    assert.doesNotMatch(work.coverImage, /\\/);
    assert.equal(path.posix.normalize(work.coverImage), work.coverImage);

    const coverImageParts = work.coverImage.split("/");
    assert.equal(coverImageParts[0], "works");
    assert.equal(coverImageParts[1], work.id);
    assert.ok(coverImageParts.at(-1).length > 0);
    assert.ok(
      coverImageParts.every((part) => part !== "." && part !== ".."),
    );

    const workAssetsDirectory = path.resolve(assetsDirectory, "works", work.id);
    const coverImagePath = path.resolve(assetsDirectory, work.coverImage);
    const coverImageRelativePath = path.relative(
      workAssetsDirectory,
      coverImagePath,
    );

    assert.ok(coverImageRelativePath.length > 0);
    assert.equal(path.isAbsolute(coverImageRelativePath), false);
    assert.notEqual(coverImageRelativePath, "..");
    assert.equal(
      coverImageRelativePath.startsWith(`..${path.sep}`),
      false,
    );
    assert.equal(fs.existsSync(coverImagePath), true);
    assert.equal(fs.lstatSync(coverImagePath).isFile(), true);

    const resolvedWorkAssetsDirectory = fs.realpathSync(workAssetsDirectory);
    const resolvedCoverImagePath = fs.realpathSync(coverImagePath);
    const resolvedCoverImageRelativePath = path.relative(
      resolvedWorkAssetsDirectory,
      resolvedCoverImagePath,
    );

    assert.ok(resolvedCoverImageRelativePath.length > 0);
    assert.equal(path.isAbsolute(resolvedCoverImageRelativePath), false);
    assert.notEqual(resolvedCoverImageRelativePath, "..");
    assert.equal(
      resolvedCoverImageRelativePath.startsWith(`..${path.sep}`),
      false,
    );
  }
});
