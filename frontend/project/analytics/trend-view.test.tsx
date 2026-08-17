import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { TrendChartGraphic, TrendView } from "./trend-view";
import type { TrackTrend } from "./track-trend";

const daily = Array.from({ length: 30 }, (_, index) => {
  const date = new Date(Date.UTC(2026, 6, 19 + index))
    .toISOString()
    .slice(0, 10);
  return {
    date,
    pv: index === 28 ? 3 : index === 29 ? 1 : 0,
    uv: index === 28 ? 2 : index === 29 ? 1 : 0,
  };
});

const trend: TrackTrend = { daily };

test("TrendView renders a readable thirty-day metric chart", () => {
  const html = renderToStaticMarkup(
    createElement(TrendView, {
      trend,
      metric: "pv",
      event: "home_page_load",
      days: 30,
      updatedAt: "2026/08/17 10:18:05",
    }),
  );

  assert.match(html, /每日 PV/);
  assert.match(html, /aria-label="home_page_load 每日 PV 趋势[^"]*左右方向键/);
  assert.equal(html.match(/class="chart-grid"/g)?.length, 4);
  assert.match(html, /class="chart-y-label"[^>]*>0<\/text>/);
  assert.match(html, /class="chart-y-label"[^>]*>3<\/text>/);
  assert.match(html, /class="chart-value-label metric-pv"[^>]*>3<\/text>/);
  assert.match(html, /class="chart-value-label metric-pv"[^>]*>1<\/text>/);
  assert.equal(html.match(/data-chart-index=/g)?.length, 30);
  assert.match(html, /2026-08-16：PV 3/);
  assert.match(html, /2026-08-17：PV 1/);
  assert.equal(html.match(/<polyline/g)?.length, 1);
  assert.doesNotMatch(html, /总事件|总设备|事件类型|页面表|按钮表/);
});

test("TrendChartGraphic renders the active date tooltip", () => {
  const html = renderToStaticMarkup(
    createElement(TrendChartGraphic, {
      activeIndex: 28,
      daily,
      descriptionId: "trend-description",
      event: "home_page_load",
      metric: "pv",
      onChartFocus: () => undefined,
      onChartKeyDown: () => undefined,
      onHoverIndex: () => undefined,
      onPinIndex: () => undefined,
    }),
  );

  assert.match(html, /class="chart-active-guide"/);
  assert.match(html, /class="chart-active-point metric-pv"/);
  assert.match(html, /class="chart-tooltip"/);
  assert.match(html, />2026-08-16<\/text>/);
  assert.match(html, />PV 3<\/text>/);
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
      updatedAt: "2026/08/17 10:18:05",
    }),
  );

  assert.match(html, /暂无该事件数据/);
  assert.doesNotMatch(html, /<svg/);
});
