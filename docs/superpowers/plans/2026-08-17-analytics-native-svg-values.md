# Analytics Native SVG Values Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在不新增图表依赖的前提下，为 Analytics 单序列趋势补充整数 Y 轴、非零值标签以及鼠标、键盘和触摸精确值 Tooltip。

**Architecture:** 把刻度、坐标、碰撞过滤、Tooltip 定位和键盘导航提取为无副作用的 `trend-chart.ts`，以 Node 单元测试锁定图表数学。`trend-view.tsx` 继续负责 React 展示，只保存悬浮索引和固定索引，并用原生 SVG 渲染图表；CSS 负责可读性、焦点、触摸命中和小屏横向滚动。现有请求、筛选、API 和数据类型保持不变。

**Tech Stack:** React 19、TypeScript 5.9、原生 SVG、CSS、Node test runner、React DOM server rendering、Vite 7。

---

## 文件结构

- Create `frontend/project/analytics/trend-chart.ts`: 纯图表数学、标签布局、Tooltip 定位和键盘索引导航。
- Create `frontend/project/analytics/trend-chart.test.ts`: 上述纯函数的边界和示例测试。
- Modify `frontend/project/analytics/trend-view.tsx:1-117`: 渲染刻度、网格、数值标签、命中区域、Tooltip 和可访问说明，并管理交互状态。
- Modify `frontend/project/analytics/trend-view.test.tsx:1-59`: 覆盖 30 天具体数字、可访问描述、激活 Tooltip 和空状态。
- Create `frontend/project/analytics/styles.test.mjs`: 锁定图表滚动、触摸命中、数字描边和隐藏说明所需的关键 CSS 契约。
- Modify `frontend/project/analytics/styles.css:224-286`: 用 Analytics 范围内的图表样式替代宽泛的 `figure`、`svg` 和旧轴标签规则。

不修改 `frontend/package.json`、锁文件、`track-trend.ts`、`app.tsx` 或 Backend。

### Task 1: 整数刻度和基础图表几何

**Files:**

- Create: `frontend/project/analytics/trend-chart.test.ts`
- Create: `frontend/project/analytics/trend-chart.ts`

- [ ] **Step 1: 写刻度和坐标失败测试**

创建 `frontend/project/analytics/trend-chart.test.ts`：

```ts
import assert from "node:assert/strict";
import test from "node:test";

import {
  buildChartGeometry,
  buildIntegerTicks,
  formatChartNumber,
} from "./trend-chart";

test("buildIntegerTicks keeps small counts exact and rounds larger counts", () => {
  assert.deepEqual(buildIntegerTicks(0), {
    axisMax: 1,
    step: 1,
    ticks: [0, 1],
  });
  assert.deepEqual(buildIntegerTicks(3), {
    axisMax: 3,
    step: 1,
    ticks: [0, 1, 2, 3],
  });
  assert.deepEqual(buildIntegerTicks(88), {
    axisMax: 100,
    step: 20,
    ticks: [0, 20, 40, 60, 80, 100],
  });
  assert.equal(formatChartNumber(12345), "12,345");
});

test("buildChartGeometry aligns points, labels, and hit areas", () => {
  const geometry = buildChartGeometry([0, 3, 1]);

  assert.equal(geometry.axisMax, 3);
  assert.deepEqual(geometry.ticks, [0, 1, 2, 3]);
  assert.deepEqual(geometry.xLabelIndexes, [0, 1, 2]);
  assert.equal(geometry.points.length, 3);
  assert.equal(geometry.hitAreas.length, 3);

  assert.equal(geometry.points[0].y, geometry.top + geometry.plotHeight);
  assert.equal(geometry.points[1].y, geometry.top);
  assert.equal(geometry.points[2].value, 1);

  for (const point of geometry.points) {
    assert.ok(point.x >= geometry.left);
    assert.ok(point.x <= geometry.width - geometry.right);
    assert.ok(point.y >= geometry.top);
    assert.ok(point.y <= geometry.top + geometry.plotHeight);
  }

  assert.equal(geometry.hitAreas[0].x, geometry.left);
  const lastHitArea = geometry.hitAreas.at(-1);
  assert.ok(lastHitArea);
  assert.equal(
    lastHitArea.x + lastHitArea.width,
    geometry.width - geometry.right,
  );
});

test("buildChartGeometry keeps one-day charts centered", () => {
  const geometry = buildChartGeometry([7]);

  assert.equal(
    geometry.points[0].x,
    geometry.left + geometry.plotWidth / 2,
  );
  assert.equal(geometry.hitAreas[0].x, geometry.left);
  assert.equal(geometry.hitAreas[0].width, geometry.plotWidth);
  assert.deepEqual(geometry.xLabelIndexes, [0]);
});
```

