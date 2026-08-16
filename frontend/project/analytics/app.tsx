import { useEffect, useRef, useState } from "react";

import {
  DEFAULT_TRACK_METRIC,
  TRACK_FILTERS_STORAGE_KEY,
  restoreTrackQuery,
  selectTrackDays,
  selectTrackEvent,
  selectTrackProject,
  serializeTrackFilters,
} from "./track-filters";
import {
  PROJECT_EVENTS,
  TRACK_DAY_OPTIONS,
  TRACK_PROJECTS,
  TRACK_TREND_ERROR_MESSAGE,
  describeTrackTrendError,
  fetchTrackTrend,
  isTrackDays,
  isTrackEvent,
  isTrackProject,
  type TrackMetric,
  type TrackProject,
  type TrackTrend,
  type TrackTrendQuery,
} from "./track-trend";
import { TrendView } from "./trend-view";

const PROJECT_LABELS: Record<TrackProject, string> = {
  hub: "Hub",
  cardgame: "Cardgame",
  shotmarker: "ShotMarker",
};

type ViewState = {
  trend: TrackTrend | null;
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

const readInitialTrackQuery = (): TrackTrendQuery => {
  if (typeof window === "undefined") return restoreTrackQuery(null);

  try {
    return restoreTrackQuery(
      window.localStorage.getItem(TRACK_FILTERS_STORAGE_KEY),
    );
  } catch {
    return restoreTrackQuery(null);
  }
};

export const ErrorNotice = ({
  loading,
  onRetry,
}: {
  loading: boolean;
  onRetry: () => void;
}) => (
  <section className="notice error-notice" role="alert">
    <span>{TRACK_TREND_ERROR_MESSAGE}</span>
    <button type="button" disabled={loading} onClick={onRetry}>
      重试
    </button>
  </section>
);

export const App = () => {
  const [query, setQuery] = useState<TrackTrendQuery>(readInitialTrackQuery);
  const [metric, setMetric] = useState<TrackMetric>(DEFAULT_TRACK_METRIC);
  const [reloadToken, setReloadToken] = useState(0);
  const [view, setView] = useState<ViewState>({
    trend: null,
    loading: true,
    error: null,
    updatedAt: null,
  });
  const latestRequest = useRef(0);

  useEffect(() => {
    try {
      window.localStorage.setItem(
        TRACK_FILTERS_STORAGE_KEY,
        serializeTrackFilters(query),
      );
    } catch {
      // Analytics remains usable when storage is unavailable.
    }
  }, [query]);

  useEffect(() => {
    const requestId = latestRequest.current + 1;
    latestRequest.current = requestId;
    let active = true;

    void fetchTrackTrend(query)
      .then((trend) => {
        if (!active || latestRequest.current !== requestId) return;
        setView({
          trend,
          loading: false,
          error: null,
          updatedAt: formatUpdatedAt(new Date()),
        });
      })
      .catch((error: unknown) => {
        if (!active || latestRequest.current !== requestId) return;
        setView((current) => ({
          ...current,
          loading: false,
          error: describeTrackTrendError(error),
        }));
      });

    return () => {
      active = false;
    };
  }, [query, reloadToken]);

  const beginFilterLoad = (nextQuery: TrackTrendQuery) => {
    setView({ trend: null, loading: true, error: null, updatedAt: null });
    setQuery(nextQuery);
  };

  const updateProject = (project: TrackProject) => {
    if (project === query.project) return;
    beginFilterLoad(selectTrackProject(query, project));
  };

  const updateDays = (days: TrackTrendQuery["days"]) => {
    if (days === query.days) return;
    beginFilterLoad(selectTrackDays(query, days));
  };

  const updateEvent = (event: TrackTrendQuery["event"]) => {
    if (event === query.event) return;
    beginFilterLoad(selectTrackEvent(query, event));
  };

  const reload = () => {
    setView((current) => ({ ...current, loading: true, error: null }));
    setReloadToken((current) => current + 1);
  };

  return (
    <div className="app-shell">
      <header className="page-header">
        <div>
          <p className="eyebrow">公开聚合数据</p>
          <h1>单事件趋势</h1>
          <p className="intro">查看一个业务事件在上海自然日内的每日 PV 或 UV。</p>
        </div>

        <div className="filters" aria-label="趋势筛选">
          <label>
            <span>项目</span>
            <select
              aria-label="项目"
              value={query.project}
              onChange={(event) => {
                const project = event.currentTarget.value;
                if (isTrackProject(project)) updateProject(project);
              }}
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
              value={query.days}
              onChange={(event) => {
                const days = Number(event.currentTarget.value);
                if (isTrackDays(days)) updateDays(days);
              }}
            >
              {TRACK_DAY_OPTIONS.map((days) => (
                <option key={days} value={days}>
                  {days} 天
                </option>
              ))}
            </select>
          </label>

          <label className="event-filter">
            <span>事件</span>
            <select
              aria-label="事件"
              value={query.event}
              onChange={(event) => {
                const nextEvent = event.currentTarget.value;
                if (isTrackEvent(query.project, nextEvent)) {
                  updateEvent(nextEvent);
                }
              }}
            >
              {PROJECT_EVENTS[query.project].events.map((event) => (
                <option key={event} value={event}>
                  {event}
                </option>
              ))}
            </select>
          </label>

          <fieldset className="metric-toggle">
            <legend>口径</legend>
            {(["pv", "uv"] as const).map((value) => (
              <button
                type="button"
                key={value}
                aria-pressed={metric === value}
                onClick={() => setMetric(value)}
              >
                {value.toUpperCase()}
              </button>
            ))}
          </fieldset>

          <button
            className="refresh-button"
            type="button"
            disabled={view.loading}
            onClick={reload}
          >
            {view.loading ? "加载中…" : "刷新"}
          </button>
        </div>
      </header>

      {view.error ? (
        <ErrorNotice loading={view.loading} onRetry={reload} />
      ) : null}

      {view.loading ? (
        <p className="loading-state" role="status">
          {view.trend ? "正在刷新趋势数据…" : "正在加载趋势数据…"}
        </p>
      ) : null}

      {view.trend && view.updatedAt ? (
        <TrendView
          trend={view.trend}
          metric={metric}
          event={query.event}
          days={query.days}
          updatedAt={view.updatedAt}
        />
      ) : null}

      <footer className="page-footer">
        仅展示逐日聚合 PV/UV，不包含原始事件记录或设备标识。
      </footer>
    </div>
  );
};
