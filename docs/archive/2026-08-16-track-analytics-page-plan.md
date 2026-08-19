# Track Analytics Page Implementation Plan

> **状态更新（2026-08-16）：** 本文已被[四字段埋点与单事件趋势重构设计](./2026-08-16-track-four-field-trend-redesign-spec.md)取代，仅保留历史记录。不得重新执行旧 summary 查询、totals、breakdown 或双指标趋势步骤。

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 新增公开的 `/analytics/` 前端页面，默认展示 Hub 最近 30 天的 Track 汇总数据，并支持项目、时间范围切换与手动刷新。

**Architecture:** 在 `frontend/project/analytics` 建立独立 Vite + React 项目。`track-summary.ts` 负责查询构造、响应校验和错误映射，`summary-view.tsx` 只负责统计展示，`app.tsx` 负责筛选与请求状态；现有统一 Vite 配置和发布脚本继续负责构建、发布与 `/api` 本地代理。

**Tech Stack:** React 19、TypeScript 5.9、Vite 7、原生 Fetch、Node test runner、React DOM server rendering、CSS、SVG。

---

## 文件结构

- Create `frontend/project/analytics/track-summary.ts`: Track 查询类型、URL 构造、响应校验、请求和错误文案。
- Create `frontend/project/analytics/track-summary.test.ts`: 查询、校验、错误映射单元测试。
- Create `frontend/project/analytics/summary-view.tsx`: 指标卡、每日趋势和三类明细表。
- Create `frontend/project/analytics/summary-view.test.tsx`: 服务端静态渲染测试。
- Create `frontend/project/analytics/app.tsx`: 默认筛选、请求生命周期、错误与刷新交互。
- Create `frontend/project/analytics/app.test.tsx`: 默认状态和首屏加载状态测试。
- Create `frontend/project/analytics/main.tsx`: React 挂载入口，不启用会重复执行 Effect 的 Strict Mode。
- Create `frontend/project/analytics/styles.css`: 黑白灰响应式样式。
- Create `frontend/project/analytics/index.html`: Vite HTML 入口。
- Create `frontend/project/analytics/favicon.svg`: 本地简单图标。
- Create `frontend/project/analytics/vite.config.ts`: 复用 `createProjectConfig`。
- Create `frontend/project/analytics/resources.test.mjs`: 生产构建和 `/analytics/` 资源路径测试。
- Modify `frontend/package.json`: 将 Analytics 加入 `build:all`。
- Modify `README.md`: 记录第四个前端与线上入口。

### Task 1: Track 查询与响应边界

**Files:**

- Create: `frontend/project/analytics/track-summary.test.ts`
- Create: `frontend/project/analytics/track-summary.ts`

- [ ] **Step 1: 写查询层失败测试**

创建 `frontend/project/analytics/track-summary.test.ts`：

```ts
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
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
npm --prefix frontend test -- project/analytics/track-summary.test.ts
```

Expected: FAIL，错误指出无法解析 `./track-summary`。

- [ ] **Step 3: 实现查询层**

创建 `frontend/project/analytics/track-summary.ts`：