- [ ] **Step 2: 运行测试并确认因模块缺失而失败**

Run:

```bash
npm --prefix frontend test -- project/analytics/trend-chart.test.ts
```

Expected: FAIL，错误包含无法解析 `./trend-chart`。

- [ ] **Step 3: 实现整数刻度、坐标和命中区域**

创建 `frontend/project/analytics/trend-chart.ts`：

```ts
const CHART_WIDTH = 720;
const CHART_HEIGHT = 240;
const CHART_RIGHT = 20;
const CHART_TOP = 28;
const CHART_BOTTOM = 44;
const TARGET_INTERVALS = 4;

const numberFormatter = new Intl.NumberFormat("zh-CN");

export type IntegerTicks = {
  axisMax: number;
  step: number;
  ticks: number[];
};

export type ChartPoint = {
  index: number;
  value: number;
  x: number;
  y: number;
};

export type ChartHitArea = {
  index: number;
  x: number;
  width: number;
};

export type ChartGeometry = {
  width: number;
  height: number;
  left: number;
  right: number;
  top: number;
  bottom: number;
  plotWidth: number;
  plotHeight: number;
  axisMax: number;
  ticks: number[];
  points: ChartPoint[];
  hitAreas: ChartHitArea[];
  xLabelIndexes: number[];
};

export const formatChartNumber = (value: number) =>
  numberFormatter.format(value);

export const buildIntegerTicks = (maxValue: number): IntegerTicks => {
  const safeMax = Number.isFinite(maxValue) && maxValue > 0
    ? Math.floor(maxValue)
    : 0;

  if (safeMax === 0) {
    return { axisMax: 1, step: 1, ticks: [0, 1] };
  }

  const roughStep = safeMax / TARGET_INTERVALS;
  const power = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / power;
  const niceFactor = normalized <= 1
    ? 1
    : normalized <= 2.5
      ? 2
      : normalized <= 7.5
        ? 5
        : 10;
  const step = Math.max(1, Math.round(niceFactor * power));
  const axisMax = Math.ceil(safeMax / step) * step;
  const ticks = Array.from(
    { length: axisMax / step + 1 },
    (_, index) => index * step,
  );

  return { axisMax, step, ticks };
};

const buildXLabelIndexes = (length: number) => {
  if (length <= 7) {
    return Array.from({ length }, (_, index) => index);
  }

  return [0, Math.floor((length - 1) / 2), length - 1];
};

export const buildChartGeometry = (
  values: readonly number[],
): ChartGeometry => {
  const { axisMax, ticks } = buildIntegerTicks(Math.max(0, ...values));
  const longestTickLength = Math.max(
    ...ticks.map((tick) => formatChartNumber(tick).length),
  );
  const left = Math.min(
    CHART_WIDTH / 3,
    Math.max(40, 18 + longestTickLength * 7),
  );
  const plotWidth = CHART_WIDTH - left - CHART_RIGHT;
  const plotHeight = CHART_HEIGHT - CHART_TOP - CHART_BOTTOM;
  const xAt = (index: number) =>
    values.length === 1
      ? left + plotWidth / 2
      : left + (index / (values.length - 1)) * plotWidth;
  const yAt = (value: number) =>
    CHART_TOP + plotHeight - (value / axisMax) * plotHeight;
  const points = values.map((value, index) => ({
    index,
    value,
    x: xAt(index),
    y: yAt(value),
  }));
  const hitAreas = points.map((point, index) => {
    const previous = points[index - 1];
    const next = points[index + 1];
    const start = previous ? (previous.x + point.x) / 2 : left;
    const end = next
      ? (point.x + next.x) / 2
      : CHART_WIDTH - CHART_RIGHT;

    return { index, x: start, width: end - start };
  });

  return {
    width: CHART_WIDTH,
    height: CHART_HEIGHT,
    left,
    right: CHART_RIGHT,
    top: CHART_TOP,
    bottom: CHART_BOTTOM,
    plotWidth,
    plotHeight,
    axisMax,
    ticks,
    points,
    hitAreas,
    xLabelIndexes: buildXLabelIndexes(values.length),
  };
};
```

- [ ] **Step 4: 运行测试并确认通过**

