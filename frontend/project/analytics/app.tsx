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
    <button type="button" disabled={loading} onClick={onRetry}>
      重试
    </button>
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
                <option key={days} value={days}>
                  {days} 天
                </option>
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