```ts
export const TRACK_PROJECTS = ["hub", "cardgame", "shotmarker"] as const;
export type TrackProject = (typeof TRACK_PROJECTS)[number];

export const TRACK_DAY_OPTIONS = [1, 7, 30, 90] as const;
export type TrackDays = (typeof TRACK_DAY_OPTIONS)[number];

export type TrackSummaryQuery = {
  project: TrackProject;
  days: TrackDays;
};

export type TrackSummary = {
  range: {
    days: number;
    from: string;
    to: string;
    timezone: string;
  };
  filter: {
    project: TrackProject | null;
  };
  totals: {
    events: number;
    devices: number;
  };
  event_breakdown: Array<{
    project: TrackProject;
    event: string;
    events: number;
    devices: number;
  }>;
  page_breakdown: Array<{
    project: TrackProject;
    page_name: string;
    events: number;
    devices: number;
  }>;
  button_breakdown: Array<{
    project: TrackProject;
    button: string;
    events: number;
    devices: number;
  }>;
  daily: Array<{
    date: string;
    events: number;
    devices: number;
  }>;
};

export class TrackSummaryError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = "TrackSummaryError";
    this.code = code;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isTrackProject = (value: unknown): value is TrackProject =>
  typeof value === "string" &&
  (TRACK_PROJECTS as readonly string[]).includes(value);

const readRecord = (value: unknown) => {
  if (!isRecord(value)) throw new TrackSummaryError("invalid_response");
  return value;
};

const readString = (value: unknown) => {
  if (typeof value !== "string" || value.length === 0) {
    throw new TrackSummaryError("invalid_response");
  }
  return value;
};

const readCount = (value: unknown) => {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new TrackSummaryError("invalid_response");
  }
  return value;
};

const readProject = (value: unknown) => {
  if (!isTrackProject(value)) throw new TrackSummaryError("invalid_response");
  return value;
};

const readList = <T>(value: unknown, parse: (entry: unknown) => T) => {
  if (!Array.isArray(value)) throw new TrackSummaryError("invalid_response");
  return value.map(parse);
};

export const buildTrackSummaryUrl = ({ project, days }: TrackSummaryQuery) => {
  const query = new URLSearchParams({
    days: String(days),
    project,
  });
  return `/api/track/summary?${query.toString()}`;
};

export const parseTrackSummary = (value: unknown): TrackSummary => {
  const root = readRecord(value);
  const range = readRecord(root.range);
  const filter = readRecord(root.filter);
  const totals = readRecord(root.totals);
  const rangeDays = readCount(range.days);

  if (rangeDays < 1 || rangeDays > 90) {
    throw new TrackSummaryError("invalid_response");
  }

  const filteredProject = filter.project;
  if (filteredProject !== null && !isTrackProject(filteredProject)) {
    throw new TrackSummaryError("invalid_response");
  }

  return {
    range: {
      days: rangeDays,
      from: readString(range.from),
      to: readString(range.to),
      timezone: readString(range.timezone),
    },
    filter: { project: filteredProject },
    totals: {
      events: readCount(totals.events),
      devices: readCount(totals.devices),
    },
    event_breakdown: readList(root.event_breakdown, (entry) => {
      const row = readRecord(entry);
      return {
        project: readProject(row.project),
        event: readString(row.event),
        events: readCount(row.events),
        devices: readCount(row.devices),
      };
    }),
    page_breakdown: readList(root.page_breakdown, (entry) => {
      const row = readRecord(entry);
      return {
        project: readProject(row.project),
        page_name: readString(row.page_name),
        events: readCount(row.events),
        devices: readCount(row.devices),
      };
    }),
    button_breakdown: readList(root.button_breakdown, (entry) => {
      const row = readRecord(entry);
      return {
        project: readProject(row.project),
        button: readString(row.button),
        events: readCount(row.events),
        devices: readCount(row.devices),
      };
    }),
    daily: readList(root.daily, (entry) => {
      const row = readRecord(entry);
      const date = readString(row.date);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new TrackSummaryError("invalid_response");
      }
      return {
        date,
        events: readCount(row.events),
        devices: readCount(row.devices),
      };
    }),
  };
};

const readErrorCode = (value: unknown) => {
  if (!isRecord(value) || !isRecord(value.error)) return null;
  return typeof value.error.code === "string" ? value.error.code : null;
};

export const fetchTrackSummary = async (
  query: TrackSummaryQuery,
  fetcher: typeof fetch = fetch,
) => {
  let response: Response;
  try {
    response = await fetcher(buildTrackSummaryUrl(query), {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new TrackSummaryError("network_error");
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new TrackSummaryError(
      response.ok ? "invalid_response" : "request_failed",
    );
  }

  if (!response.ok) {
    throw new TrackSummaryError(readErrorCode(payload) ?? "request_failed");
  }

  return parseTrackSummary(payload);
};

const ERROR_MESSAGES: Record<string, string> = {
  invalid_days: "时间范围无效。",
  invalid_project: "该项目暂不可查询。",
  track_log_unavailable: "埋点日志暂不可用，请稍后重试。",
  track_log_too_large: "埋点数据量过大，暂时无法查询。",
  track_query_busy: "已有查询正在进行，请稍后重试。",
  track_query_timeout: "查询超时，请重试。",
  internal_error: "服务暂时不可用，请稍后重试。",
  invalid_response: "数据格式异常，请重试。",
  network_error: "网络连接失败，请重试。",
  request_failed: "数据加载失败，请重试。",
};

export const describeTrackSummaryError = (
  error: unknown,
  project: TrackProject,
) => {
  if (
    error instanceof TrackSummaryError &&
    error.code === "invalid_project" &&
    project === "shotmarker"
  ) {
    return "线上 Backend 尚未支持 ShotMarker。";
  }
  if (error instanceof TrackSummaryError) {
    return ERROR_MESSAGES[error.code] ?? "数据加载失败，请重试。";
  }
  return "数据加载失败，请重试。";
};
```

