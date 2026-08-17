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
