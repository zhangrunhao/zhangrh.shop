import assert from "node:assert/strict";
import test from "node:test";

import {
  buildChartGeometry,
  buildIntegerTicks,
  formatChartNumber,
  positionChartTooltip,
  resolveChartNavigation,
  selectValueLabels,
  type ChartLabelBox,
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
