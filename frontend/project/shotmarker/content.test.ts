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
  assert.match(text, /does not show ads/);
  assert.match(text, /does not use third-party analytics SDKs/);
  assert.match(text, /does not upload your videos/);
  assert.match(text, /does not upload your training records/);
  assert.match(text, /stored mainly on your devices/);
  assert.match(
    text,
    /Diagnostic logs are automatically rotated and removed according to the app's local retention policy/,
  );
  assert.match(
    text,
    /当前版本不需要账号，不展示广告，不使用第三方分析 SDK，也不会把你的视频或训练记录上传到开发者服务器/,
  );
  assert.match(
    text,
    /训练记录、剪辑设置、Watch 同步 outbox 和诊断日志主要保存在你的设备本地/,
  );
  assert.match(text, /诊断日志会根据 App 的本地保留策略自动滚动和删除/);
  assert.match(text, /WatchConnectivity/);
  assert.match(text, /HealthKit/);
});

test("privacy page documents the first-party analytics contract", () => {
  const text = pageText(privacyPage);

  assert.equal(EFFECTIVE_DATE, "August 16, 2026");
  assert.equal(LAST_UPDATED, "2026-08-16");
  assert.match(text, /random 12-character installation identifier/);
  assert.match(
    text,
    /The four fixed event names are app_launch, training_sync_succeeded, highlight_generate_succeeded, and highlight_save_succeeded/,
  );
  assert.match(text, /empty parameter object/);
  assert.match(text, /does not have a fixed automatic expiration period/);
  assert.match(text, /does not immediately delete prior server events/);
  assert.match(text, /not used for advertising or cross-company tracking/);
  assert.match(
    text,
    /events do not contain training records, marker timestamps, videos, HealthKit data, or diagnostic logs/,
  );
  assert.match(
    text,
    /Only Release builds of the ShotMarker iPhone app send first-party product analytics events/,
  );
  assert.match(
    text,
    /The iPhone app sends the event name, client time, the project value shotmarker, an empty parameter object, and a random 12-character installation identifier stored in UserDefaults/,
  );
  assert.match(
    text,
    /When the server persists the event as schema v1, it adds schema_version 1, the server receipt time, and a server-generated 32-character hexadecimal request_id/,
  );
  assert.match(text, /The request_id is used only to deduplicate records during aggregation/);
  assert.match(text, /approximate number of unique installations/);
  assert.match(
    text,
    /do not include an advertising identifier, device model, or operating system version/,
  );
  assert.match(text, /used only for first-party product analytics/);
  assert.match(text, /not shared with third-party analytics providers/);
  assert.match(text, /single append-only events\.jsonl file/);
  assert.match(
    text,
    /The storage design will be re-evaluated when the file reaches 32 MiB and adjusted before the Backend's 64 MiB total decoded query limit/,
  );
  assert.match(
    text,
    /Uninstalling and reinstalling ShotMarker resets the local installation identifier/,
  );
  assert.match(text, /Public aggregate queries do not return raw installation identifiers/);

  assert.match(
    text,
    /仅 ShotMarker iPhone App 的 Release 构建会向开发者自己的 HTTPS 端点发送第一方产品分析事件/,
  );
  assert.match(
    text,
    /四个固定事件名为 app_launch、training_sync_succeeded、highlight_generate_succeeded 和 highlight_save_succeeded/,
  );
  assert.match(
    text,
    /iPhone App 发送事件名、客户端时间、project 值 shotmarker、空参数对象，以及保存在 UserDefaults 中的随机 12 位安装标识符/,
  );
  assert.match(
    text,
    /服务器按 schema v1 持久化事件时，会附加 schema_version 1、服务器接收时间和由服务器生成的 32 位十六进制 request_id/,
  );
  assert.match(text, /request_id 仅用于聚合时对记录去重/);
  assert.match(text, /用于估算大致的独立安装数量/);
  assert.match(
    text,
    /这些分析事件不包含训练记录、打点时间戳、视频、HealthKit 数据或诊断日志，也不包含广告标识符、设备型号或操作系统版本/,
  );
  assert.match(
    text,
    /数据仅用于第一方产品分析，不用于广告或跨公司跟踪，也不会共享给第三方分析服务商/,
  );
  assert.match(
    text,
    /第一方分析事件会保留在开发者服务器上的单一追加写入 events\.jsonl 文件中/,
  );
  assert.match(text, /该文件没有固定的自动过期周期/);
  assert.match(
    text,
    /文件达到 32 MiB 时会重新评估存储方案，并在 Backend 的 64 MiB 总解码查询上限之前完成调整/,
  );
  assert.match(
    text,
    /卸载并重新安装 ShotMarker 会重置本地安装标识符，但不会立即删除此前的服务器事件/,
  );
  assert.match(text, /公开聚合查询不会返回原始安装标识符/);
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
