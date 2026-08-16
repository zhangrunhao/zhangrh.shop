import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { TrendView } from "./trend-view";
import type { TrackTrend } from "./track-trend";

const trend: TrackTrend = {
  daily: [
    { date: "2026-08-15", pv: 40, uv: 12 },
    { date: "2026-08-16", pv: 88, uv: 21 },
  ],
};

test("TrendView renders exactly one selected metric line", () => {
  const html = renderToStaticMarkup(
    createElement(TrendView, {
      trend,
      metric: "pv",
      event: "home_page_load",
      days: 30,
      updatedAt: "2026/08/16 20:00:00",
    }),
  );

  assert.match(html, /每日 PV/);
  assert.match(html, /home_page_load/);
  assert.match(html, /role="img"/);
  assert.match(html, /aria-label="home_page_load 每日 PV 趋势"/);
  assert.match(html, /30 天/);
  assert.match(html, /2026\/08\/16 20:00:00/);
  assert.equal(html.match(/<polyline/g)?.length, 1);
  assert.doesNotMatch(html, /总事件|总设备|事件类型|页面表|按钮表/);
});

test("TrendView renders an explicit empty state for an all-zero trend", () => {
  const html = renderToStaticMarkup(
    createElement(TrendView, {
      trend: {
        daily: trend.daily.map(({ date }) => ({ date, pv: 0, uv: 0 })),
      },
      metric: "uv",
      event: "home_page_load",
      days: 30,
      updatedAt: "2026/08/16 20:00:00",
    }),
  );

  assert.match(html, /暂无该事件数据/);
  assert.doesNotMatch(html, /<svg/);
});
