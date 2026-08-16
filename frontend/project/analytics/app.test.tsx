import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import {
  App,
  ErrorNotice,
} from "./app";
import {
  DEFAULT_TRACK_METRIC,
  DEFAULT_TRACK_QUERY,
  restoreTrackQuery,
  selectTrackDays,
  selectTrackEvent,
  selectTrackProject,
  serializeTrackFilters,
} from "./track-filters";

test("Analytics defaults to Hub, thirty days, its default event, and PV", () => {
  assert.deepEqual(DEFAULT_TRACK_QUERY, {
    project: "hub",
    days: 30,
    event: "home_page_load",
  });
  assert.equal(DEFAULT_TRACK_METRIC, "pv");
});

test("restoreTrackQuery restores only valid project and day filters", () => {
  assert.deepEqual(
    restoreTrackQuery(
      JSON.stringify({
        project: "cardgame",
        days: 7,
        event: "play_again_click",
        metric: "uv",
      }),
    ),
    { project: "cardgame", days: 7, event: "cardgame_page_load" },
  );

  assert.deepEqual(
    restoreTrackQuery(JSON.stringify({ project: "shotmarker", days: 2 })),
    { project: "shotmarker", days: 30, event: "app_launch" },
  );
  assert.deepEqual(restoreTrackQuery("broken json"), DEFAULT_TRACK_QUERY);
  assert.deepEqual(restoreTrackQuery(null), DEFAULT_TRACK_QUERY);
});

test("serializeTrackFilters omits event and metric state", () => {
  const serialized = serializeTrackFilters({
    project: "cardgame",
    days: 90,
    event: "play_again_click",
  });

  assert.deepEqual(JSON.parse(serialized), {
    project: "cardgame",
    days: 90,
  });
  assert.doesNotMatch(serialized, /event|metric|pv|uv/);
});

test("project changes reset the event while range changes preserve it", () => {
  const cardgame = selectTrackProject(DEFAULT_TRACK_QUERY, "cardgame");
  assert.deepEqual(cardgame, {
    project: "cardgame",
    days: 30,
    event: "cardgame_page_load",
  });

  const selected = selectTrackEvent(cardgame, "play_again_click");
  assert.deepEqual(selectTrackDays(selected, 7), {
    project: "cardgame",
    days: 7,
    event: "play_again_click",
  });
});

test("Analytics first render exposes the four controls and loading status", () => {
  const html = renderToStaticMarkup(createElement(App));

  assert.match(html, /单事件趋势/);
  assert.match(html, /<option value="hub" selected="">Hub<\/option>/);
  assert.match(html, /<option value="30" selected="">30 天<\/option>/);
  assert.match(
    html,
    /<option value="home_page_load" selected="">home_page_load<\/option>/,
  );
  assert.match(html, /aria-pressed="true"[^>]*>PV<\/button>/);
  assert.match(html, /正在加载趋势数据/);
  assert.doesNotMatch(html, /全部事件|总事件数|总设备数|事件排行/);
});

test("ErrorNotice renders the unified safe message and retry action", () => {
  const html = renderToStaticMarkup(
    createElement(ErrorNotice, {
      loading: false,
      onRetry: () => undefined,
    }),
  );

  assert.match(html, /role="alert"/);
  assert.match(html, /数据加载失败，请重试。/);
  assert.match(html, />重试<\/button>/);
});