- [ ] **Step 4: 运行查询层测试并确认通过**

Run:

```bash
npm --prefix frontend test -- project/analytics/track-summary.test.ts
```

Expected: 5 tests PASS。

- [ ] **Step 5: 提交查询层**

```bash
git add frontend/project/analytics/track-summary.ts frontend/project/analytics/track-summary.test.ts
git commit -m "feat: 添加 Analytics 汇总数据查询层"
```

### Task 2: 统计展示组件

**Files:**

- Create: `frontend/project/analytics/summary-view.test.tsx`
- Create: `frontend/project/analytics/summary-view.tsx`

- [ ] **Step 1: 写展示组件失败测试**

创建 `frontend/project/analytics/summary-view.test.tsx`：

```tsx
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
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
npm --prefix frontend test -- project/analytics/summary-view.test.tsx
```

Expected: FAIL，错误指出无法解析 `./summary-view`。

- [ ] **Step 3: 实现展示组件**

创建 `frontend/project/analytics/summary-view.tsx`：

```tsx
import type { TrackSummary } from "./track-summary";

const numberFormatter = new Intl.NumberFormat("zh-CN");

const SummaryTable = ({
  title,
  nameLabel,
  rows,
}: {
  title: string;
  nameLabel: string;
  rows: Array<{ name: string; events: number; devices: number }>;
}) => (
  <section className="panel breakdown-panel">
    <div className="section-heading">
      <h2>{title}</h2>
      <span>{rows.length} 项</span>
    </div>
    {rows.length === 0 ? (
      <p className="empty-state">暂无数据</p>
    ) : (
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>{nameLabel}</th>
              <th>事件</th>
              <th>设备</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.name}>
                <td><code>{row.name}</code></td>
                <td>{numberFormatter.format(row.events)}</td>
                <td>{numberFormatter.format(row.devices)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )}
  </section>
);

const DailyTrend = ({ daily }: { daily: TrackSummary["daily"] }) => {
  const hasData = daily.some((item) => item.events > 0 || item.devices > 0);
  if (!hasData) {
    return (
      <section className="panel trend-panel">
        <div className="section-heading"><h2>每日趋势</h2></div>
        <p className="empty-state">暂无数据</p>
      </section>
    );
  }

  const width = 720;
  const height = 200;
  const left = 28;
  const right = 16;
  const top = 20;
  const bottom = 40;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const maxValue = Math.max(
    1,
    ...daily.flatMap((item) => [item.events, item.devices]),
  );
  const xAt = (index: number) =>
    daily.length === 1
      ? left + plotWidth / 2
      : left + (index / (daily.length - 1)) * plotWidth;
  const yAt = (value: number) => top + plotHeight - (value / maxValue) * plotHeight;
  const points = (key: "events" | "devices") =>
    daily.map((item, index) => `${xAt(index)},${yAt(item[key])}`).join(" ");
  const labelIndexes =
    daily.length <= 7
      ? daily.map((_, index) => index)
      : [...new Set([0, Math.floor((daily.length - 1) / 2), daily.length - 1])];

  return (
    <section className="panel trend-panel">
      <div className="section-heading">
        <h2>每日趋势</h2>
        <div className="legend" aria-label="图例">
          <span><i className="event-dot" />事件</span>
          <span><i className="device-dot" />设备</span>
        </div>
      </div>
      <figure>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          role="img"
          aria-label="每日事件数和设备数趋势"
        >
          <line
            className="chart-axis"
            x1={left}
            x2={width - right}
            y1={top + plotHeight}
            y2={top + plotHeight}
          />
          <polyline className="event-line" points={points("events")} />
          <polyline className="device-line" points={points("devices")} />
          {daily.length <= 7
            ? daily.flatMap((item, index) => [
                <circle
                  className="event-point"
                  cx={xAt(index)}
                  cy={yAt(item.events)}
                  key={`event-${item.date}`}
                  r="4"
                />,
                <circle
                  className="device-point"
                  cx={xAt(index)}
                  cy={yAt(item.devices)}
                  key={`device-${item.date}`}
                  r="4"
                />,
              ])
            : null}
          {labelIndexes.map((index) => (
            <text
              className="chart-label"
              key={daily[index].date}
              textAnchor={index === 0 ? "start" : index === daily.length - 1 ? "end" : "middle"}
              x={xAt(index)}
              y={height - 10}
            >
              {daily[index].date.slice(5).replace("-", "/")}
            </text>
          ))}
        </svg>
      </figure>
    </section>
  );
};

export const SummaryView = ({
  summary,
  updatedAt,
}: {
  summary: TrackSummary;
  updatedAt: string;
}) => (
  <>
    <section className="metric-grid" aria-label="核心指标">
      <article className="metric-card">
        <span>事件数</span>
        <strong>{numberFormatter.format(summary.totals.events)}</strong>
      </article>
      <article className="metric-card">
        <span>近似设备数</span>
        <strong>{numberFormatter.format(summary.totals.devices)}</strong>
      </article>
    </section>

    <p className="summary-meta">
      {summary.range.days} 天 · {summary.range.timezone} · 更新于 {updatedAt}
    </p>

    <DailyTrend daily={summary.daily} />

    <div className="breakdown-grid">
      <SummaryTable
        title="事件类型"
        nameLabel="事件"
        rows={summary.event_breakdown.map((row) => ({
          name: row.event,
          events: row.events,
          devices: row.devices,
        }))}
      />
      <SummaryTable
        title="页面"
        nameLabel="页面"
        rows={summary.page_breakdown.map((row) => ({
          name: row.page_name,
          events: row.events,
          devices: row.devices,
        }))}
      />
      <SummaryTable
        title="按钮"
        nameLabel="按钮"
        rows={summary.button_breakdown.map((row) => ({
          name: row.button,
          events: row.events,
          devices: row.devices,
        }))}
      />
    </div>
  </>
);
```

