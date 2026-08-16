import test from "node:test";
import assert from "node:assert/strict";
import {
  CONTACT_EMAIL,
  EFFECTIVE_DATE,
  HOW_TO_PATH,
  LAST_UPDATED,
  PRIVACY_PATH,
  SUPPORT_PATH,
  howToPage,
  privacyPage,
  supportPage,
  type ContentBlock,
  type ShotMarkerPage,
} from "./content";

const OLD_PROJECT_SLUG = "shot" + "maker";

const blockText = (block: ContentBlock) =>
  block.kind === "list" ? block.items.join("\n") : block.text;

const pageText = (page: ShotMarkerPage) =>
  [
    page.title,
    page.description,
    page.muted,
    page.summary,
    page.summaryZh,
    ...page.sections.flatMap((section) => [
      section.title,
      ...section.blocks.map(blockText),
    ]),
  ]
    .filter(Boolean)
    .join("\n");

test("privacy page contains the provided local-first privacy summary", () => {
  const text = pageText(privacyPage);

  assert.equal(privacyPage.title, "ShotMarker Privacy Policy");
  assert.match(text, /does not require an account/);
  assert.match(text, /does not use third-party analytics SDKs/);
  assert.match(text, /does not upload your videos/);
  assert.match(text, /WatchConnectivity/);
  assert.match(text, /HealthKit/);
});

test("privacy page documents the first-party analytics contract", () => {
  const text = pageText(privacyPage);

  assert.equal(EFFECTIVE_DATE, "August 16, 2026");
  assert.equal(LAST_UPDATED, "2026-08-16");
  assert.match(text, /random 12-character installation identifier/);
  assert.match(text, /app_launch/);
  assert.match(text, /training_sync_succeeded/);
  assert.match(text, /highlight_generate_succeeded/);
  assert.match(text, /highlight_save_succeeded/);
  assert.match(text, /empty parameter object/);
  assert.match(text, /does not have a fixed automatic expiration period/);
  assert.match(text, /32 MiB/);
  assert.match(text, /does not immediately delete prior server events/);
  assert.match(text, /not used for advertising or cross-company tracking/);
  assert.match(
    text,
    /events do not contain training records, marker timestamps, videos, HealthKit data, or diagnostic logs/,
  );
});

test("support page contains the provided FAQ and contact details", () => {
  const text = pageText(supportPage);

  assert.equal(supportPage.title, "ShotMarker Support");
  assert.match(text, /Apple Watch markers did not sync/);
  assert.match(text, /Why did iCloud video loading fail/);
  assert.match(text, /Does ShotMarker upload my videos/);
  assert.match(text, /export diagnostic logs/);
  assert.match(text, new RegExp(CONTACT_EMAIL));
});

test("how-to page contains the core Chinese usage flow", () => {
  const text = pageText(howToPage);

  assert.equal(howToPage.title, "ShotMarker 使用说明");
  assert.match(text, /用 Apple Watch 给好球打点/);
  assert.match(text, /打开 iPhone 里的训练记录/);
  assert.match(text, /选择视频，生成集锦/);
  assert.match(text, /双击按钮或转动数码表冠/);
});

test("public links use the production shotmarker route", () => {
  assert.equal(SUPPORT_PATH, "/shotmarker/support");
  assert.equal(PRIVACY_PATH, "/shotmarker/privacy");
  assert.equal(HOW_TO_PATH, "/shotmarker/how-to");
  assert.match(blockText(supportPage.sections[2].blocks[0]), /\/shotmarker\/privacy/);
  assert.match(
    blockText(privacyPage.sections.at(-1)?.blocks[1] ?? { kind: "paragraph", text: "" }),
    /\/shotmarker\/support/,
  );
  assert.doesNotMatch(blockText(supportPage.sections[2].blocks[0]), new RegExp(OLD_PROJECT_SLUG));
  assert.doesNotMatch(
    blockText(privacyPage.sections.at(-1)?.blocks[1] ?? { kind: "paragraph", text: "" }),
    new RegExp(OLD_PROJECT_SLUG),
  );
});
