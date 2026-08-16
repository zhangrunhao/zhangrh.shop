import assert from "node:assert/strict";
import test from "node:test";

import {
  TrackSummaryError,
  buildTrackSummaryUrl,
  describeTrackSummaryError,
  fetchTrackSummary,
  parseTrackSummary,
  type TrackSummary,
} from "./track-summary";

const payload = {
  range: {
    days: 30,
    from: "2026-07-18T00:00:00+08:00",
    to: "2026-08-16T12:00:00.000+08:00",
    timezone: "Asia/Shanghai",
  },
  filter: { project: "hub" },
  totals: { events: 6, devices: 3 },
  event_breakdown: [
    { project: "hub", event: "load_page", events: 4, devices: 3 },
    { project: "hub", event: "click", events: 2, devices: 2 },
  ],
  page_breakdown: [
    { project: "hub", page_name: "home", events: 4, devices: 3 },
  ],
  button_breakdown: [
    { project: "hub", button: "nav_about", events: 2, devices: 2 },
  ],
  daily: [
    { date: "2026-08-15", events: 2, devices: 1 },
    { date: "2026-08-16", events: 4, devices: 3 },
  ],
  diagnostics: { lines_read: 6 },
};

test("buildTrackSummaryUrl supports every project and day option", () => {
  assert.equal(
    buildTrackSummaryUrl({ project: "hub", days: 30 }),
    "/api/track/summary?days=30&project=hub",
  );

  for (const project of ["hub", "cardgame", "shotmarker"] as const) {
    for (const days of [1, 7, 30, 90] as const) {
      const url = new URL(
        buildTrackSummaryUrl({ project, days }),
        "https://zhangrh.shop",
      );
      assert.equal(url.searchParams.get("project"), project);
      assert.equal(url.searchParams.get("days"), String(days));
    }
  }
});

test("parseTrackSummary keeps only validated display data", () => {
  const summary = parseTrackSummary(payload);

  assert.deepEqual(summary, {
    range: payload.range,
    filter: payload.filter,
    totals: payload.totals,
    event_breakdown: payload.event_breakdown,
    page_breakdown: payload.page_breakdown,
    button_breakdown: payload.button_breakdown,
    daily: payload.daily,
  } satisfies TrackSummary);
  assert.doesNotMatch(JSON.stringify(summary), /diagnostics/);
});

test("parseTrackSummary rejects malformed counts", () => {
  assert.throws(
    () =>
      parseTrackSummary({
        ...payload,
        daily: [{ date: "2026-08-16", events: -1, devices: 1 }],
      }),
    (error: unknown) =>
      error instanceof TrackSummaryError && error.code === "invalid_response",
  );
});

test("fetchTrackSummary preserves a safe server error code", async () => {
  await assert.rejects(
    () =>
      fetchTrackSummary(
        { project: "shotmarker", days: 30 },
        async () =>
          new Response(
            JSON.stringify({
              error: {
                code: "invalid_project",
                message: "project is invalid",
              },
            }),
            {
              status: 400,
              headers: { "Content-Type": "application/json" },
            },
          ),
      ),
    (error: unknown) =>
      error instanceof TrackSummaryError && error.code === "invalid_project",
  );
});

test("describeTrackSummaryError explains the legacy ShotMarker backend", () => {
  assert.equal(
    describeTrackSummaryError(
      new TrackSummaryError("invalid_project"),
      "shotmarker",
    ),
    "线上 Backend 尚未支持 ShotMarker。",
  );
  assert.equal(
    describeTrackSummaryError(new TrackSummaryError("invalid_response"), "hub"),
    "数据格式异常，请重试。",
  );
  assert.equal(
    describeTrackSummaryError(new Error("private details"), "hub"),
    "数据加载失败，请重试。",
  );
});