- [ ] **Step 4: 运行展示测试并确认通过**

Run:

```bash
npm --prefix frontend test -- project/analytics/summary-view.test.tsx
```

Expected: 2 tests PASS。

- [ ] **Step 5: 提交展示组件**

```bash
git add frontend/project/analytics/summary-view.tsx frontend/project/analytics/summary-view.test.tsx
git commit -m "feat: 添加 Analytics 数据概览组件"
```

### Task 3: 页面请求状态与交互

**Files:**

- Create: `frontend/project/analytics/app.test.tsx`
- Create: `frontend/project/analytics/app.tsx`

- [ ] **Step 1: 写默认状态失败测试**

创建 `frontend/project/analytics/app.test.tsx`：

```tsx
import assert from "node:assert/strict";
import test from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { App, DEFAULT_TRACK_QUERY, ErrorNotice } from "./app";

test("Analytics defaults to Hub for thirty days", () => {
  assert.deepEqual(DEFAULT_TRACK_QUERY, { project: "hub", days: 30 });
});

test("Analytics first render exposes filters and loading status", () => {
  const html = renderToStaticMarkup(createElement(App));

  assert.match(html, /Track 概览/);
  assert.match(html, /<option value="hub" selected="">Hub<\/option>/);
  assert.match(html, /<option value="30" selected="">30 天<\/option>/);
  assert.match(html, /正在加载汇总数据/);
  assert.doesNotMatch(html, /全部项目/);
});

test("ErrorNotice renders a retryable safe message", () => {
  const html = renderToStaticMarkup(
    createElement(ErrorNotice, {
      message: "数据格式异常，请重试。",
      loading: false,
      onRetry: () => undefined,
    }),
  );

  assert.match(html, /role="alert"/);
  assert.match(html, /数据格式异常，请重试/);
  assert.match(html, />重试<\/button>/);
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
npm --prefix frontend test -- project/analytics/app.test.tsx
```

Expected: FAIL，错误指出无法解析 `./app`。

- [ ] **Step 3: 实现页面状态与交互**

创建 `frontend/project/analytics/app.tsx`：

