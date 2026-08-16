import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { SummaryView } from "./summary-view";
import type { TrackSummary } from "./track-summary";

const summary: TrackSummary = {
  range: {
    days: 30,
    from: "2026-07-18T00:00:00+08:00",
    to: "2026-08-16T12:00:00.000+08:00",
    timezone: "Asia/Shanghai",
  },
  filter: { project: "hub" },
  totals: { events: 128, devices: 21 },
  event_breakdown: [
    { project: "hub", event: "load_page", events: 72, devices: 18 },
  ],
  page_breakdown: [
    { project: "hub", page_name: "home", events: 40, devices: 16 },
  ],
  button_breakdown: [
    { project: "hub", button: "nav_about", events: 12, devices: 8 },
  ],
  daily: [
    { date: "2026-08-15", events: 40, devices: 12 },
    { date: "2026-08-16", events: 88, devices: 21 },
  ],
};

test("SummaryView renders metrics, trend, and every breakdown", () => {
  const html = renderToStaticMarkup(
    createElement(SummaryView, {
      summary,
      updatedAt: "2026/08/16 20:00:00",
    }),
  );

  assert.match(html, />128<\/strong>/);
  assert.match(html, />21<\/strong>/);
  assert.match(html, /每日趋势/);
  assert.match(html, /role="img"/);
  assert.match(html, /load_page/);
  assert.match(html, /home/);
  assert.match(html, /nav_about/);
  assert.match(html, /2026\/08\/16 20:00:00/);
});

test("SummaryView renders explicit empty states", () => {
  const html = renderToStaticMarkup(
    createElement(SummaryView, {
      summary: {
        ...summary,
        totals: { events: 0, devices: 0 },
        event_breakdown: [],
        page_breakdown: [],
        button_breakdown: [],
        daily: [{ date: "2026-08-16", events: 0, devices: 0 }],
      },
      updatedAt: "2026/08/16 20:00:00",
    }),
  );

  assert.equal(html.match(/暂无数据/g)?.length, 4);
});
