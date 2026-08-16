import type {
  TrackDays,
  TrackEvent,
  TrackMetric,
  TrackTrend,
} from "./track-trend";

const numberFormatter = new Intl.NumberFormat("zh-CN");

const METRIC_LABELS: Record<TrackMetric, string> = {
  pv: "PV",
  uv: "UV",
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
  const metricLabel = METRIC_LABELS[metric];
  const hasData = trend.daily.some((item) => item.pv > 0 || item.uv > 0);

  const width = 720;
  const height = 220;
  const left = 28;
  const right = 16;
  const top = 20;
  const bottom = 44;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const maxValue = Math.max(1, ...trend.daily.map((item) => item[metric]));
  const xAt = (index: number) =>
    trend.daily.length === 1
      ? left + plotWidth / 2
      : left + (index / (trend.daily.length - 1)) * plotWidth;
  const yAt = (value: number) =>
    top + plotHeight - (value / maxValue) * plotHeight;
  const points = trend.daily
    .map((item, index) => `${xAt(index)},${yAt(item[metric])}`)
    .join(" ");
  const labelIndexes =
    trend.daily.length <= 7
      ? trend.daily.map((_, index) => index)
      : [0, Math.floor((trend.daily.length - 1) / 2), trend.daily.length - 1];

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
        <figure>
          <svg
            viewBox={`0 0 ${width} ${height}`}
            role="img"
            aria-label={`${event} 每日 ${metricLabel} 趋势`}
          >
            <line
              className="chart-axis"
              x1={left}
              x2={width - right}
              y1={top + plotHeight}
              y2={top + plotHeight}
            />
            <polyline className={`trend-line metric-${metric}`} points={points} />
            {trend.daily.length <= 7
              ? trend.daily.map((item, index) => (
                  <circle
                    className={`trend-point metric-${metric}`}
                    cx={xAt(index)}
                    cy={yAt(item[metric])}
                    key={item.date}
                    r="4"
                  >
                    <title>{`${item.date}: ${metricLabel} ${numberFormatter.format(item[metric])}`}</title>
                  </circle>
                ))
              : null}
            {labelIndexes.map((index) => (
              <text
                className="chart-label"
                key={trend.daily[index].date}
                textAnchor={
                  index === 0
                    ? "start"
                    : index === trend.daily.length - 1
                      ? "end"
                      : "middle"
                }
                x={xAt(index)}
                y={height - 10}
              >
                {trend.daily[index].date.slice(5).replace("-", "/")}
              </text>
            ))}
          </svg>
        </figure>
      ) : (
        <p className="empty-state">暂无该事件数据</p>
      )}
    </section>
  );
};