```tsx
import { useEffect, useState } from "react";

import { SummaryView } from "./summary-view";
import {
  TRACK_DAY_OPTIONS,
  TRACK_PROJECTS,
  describeTrackSummaryError,
  fetchTrackSummary,
  type TrackDays,
  type TrackProject,
  type TrackSummary,
  type TrackSummaryQuery,
} from "./track-summary";

export const DEFAULT_TRACK_QUERY = {
  project: "hub",
  days: 30,
} as const satisfies TrackSummaryQuery;

const PROJECT_LABELS: Record<TrackProject, string> = {
  hub: "Hub",
  cardgame: "Cardgame",
  shotmarker: "ShotMarker",
};

type ViewState = {
  summary: TrackSummary | null;
  loading: boolean;
  error: string | null;
  updatedAt: string | null;
};

const formatUpdatedAt = (date: Date) =>
  new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "medium",
    hour12: false,
  }).format(date);

export const ErrorNotice = ({
  message,
  loading,
  onRetry,
}: {
  message: string;
  loading: boolean;
  onRetry: () => void;
}) => (
  <section className="notice error-notice" role="alert">
    <span>{message}</span>
    <button type="button" disabled={loading} onClick={onRetry}>重试</button>
  </section>
);

export const App = () => {
  const [query, setQuery] = useState<TrackSummaryQuery>(DEFAULT_TRACK_QUERY);
  const [reloadToken, setReloadToken] = useState(0);
  const [view, setView] = useState<ViewState>({
    summary: null,
    loading: true,
    error: null,
    updatedAt: null,
  });

  useEffect(() => {
    let active = true;

    void fetchTrackSummary(query)
      .then((summary) => {
        if (!active) return;
        setView({
          summary,
          loading: false,
          error: null,
          updatedAt: formatUpdatedAt(new Date()),
        });
      })
      .catch((error: unknown) => {
        if (!active) return;
        setView((current) => ({
          ...current,
          loading: false,
          error: describeTrackSummaryError(error, query.project),
        }));
      });

    return () => {
      active = false;
    };
  }, [query, reloadToken]);

  const beginLoad = () => {
    setView((current) => ({ ...current, loading: true, error: null }));
  };

  const updateProject = (project: TrackProject) => {
    beginLoad();
    setQuery((current) => ({ ...current, project }));
  };

  const updateDays = (days: TrackDays) => {
    beginLoad();
    setQuery((current) => ({ ...current, days }));
  };

  const reload = () => {
    beginLoad();
    setReloadToken((current) => current + 1);
  };

  return (
    <div className="app-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">公开聚合数据</p>
          <h1>Track 概览</h1>
          <p className="intro">快速查看项目事件、近似设备和每日变化。</p>
        </div>

        <div className="filters" aria-label="数据筛选">
          <label>
            <span>项目</span>
            <select
              aria-label="项目"
              disabled={view.loading}
              value={query.project}
              onChange={(event) =>
                updateProject(event.currentTarget.value as TrackProject)
              }
            >
              {TRACK_PROJECTS.map((project) => (
                <option key={project} value={project}>
                  {PROJECT_LABELS[project]}
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>范围</span>
            <select
              aria-label="时间范围"
              disabled={view.loading}
              value={query.days}
              onChange={(event) =>
                updateDays(Number(event.currentTarget.value) as TrackDays)
              }
            >
              {TRACK_DAY_OPTIONS.map((days) => (
                <option key={days} value={days}>{days} 天</option>
              ))}
            </select>
          </label>

          <button type="button" disabled={view.loading} onClick={reload}>
            {view.loading ? "加载中…" : "刷新"}
          </button>
        </div>
      </header>

      {view.error ? (
        <ErrorNotice
          loading={view.loading}
          message={view.error}
          onRetry={reload}
        />
      ) : null}

      {view.loading ? (
        <p className="loading-state" role="status">
          {view.summary ? "正在更新数据…" : "正在加载汇总数据…"}
        </p>
      ) : null}

      {view.summary && view.updatedAt ? (
        <SummaryView summary={view.summary} updatedAt={view.updatedAt} />
      ) : null}

      <footer className="page-footer">
        仅展示公开聚合数据，不包含原始事件或设备标识。
      </footer>
    </div>
  );
};
```

- [ ] **Step 4: 运行页面测试并确认通过**

