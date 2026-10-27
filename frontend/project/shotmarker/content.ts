export const APP_NAME = "ShotMarker";
export const CONTACT_EMAIL = "zhangrhweb@gmail.com";
export const SUPPORT_PATH = "/shotmarker/support";
export const PRIVACY_PATH = "/shotmarker/privacy";
export const HOW_TO_PATH = "/shotmarker/how-to";
export const ZHANGRH_SHOP_URL = "https://zhangrh.shop/hub/";
export const EFFECTIVE_DATE = "August 19, 2026";
export const LAST_UPDATED = "2026-10-27";
export const DEVELOPER = "Rain / ShotMarker";
export const VERSION_NOTICE = "以下介绍适用于 ShotMarker 1.3；具体可用版本以 App Store 为准。";
export const UPGRADE_NOTICE_ZH = "升级到 1.3 后首次启动，会清理 iPhone 和 Apple Watch 中 ShotMarker 的旧训练与打点、集锦任务、片段确认、App 内视频副本和成片、待同步数据、缓存、日志及设置，不提供自动迁移。请在升级前将需要保留的成片保存到系统相册。系统照片库、HealthKit 数据和 App 外导出文件不受影响；此后创建的新数据正常保留。";
export const UPGRADE_NOTICE_EN = "On first launch after upgrading to 1.3, ShotMarker clears old local training records and markers, highlight tasks, clip reviews, in-app video copies and highlights, pending sync data, caches, logs, and settings on iPhone and Apple Watch. There is no automatic migration. Before updating, save any highlights you want to keep to Photos. Your system photo library, HealthKit data, and files exported outside the app are not affected. New data is retained on subsequent launches.";

export type HowToRelatedLink = {
  title: string;
  description: string;
  href: string;
};

export const HOW_TO_RELATED_LINKS: readonly HowToRelatedLink[] = [
  {
    title: "ShotMarker Support",
    description: "获取使用帮助、反馈问题。",
    href: SUPPORT_PATH,
  },
  {
    title: "Privacy Policy",
    description: "查看 ShotMarker 隐私政策。",
    href: PRIVACY_PATH,
  },
  {
    title: "zhangrh.shop",
    description: "返回 zhangrh.shop 作品主页。",
    href: ZHANGRH_SHOP_URL,
  },
];

export type ContentBlock =
  | { kind: "paragraph"; text: string; className?: string }
  | { kind: "heading"; text: string }
  | { kind: "list"; items: string[] }
  | {
      kind: "email";
      text: string;
      email: string;
      prefix?: string;
      suffix?: string;
      className?: string;
    }
  | {
      kind: "internalLink";
      text: string;
      href: string;
      label: string;
      prefix: string;
      suffix?: string;
      className?: string;
    };

export type ContentSection = {
  id: string;
  title: string;
  blocks: ContentBlock[];
};

export type ShotMarkerPage = {
  title: string;
  description: string;
  muted?: string;
  summary?: string;
  summaryZh?: string;
  sections: ContentSection[];
};

