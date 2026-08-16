import assert from "node:assert/strict";
import test from "node:test";

import {
  PROJECT_EVENTS,
  TrackTrendError,
  buildTrackTrendUrl,
  describeTrackTrendError,
  fetchTrackTrend,
  parseTrackTrend,
  type TrackTrend,
} from "./track-trend";

const daily: TrackTrend["daily"] = [
  { date: "2026-08-10", pv: 4, uv: 3 },
  { date: "2026-08-11", pv: 0, uv: 0 },
  { date: "2026-08-12", pv: 1, uv: 1 },
  { date: "2026-08-13", pv: 0, uv: 0 },
  { date: "2026-08-14", pv: 0, uv: 0 },
  { date: "2026-08-15", pv: 2, uv: 2 },
  { date: "2026-08-16", pv: 12, uv: 7 },
];

const isInvalidResponse = (error: unknown) =>
  error instanceof TrackTrendError && error.code === "invalid_response";

test("PROJECT_EVENTS matches the three approved event catalogs", () => {
  assert.deepEqual(PROJECT_EVENTS, {
    hub: {
      defaultEvent: "home_page_load",
      events: [
        "home_page_load",
        "products_page_load",
        "articles_page_load",
        "article_detail_page_load",
        "about_page_load",
      ],
    },
    cardgame: {
      defaultEvent: "cardgame_page_load",
      events: [
        "cardgame_page_load",
        "create_room_click",
        "join_room_click",
        "ai_battle_click",
        "play_cards_click",
        "round_confirm_click",
        "play_again_click",
      ],
    },
    shotmarker: {
      defaultEvent: "app_launch",
      events: [
        "app_launch",
        "training_sync_succeeded",
        "highlight_generate_succeeded",
        "highlight_save_succeeded",
      ],
    },
  });
});

test("buildTrackTrendUrl sends project, event, and days", () => {
  assert.equal(
    buildTrackTrendUrl({
      project: "hub",
      event: "home_page_load",
      days: 7,
    }),
    "/api/track/trend?project=hub&event=home_page_load&days=7",
  );
});

test("parseTrackTrend accepts a complete continuous response", () => {
  assert.deepEqual(parseTrackTrend({ daily }, 7), { daily });
});

test("parseTrackTrend accepts a complete all-zero response", () => {
  const zeroDaily = daily.map(({ date }) => ({ date, pv: 0, uv: 0 }));
  assert.deepEqual(parseTrackTrend({ daily: zeroDaily }, 7), {
    daily: zeroDaily,
  });
});

test("parseTrackTrend rejects malformed response shapes", () => {
  const invalidPayloads: Array<{ payload: unknown; days: 1 | 7 }> = [
    { payload: { daily, totals: { pv: 19 } }, days: 7 },
    { payload: { daily: daily.slice(0, 6) }, days: 7 },
    { payload: { daily: [{ date: "2026-02-30", pv: 1, uv: 1 }] }, days: 1 },
    {
      payload: { daily: daily.map((row, index) => (index === 1 ? daily[0] : row)) },
      days: 7,
    },
    {
      payload: {
        daily: daily.map((row, index) =>
          index === 1 ? { ...row, date: "2026-08-12" } : row,
        ),
      },
      days: 7,
    },
    {
      payload: { daily: [{ date: "2026-08-16", pv: -1, uv: 0 }] },
      days: 1,
    },
    {
      payload: { daily: [{ date: "2026-08-16", pv: 1.5, uv: 1 }] },
      days: 1,
    },
    {
      payload: { daily: [{ date: "2026-08-16", pv: 1, uv: 2 }] },
      days: 1,
    },
    {
      payload: {
        daily: [{ date: "2026-08-16", pv: 1, uv: 1, devices: [] }],
      },
      days: 1,
    },
  ];

  for (const { payload, days } of invalidPayloads) {
    assert.throws(() => parseTrackTrend(payload, days), isInvalidResponse);
  }
});

test("fetchTrackTrend validates successful payloads", async () => {
  const result = await fetchTrackTrend(
    { project: "hub", event: "home_page_load", days: 7 },
    async () =>
      new Response(JSON.stringify({ daily }), {
        headers: { "Content-Type": "application/json" },
      }),
  );

  assert.deepEqual(result, { daily });
});

test("network and server failures use one safe display message", async () => {
  const query = { project: "hub", event: "home_page_load", days: 7 } as const;

  await assert.rejects(
    () =>
      fetchTrackTrend(query, async () => {
        throw new Error("private network details");
      }),
    (error: unknown) =>
      error instanceof TrackTrendError && error.code === "network_error",
  );

  await assert.rejects(
    () =>
      fetchTrackTrend(
        query,
        async () =>
          new Response("private upstream response", { status: 503 }),
      ),
    (error: unknown) =>
      error instanceof TrackTrendError && error.code === "request_failed",
  );

  assert.equal(
    describeTrackTrendError(new TrackTrendError("network_error")),
    "数据加载失败，请重试。",
  );
  assert.equal(
    describeTrackTrendError(new Error("private details")),
    "数据加载失败，请重试。",
  );
});