Run:

```bash
npm --prefix frontend test -- project/analytics/trend-chart.test.ts
```

Expected: 3 tests PASS。

- [ ] **Step 5: 提交基础图表数学**

```bash
git add frontend/project/analytics/trend-chart.ts frontend/project/analytics/trend-chart.test.ts
git commit -m "feat: 增加 Analytics 图表刻度与坐标计算"
```

### Task 2: 标签碰撞、Tooltip 定位和键盘导航

**Files:**

- Modify: `frontend/project/analytics/trend-chart.test.ts`
- Modify: `frontend/project/analytics/trend-chart.ts`

- [ ] **Step 1: 扩充纯函数失败测试**

把 `frontend/project/analytics/trend-chart.test.ts` 的导入替换为：

```ts
import {
  buildChartGeometry,
  buildIntegerTicks,
  formatChartNumber,
  positionChartTooltip,
  resolveChartNavigation,
  selectValueLabels,
  type ChartLabelBox,
} from "./trend-chart";
```

在文件末尾追加：

```ts
const boxesOverlap = (first: ChartLabelBox, second: ChartLabelBox) =>
  first.left < second.right &&
  first.right > second.left &&
  first.top < second.bottom &&
  first.bottom > second.top;

test("selectValueLabels keeps the latest value and global maximum without overlap", () => {
  const values = Array.from({ length: 90 }, () => 1);
  values[20] = 50;
  const geometry = buildChartGeometry(values);
  const labels = selectValueLabels(geometry);

  assert.ok(labels.some((label) => label.index === 89));
  assert.ok(labels.some((label) => label.index === 20));
  assert.ok(labels.every((label) => label.value > 0));

  for (const [index, label] of labels.entries()) {
    for (const other of labels.slice(index + 1)) {
      assert.equal(boxesOverlap(label.box, other.box), false);
    }
  }
});

test("positionChartTooltip stays inside the chart", () => {
  const geometry = buildChartGeometry([3, 0, 1]);

  for (const point of [geometry.points[0], geometry.points.at(-1)!]) {
    const tooltip = positionChartTooltip(point, geometry);
    assert.ok(tooltip.x >= 4);
    assert.ok(tooltip.y >= 4);
    assert.ok(tooltip.x + tooltip.width <= geometry.width - 4);
    assert.ok(
      tooltip.y + tooltip.height <= geometry.top + geometry.plotHeight,
    );
  }
});

test("resolveChartNavigation supports arrows, boundaries, and escape", () => {
  assert.equal(resolveChartNavigation("ArrowLeft", 2, 5), 1);
  assert.equal(resolveChartNavigation("ArrowLeft", 0, 5), 0);
  assert.equal(resolveChartNavigation("ArrowRight", 4, 5), 4);
  assert.equal(resolveChartNavigation("Home", 3, 5), 0);
  assert.equal(resolveChartNavigation("End", 1, 5), 4);
  assert.equal(resolveChartNavigation("Escape", 2, 5), null);
  assert.equal(resolveChartNavigation("Enter", 2, 5), undefined);
});
```

- [ ] **Step 2: 运行测试并确认新导出缺失**

Run:

```bash
npm --prefix frontend test -- project/analytics/trend-chart.test.ts
```

Expected: FAIL，错误指出 `selectValueLabels`、`positionChartTooltip` 或 `resolveChartNavigation` 尚未导出。

- [ ] **Step 3: 实现标签、Tooltip 和键盘纯函数**

在 `frontend/project/analytics/trend-chart.ts` 末尾追加：

