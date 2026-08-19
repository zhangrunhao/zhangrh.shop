import test from "node:test";
import assert from "node:assert/strict";
import {
  CONTACT_EMAIL,
  HOW_TO_PATH,
  LAST_UPDATED,
  PRIVACY_PATH,
  SUPPORT_PATH,
  howToPage,
  privacyPage,
  supportPage,
  type ContentBlock,
  type ShotMarkerPage,
} from "./content";

const OLD_PROJECT_SLUG = "shot" + "maker";

const blockText = (block: ContentBlock) =>
  block.kind === "list" ? block.items.join("\n") : block.text;

const pageText = (page: ShotMarkerPage) =>
  [
    page.title,
    page.description,
    page.muted,
    page.summary,
    page.summaryZh,
    ...page.sections.flatMap((section) => [
      section.title,
      ...section.blocks.map(blockText),
    ]),
  ]
    .filter(Boolean)
    .join("\n");

test("privacy page keeps its local-first summary without hiding remote diagnostics", () => {
  const text = pageText(privacyPage);

  assert.equal(privacyPage.title, "ShotMarker Privacy Policy");
  assert.match(text, /does not require an account/);
  assert.match(text, /does not show ads/);
  assert.match(text, /does not use third-party product analytics services/);
  assert.match(text, /uses the Sentry SDK to connect to a developer-operated GlitchTip service/);
  assert.match(text, /does not upload your videos/);
  assert.match(text, /does not upload your training records/);
  assert.doesNotMatch(text, /does not use third-party analytics SDKs/);
  assert.match(
    text,
    /当前版本不需要账号，不展示广告，不使用第三方产品分析服务/,
  );
  assert.match(
    text,
    /使用 Sentry SDK 连接开发者运营的 GlitchTip 服务/,
  );
  assert.doesNotMatch(text, /不使用第三方分析 SDK/);
  assert.match(text, /WatchConnectivity/);
  assert.match(text, /HealthKit/);
});

