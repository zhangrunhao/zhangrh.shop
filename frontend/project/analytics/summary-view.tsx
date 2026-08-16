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
                <td>
                  <code>{row.name}</code>
                </td>
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
        <div className="section-heading">
          <h2>每日趋势</h2>
        </div>
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
  const yAt = (value: number) =>
    top + plotHeight - (value / maxValue) * plotHeight;
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
          <span>
            <i className="event-dot" />事件
          </span>
          <span>
            <i className="device-dot" />设备
          </span>
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
              textAnchor={
                index === 0
                  ? "start"
                  : index === daily.length - 1
                    ? "end"
                    : "middle"
              }
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