```ts
const LABEL_HEIGHT = 15;
const LABEL_COLLISION_GAP = 4;
const TOOLTIP_MIN_WIDTH = 132;
const TOOLTIP_HEIGHT = 52;
const TOOLTIP_GAP = 10;

export type ChartLabelBox = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

export type ChartValueLabel = {
  index: number;
  value: number;
  x: number;
  y: number;
  textAnchor: "start" | "middle" | "end";
  box: ChartLabelBox;
};

export type ChartTooltipPosition = {
  x: number;
  y: number;
  width: number;
  height: number;
};

const labelBoxAt = (
  x: number,
  baseline: number,
  width: number,
  textAnchor: ChartValueLabel["textAnchor"],
): ChartLabelBox => {
  const left = textAnchor === "start"
    ? x
    : textAnchor === "end"
      ? x - width
      : x - width / 2;

  return {
    left,
    right: left + width,
    top: baseline - LABEL_HEIGHT + 2,
    bottom: baseline + 2,
  };
};

const labelBoxesCollide = (
  first: ChartLabelBox,
  second: ChartLabelBox,
) =>
  first.left < second.right + LABEL_COLLISION_GAP &&
  first.right > second.left - LABEL_COLLISION_GAP &&
  first.top < second.bottom + LABEL_COLLISION_GAP &&
  first.bottom > second.top - LABEL_COLLISION_GAP;

export const selectValueLabels = (
  geometry: ChartGeometry,
): ChartValueLabel[] => {
  const nonZero = geometry.points.filter((point) => point.value > 0);
  if (nonZero.length === 0) return [];

  const latest = nonZero[nonZero.length - 1];
  const maximum = Math.max(...nonZero.map((point) => point.value));
  const latestMaximum = [...nonZero]
    .reverse()
    .find((point) => point.value === maximum)!;
  const priorityIndexes = [
    latest.index,
    latestMaximum.index,
    ...[...nonZero].reverse().map((point) => point.index),
  ].filter((index, position, indexes) => indexes.indexOf(index) === position);
  const labels: ChartValueLabel[] = [];

  for (const index of priorityIndexes) {
    const point = geometry.points[index];
    const textWidth = Math.max(8, formatChartNumber(point.value).length * 7);
    let x = point.x;
    let textAnchor: ChartValueLabel["textAnchor"] = "middle";

    if (point.x - textWidth / 2 < geometry.left) {
      x = geometry.left;
      textAnchor = "start";
    } else if (point.x + textWidth / 2 > geometry.width - geometry.right) {
      x = geometry.width - geometry.right;
      textAnchor = "end";
    }

    for (const y of [point.y - 10, point.y + 18]) {
      const box = labelBoxAt(x, y, textWidth, textAnchor);
      const isInsideChart =
        box.top >= 4 &&
        box.bottom <= geometry.top + geometry.plotHeight - 3;
      const collides = labels.some((label) =>
        labelBoxesCollide(box, label.box),
      );

      if (isInsideChart && !collides) {
        labels.push({
          index,
          value: point.value,
          x,
          y,
          textAnchor,
          box,
        });
        break;
      }
    }
  }

  return labels.sort((first, second) => first.index - second.index);
};

export const positionChartTooltip = (
  point: ChartPoint,
  geometry: ChartGeometry,
): ChartTooltipPosition => {
  const plotRight = geometry.width - geometry.right;
  const tooltipWidth = Math.min(
    geometry.width - 8,
    Math.max(
      TOOLTIP_MIN_WIDTH,
      24 + (formatChartNumber(point.value).length + 3) * 8,
    ),
  );
  const rawX = point.x + TOOLTIP_GAP + tooltipWidth <= plotRight
    ? point.x + TOOLTIP_GAP
    : point.x - TOOLTIP_GAP - tooltipWidth;
  const maxY = geometry.top + geometry.plotHeight - TOOLTIP_HEIGHT;

  return {
    x: Math.min(
      geometry.width - tooltipWidth - 4,
      Math.max(4, rawX),
    ),
    y: Math.min(maxY, Math.max(4, point.y - TOOLTIP_HEIGHT / 2)),
    width: tooltipWidth,
    height: TOOLTIP_HEIGHT,
  };
};

export const resolveChartNavigation = (
  key: string,
  currentIndex: number | null,
  length: number,
): number | null | undefined => {
  if (key === "Escape") return null;
  if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(key)) {
    return undefined;
  }
  if (length === 0) return null;

  const current = currentIndex ?? length - 1;
  if (key === "Home") return 0;
  if (key === "End") return length - 1;
  if (key === "ArrowLeft") return Math.max(0, current - 1);
  return Math.min(length - 1, current + 1);
};
```

- [ ] **Step 4: 运行纯函数测试并确认通过**

Run:

```bash
npm --prefix frontend test -- project/analytics/trend-chart.test.ts
```

Expected: 6 tests PASS。

- [ ] **Step 5: 提交标签和交互数学**

```bash
git add frontend/project/analytics/trend-chart.ts frontend/project/analytics/trend-chart.test.ts
git commit -m "feat: 增加 Analytics 数值标签与交互计算"
```

### Task 3: SVG 数值渲染与精确值交互

**Files:**

- Modify: `frontend/project/analytics/trend-view.test.tsx`
- Modify: `frontend/project/analytics/trend-view.tsx`

- [ ] **Step 1: 用 30 天数据重写展示失败测试**

