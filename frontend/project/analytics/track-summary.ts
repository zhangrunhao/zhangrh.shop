export const TRACK_PROJECTS = ["hub", "cardgame", "shotmarker"] as const;
export type TrackProject = (typeof TRACK_PROJECTS)[number];

export const TRACK_DAY_OPTIONS = [1, 7, 30, 90] as const;
export type TrackDays = (typeof TRACK_DAY_OPTIONS)[number];

export type TrackSummaryQuery = {
  project: TrackProject;
  days: TrackDays;
};

export type TrackSummary = {
  range: {
    days: number;
    from: string;
    to: string;
    timezone: string;
  };
  filter: {
    project: TrackProject | null;
  };
  totals: {
    events: number;
    devices: number;
  };
  event_breakdown: Array<{
    project: TrackProject;
    event: string;
    events: number;
    devices: number;
  }>;
  page_breakdown: Array<{
    project: TrackProject;
    page_name: string;
    events: number;
    devices: number;
  }>;
  button_breakdown: Array<{
    project: TrackProject;
    button: string;
    events: number;
    devices: number;
  }>;
  daily: Array<{
    date: string;
    events: number;
    devices: number;
  }>;
};

export class TrackSummaryError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = "TrackSummaryError";
    this.code = code;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isTrackProject = (value: unknown): value is TrackProject =>
  typeof value === "string" &&
  (TRACK_PROJECTS as readonly string[]).includes(value);

const readRecord = (value: unknown) => {
  if (!isRecord(value)) throw new TrackSummaryError("invalid_response");
  return value;
};

const readString = (value: unknown) => {
  if (typeof value !== "string" || value.length === 0) {
    throw new TrackSummaryError("invalid_response");
  }
  return value;
};

const readCount = (value: unknown) => {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    throw new TrackSummaryError("invalid_response");
  }
  return value;
};

const readProject = (value: unknown) => {
  if (!isTrackProject(value)) throw new TrackSummaryError("invalid_response");
  return value;
};

const readList = <T>(value: unknown, parse: (entry: unknown) => T) => {
  if (!Array.isArray(value)) throw new TrackSummaryError("invalid_response");
  return value.map(parse);
};

export const buildTrackSummaryUrl = ({ project, days }: TrackSummaryQuery) => {
  const query = new URLSearchParams({
    days: String(days),
    project,
  });
  return `/api/track/summary?${query.toString()}`;
};

export const parseTrackSummary = (value: unknown): TrackSummary => {
  const root = readRecord(value);
  const range = readRecord(root.range);
  const filter = readRecord(root.filter);
  const totals = readRecord(root.totals);
  const rangeDays = readCount(range.days);

  if (rangeDays < 1 || rangeDays > 90) {
    throw new TrackSummaryError("invalid_response");
  }

  const filteredProject = filter.project;
  if (filteredProject !== null && !isTrackProject(filteredProject)) {
    throw new TrackSummaryError("invalid_response");
  }

  return {
    range: {
      days: rangeDays,
      from: readString(range.from),
      to: readString(range.to),
      timezone: readString(range.timezone),
    },
    filter: { project: filteredProject },
    totals: {
      events: readCount(totals.events),
      devices: readCount(totals.devices),
    },
    event_breakdown: readList(root.event_breakdown, (entry) => {
      const row = readRecord(entry);
      return {
        project: readProject(row.project),
        event: readString(row.event),
        events: readCount(row.events),
        devices: readCount(row.devices),
      };
    }),
    page_breakdown: readList(root.page_breakdown, (entry) => {
      const row = readRecord(entry);
      return {
        project: readProject(row.project),
        page_name: readString(row.page_name),
        events: readCount(row.events),
        devices: readCount(row.devices),
      };
    }),
    button_breakdown: readList(root.button_breakdown, (entry) => {
      const row = readRecord(entry);
      return {
        project: readProject(row.project),
        button: readString(row.button),
        events: readCount(row.events),
        devices: readCount(row.devices),
      };
    }),
    daily: readList(root.daily, (entry) => {
      const row = readRecord(entry);
      const date = readString(row.date);
      if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
        throw new TrackSummaryError("invalid_response");
      }
      return {
        date,
        events: readCount(row.events),
        devices: readCount(row.devices),
      };
    }),
  };
};

const readErrorCode = (value: unknown) => {
  if (!isRecord(value) || !isRecord(value.error)) return null;
  return typeof value.error.code === "string" ? value.error.code : null;
};

export const fetchTrackSummary = async (
  query: TrackSummaryQuery,
  fetcher: typeof fetch = fetch,
) => {
  let response: Response;
  try {
    response = await fetcher(buildTrackSummaryUrl(query), {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new TrackSummaryError("network_error");
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new TrackSummaryError(
      response.ok ? "invalid_response" : "request_failed",
    );
  }

  if (!response.ok) {
    throw new TrackSummaryError(readErrorCode(payload) ?? "request_failed");
  }

  return parseTrackSummary(payload);
};

const ERROR_MESSAGES: Record<string, string> = {
  invalid_days: "时间范围无效。",
  invalid_project: "该项目暂不可查询。",
  track_log_unavailable: "埋点日志暂不可用，请稍后重试。",
  track_log_too_large: "埋点数据量过大，暂时无法查询。",
  track_query_busy: "已有查询正在进行，请稍后重试。",
  track_query_timeout: "查询超时，请重试。",
  internal_error: "服务暂时不可用，请稍后重试。",
  invalid_response: "数据格式异常，请重试。",
  network_error: "网络连接失败，请重试。",
  request_failed: "数据加载失败，请重试。",
};

export const describeTrackSummaryError = (
  error: unknown,
  project: TrackProject,
) => {
  if (
    error instanceof TrackSummaryError &&
    error.code === "invalid_project" &&
    project === "shotmarker"
  ) {
    return "线上 Backend 尚未支持 ShotMarker。";
  }
  if (error instanceof TrackSummaryError) {
    return ERROR_MESSAGES[error.code] ?? "数据加载失败，请重试。";
  }
  return "数据加载失败，请重试。";
};