Run:

```bash
npm --prefix frontend test -- project/analytics/app.test.tsx
```

Expected: 3 tests PASS。

- [ ] **Step 5: 提交页面逻辑**

```bash
git add frontend/project/analytics/app.tsx frontend/project/analytics/app.test.tsx
git commit -m "feat: 添加 Analytics 筛选与刷新交互"
```

### Task 4: 页面资源、样式与生产构建

**Files:**

- Create: `frontend/project/analytics/resources.test.mjs`
- Create: `frontend/project/analytics/main.tsx`
- Create: `frontend/project/analytics/index.html`
- Create: `frontend/project/analytics/favicon.svg`
- Create: `frontend/project/analytics/styles.css`
- Create: `frontend/project/analytics/vite.config.ts`

- [ ] **Step 1: 写生产资源失败测试**

创建 `frontend/project/analytics/resources.test.mjs`：

```js
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { build } from "vite";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const configFile = path.join(currentDir, "vite.config.ts");

test("Analytics production build uses the /analytics/ public base", async () => {
  const temporaryRoot = await mkdtemp(
    path.join(os.tmpdir(), "analytics-build-test-"),
  );
  const outDir = path.join(temporaryRoot, "dist");

  try {
    await build({
      cacheDir: path.join(temporaryRoot, "cache"),
      configFile,
      logLevel: "silent",
      build: { emptyOutDir: true, outDir },
    });

    const html = await readFile(path.join(outDir, "index.html"), "utf8");
    assert.match(html, /(?:src|href)="\/analytics\/static\//);
    assert.match(html, /href="\/analytics\/favicon[^\"]*\.svg"/);
    assert.doesNotMatch(html, /(?:src|href)="\/static\//);
  } finally {
    await rm(temporaryRoot, { force: true, recursive: true });
  }
});
```

- [ ] **Step 2: 运行测试并确认失败**

Run:

```bash
npm --prefix frontend test -- project/analytics/resources.test.mjs
```

Expected: FAIL，错误指出缺少 `vite.config.ts` 或 `index.html`。

- [ ] **Step 3: 创建入口、图标和 Vite 配置**

创建 `frontend/project/analytics/main.tsx`：

```tsx
import { createRoot } from "react-dom/client";

import { App } from "./app";
import "./styles.css";

createRoot(document.getElementById("root")!).render(<App />);
```

不包裹 `StrictMode`，避免开发环境重复执行初次请求，触发 Backend 的单查询并发限制。

创建 `frontend/project/analytics/index.html`：

```html
<!doctype html>
<html lang="zh-CN">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content="zhangrh.shop 项目埋点聚合数据概览。" />
    <link rel="icon" type="image/svg+xml" href="./favicon.svg" />
    <title>Track 概览</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/main.tsx"></script>
  </body>
</html>
```

创建 `frontend/project/analytics/favicon.svg`：

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#171717"/>
  <path d="M16 46V32h8v14zm12 0V18h8v28zm12 0V25h8v21z" fill="#fff"/>
</svg>
```

创建 `frontend/project/analytics/vite.config.ts`：

```ts
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createProjectConfig } from "../../vite.config";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default createProjectConfig({ projectRoot });
```

- [ ] **Step 4: 创建响应式样式**

创建 `frontend/project/analytics/styles.css`：

```css
:root {
  color: #171717;
  background: #f5f5f4;
  font-family: Inter, ui-sans-serif, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  --surface: #ffffff;
  --border: #e7e5e4;
  --muted: #737373;
  --soft: #fafaf9;
  --dark: #171717;
}

* { box-sizing: border-box; }

body {
  min-width: 320px;
  min-height: 100vh;
  margin: 0;
  background: #f5f5f4;
}

button,
select { font: inherit; }

button:focus-visible,
select:focus-visible {
  outline: 3px solid rgba(23, 23, 23, 0.18);
  outline-offset: 2px;
}

.app-shell {
  width: min(1120px, calc(100% - 32px));
  margin: 0 auto;
  padding: 48px 0 32px;
}

.page-header {
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: 32px;
  margin-bottom: 24px;
}