将 `frontend/project/analytics/trend-view.test.tsx` 替换为：

```tsx
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
  assert.match(html, /aria-label="home_page_load 每日 PV 趋势[^\"]*左右方向键/);
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
        daily: daily.map(({ date }) => ({ date, pv: 0, uv: 0 })),
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
```

- [ ] **Step 2: 运行测试并确认新组件与标记缺失**

Run:

```bash
npm --prefix frontend test -- project/analytics/trend-view.test.tsx
```

Expected: FAIL，至少指出 `TrendChartGraphic` 尚未导出或缺少 `chart-y-label`。

- [ ] **Step 3: 用原生 SVG 实现刻度、标签、命中区域和 Tooltip**

将 `frontend/project/analytics/trend-view.tsx` 替换为：

```tsx
import {
  useId,
  useState,
  type KeyboardEvent,
} from "react";

import {
  buildChartGeometry,
  formatChartNumber,
  positionChartTooltip,
  resolveChartNavigation,
  selectValueLabels,
} from "./trend-chart";
import type {
  TrackDays,
  TrackEvent,
  TrackMetric,
  TrackTrend,
} from "./track-trend";

const METRIC_LABELS: Record<TrackMetric, string> = {
  pv: "PV",
  uv: "UV",
};

type TrendChartGraphicProps = {
  activeIndex: number | null;
  daily: TrackTrend["daily"];
  descriptionId: string;
  event: TrackEvent;
  metric: TrackMetric;
  onChartFocus: () => void;
  onChartKeyDown: (event: KeyboardEvent<SVGSVGElement>) => void;
  onHoverIndex: (index: number | null) => void;
  onPinIndex: (index: number) => void;
};

export const TrendChartGraphic = ({
  activeIndex,
  daily,
  descriptionId,
  event,
  metric,
  onChartFocus,
  onChartKeyDown,
  onHoverIndex,
  onPinIndex,
}: TrendChartGraphicProps) => {
  const metricLabel = METRIC_LABELS[metric];
  const values = daily.map((item) => item[metric]);
  const geometry = buildChartGeometry(values);
  const points = geometry.points
    .map((point) => `${point.x},${point.y}`)
    .join(" ");
  const valueLabels = selectValueLabels(geometry);
  const activePoint = activeIndex === null
    ? null
    : geometry.points[activeIndex] ?? null;
  const activeDay = activeIndex === null ? null : daily[activeIndex] ?? null;
  const tooltip = activePoint
    ? positionChartTooltip(activePoint, geometry)
    : null;
  const accessibleValues = daily
    .map(
      (item) =>
        `${item.date}：${metricLabel} ${formatChartNumber(item[metric])}`,
    )
    .join("；");

  return (
    <figure className="chart-figure">
      <svg
        aria-describedby={descriptionId}
        aria-label={`${event} 每日 ${metricLabel} 趋势。聚焦后使用左右方向键逐日查看，Home 和 End 跳转，Escape 清除固定提示。`}
        className="trend-chart"
        onFocus={onChartFocus}
        onKeyDown={onChartKeyDown}
        onPointerLeave={() => onHoverIndex(null)}
        role="img"
        tabIndex={0}
        viewBox={`0 0 ${geometry.width} ${geometry.height}`}
      >
        <title>{`${event} 每日 ${metricLabel} 趋势`}</title>

        {geometry.ticks.map((tick) => {
          const y =
            geometry.top +
            geometry.plotHeight -
            (tick / geometry.axisMax) * geometry.plotHeight;

          return (
            <g key={tick}>
              <line
                className="chart-grid"
                x1={geometry.left}
                x2={geometry.width - geometry.right}
                y1={y}
                y2={y}
              />
              <text
                className="chart-y-label"
                textAnchor="end"
                x={geometry.left - 10}
                y={y + 4}
              >
                {formatChartNumber(tick)}
              </text>
            </g>
          );
        })}

        <polyline className={`trend-line metric-${metric}`} points={points} />

        {geometry.points
          .filter((point) => point.value > 0)
          .map((point) => (
            <circle
              className={`trend-point metric-${metric}`}
              cx={point.x}
              cy={point.y}
              key={daily[point.index].date}
              r="3.5"
            />
          ))}

        {valueLabels.map((label) => (
          <text
            className={`chart-value-label metric-${metric}`}
            data-chart-value={label.value}
            key={daily[label.index].date}
            textAnchor={label.textAnchor}
            x={label.x}
            y={label.y}
          >
            {formatChartNumber(label.value)}
          </text>
        ))}

        {geometry.xLabelIndexes.map((index) => (
          <text
            className="chart-x-label"
            key={daily[index].date}
            textAnchor={
              index === 0
                ? "start"
                : index === daily.length - 1
                  ? "end"
                  : "middle"
            }
            x={geometry.points[index].x}
            y={geometry.height - 10}
          >
            {daily[index].date.slice(5).replace("-", "/")}
          </text>
        ))}

        {activePoint && activeDay && tooltip ? (
          <>
            <line
              className="chart-active-guide"
              x1={activePoint.x}
              x2={activePoint.x}
              y1={geometry.top}
              y2={geometry.top + geometry.plotHeight}
            />
            <circle
              className={`chart-active-point metric-${metric}`}
              cx={activePoint.x}
              cy={activePoint.y}
              r="5"
            />
            <g
              aria-hidden="true"
              className="chart-tooltip"
              transform={`translate(${tooltip.x} ${tooltip.y})`}
            >
              <rect
                className="chart-tooltip-background"
                height={tooltip.height}
                rx="7"
                width={tooltip.width}
              />
              <text className="chart-tooltip-date" x="12" y="20">
                {activeDay.date}
              </text>
              <text className="chart-tooltip-value" x="12" y="40">
                {`${metricLabel} ${formatChartNumber(activeDay[metric])}`}
              </text>
            </g>
          </>
        ) : null}

        {geometry.hitAreas.map((area) => (
          <rect
            aria-hidden="true"
            className="chart-hit-area"
            data-chart-index={area.index}
            height={geometry.plotHeight}
            key={daily[area.index].date}
            onClick={() => onPinIndex(area.index)}
            onPointerEnter={() => onHoverIndex(area.index)}
            width={area.width}
            x={area.x}
            y={geometry.top}
          />
        ))}
      </svg>

      <figcaption className="visually-hidden" id={descriptionId}>
        {accessibleValues}
      </figcaption>
      <p aria-live="polite" className="visually-hidden">
        {activeDay
          ? `${activeDay.date}，${metricLabel} ${formatChartNumber(activeDay[metric])}`
          : ""}
      </p>
    </figure>
  );
};

export const TrendView = ({
  trend,
  metric,
  event,
  days,
  updatedAt,
}: {
  trend: TrackTrend;
  metric: TrackMetric;
  event: TrackEvent;
  days: TrackDays;
  updatedAt: string;
}) => {
  const descriptionId = useId();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [pinnedIndex, setPinnedIndex] = useState<number | null>(null);
  const metricLabel = METRIC_LABELS[metric];
  const hasData = trend.daily.some((item) => item.pv > 0 || item.uv > 0);
  const activeIndex = pinnedIndex ?? hoveredIndex;

  const handleChartKeyDown = (event: KeyboardEvent<SVGSVGElement>) => {
    const nextIndex = resolveChartNavigation(
      event.key,
      activeIndex,
      trend.daily.length,
    );
    if (nextIndex === undefined) return;

    event.preventDefault();
    setPinnedIndex(nextIndex);
  };

  const handleChartFocus = () => {
    setPinnedIndex((current) => current ?? trend.daily.length - 1);
  };

  return (
    <section className="panel trend-panel">
      <div className="section-heading">
        <h2>每日 {metricLabel}</h2>
        <span className={`metric-badge metric-${metric}`}>{metricLabel}</span>
      </div>

      <p className="trend-meta">
        <code>{event}</code> · {days} 天 · 更新于 {updatedAt}
      </p>

      {hasData ? (
        <TrendChartGraphic
          activeIndex={activeIndex}
          daily={trend.daily}
          descriptionId={descriptionId}
          event={event}
          metric={metric}
          onChartFocus={handleChartFocus}
          onChartKeyDown={handleChartKeyDown}
          onHoverIndex={setHoveredIndex}
          onPinIndex={setPinnedIndex}
        />
      ) : (
        <p className="empty-state">暂无该事件数据</p>
      )}
    </section>
  );
};
```

