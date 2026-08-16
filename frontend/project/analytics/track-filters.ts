import {
  defaultTrackEvent,
  isTrackDays,
  isTrackEvent,
  isTrackProject,
  type TrackDays,
  type TrackEvent,
  type TrackMetric,
  type TrackProject,
  type TrackTrendQuery,
} from "./track-trend";

export const TRACK_FILTERS_STORAGE_KEY = "track.analytics.filters.v2";

export const DEFAULT_TRACK_QUERY = {
  project: "hub",
  days: 30,
  event: "home_page_load",
} as const satisfies TrackTrendQuery;

export const DEFAULT_TRACK_METRIC = "pv" as const satisfies TrackMetric;

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

export const restoreTrackQuery = (serialized: string | null): TrackTrendQuery => {
  if (serialized === null) return { ...DEFAULT_TRACK_QUERY };

  let stored: unknown;
  try {
    stored = JSON.parse(serialized);
  } catch {
    return { ...DEFAULT_TRACK_QUERY };
  }

  if (!isRecord(stored)) return { ...DEFAULT_TRACK_QUERY };

  const project = isTrackProject(stored.project)
    ? stored.project
    : DEFAULT_TRACK_QUERY.project;
  const days = isTrackDays(stored.days) ? stored.days : DEFAULT_TRACK_QUERY.days;

  return {
    project,
    days,
    event: defaultTrackEvent(project),
  };
};

export const serializeTrackFilters = ({ project, days }: TrackTrendQuery) =>
  JSON.stringify({ project, days });

export const selectTrackProject = (
  current: TrackTrendQuery,
  project: TrackProject,
): TrackTrendQuery => ({
  project,
  days: current.days,
  event: defaultTrackEvent(project),
});

export const selectTrackDays = (
  current: TrackTrendQuery,
  days: TrackDays,
): TrackTrendQuery => ({ ...current, days });

export const selectTrackEvent = (
  current: TrackTrendQuery,
  event: TrackEvent,
): TrackTrendQuery =>
  isTrackEvent(current.project, event) ? { ...current, event } : current;