test("privacy page separates analytics, remote crash reporting, and local diagnostics", () => {
  const text = pageText(privacyPage);

  for (const phrase of [
    "First-Party Product Analytics",
    "Crash and Error Reporting",
    "Local Diagnostic Logs",
    "第一方产品分析",
    "崩溃与错误上报",
    "本地诊断日志",
    "Sentry SDK",
    "GlitchTip",
    "uncaught crashes",
    "未捕获崩溃",
  ]) {
    assert.match(text, new RegExp(phrase));
  }

  assert.match(text, /iOS app has a valid DSN/);
  assert.match(text, /iOS App 配置了有效 DSN/);
  assert.match(text, /trimmed subset of \.error events/);
  assert.match(text, /\.error 事件的精简子集/);
  assert.match(
    text,
    /ShotMarker supplies a fixed message, error name and category, timestamp, and optional error domain and code/,
  );
  assert.match(
    text,
    /ShotMarker 提供固定消息、错误名称和分类、时间，以及可选的 error domain 和 code/,
  );
  assert.match(text, /Watch app does not use this reporting path/);
  assert.match(text, /Watch App 不使用这条上报链路/);
  assert.match(
    text,
    /does not copy AppLogEvent context, training IDs, job IDs, video IDs, file paths, or original error descriptions/,
  );
  assert.match(
    text,
    /不会复制 AppLogEvent context、训练 ID、任务 ID、视频 ID、文件路径或原始错误描述/,
  );
  assert.match(text, /Sentry Cocoa 9\.26\.0 may add/i);
  assert.match(text, /Sentry Cocoa 9\.26\.0 可能补充/);
  assert.match(
    text,
    /release, build, environment, SDK metadata, a current-thread stack and debug image data, and app, device, operating system, locale, and current-view context/,
  );
  assert.match(
    text,
    /release、build、environment、SDK 元数据、当前线程栈与调试镜像数据，以及 App、设备、操作系统、语言区域和当前视图上下文/,
  );
  assert.match(text, /installation-scoped Sentry user ID/);
  assert.match(text, /安装范围的 Sentry user ID/);
  assert.match(text, /separate from the 12-character first-party analytics identifier/);
  assert.match(text, /与第一方分析使用的 12 位安装标识不同/);
  assert.match(text, /sendDefaultPii to false/);
  assert.match(text, /sendDefaultPii 设为 false/);
  assert.match(text, /source IP address to the receiving network infrastructure/);
  assert.match(text, /请求源 IP 地址/);
  assert.match(text, /Whether the current GlitchTip deployment retains that address has not been independently verified/);
  assert.match(text, /当前 GlitchTip 部署是否保留该地址尚未独立核验/);
  assert.doesNotMatch(text, /contains only a fixed message/);
  assert.doesNotMatch(text, /自动发送的精简错误只包含/);
  assert.doesNotMatch(text, /does not configure user identity or default PII/);
  assert.doesNotMatch(text, /不配置用户身份或默认 PII/);
  assert.match(
    text,
    /does not attach training records, videos, screenshots, or complete local log files/,
  );
  assert.match(
    text,
    /performance tracing, profiling, Session Replay, automatic session tracking, network tracing, and automatic breadcrumbs are disabled/i,
  );
  assert.match(
    text,
    /性能追踪、Profiling、Session Replay、自动 Session Tracking、网络追踪和自动 Breadcrumb 均已关闭/,
  );

  assert.match(
    text,
    /native crash reports may include a crash stack and similar SDK-supplied technical context/i,
  );
  assert.match(
    text,
    /原生崩溃报告可能包含崩溃堆栈和相似的 SDK 技术环境/,
  );
  assert.doesNotMatch(
    text,
    /native crash reports do not include a device model or operating system version/,
  );

  assert.match(
    text,
    /full JSONL logs and iPhone-side WatchConnectivity diagnostics stay on the iPhone unless you export and share them/,
  );
  assert.match(
    text,
    /完整 JSONL 日志和 iPhone 侧 WatchConnectivity 诊断会保留在本机，除非你主动导出并分享/,
  );
  assert.match(text, /A trimmed subset of \.error events may be sent automatically/);
  assert.match(text, /\.error 事件的精简子集可能自动发送/);
  assert.doesNotMatch(
    text,
    /The developer can only access diagnostic logs if you explicitly export and share them/,
  );
  assert.doesNotMatch(text, /只有你主动导出并分享后，开发者才会看到诊断日志/);
});

test("privacy page documents highlight job and deletion boundaries", () => {
  const text = pageText(privacyPage);

  for (const phrase of [
    "training snapshot",
    "video local identifier",
    "required input copy",
    "local output video",
    "photo library",
    "Apple Health",
    "训练快照",
    "视频本地标识",
    "必要输入副本",
    "本地输出视频",
    "系统照片库",
  ]) {
    assert.match(text, new RegExp(phrase));
  }

  assert.match(
    text,
    /Cancelling or deleting a highlight job removes its corresponding job files/,
  );
  assert.match(text, /取消或删除集锦任务会移除对应任务文件/);
  assert.match(
    text,
    /Deleting the app removes data in the app sandbox and UserDefaults/,
  );
  assert.match(text, /删除 App 会移除 App 沙盒和 UserDefaults 中的数据/);
  assert.match(
    text,
    /Uninstalling ShotMarker does not delete videos already in the photo library or workouts already saved in Apple Health/,
  );
  assert.match(
    text,
    /卸载 ShotMarker 不会删除系统照片库中的视频，也不等于删除 Apple Health 中已保存的 workout/,
  );
  assert.match(text, /cleanup is applied when a diagnostic export is prepared/);
  assert.match(text, /准备诊断导出时执行配置清理/);
  assert.doesNotMatch(
    text,
    /automatically rotated and removed according to the app's local retention policy/,
  );
  assert.doesNotMatch(text, /诊断日志会根据 App 的本地保留策略自动滚动和删除/);
});