- [ ] **Step 4: 运行展示测试并确认通过**

Run:

```bash
npm --prefix frontend test -- project/analytics/trend-view.test.tsx
```

Expected: 3 tests PASS。

- [ ] **Step 5: 同时运行图表数学与展示测试**

Run:

```bash
npm --prefix frontend test -- project/analytics/trend-chart.test.ts project/analytics/trend-view.test.tsx
```

Expected: 9 tests PASS。

- [ ] **Step 6: 提交 SVG 展示与交互**

```bash
git add frontend/project/analytics/trend-view.tsx frontend/project/analytics/trend-view.test.tsx
git commit -m "feat: 显示 Analytics 趋势精确数值"
```

### Task 4: 图表可读性与小屏样式

**Files:**

- Create: `frontend/project/analytics/styles.test.mjs`
- Modify: `frontend/project/analytics/styles.css:224-286`

- [ ] **Step 1: 写关键 CSS 契约失败测试**

创建 `frontend/project/analytics/styles.test.mjs`：

```js
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

const styles = readFileSync(new URL("./styles.css", import.meta.url), "utf8");

test("Analytics chart styles keep values readable and touch targets usable", () => {
  assert.match(
    styles,
    /\.chart-figure\s*\{[^}]*overflow-x:\s*auto;/s,
  );
  assert.match(
    styles,
    /\.trend-chart\s*\{[^}]*min-width:\s*560px;[^}]*touch-action:\s*pan-x pan-y;/s,
  );
  assert.match(
    styles,
    /\.chart-value-label\s*\{[^}]*paint-order:\s*stroke;/s,
  );
  assert.match(
    styles,
    /\.chart-hit-area\s*\{[^}]*pointer-events:\s*all;/s,
  );
  assert.match(styles, /\.visually-hidden\s*\{/);
});
```

