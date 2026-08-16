export const TRACK_PROJECTS = ["hub", "cardgame", "shotmarker"] as const;
export type TrackProject = (typeof TRACK_PROJECTS)[number];

export const TRACK_DAY_OPTIONS = [1, 7, 30, 90] as const;
export type TrackDays = (typeof TRACK_DAY_OPTIONS)[number];

export const PROJECT_EVENTS = {
  hub: {
    defaultEvent: "home_page_load",
    events: [
      "home_page_load",
      "products_page_load",
      "articles_page_load",
      "article_detail_page_load",
      "about_page_load",
    ],
  },
  cardgame: {
    defaultEvent: "cardgame_page_load",
    events: [
      "cardgame_page_load",
      "create_room_click",
      "join_room_click",
      "ai_battle_click",
      "play_cards_click",
      "round_confirm_click",
      "play_again_click",
    ],
  },
  shotmarker: {
    defaultEvent: "app_launch",
    events: [
      "app_launch",
      "training_sync_succeeded",
      "highlight_generate_succeeded",
      "highlight_save_succeeded",
    ],
  },
} as const;

type ProjectEvents = typeof PROJECT_EVENTS;
export type TrackEvent = ProjectEvents[TrackProject]["events"][number];
export type TrackMetric = "pv" | "uv";

export type TrackTrendQuery = {
  project: TrackProject;
  event: TrackEvent;
  days: TrackDays;
};

export type TrackTrend = {
  daily: Array<{
    date: string;
    pv: number;
    uv: number;
  }>;
};

export class TrackTrendError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(code);
    this.name = "TrackTrendError";
    this.code = code;
  }
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const hasExactKeys = (
  value: Record<string, unknown>,
  expectedKeys: readonly string[],
) => {
  const keys = Object.keys(value);
  return (
    keys.length === expectedKeys.length &&
    expectedKeys.every((key) => Object.hasOwn(value, key))
  );
};

const invalidResponse = (): never => {
  throw new TrackTrendError("invalid_response");
};

const readCount = (value: unknown) => {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value < 0) {
    return invalidResponse();
  }
  return value;
};

const readDateTimestamp = (value: unknown) => {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return invalidResponse();
  }

  const timestamp = Date.parse(`${value}T00:00:00.000Z`);
  if (
    !Number.isFinite(timestamp) ||
    new Date(timestamp).toISOString().slice(0, 10) !== value
  ) {
    return invalidResponse();
  }
  return { value, timestamp };
};

export const isTrackProject = (value: unknown): value is TrackProject =>
  typeof value === "string" &&
  (TRACK_PROJECTS as readonly string[]).includes(value);

export const isTrackDays = (value: unknown): value is TrackDays =>
  typeof value === "number" &&
  (TRACK_DAY_OPTIONS as readonly number[]).includes(value);

export const isTrackEvent = (
  project: TrackProject,
  value: unknown,
): value is TrackEvent =>
  typeof value === "string" &&
  (PROJECT_EVENTS[project].events as readonly string[]).includes(value);

export const defaultTrackEvent = (project: TrackProject): TrackEvent =>
  PROJECT_EVENTS[project].defaultEvent;

export const buildTrackTrendUrl = ({
  project,
  event,
  days,
}: TrackTrendQuery) => {
  const query = new URLSearchParams({
    project,
    event,
    days: String(days),
  });
  return `/api/track/trend?${query.toString()}`;
};

export const parseTrackTrend = (
  value: unknown,
  expectedDays: TrackDays,
): TrackTrend => {
  if (!isRecord(value) || !hasExactKeys(value, ["daily"])) {
    return invalidResponse();
  }
  if (!Array.isArray(value.daily) || value.daily.length !== expectedDays) {
    return invalidResponse();
  }

  let previousTimestamp: number | null = null;
  const daily = value.daily.map((entry) => {
    if (!isRecord(entry) || !hasExactKeys(entry, ["date", "pv", "uv"])) {
      return invalidResponse();
    }

    const { value: date, timestamp } = readDateTimestamp(entry.date);
    const pv = readCount(entry.pv);
    const uv = readCount(entry.uv);

    if (uv > pv) return invalidResponse();
    if (
      previousTimestamp !== null &&
      timestamp - previousTimestamp !== 24 * 60 * 60 * 1000
    ) {
      return invalidResponse();
    }
    previousTimestamp = timestamp;

    return { date, pv, uv };
  });

  return { daily };
};

export const fetchTrackTrend = async (
  query: TrackTrendQuery,
  fetcher: typeof fetch = fetch,
) => {
  let response: Response;
  try {
    response = await fetcher(buildTrackTrendUrl(query), {
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
  } catch {
    throw new TrackTrendError("network_error");
  }

  if (!response.ok) {
    throw new TrackTrendError("request_failed");
  }

  let payload: unknown;
  try {
    payload = await response.json();
  } catch {
    throw new TrackTrendError("invalid_response");
  }

  return parseTrackTrend(payload, query.days);
};

export const TRACK_TREND_ERROR_MESSAGE = "数据加载失败，请重试。";

export const describeTrackTrendError = (error: unknown) => {
  void error;
  return TRACK_TREND_ERROR_MESSAGE;
};
