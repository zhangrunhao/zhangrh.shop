import test from "node:test";
import assert from "node:assert/strict";
import {
  CONTACT_EMAIL,
  PRIVACY_PATH,
  SUPPORT_PATH,
  privacyPage,
  supportPage,
  type ContentBlock,
  type ShotMarkerPage,
} from "./content";

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

test("support page contains the provided FAQ and contact details", () => {
  const text = pageText(supportPage);

  assert.equal(supportPage.title, "ShotMarker Support");
  assert.match(text, /Apple Watch markers did not sync/);
  assert.match(text, /Why did iCloud video loading fail/);
  assert.match(text, /Does ShotMarker upload my videos/);
  assert.match(text, /export diagnostic logs/);
  assert.match(text, new RegExp(CONTACT_EMAIL));
});

test("public links use the production shotmaker route", () => {
  assert.equal(SUPPORT_PATH, "/shotmaker/support");
  assert.equal(PRIVACY_PATH, "/shotmaker/privacy");
  assert.doesNotMatch(blockText(supportPage.sections[2].blocks[0]), /shotmarker/);
  assert.doesNotMatch(
    blockText(privacyPage.sections.at(-1)?.blocks[1] ?? { kind: "paragraph", text: "" }),
    /shotmarker/,
  );
});
