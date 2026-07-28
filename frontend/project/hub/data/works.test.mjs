import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const worksDataPath = path.join(currentDir, "works.json");
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
    assert.ok(work.coverImage.startsWith(`works/${work.id}/`));
    assert.equal(path.posix.normalize(work.coverImage), work.coverImage);

    const coverImageParts = work.coverImage.split("/");
    assert.ok(coverImageParts.at(-1).length > 0);
    assert.ok(
      coverImageParts.every((part) => part !== "." && part !== ".."),
    );
  }
});
