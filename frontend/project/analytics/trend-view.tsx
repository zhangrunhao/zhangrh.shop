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