test("privacy page documents the first-party analytics contract", () => {
  const text = pageText(privacyPage);

  assert.equal(privacyPage.muted, "Effective date: August 19, 2026");
  assert.equal(LAST_UPDATED, "2026-08-19");
  assert.match(text, /random 12-character installation identifier/);
  assert.match(
    text,
    /The four fixed event names are app_launch, training_sync_succeeded, highlight_generate_succeeded, and highlight_save_succeeded/,
  );
  assert.match(text, /does not have a fixed automatic expiration period/);
  assert.match(text, /does not immediately delete prior server events/);
  assert.match(text, /not used for advertising or cross-company tracking/);
  assert.match(
    text,
    /events do not contain training records, marker timestamps, videos, HealthKit data, or diagnostic logs/,
  );
  assert.match(
    text,
    /Only Release builds of the ShotMarker iPhone app send first-party product analytics events/,
  );
  assert.match(
    text,
    /The iPhone app sends only the project value shotmarker, the event name, and a random 12-character installation identifier stored in UserDefaults/,
  );
  assert.match(
    text,
    /When the server writes the event, it adds its ISO 8601 receipt time/,
  );
  assert.match(text, /The stored record contains only project, event, time, and device_id/);
  assert.match(text, /used to estimate daily unique installations/);
  assert.doesNotMatch(
    text,
    /client time|empty parameter object|schema_version|request_id/,
  );
  assert.match(
    text,
    /do not include an advertising identifier, device model, or operating system version/,
  );
  assert.match(text, /used only for first-party product analytics/);
  assert.match(text, /not shared with third-party analytics providers/);
  assert.match(text, /single append-only events\.jsonl file/);
  assert.match(
    text,
    /if it exceeds the Backend's 64 MiB current-file read limit, aggregate trends remain unavailable until a new storage mechanism is deployed/,
  );
  assert.match(
    text,
    /Uninstalling and reinstalling ShotMarker resets the local installation identifier/,
  );
  assert.match(text, /Public aggregate queries do not return raw installation identifiers/);

  assert.match(
    text,
    /仅 ShotMarker iPhone App 的 Release 构建会向开发者自己的 HTTPS 端点发送第一方产品分析事件/,
  );
  assert.match(
    text,
    /四个固定事件名为 app_launch、training_sync_succeeded、highlight_generate_succeeded 和 highlight_save_succeeded/,
  );
  assert.match(
    text,
    /iPhone App 只发送 project 值 shotmarker、事件名，以及保存在 UserDefaults 中的随机 12 位安装标识符/,
  );
  assert.match(
    text,
    /服务器写入事件时添加 ISO 8601 接收时间；保存的记录只包含 project、event、time 和 device_id/,
  );
  assert.match(text, /用于估算每日独立安装数量/);
  assert.doesNotMatch(text, /客户端时间|空参数对象|schema v1|32 位十六进制/);
  assert.match(
    text,
    /这些分析事件不包含训练记录、打点时间戳、视频、HealthKit 数据或诊断日志，也不包含广告标识符、设备型号或操作系统版本/,
  );
  assert.match(
    text,
    /数据仅用于第一方产品分析，不用于广告或跨公司跟踪，也不会共享给第三方分析服务商/,
  );
  assert.match(
    text,
    /第一方分析事件会保留在开发者服务器上的单一追加写入 events\.jsonl 文件中/,
  );
  assert.match(text, /该文件没有固定的自动过期周期/);
  assert.match(
    text,
    /若超过 Backend 的 64 MiB 当前文件读取上限，聚合趋势会保持不可用，直到新的存储机制部署完成/,
  );
  assert.match(
    text,
    /卸载并重新安装 ShotMarker 会重置本地安装标识符，但不会立即删除此前的服务器事件/,
  );
  assert.match(text, /公开聚合查询不会返回原始安装标识符/);
});

test("support page contains the provided FAQ and contact details", () => {
  const text = pageText(supportPage);

  assert.equal(supportPage.title, "ShotMarker Support");
  assert.match(text, /Apple Watch markers did not sync/);
  assert.match(text, /Why did iCloud video loading fail/);
  assert.match(text, /Does ShotMarker upload my videos/);
  assert.match(text, /export diagnostic logs/);
  assert.match(text, new RegExp(CONTACT_EMAIL));
});