.eyebrow {
  margin: 0 0 8px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

h1 {
  margin: 0;
  font-size: clamp(32px, 5vw, 52px);
  line-height: 1;
  letter-spacing: -0.04em;
}

.intro {
  margin: 14px 0 0;
  color: var(--muted);
}

.filters {
  display: flex;
  align-items: end;
  gap: 10px;
}

.filters label {
  display: grid;
  gap: 6px;
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
}

.filters select,
.filters button,
.notice button {
  min-height: 42px;
  border: 1px solid #d6d3d1;
  border-radius: 9px;
  background: var(--surface);
  color: var(--dark);
  padding: 0 12px;
}

.filters button,
.notice button {
  border-color: var(--dark);
  background: var(--dark);
  color: #ffffff;
  cursor: pointer;
  font-weight: 650;
}

button:disabled,
select:disabled {
  cursor: wait;
  opacity: 0.55;
}

.notice {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 16px;
  border: 1px solid #fecaca;
  border-radius: 12px;
  background: #fff7f7;
  padding: 14px 16px;
  color: #991b1b;
}

.notice button {
  min-height: 34px;
  border-color: #991b1b;
  background: #991b1b;
}

.loading-state {
  margin: 0 0 16px;
  color: var(--muted);
  font-size: 14px;
}

.metric-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.metric-card,
.panel {
  border: 1px solid var(--border);
  border-radius: 16px;
  background: var(--surface);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.03);
}

.metric-card {
  display: grid;
  gap: 14px;
  min-height: 144px;
  padding: 22px;
}

.metric-card span {
  color: var(--muted);
  font-size: 14px;
}

.metric-card strong {
  align-self: end;
  font-size: clamp(38px, 7vw, 58px);
  line-height: 1;
  letter-spacing: -0.04em;
}

.summary-meta {
  margin: 12px 2px 24px;
  color: var(--muted);
  font-size: 13px;
}

.panel { padding: 22px; }

.trend-panel { margin-bottom: 16px; }

.section-heading {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 18px;
}

.section-heading h2 {
  margin: 0;
  font-size: 18px;
  letter-spacing: -0.02em;
}

.section-heading > span {
  color: var(--muted);
  font-size: 12px;
}

.legend {
  display: flex;
  gap: 14px;
  color: var(--muted);
  font-size: 12px;
}

.legend span { display: inline-flex; align-items: center; gap: 6px; }

.legend i {
  width: 8px;
  height: 8px;
  border-radius: 999px;
}