export const howToPage: ShotMarkerPage = {
  title: "ShotMarker 使用说明",
  description: "ShotMarker 1.3：Apple Watch 训练打点，iPhone 逐片段预览和调整，保存可继续编辑的集锦任务。",
  muted: "Apple Watch + iPhone · 1.3 使用说明",
  summary: "记下好球，逐段调整，留下自己的训练集锦。",
  summaryZh: "手表打点 → 选择训练视频 → 审核片段并生成。任务可以保存，之后继续编辑。",
  sections: [
    {
      id: "watch-markers",
      title: "用 Apple Watch 给好球打点",
      blocks: [
        {
          kind: "paragraph",
          text: "长按开始训练。看到想保留的投篮，双击按钮或转动数码表冠。结束时再长按。",
        },
      ],
    },
    {
      id: "iphone-record",
      title: "打开 iPhone 里的训练记录",
      blocks: [
        {
          kind: "paragraph",
          text: "训练结束后，记录会同步到 iPhone。找到对应日期和时间，点进这次训练，选择拍摄时间覆盖打点的视频。可以选择多个视频，并调整视频顺序。",
        },
        {
          kind: "paragraph",
          text: "设置默认剪辑时长，展开“样式调整”，预览并调整片段序数的位置、字号、文字和背景透明度。点击“下一步：审核片段”后，App 会保存一个独立的集锦任务。",
        },
      ],
    },
    {
      id: "generate-highlight",
      title: "审核片段，生成集锦",
      blocks: [
        {
          kind: "paragraph",
          text: "在片段图集中查看自动匹配的结果。可以直接使用默认范围，也可以预览每个片段、调整起止时间，确认保留或排除；确认后会继续打开后续尚未确认的片段。",
        },
        {
          kind: "paragraph",
          text: "点“生成视频”后返回首页，任务会排队并依次生成。请保持 App 在前台；进入后台会停止生成，稍后可手动重新生成，不会自动继续。生成完成后可以播放，或保存到系统相册。保存到相册和生成完成是两个独立动作。",
        },
        {
          kind: "paragraph",
          text: "从首页重新打开“集锦任务”，可以继续调整视频、默认时长、序数样式和片段。停止、生成失败或退出审核都不会删除任务；已有成片会保留，重新生成成功后才替换。",
        },
        {
          kind: "paragraph",
          text: "修改后出现“当前成片不包含最新修改”时，播放的仍是之前的成片。重新生成后即可看到新效果。删除任务会清理任务的 App 内视频文件，不影响系统相册中已经保存的视频。",
        },
      ],
    },
    {
      id: "upgrade",
      title: "升级到 1.3 前，请先保存需要保留的成片",
      blocks: [{ kind: "paragraph", text: UPGRADE_NOTICE_ZH }],
    },
    {
      id: "tips",
      title: "使用提示",
      blocks: [
        {
          kind: "list",
          items: [
            "视频要对得上训练时间，应用会按时间自动匹配打点。",
            "默认保留打点前 9 秒、打点后 4 秒，剪辑范围可以调整。",
            "可以使用默认片段直接生成，也可以逐段调整起止时间、确认保留或排除。",
            "序数标识的位置、字号、文字与背景透明度都可以调整。",
            "任务保存后可随时继续编辑；修改期间保留旧成片，重新生成成功后再替换。",
            "生成时保持 App 在前台；进入后台会停止，之后需要手动重新生成。",
          ],
        },
      ],
    },
  ],
};

