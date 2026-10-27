import { fetchTrackTrend, type TrackTrendQuery } from "./track-trend";

export const AUDIENCES = ["production", "test", "self", "unknown", "all"] as const;
export type Audience = (typeof AUDIENCES)[number];
export const AUDIENCE_LABELS: Record<Audience, string> = { production: "正式使用", test: "测试", self: "自用", unknown: "未知来源", all: "全部来源" };
const FLOWS = ["training_sync", "highlight_generate", "highlight_save"] as const;
export const FLOW_LABELS = { training_sync: "同步", highlight_generate: "生成", highlight_save: "保存" };
export const COUNTS = ["attempts", "installations", "succeeded", "failed", "cancelled", "ignored", "unknown", "missing_start", "conflicts"] as const;
export const COUNT_LABELS = ["尝试", "涉及安装", "成功", "失败", "取消", "忽略", "结果未知", "缺开始结果", "冲突结果"];
const STAGES = ["", "received", "decode", "import", "ack", "validation", "queue", "export", "commit", "permission", "photos_write", "local_state"];
const REASONS = ["", "invalid_input", "decode_failed", "import_failed", "ack_failed", "before_cutover", "background", "busy", "invalid_task", "revision_conflict", "source_unavailable", "export_failed", "output_commit_failed", "permission_denied", "missing_output", "photos_write_failed", "state_update_failed", "user_cancelled", "backgrounded", "cancelled", "interrupted", "unknown"];
export const STAGE_LABELS: Record<string, string> = { received: "收到同步", decode: "解码", import: "导入", ack: "发送回执", validation: "入口检查", queue: "排队", export: "导出视频", commit: "提交输出", permission: "相册权限", photos_write: "写入相册", local_state: "更新本地状态" };
export const REASON_LABELS: Record<string, string> = { invalid_input: "输入无效", decode_failed: "解码失败", import_failed: "导入失败", ack_failed: "回执失败", before_cutover: "升级前旧数据", background: "处于后台", busy: "正在处理其他操作", invalid_task: "任务无效", revision_conflict: "任务版本冲突", source_unavailable: "原视频不可用", export_failed: "导出失败", output_commit_failed: "输出提交失败", permission_denied: "权限被拒绝", missing_output: "缺少输出文件", photos_write_failed: "相册写入失败", state_update_failed: "状态更新失败", user_cancelled: "用户停止", backgrounded: "切到后台", cancelled: "操作取消", interrupted: "操作中断", unknown: "未知" };
export const EVENT_LABELS: Record<string, string> = { training_sync_failed: "同步失败", training_sync_ack_failed: "回执失败", highlight_generate_failed: "生成失败", highlight_save_failed: "保存失败", highlight_save_state_failed: "保存状态失败" };
type Flow = (typeof FLOWS)[number];
type FlowRow = { flow: Flow } & Record<(typeof COUNTS)[number], number>;
type Issue = { flow: Flow; event: string; stage: string; reason: string; count: number };
export type ShotMarkerSummary = { flows: FlowRow[]; issues: Issue[] };
const object = (value: unknown): value is Record<string, unknown> => typeof value === "object" && value !== null && !Array.isArray(value);
const exact = (value: Record<string, unknown>, keys: string[]) => Object.keys(value).length === keys.length && keys.every((key) => Object.hasOwn(value, key));
const count = (value: unknown): value is number => typeof value === "number" && Number.isSafeInteger(value) && value >= 0;
const invalid = (): never => { throw new Error("invalid_response"); };
export const parseShotMarker = (value: unknown): ShotMarkerSummary => {
  if (!object(value) || !exact(value, ["flows", "issues"]) || !Array.isArray(value.flows) || value.flows.length !== 3 || !Array.isArray(value.issues)) return invalid();
  const flows = value.flows.map((row, index) => {
    if (!object(row) || !exact(row, ["flow", ...COUNTS]) || row.flow !== FLOWS[index] || !COUNTS.every((key) => count(row[key]))) return invalid();
    return row as FlowRow;
  });
  const issues = value.issues.map((issue) => {
    if (!object(issue) || !exact(issue, ["flow", "event", "stage", "reason", "count"]) || !FLOWS.includes(issue.flow as Flow) || !count(issue.count) || !STAGES.includes(issue.stage as string) || !REASONS.includes(issue.reason as string)) return invalid();
    const allowedEvents = [`${issue.flow}_failed`, ...(issue.flow === "training_sync" ? ["training_sync_ack_failed"] : []), ...(issue.flow === "highlight_save" ? ["highlight_save_state_failed"] : [])];
    if (!allowedEvents.includes(issue.event as string)) return invalid();
    return issue as Issue;
  });
  return { flows, issues };
};
export const buildShotMarkerUrl = (query: TrackTrendQuery) => {
  const params = new URLSearchParams({ days: String(query.days), audience: query.audience ?? "production" });
  if (query.version) params.set("version", query.version);
  return `/api/track/shotmarker?${params.toString()}`;
};

// Let an in-flight scan finish before the next request: the Backend has one shared slot.
let requestQueue: Promise<unknown> = Promise.resolve();
export const loadAnalytics = (query: TrackTrendQuery, fetcher: typeof fetch = fetch, isActive = () => true) => {
  const task = requestQueue.then(async () => {
    if (!isActive()) return null;
    const trend = await fetchTrackTrend(query, fetcher);
    if (!isActive()) return null;
    let steps: ShotMarkerSummary | null = null;
    if (query.project === "shotmarker") {
      const response = await fetcher(buildShotMarkerUrl(query), { cache: "no-store", headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("request_failed");
      steps = parseShotMarker(await response.json());
    }
    return isActive() ? { trend, steps } : null;
  });
  requestQueue = task.catch(() => undefined);
  return task;
};