.event-dot { background: #171717; }
.device-dot { background: #a3a3a3; }

figure { margin: 0; }

svg { display: block; width: 100%; height: auto; overflow: visible; }

.chart-axis {
  stroke: #e7e5e4;
  stroke-width: 1;
}

.event-line,
.device-line {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 3;
}

.event-line { stroke: #171717; }
.device-line { stroke: #a3a3a3; }
.event-point { fill: #171717; }
.device-point { fill: #a3a3a3; }

.chart-label {
  fill: #737373;
  font-size: 11px;
}

.breakdown-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
}

.breakdown-panel:first-child { grid-column: 1 / -1; }

.table-wrap { overflow-x: auto; }

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

th,
td {
  border-bottom: 1px solid var(--border);
  padding: 11px 8px;
  text-align: right;
  white-space: nowrap;
}

th:first-child,
td:first-child {
  width: 100%;
  padding-left: 0;
  text-align: left;
}

th:last-child,
td:last-child { padding-right: 0; }

th {
  color: var(--muted);
  font-size: 12px;
  font-weight: 600;
}

tbody tr:last-child td { border-bottom: 0; }

code {
  border-radius: 5px;
  background: var(--soft);
  padding: 3px 6px;
  color: #404040;
  font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
  font-size: 12px;
}

.empty-state {
  display: grid;
  min-height: 112px;
  place-items: center;
  margin: 0;
  color: var(--muted);
}

.page-footer {
  margin-top: 28px;
  color: var(--muted);
  font-size: 12px;
  text-align: center;
}

@media (max-width: 720px) {
  .app-shell {
    width: min(100% - 24px, 1120px);
    padding-top: 28px;
  }

  .page-header {
    align-items: stretch;
    flex-direction: column;
    gap: 22px;
  }

  .filters { display: grid; grid-template-columns: 1fr 1fr; }
  .filters select { width: 100%; }
  .filters button { grid-column: 1 / -1; }
  .metric-grid,
  .breakdown-grid { grid-template-columns: 1fr; }
  .breakdown-panel:first-child { grid-column: auto; }
  .metric-card { min-height: 126px; }
  .panel { padding: 18px; }
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after { scroll-behavior: auto !important; }
}
```

- [ ] **Step 5: 运行资源测试和 Analytics 构建**

Run:

```bash
npm --prefix frontend test -- project/analytics/resources.test.mjs
npm --prefix frontend run build -- analytics
```

Expected: 资源测试 PASS，Vite 生成 `frontend/dist/analytics/index.html`，资源路径以 `/analytics/` 开头。

- [ ] **Step 6: 提交页面资源**

```bash
git add frontend/project/analytics/main.tsx frontend/project/analytics/index.html frontend/project/analytics/favicon.svg frontend/project/analytics/styles.css frontend/project/analytics/vite.config.ts frontend/project/analytics/resources.test.mjs
git commit -m "feat: 添加 Analytics 响应式页面资源"
```

### Task 5: 接入仓库构建与说明

**Files:**

- Modify: `frontend/package.json`
- Modify: `README.md`

- [ ] **Step 1: 将 Analytics 加入完整构建**

在 `frontend/package.json` 中修改脚本：

```diff
-    "build:all": "npm run build hub && npm run build cardgame && npm run build shotmarker",
+    "build:all": "npm run build hub && npm run build cardgame && npm run build shotmarker && npm run build analytics",
```

- [ ] **Step 2: 更新仓库入口说明**

在 `README.md` 中应用以下修改：

```diff
-`zhangrh.shop` 是个人主页与独立项目的统一代码仓库，包含三个 Vite 前端和一个 Node/Express 后端。
+`zhangrh.shop` 是个人主页与独立项目的统一代码仓库，包含四个 Vite 前端和一个 Node/Express 后端。
@@
 - [ShotMarker](https://zhangrh.shop/shotmarker/)：ShotMarker 产品介绍与帮助页面。
+- [Analytics](https://zhangrh.shop/analytics/)：公开的 Track 聚合数据概览。
@@
 | `frontend/project/shotmarker` | ShotMarker 产品页面 |
+| `frontend/project/analytics` | Track 聚合数据概览 |
```

- [ ] **Step 3: 验证统一脚本发现新项目**

Run:

```bash
npm --prefix frontend run build -- analytics
node frontend/tools/vite-project.mjs 2>&1 | grep "analytics"
```

Expected: Analytics 构建成功；用法输出的 `Available projects` 包含 `analytics`。第二条命令因缺少合法子命令以状态 1 退出是预期行为。

- [ ] **Step 4: 提交仓库接入**

```bash
git add frontend/package.json README.md
git commit -m "chore: 接入 Analytics 构建与项目说明"
```

### Task 6: 完整验证与视觉检查

**Files:**

- Verify only; fix only failures caused by Analytics changes.

- [ ] **Step 1: 运行 Analytics 全部测试**

Run:

```bash
npm --prefix frontend test -- project/analytics/track-summary.test.ts project/analytics/summary-view.test.tsx project/analytics/app.test.tsx project/analytics/resources.test.mjs
```

Expected: 11 tests PASS。

- [ ] **Step 2: 运行仓库完整检查**

Run:

```bash
npm run check
```

Expected: 自动化、前端和 Backend 测试全部 PASS；ESLint 与 TypeScript 无错误；Hub、Cardgame、ShotMarker、Analytics 全部构建成功。

- [ ] **Step 3: 本地浏览器检查**

在两个终端分别启动 Backend 和 Analytics：

```bash
# 终端 A
npm --prefix backend run dev

# 终端 B
npm --prefix frontend run dev -- analytics --host 127.0.0.1
```

检查桌面宽度与 390px 窄屏：默认选择 Hub / 30 天；项目和天数切换会重新加载；刷新按钮工作；加载时控件禁用；零数据和接口错误文案清楚；ShotMarker 的旧 Backend 错误使用专用提示；浏览器控制台无错误。

- [ ] **Step 4: 确认工作区与提交记录**

Run:

```bash
git status --short
git log --oneline -6
```

Expected: 工作区没有遗漏的 Analytics 改动；最近提交依次包含查询层、展示组件、页面交互、页面资源和仓库接入。