- [ ] **Step 2: 运行样式测试并确认失败**

Run:

```bash
npm --prefix frontend test -- project/analytics/styles.test.mjs
```

Expected: FAIL，首个缺失规则为 `.chart-figure`。

- [ ] **Step 3: 用作用域明确的图表样式替换旧规则**

在 `frontend/project/analytics/styles.css` 中，将从现有 `figure {` 到 `.chart-label { ... }` 结束的整段替换为：

```css
.chart-figure {
  position: relative;
  width: 100%;
  margin: 0;
  overflow-x: auto;
  overflow-y: hidden;
  padding: 4px 0 8px;
}

.trend-chart {
  display: block;
  width: 100%;
  min-width: 560px;
  height: auto;
  overflow: visible;
  touch-action: pan-x pan-y;
}

.trend-chart:focus-visible {
  outline: 3px solid rgba(37, 99, 235, 0.28);
  outline-offset: 2px;
}

.chart-grid {
  stroke: var(--border);
  stroke-width: 1;
}

.chart-y-label,
.chart-x-label {
  fill: var(--muted);
  font-size: 11px;
}

.chart-value-label {
  fill: var(--dark);
  stroke: var(--surface);
  stroke-width: 4px;
  stroke-linejoin: round;
  font-size: 12px;
  font-weight: 800;
  paint-order: stroke;
  pointer-events: none;
}

.chart-value-label.metric-uv {
  fill: var(--uv);
}

.trend-line {
  fill: none;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 3;
  pointer-events: none;
}

.trend-line.metric-pv {
  stroke: var(--dark);
}

.trend-line.metric-uv {
  stroke: var(--uv);
}

.trend-point.metric-pv,
.chart-active-point.metric-pv {
  fill: var(--dark);
}

.trend-point.metric-uv,
.chart-active-point.metric-uv {
  fill: var(--uv);
}

.chart-hit-area {
  fill: transparent;
  cursor: crosshair;
  pointer-events: all;
}

.chart-active-guide {
  stroke: #a8a29e;
  stroke-dasharray: 4 4;
  stroke-width: 1;
  pointer-events: none;
}

.chart-active-point {
  stroke: var(--surface);
  stroke-width: 2px;
  pointer-events: none;
}

.chart-tooltip {
  pointer-events: none;
}

.chart-tooltip-background {
  fill: var(--dark);
  filter: drop-shadow(0 4px 10px rgba(0, 0, 0, 0.18));
}

.chart-tooltip-date {
  fill: #d6d3d1;
  font-size: 11px;
}

.chart-tooltip-value {
  fill: #ffffff;
  font-size: 13px;
  font-weight: 800;
}

.visually-hidden {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
}
```

- [ ] **Step 4: 运行样式和图表测试**

Run:

```bash
npm --prefix frontend test -- project/analytics/styles.test.mjs project/analytics/trend-chart.test.ts project/analytics/trend-view.test.tsx
```

Expected: 10 tests PASS。

- [ ] **Step 5: 运行 Analytics 生产构建**

Run:

```bash
npm --prefix frontend run build analytics
```

Expected: Vite build succeeds，输出 `frontend/dist/analytics`，且没有 TypeScript 或 CSS 错误。

- [ ] **Step 6: 提交图表样式**

```bash
git add frontend/project/analytics/styles.css frontend/project/analytics/styles.test.mjs
git commit -m "style: 完善 Analytics 图表数值样式"
```

### Task 5: 回归验证与验收

**Files:**

- Verify only; no planned source changes.

- [ ] **Step 1: 运行全部 Analytics 测试**

Run:

```bash
npm --prefix frontend test -- \
  project/analytics/app.test.tsx \
  project/analytics/resources.test.mjs \
  project/analytics/styles.test.mjs \
  project/analytics/track-trend.test.ts \
  project/analytics/trend-chart.test.ts \
  project/analytics/trend-view.test.tsx
```

Expected: Analytics 的查询、筛选、应用、图表、样式和资源测试全部 PASS。

- [ ] **Step 2: 运行前端 lint 和类型检查**

Run:

```bash
npm --prefix frontend run lint -- project/analytics
npm --prefix frontend run typecheck
```

Expected: 两条命令均以退出码 0 完成，无 lint 或 TypeScript 错误。

- [ ] **Step 3: 运行仓库完整检查**

Run:

```bash
npm run check
```

Expected: 根自动化测试、全部前后端测试、lint、typecheck 和四个前端生产构建全部通过。

- [ ] **Step 4: 核对依赖和改动范围**

Run:

```bash
git diff 2b0c5e8 -- frontend/package.json frontend/package-lock.json
git status --short
git log --oneline 2b0c5e8..HEAD
```

Expected:

- 第一条命令无输出，证明没有新增图表依赖。
- `git status --short` 无输出。
- 日志只包含本实施计划文档以及本计划中的功能、测试或样式提交。

- [ ] **Step 5: 建立本地验收数据并启动页面**

先创建被 `.gitignore` 排除的验收目录：

```bash
mkdir -p .superpowers/qa/analytics-track
```

使用 `apply_patch` 创建不会进入 Git 的 `.superpowers/qa/analytics-track/events.jsonl`：

```text
{"project":"hub","event":"home_page_load","time":"2026-08-16T09:00:00+08:00","device_id":"AaBbCcDdEe01"}
{"project":"hub","event":"home_page_load","time":"2026-08-16T10:00:00+08:00","device_id":"AaBbCcDdEe01"}
{"project":"hub","event":"home_page_load","time":"2026-08-16T11:00:00+08:00","device_id":"FfGgHhIiJj02"}
{"project":"hub","event":"home_page_load","time":"2026-08-17T00:01:00+08:00","device_id":"KkLlMmNnOo03"}
```

在第一个终端启动读取该文件的 Backend：

```bash
TRACK_LOG_DIR="$PWD/.superpowers/qa/analytics-track" npm --prefix backend start
```

Expected: 输出 `Backend listening on http://localhost:3001`。

在第二个终端启动 Analytics：

```bash
npm --prefix frontend run dev analytics -- --host 127.0.0.1
```

Expected: Vite 输出本地 URL，默认是 `http://127.0.0.1:5173/`。打开该 URL后，Backend 自动把 4 条记录补齐为连续 30 天响应。

- [ ] **Step 6: 执行桌面、键盘和手机宽度视觉检查**

检查以下行为：

- PV 下 Y 轴显示 `0、1、2、3`，`3` 和 `1` 常驻可见。
- UV 下 Y 轴显示 `0、1、2`，`2` 和 `1` 常驻可见，切换时不发送新请求。
- 鼠标悬浮任意日期显示完整日期和值，移出后未固定项消失。
- 点击 `08/16` 后 Tooltip 固定，点击其他日期切换固定项。
- Tab 聚焦图表后默认显示末日，方向键、Home、End 和 Escape 符合设计。
- 320px 视口下页面不整体横向溢出，图表区域可横向滚动，手机点击命中区域不阻止纵向滚动。

Expected: 所有行为与 `docs/superpowers/specs/2026-08-17-analytics-native-svg-values-design.md` 的验收标准一致。

- [ ] **Step 7: 停止两个本地服务并清理验收数据**

在两个终端分别按 `Ctrl-C`，然后使用 `apply_patch` 删除 `.superpowers/qa/analytics-track/events.jsonl`。

Run:

```bash
git status --short
```

Expected: 无输出；验收数据没有进入工作树。