export const privacyPage: ShotMarkerPage = {
  title: "ShotMarker Privacy Policy",
  description: "Privacy Policy for ShotMarker.",
  muted: `Effective date: ${EFFECTIVE_DATE}`,
  summary:
    "ShotMarker is designed as a local-first training tool. The current version does not require an account, does not show ads, does not use third-party product analytics services, and does not upload your videos or training records to the developer's server. It uses the Sentry SDK to connect to a developer-operated GlitchTip service for crash and error reporting.",
  summaryZh:
    "ShotMarker 是一个本地优先的训练工具。当前版本不需要账号，不展示广告，不使用第三方产品分析服务，也不会把你的视频或训练记录上传到开发者服务器。App 使用 Sentry SDK 连接开发者运营的 GlitchTip 服务，用于崩溃与错误上报。",
  sections: [
    {
      id: "scope",
      title: "What This Policy Covers",
      blocks: [
        {
          kind: "paragraph",
          text: "This policy explains how the current version of ShotMarker processes training markers, selected videos, HealthKit workout permission, WatchConnectivity sync data, first-party product analytics, crash and error reports, and local diagnostic logs.",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "本政策说明当前版本的 ShotMarker 如何处理训练打点、用户选择的视频、HealthKit 训练权限、WatchConnectivity 同步数据、第一方产品分析、崩溃与错误上报和本地诊断日志。",
        },
      ],
    },
    {
      id: "data",
      title: "Data Processed by ShotMarker",
      blocks: [
        { kind: "heading", text: "Training Session Data" },
        {
          kind: "paragraph",
          text: "ShotMarker may process training start time, training end time, Apple Watch marker timestamps, marker count, and local training session IDs. This data is used to show training sessions on iPhone, match marker times with training videos, and generate highlight clips.",
        },
        {
          kind: "paragraph",
          text: "ShotMarker stores training sessions and marker timestamps locally on your iPhone. When you use the Apple Watch app, completed training sessions are transferred from your Apple Watch to your paired iPhone using Apple's WatchConnectivity framework.",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "ShotMarker 可能会处理训练开始时间、结束时间、Apple Watch 打点时间、打点数量和本地训练记录 ID。这些数据用于在 iPhone 首页展示训练记录、匹配训练视频时间并生成集锦。使用 Apple Watch App 时，已完成的训练记录会通过 Apple 的 WatchConnectivity 框架在你的 Apple Watch 和配对 iPhone 之间同步。",
        },
        { kind: "heading", text: "Photos and Videos" },
        {
          kind: "paragraph",
          text: "ShotMarker only accesses videos that you explicitly select. The app reads video metadata such as creation time and duration, and uses the selected video content, video track, and audio track to generate highlight clips locally on your device. Your videos are not uploaded to the developer's server.",
        },
        {
          kind: "paragraph",
          text: "ShotMarker may request Photos access to read selected training videos and may request add-only Photos permission to save generated highlight clips to your photo library.",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "ShotMarker 只访问你主动选择的视频。App 会读取视频拍摄时间、视频时长、视频轨道和音频轨道等信息，并在你的设备本地生成集锦。你的视频不会上传到开发者服务器。ShotMarker 可能会请求照片读取权限以读取所选训练视频，也可能会请求仅添加照片权限以保存生成的集锦。",
        },
        { kind: "heading", text: "HealthKit and Workout Data" },
        {
          kind: "paragraph",
          text: "On Apple Watch, ShotMarker may request HealthKit workout permission to manage a workout session during training. This is used to improve the reliability of training-time marker recording on Apple Watch. ShotMarker does not upload HealthKit data to the developer's server.",
        },
        {
          kind: "paragraph",
          text: "Workout data may be stored in Apple Health according to your Health permissions and Apple system settings.",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "在 Apple Watch 上，ShotMarker 可能会请求 HealthKit 训练相关权限，用于在训练期间维持 workout session，提高打点记录的可靠性。ShotMarker 不会把 HealthKit 数据上传到开发者服务器。Workout 数据可能会根据你的健康权限和 Apple 系统设置存储在 Apple Health 中。",
        },
        { kind: "heading", text: "WatchConnectivity" },
        {
          kind: "paragraph",
          text: "ShotMarker uses Apple's WatchConnectivity framework to transfer completed training session data between your own Apple Watch and paired iPhone. This sync is used to show Watch-recorded training markers in the iPhone app.",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "ShotMarker 使用 Apple 的 WatchConnectivity 框架在你的 Apple Watch 和配对 iPhone 之间同步已完成的训练记录，用于在 iPhone App 中展示 Watch 记录的训练打点。",
        },
        { kind: "heading", text: "First-Party Product Analytics" },
        {
          kind: "paragraph",
          text: "Only Release builds of the ShotMarker iPhone app send first-party product analytics events to the developer's own HTTPS endpoint. Fixed events cover app_launch and the starts, outcomes, and diagnostics of phone-side sync, highlight generation, and saving. Success, failure, cancellation, ignored old sync data, failed acknowledgements, and failed local save-state updates are distinguished.",
        },
        {
          kind: "paragraph",
          text: "The iPhone app sends the project value shotmarker, the event name, and a random 12-character installation identifier stored in UserDefaults. When the server writes the event, it adds its ISO 8601 receipt time. The record also includes distribution, is_self_use, app_version, app_build, operation_id, stage, and reason. These fields describe the distribution channel, self-use setting, app version/build, a dedicated random operation UUID, and fixed stage/reason enums. The operation UUID is not a training, task, or video identifier; it is used only to pair analytics steps. The installation identifier is associated only with the current app installation and is used to estimate daily unique installations.",
        },
        {
          kind: "paragraph",
          text: "These analytics events do not contain training records, marker timestamps, videos, HealthKit data, or diagnostic logs. They also do not include an advertising identifier, device model, or operating system version. The data is used only for first-party product analytics; it is not used for advertising or cross-company tracking and is not shared with third-party analytics providers.",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "仅 ShotMarker iPhone App 的 Release 构建会向开发者自己的 HTTPS 端点发送第一方产品分析事件。固定事件覆盖 app_launch，以及手机侧同步、集锦生成和保存的开始、结果与附属诊断。成功、失败、取消、忽略旧同步数据、回执失败和本地保存状态更新失败分别记录。",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "iPhone App 发送 project 值 shotmarker、事件名，以及保存在 UserDefaults 中的随机 12 位安装标识符。服务器写入事件时添加 ISO 8601 接收时间；记录还包含 distribution、is_self_use、app_version、app_build、operation_id、stage 和 reason。它们表示分发渠道、自用标记、App 版本与构建号、专用随机操作 UUID，以及固定枚举的阶段与原因。操作 UUID 只用于配对分析步骤，不使用训练、任务或视频标识。该标识符只与当前 App 安装相关，用于估算每日独立安装数量。",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "这些分析事件不包含训练记录、打点时间戳、视频、HealthKit 数据或诊断日志，也不包含广告标识符、设备型号或操作系统版本。数据仅用于第一方产品分析，不用于广告或跨公司跟踪，也不会共享给第三方分析服务商。",
        },
        { kind: "heading", text: "Crash and Error Reporting" },
        {
          kind: "paragraph",
          text: "When the iOS app has a valid DSN, it uses the Sentry SDK to send uncaught crashes and a trimmed subset of .error events to a developer-operated GlitchTip service. The Watch app does not use this reporting path.",
        },
        {
          kind: "paragraph",
          text: "For a trimmed .error event, ShotMarker supplies a fixed message, error name and category, timestamp, and optional error domain and code. It does not copy AppLogEvent context, training IDs, job IDs, video IDs, file paths, or original error descriptions into that event.",
        },
        {
          kind: "paragraph",
          text: "Before sending, Sentry Cocoa 9.26.0 may add release, build, environment, SDK metadata, a current-thread stack and debug image data, and app, device, operating system, locale, and current-view context to the trimmed .error event. Native crash reports may include a crash stack and similar SDK-supplied technical context.",
        },
        {
          kind: "paragraph",
          text: "ShotMarker sets sendDefaultPii to false and does not set an account identity. In this SDK version, however, error and crash events still receive an installation-scoped Sentry user ID, separate from the 12-character first-party analytics identifier. ShotMarker does not attach training records, videos, screenshots, or complete local log files.",
        },
        {
          kind: "paragraph",
          text: "The HTTPS connection exposes the request's source IP address to the receiving network infrastructure. Whether the current GlitchTip deployment retains that address has not been independently verified.",
        },
        {
          kind: "paragraph",
          text: "Performance tracing, profiling, Session Replay, automatic session tracking, network tracing, and automatic breadcrumbs are disabled. These reports are used for fault diagnosis; no fixed GlitchTip retention period is stated here because the current hosted retention has not been independently verified.",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "崩溃与错误上报：当 iOS App 配置了有效 DSN 时，会使用 Sentry SDK 向开发者运营的 GlitchTip 服务发送未捕获崩溃和 .error 事件的精简子集；Watch App 不使用这条上报链路。",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "对于精简 .error 事件，ShotMarker 提供固定消息、错误名称和分类、时间，以及可选的 error domain 和 code；不会复制 AppLogEvent context、训练 ID、任务 ID、视频 ID、文件路径或原始错误描述。",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "发送前，Sentry Cocoa 9.26.0 可能补充 release、build、environment、SDK 元数据、当前线程栈与调试镜像数据，以及 App、设备、操作系统、语言区域和当前视图上下文。原生崩溃报告可能包含崩溃堆栈和相似的 SDK 技术环境。",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "ShotMarker 将 sendDefaultPii 设为 false，也不会设置账号身份；但在这个 SDK 版本中，错误与崩溃事件仍会获得安装范围的 Sentry user ID，它与第一方分析使用的 12 位安装标识不同。ShotMarker 不会附加训练记录、视频、截图或完整本地日志文件。",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "HTTPS 连接会向接收网络基础设施暴露请求源 IP 地址；当前 GlitchTip 部署是否保留该地址尚未独立核验。",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "性能追踪、Profiling、Session Replay、自动 Session Tracking、网络追踪和自动 Breadcrumb 均已关闭。这些报告只用于故障诊断；由于当前托管保留状态尚未独立核验，本政策不声明固定的 GlitchTip 保留周期。",
        },
        { kind: "heading", text: "Local Diagnostic Logs" },
        {
          kind: "paragraph",
          text: "ShotMarker writes complete JSONL diagnostic logs by day on your iPhone and keeps iPhone-side WatchConnectivity diagnostics locally. These logs may contain app and sync status, video and export status, Photos save errors, app and device information, local identifiers, context, and original error details needed for troubleshooting.",
        },
        {
          kind: "paragraph",
          text: "The full JSONL logs and iPhone-side WatchConnectivity diagnostics stay on the iPhone unless you export and share them through the system share sheet. A trimmed subset of .error events may be sent automatically through the separate GlitchTip path described above.",
        },
        {
          kind: "paragraph",
          text: "Local logs are written by day. After normal log writes and when a diagnostic export is prepared, cleanup removes expired or oldest log files according to a 14-day retention window and a 30 MiB total-size limit. Deleting the app removes these local log files.",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "本地诊断日志：ShotMarker 会在 iPhone 上按日写入完整 JSONL 诊断日志，并在本地保存 iPhone 侧 WatchConnectivity 诊断。这些内容可能包含 App 与同步状态、视频与导出状态、相册保存错误、App 与设备信息、本地标识、context 和排障所需的原始错误详情。",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "完整 JSONL 日志和 iPhone 侧 WatchConnectivity 诊断会保留在本机，除非你主动导出并分享；.error 事件的精简子集可能自动发送，并属于上文独立的 GlitchTip 链路。",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "本地日志按日写入。正常写入日志后，以及准备诊断导出时，会按日志日期删除过期或最早的文件，执行 14 天保留窗口和 30 MiB 总量上限；删除 App 会移除这些本地日志文件。",
        },
      ],
    },
    {
      id: "not-used",
      title: "What ShotMarker Does Not Do in the Current Version",
      blocks: [
        {
          kind: "list",
          items: [
            "ShotMarker does not require user accounts.",
            "ShotMarker does not upload your videos to the developer's server.",
            "ShotMarker does not upload your training records to the developer's server.",
            "ShotMarker does not sell personal data.",
            "ShotMarker does not use advertising tracking.",
            "ShotMarker does not use third-party product analytics services. The Sentry SDK is used only with the developer-operated GlitchTip crash and error reporting service described above.",
          ],
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "当前版本的 ShotMarker 不需要用户账号，不会把你的视频或训练记录上传到开发者服务器，不出售个人数据，不使用广告跟踪，也不使用第三方产品分析服务。Sentry SDK 只用于连接上文所述、由开发者运营的 GlitchTip 崩溃与错误上报服务。",
        },
      ],
    },
    {
      id: "retention",
      title: "Data Retention and Deletion",
      blocks: [
        {
          kind: "paragraph",
          text: "Training sessions, clip settings, Watch sync outbox data, the installation identifier, and local diagnostic logs are stored on your devices. A saved highlight task also stores a training snapshot, video local identifier, selected video order, label style, clip ranges and keep/exclude decisions, generation status, error state, and output path.",
        },
        {
          kind: "paragraph",
          text: "When PhotosPicker cannot keep a reusable photo-library reference, ShotMarker stores a required input copy in the app sandbox for the saved task. Stopping generation keeps the task and any existing local output video. Editing a task keeps the previous output until a replacement is generated successfully. Deleting a highlight task removes its corresponding task files. Deleting the app removes data in the app sandbox and UserDefaults.",
        },
        {
          kind: "paragraph",
          text: "Original photo-library videos and highlights you manually save to the photo library are managed by Photos. Deleting a job or uninstalling ShotMarker does not remove that photo-library content. HealthKit workouts are managed by Apple Health and system permissions. Uninstalling ShotMarker does not delete videos already in the photo library or workouts already saved in Apple Health.",
        },
        {
          kind: "paragraph",
          text: "Local diagnostic logs are written by day. After normal log writes and when a diagnostic export is prepared, cleanup removes expired or oldest log files according to a 14-day retention window and a 30 MiB total-size limit.",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "训练记录、剪辑设置、Watch 同步 outbox、安装标识和本地诊断日志保存在设备上。集锦任务还会保存训练快照、视频本地标识与顺序、序数样式、片段范围及保留/排除决定、生成状态、错误状态和输出路径。",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "当 PhotosPicker 无法保持可复用的照片库引用时，ShotMarker 会为任务在 App 沙盒保存必要输入副本。停止生成会保留任务和已有本地输出视频；编辑任务时保留旧成片，重新生成成功后才替换。删除集锦任务会移除对应任务文件；删除 App 会移除 App 沙盒和 UserDefaults 中的数据。",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "原始照片库视频和手动保存到系统照片库的集锦由照片 App 管理，删除任务或卸载 ShotMarker 不会自动删除这些内容。HealthKit workout 由 Apple Health 和系统权限管理；卸载 ShotMarker 不会删除系统照片库中的视频，也不等于删除 Apple Health 中已保存的 workout。",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "本地诊断日志按日写入。正常写入日志后，以及准备诊断导出时，会按日志日期删除过期或最早的文件，执行 14 天保留窗口和 30 MiB 总量上限。",
        },
        {
          kind: "paragraph",
          text: "First-party analytics events are retained on the developer's server in a single append-only events.jsonl file. This file does not have a fixed automatic expiration period. The storage design will be re-evaluated when the file reaches 32 MiB; if it exceeds the Backend's 64 MiB current-file read limit, aggregate trends remain unavailable until a new storage mechanism is deployed.",
        },
        {
          kind: "paragraph",
          text: "Uninstalling and reinstalling ShotMarker resets the local installation identifier, but does not immediately delete prior server events. Public aggregate queries do not return raw installation identifiers or operation UUIDs.",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "第一方分析事件会保留在开发者服务器上的单一追加写入 events.jsonl 文件中。该文件没有固定的自动过期周期。文件达到 32 MiB 时会重新评估存储方案；若超过 Backend 的 64 MiB 当前文件读取上限，聚合趋势会保持不可用，直到新的存储机制部署完成。",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "卸载并重新安装 ShotMarker 会重置本地安装标识符，但不会立即删除此前的服务器事件。公开聚合查询不会返回原始安装标识符或操作 UUID。",
        },
      ],
    },
    {
      id: "version-1-3-upgrade",
      title: "Version 1.3 Local Data Upgrade / 1.3 本地数据升级",
      blocks: [
        { kind: "paragraph", text: UPGRADE_NOTICE_EN },
        { kind: "paragraph", text: "This reset also prevents pre-upgrade Watch records from being imported again. New training sessions can sync normally. The reset does not delete prior server analytics or diagnostic reports." },
        { kind: "paragraph", className: "language-block", text: UPGRADE_NOTICE_ZH },
        { kind: "paragraph", className: "language-block", text: "升级清理也会阻止旧 Watch 记录再次导入；新训练可以正常同步。本地清理不会删除此前服务器上的分析事件或诊断报告。" },
      ],
    },
    {
      id: "permissions",
      title: "Permissions",
      blocks: [
        {
          kind: "paragraph",
          text: "You can manage Photos permissions in the iOS Settings app. You can manage Health permissions in iOS Settings or in the Apple Health app.",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "你可以在 iOS 设置中管理照片权限，也可以在 iOS 设置或 Apple Health App 中管理健康权限。",
        },
      ],
    },
    {
      id: "sharing",
      title: "Third-Party Sharing",
      blocks: [
        {
          kind: "paragraph",
          text: "ShotMarker does not share your personal data with advertisers or third-party product analytics providers. Crash and error reports use the Sentry SDK to reach the developer-operated GlitchTip service described above. If you export complete diagnostic logs and send them to the developer, they are used only to troubleshoot your support request.",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "ShotMarker 不会向广告商或第三方产品分析服务共享你的个人数据。崩溃与错误报告通过 Sentry SDK 发送到上文所述、由开发者运营的 GlitchTip 服务。如果你主动导出完整诊断日志并发送给开发者，这些日志只会用于处理你的支持请求。",
        },
      ],
    },
    {
      id: "children",
      title: "Children's Privacy",
      blocks: [
        { kind: "paragraph", text: "ShotMarker is not specifically directed to children." },
        {
          kind: "paragraph",
          className: "language-block",
          text: "ShotMarker 并非专门面向儿童设计。",
        },
      ],
    },
    {
      id: "updates",
      title: "Policy Updates",
      blocks: [
        {
          kind: "paragraph",
          text: "This Privacy Policy may be updated when ShotMarker's features or data practices change. The last-updated date is shown below. The October 27, 2026 update describes first-party analytics for distribution channel, self-use, app version/build, and phone-side operation steps and outcomes.",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "如果 ShotMarker 的功能或数据实践发生变化，本隐私政策会相应更新，并在页尾标明最后更新日期。2026 年 10 月 27 日的更新补充分发渠道、自用标记、App 版本与构建号，以及手机侧操作步骤和结果的第一方分析采集说明。",
        },
      ],
    },
    {
      id: "contact",
      title: "Contact",
      blocks: [
        {
          kind: "email",
          text: `If you have questions about this Privacy Policy or need support, contact ${CONTACT_EMAIL}.`,
          prefix: "If you have questions about this Privacy Policy or need support, contact ",
          email: CONTACT_EMAIL,
          suffix: ".",
        },
        {
          kind: "internalLink",
          text: `Support page: ${SUPPORT_PATH}`,
          prefix: "Support page: ",
          label: SUPPORT_PATH,
          href: SUPPORT_PATH,
        },
        {
          kind: "email",
          className: "language-block",
          text: `如果你对本隐私政策有疑问或需要支持，请联系 ${CONTACT_EMAIL}。支持页面：${SUPPORT_PATH}`,
          prefix: "如果你对本隐私政策有疑问或需要支持，请联系 ",
          email: CONTACT_EMAIL,
          suffix: `。支持页面：${SUPPORT_PATH}`,
        },
      ],
    },
  ],
};

