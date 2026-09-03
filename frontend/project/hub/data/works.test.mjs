import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const worksDataPath = path.join(currentDir, "works.json");
const assetsDirectory = path.resolve(currentDir, "..", "assets");
const worksAssetsDirectory = path.join(assetsDirectory, "works");
const workIdPattern = /^\d{8}_[a-z0-9]+(?:_[a-z0-9]+)*$/;
const expectedWorkLinks = {
  "20260517_shotmarker": "https://zhangrh.shop/shotmarker/",
  "20260903_webtrace": "https://zhangrh.shop/webtrace/",
  "20260729_cardgame": "https://zhangrh.shop/cardgame/",
};

const readWorksData = () => JSON.parse(fs.readFileSync(worksDataPath, "utf8"));

test("works data uses the Hub work contract", () => {
  const works = readWorksData();
  const ids = new Set();
  const resolvedAssetsDirectory = fs.realpathSync(assetsDirectory);

  assert.deepEqual(
    works.map((work) => work.id),
    [
      "20260517_shotmarker",
      "20260903_webtrace",
      "20260729_cardgame",
    ],
  );
  assert.deepEqual(
    fs
      .readdirSync(worksAssetsDirectory, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map((entry) => entry.name)
      .sort(),
    [
      "20260517_shotmarker",
      "20260729_cardgame",
      "20260903_webtrace",
    ],
  );

  assert.deepEqual(works[0], {
    id: "20260517_shotmarker",
    name: "ShotMarker",
    summary:
      "训练时用 Apple Watch 给精彩投篮打点，结束后在 iPhone 上把训练视频整理成集锦。",
    link: "https://zhangrh.shop/shotmarker/",
    coverImage: "works/20260517_shotmarker/cover.webp",
    status: "active",
  });

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

    const workUrl = new URL(work.link);
    assert.equal(workUrl.protocol, "https:");
    assert.equal(work.link, expectedWorkLinks[work.id]);

    assert.match(work.status, /^(active|paused|archived)$/);
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
    assert.equal(fs.lstatSync(workAssetsDirectory).isDirectory(), true);

    const resolvedWorkAssetsDirectory = fs.realpathSync(workAssetsDirectory);
    const resolvedWorkAssetsRelativePath = path.relative(
      resolvedAssetsDirectory,
      resolvedWorkAssetsDirectory,
    );
    const resolvedCoverImagePath = fs.realpathSync(coverImagePath);
    const resolvedCoverImageRelativePath = path.relative(
      resolvedWorkAssetsDirectory,
      resolvedCoverImagePath,
    );

    assert.equal(path.isAbsolute(resolvedWorkAssetsRelativePath), false);
    assert.notEqual(resolvedWorkAssetsRelativePath, "..");
    assert.equal(
      resolvedWorkAssetsRelativePath.startsWith(`..${path.sep}`),
      false,
    );
    assert.equal(
      resolvedWorkAssetsRelativePath,
      path.join("works", work.id),
    );
    assert.ok(resolvedCoverImageRelativePath.length > 0);
    assert.equal(path.isAbsolute(resolvedCoverImageRelativePath), false);
    assert.notEqual(resolvedCoverImageRelativePath, "..");
    assert.equal(
      resolvedCoverImageRelativePath.startsWith(`..${path.sep}`),
      false,
    );
  }

  assert.deepEqual(works[1], {
    id: "20260903_webtrace",
    name: "WebTrace",
    summary:
      "在本机记录指定网站的打开次数与有效使用时长，用最近 14 天趋势看清注意力去向。",
    link: "https://zhangrh.shop/webtrace/",
    coverImage: "works/20260903_webtrace/cover.webp",
    status: "active",
  });

  assert.deepEqual(works[2], {
    id: "20260729_cardgame",
    name: "CardGame",
    summary: "策略卡牌对战 Demo，当前暂停维护，仍可体验。",
    link: "https://zhangrh.shop/cardgame/",
    coverImage: "works/20260729_cardgame/cover.svg",
    status: "paused",
  });
});
