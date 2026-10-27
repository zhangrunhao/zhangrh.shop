import assert from "node:assert/strict";
import test from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import * as steps from "./shotmarker-query";
import { ShotMarkerSteps } from "./shotmarker-steps";
import { buildTrackTrendUrl } from "./track-trend";

const query = { project: "shotmarker", event: "app_launch", days: 1, audience: "test", version: "1.3" } as const;
const empty = { flows: ["training_sync", "highlight_generate", "highlight_save"].map((flow) => ({ flow, attempts: 0, installations: 0, succeeded: 0, failed: 0, cancelled: 0, ignored: 0, unknown: 0, missing_start: 0, conflicts: 0 })), issues: [] };

test("ShotMarker trend and steps use identical bounded source/version filters", () => {
  assert.equal(buildTrackTrendUrl(query), "/api/track/trend?project=shotmarker&event=app_launch&days=1&audience=test&version=1.3");
  assert.equal(steps.buildShotMarkerUrl(query), "/api/track/shotmarker?days=1&audience=test&version=1.3");
  assert.equal(steps.buildShotMarkerUrl({ ...query, audience: undefined }), "/api/track/shotmarker?days=1&audience=production&version=1.3");
});

test("serializes queries across filter changes and skips superseded queued work", async () => {
  let active = 0;
  let maxActive = 0;
  const urls: string[] = [];
  const fetcher = (async (input: string | URL | Request) => {
    active += 1; maxActive = Math.max(maxActive, active); urls.push(String(input));
    await new Promise((resolve) => setTimeout(resolve, 5)); active -= 1;
    return Response.json(String(input).includes("/shotmarker?") ? empty : { daily: [{ date: "2026-10-27", pv: 0, uv: 0 }] });
  }) as typeof fetch;
  let firstActive = true;
  const first = steps.loadAnalytics(query, fetcher, () => firstActive);
  await new Promise((resolve) => setTimeout(resolve, 1));
  firstActive = false;
  const stale = steps.loadAnalytics(query, fetcher, () => false);
  const latest = steps.loadAnalytics({ ...query, audience: "production" }, fetcher);
  assert.equal(await first, null);
  assert.equal(await stale, null);
  assert.ok((await latest)?.steps);
  assert.equal(maxActive, 1);
  assert.equal(urls.length, 3);
});

test("renders zero counts and independent diagnostic labels and rejects identifiers in responses", () => {
  const parsed = steps.parseShotMarker(empty);
  const html = renderToStaticMarkup(createElement(ShotMarkerSteps, { steps: parsed }));
  assert.match(html, /结果未知/); assert.match(html, /缺开始结果/); assert.match(html, /冲突结果/);
  assert.match(html, /暂无失败或附属诊断/); assert.match(html, /正式使用/);
  assert.throws(() => steps.parseShotMarker({ ...empty, device_id: "AbCd1234Ef56" }));
  assert.throws(() => steps.parseShotMarker({ ...empty, issues: [{ flow: "training_sync", event: "raw", stage: "raw", reason: "raw error", count: 1 }] }));
});

test("failed request releases the serial queue for a later retry", async () => {
  await assert.rejects(steps.loadAnalytics(query, (async () => Response.json({}, { status: 503 })) as typeof fetch));
  const result = await steps.loadAnalytics(query, (async (url) => Response.json(String(url).includes('/shotmarker?') ? empty : { daily: [{ date: '2026-10-27', pv: 0, uv: 0 }] })) as typeof fetch);
  assert.ok(result?.steps);
});

test("diagnostic table presents stages and reasons in plain Chinese", () => {
  const data = steps.parseShotMarker({ ...empty, issues: [{ flow: "highlight_save", event: "highlight_save_state_failed", stage: "local_state", reason: "state_update_failed", count: 1 }, { flow: "highlight_save", event: "highlight_save_failed", stage: "photos_write", reason: "permission_denied", count: 1 }] });
  const html = renderToStaticMarkup(createElement(ShotMarkerSteps, { steps: data }));
  assert.match(html, /保存状态失败/);
  assert.match(html, /写入相册/);
  assert.match(html, /权限被拒绝/);
  assert.doesNotMatch(html, /permission_denied|highlight_save_state_failed|photos_write/);
});