export const supportPage: ShotMarkerPage = {
  title: "ShotMarker Support",
  description: "Support information and FAQ for ShotMarker.",
  muted: "ShotMarker 支持 · 含 1.3 使用说明",
  summary:
    "ShotMarker helps you turn basketball training videos into highlights using Apple Watch markers. Version 1.3 adds editable tasks, clip previews and trimming, keep/exclude decisions, and customizable clip number labels. Available versions are shown in the App Store.",
  summaryZh:
    "ShotMarker 帮你用 Apple Watch 打点，把篮球训练视频整理成集锦。1.3 支持保存并继续编辑任务、逐片段预览和范围调整、保留/排除，以及自定义序数样式。具体可用版本以 App Store 为准。",
  sections: [
    {
      id: "contact",
      title: "Contact",
      blocks: [
        {
          kind: "paragraph",
          text: "For help, bug reports, feature requests, or App Store support questions, contact:",
        },
        { kind: "email", className: "contact", text: CONTACT_EMAIL, email: CONTACT_EMAIL },
        {
          kind: "paragraph",
          className: "language-block",
          text: "如需帮助、反馈问题或提出功能建议，请发送邮件到上方邮箱。",
        },
      ],
    },
    {
      id: "faq",
      title: "FAQ",
      blocks: [
        { kind: "heading", text: "1. Apple Watch markers did not sync to iPhone. What should I do?" },
        {
          kind: "list",
          items: [
            "Make sure your Apple Watch and iPhone are paired.",
            "Make sure ShotMarker is installed on both devices.",
            "Open ShotMarker on iPhone, then reopen the Watch app.",
            "Keep the two devices close to each other.",
            "If the issue continues, open the ShotMarker home screen on iPhone.",
            "Press and hold the centered “训练记录” navigation title for 5 seconds.",
            "Choose “导出” in the “是否导出诊断日志？” prompt.",
            "Use the system share sheet to decide whether to send the generated diagnostic file to support.",
          ],
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "如果 Apple Watch 打点没有同步到 iPhone，请确认手表和手机已配对、两个设备都安装了 ShotMarker，并保持距离较近。仍无法同步时，在 iPhone 打开 ShotMarker 首页，长按页面中央导航标题“训练记录”5 秒，在“是否导出诊断日志？”提示中选择“导出”，再通过系统分享面板决定是否把生成的诊断文件发送给支持邮箱。",
        },
        { kind: "heading", text: "2. Why did the selected video not match any markers?" },
        {
          kind: "list",
          items: [
            "ShotMarker matches markers by comparing the video recording time with the Apple Watch marker times.",
            "The selected video must cover the time when the training markers happened.",
            "If the video is missing recording time metadata, ShotMarker may not be able to generate a highlight.",
            "Using videos recorded with the iPhone Camera app is recommended.",
          ],
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "ShotMarker 会根据视频拍摄时间和 Watch 打点时间进行匹配。视频需要覆盖打点发生的时间；如果视频缺少拍摄时间信息，可能无法生成集锦。建议使用 iPhone 原相机录制的视频。",
        },
        { kind: "heading", text: "3. Why did iCloud video loading fail?" },
        {
          kind: "list",
          items: [
            "After selecting a video, tap its card if it says “未下载或未准备好” (not downloaded or not ready).",
            "Confirm “开始” in the “下载或准备视频？” prompt. Preparation may use network data.",
            "Watch the preparation progress on the card. Tap a preparing card to pause; tap a paused card to start preparation again.",
            "If preparation fails, confirm that the network is available and try again.",
            "If the problem continues, open and fully play the original in Photos as an additional troubleshooting step, then return to ShotMarker.",
          ],
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "选择视频后，如果卡片显示“未下载或未准备好”，请点击该卡片，在“下载或准备视频？”提示中确认“开始”；这个过程可能使用网络流量。你可以在卡片查看准备进度，再次点击准备中的卡片可暂停，点击已暂停的卡片可重新开始准备。失败时先确认网络可用后重试；如果仍有问题，再在照片 App 中打开并完整播放原视频作为补充排障，然后回到 ShotMarker。",
        },
        { kind: "heading", text: "4. Why did saving the highlight clip fail?" },
        {
          kind: "list",
          items: [
            "Make sure ShotMarker is allowed to add content to your photo library.",
            "You can review Photos permissions in iOS Settings.",
            "Make sure your device has enough free storage.",
          ],
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "如果保存集锦失败，请确认已经允许 ShotMarker 添加内容到照片图库，并确认设备存储空间充足。你也可以在 iOS 设置中重新检查照片权限。",
        },
        { kind: "heading", text: "5. Does ShotMarker upload my videos?" },
        {
          kind: "paragraph",
          text: "No. In the current version, ShotMarker reads only the videos you select and uses them locally on your device to generate highlight clips. Your videos are not uploaded to the developer's server.",
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "不会。当前版本只在设备本地读取你主动选择的视频，用于生成集锦；视频不会上传到开发者服务器。",
        },
        { kind: "heading", text: "6. How do I export diagnostic logs?" },
        {
          kind: "list",
          items: [
            "Open the ShotMarker home screen on iPhone.",
            "Press and hold the centered “训练记录” navigation title for 5 seconds.",
            "Choose “导出” in the “是否导出诊断日志？” prompt.",
            "Use the system share sheet to decide whether to send the generated diagnostic file to the support email.",
            "The top-right down and up arrows import and export training records; they do not export diagnostic logs.",
            "Diagnostic logs can help troubleshoot Watch sync, video loading, highlight generation, and saving to Photos.",
            "The complete diagnostic file reaches the developer only if you share it. Automatic trimmed GlitchTip errors are a separate path described in the privacy policy.",
          ],
        },
        {
          kind: "paragraph",
          className: "language-block",
          text: "在 iPhone 打开 ShotMarker 首页，长按页面中央导航标题“训练记录”5 秒，在“是否导出诊断日志？”提示中选择“导出”，再通过系统分享面板决定是否把生成的诊断文件发送给支持邮箱。右上角向下和向上箭头用于导入和导出训练记录，不是诊断日志入口。完整诊断文件只有你选择分享时才会交给开发者；自动发送的 GlitchTip 精简错误属于另一条链路，详见隐私政策。",
        },
        { kind: "heading", text: "7. Can I edit a saved highlight task in 1.3?" },
        { kind: "paragraph", text: "Yes. Open the task from the home screen, change videos, default clip durations or number-label style, then tap “下一步：审核片段”. You can preview and trim clips and confirm which ones to keep or exclude. Your previous highlight is kept until a new one is generated successfully." },
        { kind: "paragraph", className: "language-block", text: "可以。从首页打开集锦任务，调整视频、默认时长或序数样式，再点“下一步：审核片段”。可以预览并调整片段范围，确认保留或排除。旧成片会保留，重新生成成功后才替换；“当前成片不包含最新修改”表示需要重新生成才能看到修改效果。" },
        { kind: "heading", text: "8. Why did generation stop in 1.3?" },
        { kind: "paragraph", text: "Keep the app in the foreground while generating. Entering the background stops queued and running generation. After an unexpected exit, unfinished generation is marked as stopped. The task and any previous output remain available, but generation does not resume automatically. Reopen the task and restart manually; if you changed its settings, review the clips again before generating." },
        { kind: "paragraph", className: "language-block", text: "生成时请保持 App 在前台。进入后台会停止排队和正在进行的生成；异常退出后的未完成生成也会标记为已停止。任务和已有成片会保留，但不会自动继续。重新打开任务后手动重新生成；若修改了设置，先重新进入片段审核。" },
        { kind: "heading", text: "9. What should I save before upgrading to 1.3?" },
        { kind: "paragraph", text: UPGRADE_NOTICE_EN },
        { kind: "paragraph", className: "language-block", text: UPGRADE_NOTICE_ZH },
        { kind: "heading", text: "10. How should I report a problem or suggestion?" },
        {
          kind: "email",
          text: `Email ${CONTACT_EMAIL}. If possible, include your app version, iPhone model, Apple Watch model, iOS version, watchOS version, screenshots, and diagnostic logs.`,
          prefix: "Email ",
          email: CONTACT_EMAIL,
          suffix:
            ". If possible, include your app version, iPhone model, Apple Watch model, iOS version, watchOS version, screenshots, and diagnostic logs.",
        },
        {
          kind: "email",
          className: "language-block",
          text: `请发送邮件到 ${CONTACT_EMAIL}。建议附上 App 版本、iPhone 型号、Apple Watch 型号、iOS/watchOS 版本、问题截图和诊断日志。`,
          prefix: "请发送邮件到 ",
          email: CONTACT_EMAIL,
          suffix: "。建议附上 App 版本、iPhone 型号、Apple Watch 型号、iOS/watchOS 版本、问题截图和诊断日志。",
        },
      ],
    },
    {
      id: "privacy-link",
      title: "Privacy",
      blocks: [
        {
          kind: "internalLink",
          text: `Read the ShotMarker privacy policy at ${PRIVACY_PATH}.`,
          prefix: "Read the ShotMarker privacy policy at ",
          label: PRIVACY_PATH,
          href: PRIVACY_PATH,
          suffix: ".",
        },
        {
          kind: "internalLink",
          className: "language-block",
          text: `你可以在 ${PRIVACY_PATH} 查看 ShotMarker 隐私政策。`,
          prefix: "你可以在 ",
          label: PRIVACY_PATH,
          href: PRIVACY_PATH,
          suffix: " 查看 ShotMarker 隐私政策。",
        },
      ],
    },
  ],
};
