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