test("support page documents the current diagnostic export flow", () => {
  const text = pageText(supportPage);

  assert.match(
    text,
    /press and hold the centered “训练记录” navigation title for 5 seconds/i,
  );
  assert.match(text, /长按页面中央导航标题“训练记录”5 秒/);
  assert.match(text, /choose “导出” in the “是否导出诊断日志？” prompt/i);
  assert.match(text, /在“是否导出诊断日志？”提示中选择“导出”/);
  assert.match(text, /system share sheet/);
  assert.match(text, /系统分享面板/);
  assert.match(
    text,
    /top-right down and up arrows import and export training records; they do not export diagnostic logs/,
  );
  assert.match(
    text,
    /右上角向下和向上箭头用于导入和导出训练记录，不是诊断日志入口/,
  );
  assert.match(text, /automatic trimmed GlitchTip errors are a separate path/i);
  assert.match(text, /自动发送的 GlitchTip 精简错误属于另一条链路/);
  assert.doesNotMatch(text, /Tap the export button in the top-right corner of the home screen/);
  assert.doesNotMatch(text, /首页点击右上角导出按钮即可导出诊断日志/);
});

test("support page prioritizes in-app iCloud video preparation", () => {
  const text = pageText(supportPage);

  for (const phrase of [
    "未下载或未准备好",
    "下载或准备视频？",
    "preparation progress",
    "pause",
    "start preparation again",
    "准备进度",
    "暂停",
    "重新开始准备",
  ]) {
    assert.match(text, new RegExp(phrase, "i"));
  }

  assert.match(text, /may use network data/);
  assert.match(text, /可能使用网络流量/);
  assert.match(text, /confirm that the network is available and try again/);
  assert.match(text, /确认网络可用后重试/);
  assert.match(
    text,
    /open and fully play the original in Photos as an additional troubleshooting step/,
  );
  assert.match(text, /在照片 App 中打开并完整播放原视频作为补充排障/);
});

test("how-to page contains the core Chinese usage flow", () => {
  const text = pageText(howToPage);

  assert.equal(howToPage.title, "ShotMarker 使用说明");
  assert.match(text, /用 Apple Watch 给好球打点/);
  assert.match(text, /打开 iPhone 里的训练记录/);
  assert.match(text, /选择视频，生成集锦/);
  assert.match(text, /双击按钮或转动数码表冠/);
});

test("how-to page documents persistent highlight jobs and launch recovery", () => {
  const text = pageText(howToPage);

  for (const phrase of [
    "持久化队列任务",
    "返回首页",
    "集锦任务",
    "排队",
    "处理中",
    "完成",
    "失败",
    "中断",
    "播放",
    "保存到系统相册",
    "删除任务",
    "重新开始",
    "取消",
  ]) {
    assert.match(text, new RegExp(phrase));
  }

  assert.match(text, /保存到相册和生成完成是两个独立动作/);
  assert.match(text, /遗留的排队、运行或保存中任务会标记为中断/);
  assert.match(text, /不保证退出 App 或锁屏后仍由系统后台持续运行/);
  assert.doesNotMatch(text, /退出 App 后会继续在后台生成/);
});

test("public links use the production shotmarker route", () => {
  assert.equal(SUPPORT_PATH, "/shotmarker/support");
  assert.equal(PRIVACY_PATH, "/shotmarker/privacy");
  assert.equal(HOW_TO_PATH, "/shotmarker/how-to");
  assert.match(blockText(supportPage.sections[2].blocks[0]), /\/shotmarker\/privacy/);
  assert.match(
    blockText(privacyPage.sections.at(-1)?.blocks[1] ?? { kind: "paragraph", text: "" }),
    /\/shotmarker\/support/,
  );
  assert.doesNotMatch(blockText(supportPage.sections[2].blocks[0]), new RegExp(OLD_PROJECT_SLUG));
  assert.doesNotMatch(
    blockText(privacyPage.sections.at(-1)?.blocks[1] ?? { kind: "paragraph", text: "" }),
    new RegExp(OLD_PROJECT_SLUG),
  );
});
