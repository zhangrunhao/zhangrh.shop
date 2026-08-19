# ShotMarker 公开页面内容同步实施计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 让 ShotMarker 的支持页、隐私政策和使用说明准确反映当前 App 的诊断上报、视频准备与持久化集锦任务行为。

**Architecture:** 保持现有三个路由和 `ShotMarkerPage` 内容模型不变，把可验证的双语正文继续集中在 `content.ts`，由 `content.test.ts` 锁定隐私与操作契约。how-to 仍由 `app.tsx` 渲染，但第 3 步增加来自当前 ShotMarker 模拟器演示数据的已完成任务截图，并由 SSR 渲染测试锁定图片和替代文本。

**Tech Stack:** React 19、TypeScript 5.9、Vite 7、Node.js 24 内置 test runner、React SSR、CSS。

**Spec:** [ShotMarker 公开页面内容同步设计](./2026-08-19-shotmarker-public-content-spec.md)

## 全局约束

- 使用 Node.js 24；本机命令以 `PATH=/Users/runhaozhang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH` 开头。
- 不改变 `/shotmarker/support`、`/shotmarker/privacy`、`/shotmarker/how-to`、联系邮箱、Track 三参数协议或四个 Analytics 事件。
- 不修改 ShotMarker 仓库、生产服务、App Store Connect、GlitchTip 配置或私有基础设施。
- 不披露凭据、私有服务路径、原始事件、用户标识实际值或真实用户数据；隐私页仍须披露实现会处理的标识类别。
- 中英文必须覆盖相同的数据类别、启用范围、字段、排除项、保留边界和用户操作。
- 本地日志只描述已核验行为：按日写入，准备诊断导出时执行配置清理；不得声称 14 天或 30 MiB 上限持续自动执行。
- 不声称系统后台会在 App 退出或锁屏后持续运行集锦任务，也不声称本次本地实现已发布上线。
- 当前工作区已有用户创建的 spec 与 `docs/README.md` 变更；所有编辑必须保留这些内容，不自动提交或覆盖其他用户改动。

---

### Task 1: 锁定并实现隐私政策内容契约

**Files:**
- Modify: `frontend/project/shotmarker/content.test.ts`
- Modify: `frontend/project/shotmarker/content.ts`

**Interfaces:**
- Consumes: 现有 `ShotMarkerPage`、`ContentSection`、`ContentBlock` 和 `pageText()` 测试辅助函数。
- Produces: `privacyPage` 中独立的 First-Party Product Analytics、Crash and Error Reporting、Local Diagnostic Logs 段落，以及完整本地保留与删除边界。

- [x] **Step 1: 把旧的隐私摘要测试改成三条数据链路的失败测试**

在 `content.test.ts` 中保留现有 Analytics 四事件和四字段契约断言，并新增如下等价断言；旧的“第三方 SDK 不存在”和“日志持续自动清理”正向断言改为负向断言：

```ts
test("privacy page distinguishes analytics, remote errors, and local logs", () => {
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

  assert.match(text, /Watch app does not use this reporting path/);
  assert.match(text, /Watch App 不使用这条上报链路/);
  assert.match(text, /Sentry Cocoa 9\.26\.0 may add/);
  assert.match(text, /installation-scoped Sentry user ID/);
  assert.match(text, /sendDefaultPii to false/);
  assert.match(text, /does not copy AppLogEvent context/);
  assert.doesNotMatch(text, /contains only a fixed message/);
  assert.match(text, /performance tracing, profiling, Session Replay, automatic session tracking, network tracing, and automatic breadcrumbs are disabled/);
  assert.match(text, /性能追踪、Profiling、Session Replay、自动 Session Tracking、网络追踪和自动 Breadcrumb 均已关闭/);
  assert.doesNotMatch(text, /does not use third-party analytics SDKs/);
  assert.doesNotMatch(text, /诊断日志会根据 App 的本地保留策略自动滚动和删除/);
});
```

- [x] **Step 2: 增加原生崩溃、本地日志和数据删除边界的失败测试**

```ts
test("privacy page documents crash payload and local retention boundaries", () => {
  const text = pageText(privacyPage);

  assert.match(text, /native crash reports may include a crash stack and similar SDK-supplied technical context/);
  assert.match(text, /原生崩溃报告可能包含崩溃堆栈和相似的 SDK 技术环境/);
  assert.match(text, /full JSONL logs and iPhone-side WatchConnectivity diagnostics stay on the iPhone unless you export and share them/);
  assert.match(text, /完整 JSONL 日志和 iPhone 侧 WatchConnectivity 诊断会保留在本机/);
  assert.match(text, /trimmed subset of \.error events may be sent automatically/);
  assert.match(text, /\.error 事件的精简子集可能自动发送/);

  for (const phrase of [
    "training snapshot",
    "required input copy",
    "local output video",
    "photo library",
    "Apple Health",
    "训练快照",
    "必要输入副本",
    "本地输出视频",
    "系统照片库",
  ]) {
    assert.match(text, new RegExp(phrase));
  }

  assert.match(text, /Cancelling or deleting a highlight job removes its corresponding job files/);
  assert.match(text, /取消或删除集锦任务会移除对应任务文件/);
  assert.match(text, /Uninstalling ShotMarker does not delete videos already in the photo library or workouts already saved in Apple Health/);
  assert.match(text, /卸载 ShotMarker 不会删除系统照片库中的视频，也不等于删除 Apple Health 中已保存的 workout/);
  assert.match(text, /cleanup is applied when a diagnostic export is prepared/);
  assert.match(text, /准备诊断导出时执行配置清理/);
  assert.doesNotMatch(text, /automatically rotated and removed according to the app's local retention policy/);
});
```

- [x] **Step 3: 运行隐私内容测试并确认它按预期失败**

Run:

```bash
PATH=/Users/runhaozhang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm --prefix frontend exec -- tsx --tsconfig tsconfig.app.json --test project/shotmarker/content.test.ts
```

Expected: FAIL，至少缺少 `Crash and Error Reporting`、`Local Diagnostic Logs` 或新的保留边界。

- [x] **Step 4: 最小改写 `privacyPage` 使新契约成立**

在 `content.ts` 中：

- 本 Change 不发布页面，因此将 `EFFECTIVE_DATE` 设为 `Upon publication`，`LAST_UPDATED` 更新为 `2026-08-19`；不得为未来发布虚构日期。
- 摘要改为“不需要账号、不展示广告、不使用第三方产品分析服务；使用 Sentry SDK 连接开发者运营的 GlitchTip 错误报告服务；不向开发者服务器上传视频或训练记录”的等价中英文。
- 在 `Data Processed by ShotMarker` 中保留训练、照片、HealthKit、WatchConnectivity 与 Analytics 内容，并新增独立的 `Crash and Error Reporting`、`Local Diagnostic Logs` 标题和双语段落。
- 精简 `.error` 段落先列出 ShotMarker 主动提供的固定消息、错误名称和分类、时间、可选 domain/code 及未复制的业务字段，再披露 Sentry Cocoa 9.26.0 发送前补充的技术上下文、线程栈、安装范围 ID 和源 IP 未核验边界。
- 原生崩溃段落使用“may include / 可能包含”，不承诺排除设备型号、系统版本或 SDK 技术上下文。
- `Data Retention and Deletion` 明确任务 JSON、训练快照、视频本地标识、设置、状态、错误和输出路径，必要输入副本、本地输出、任务删除、App 删除、照片库和 Apple Health 边界。
- 日志段落只写导出准备时清理，不写持续自动执行配置上限。
- `What ShotMarker Does Not Do` 保留本地优先和无广告边界，但明确“无第三方产品 Analytics”不等于“无第三方 SDK”。

- [x] **Step 5: 运行隐私内容测试并确认通过**

Run: 与 Step 3 相同。

Expected: PASS。

---

### Task 2: 锁定并实现支持页与 how-to 操作契约

**Files:**
- Modify: `frontend/project/shotmarker/content.test.ts`
- Modify: `frontend/project/shotmarker/content.ts`

**Interfaces:**
- Consumes: Task 1 更新后的日期、页面模型和双语写法。
- Produces: 可操作的诊断导出、App 内 iCloud 视频准备、持久化集锦任务和中断恢复说明。

- [x] **Step 1: 为支持页写失败测试**

```ts
test("support page documents the current diagnostic export and video preparation flows", () => {
  const text = pageText(supportPage);

  assert.match(text, /press and hold the centered “训练记录” navigation title for 5 seconds/);
  assert.match(text, /长按页面中央导航标题“训练记录”5 秒/);
  assert.match(text, /choose “导出” in the “是否导出诊断日志？” prompt/);
  assert.match(text, /top-right down and up arrows import and export training records; they do not export diagnostic logs/);
  assert.match(text, /右上角向下和向上箭头用于导入和导出训练记录，不是诊断日志入口/);
  assert.doesNotMatch(text, /Tap the export button in the top-right corner of the home screen/);
  assert.doesNotMatch(text, /首页点击右上角导出按钮即可导出诊断日志/);

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
  assert.match(text, /open and fully play the original in Photos as an additional troubleshooting step/);
  assert.match(text, /在照片 App 中打开并完整播放原视频作为补充排障/);
});
```

- [x] **Step 2: 为 how-to 第 3 步写失败测试**

```ts
test("how-to page documents persistent highlight jobs and launch recovery", () => {
  const text = pageText(howToPage);

  for (const phrase of [
    "持久化队列任务",
    "返回首页",
    "集锦任务",
    "播放",
    "保存到系统相册",
    "删除任务",
    "重新开始",
    "标记为中断",
  ]) {
    assert.match(text, new RegExp(phrase));
  }
  assert.match(text, /保存到相册和生成完成是两个独立动作/);
  assert.match(text, /不保证退出 App 或锁屏后仍由系统后台持续运行/);
  assert.doesNotMatch(text, /退出 App 后会继续在后台生成/);
});
```

- [x] **Step 3: 运行内容测试并确认新增断言失败**

Run: Task 1 Step 3 的命令。

Expected: FAIL，缺少 5 秒标题长按、App 内视频准备和任务恢复文案。

- [x] **Step 4: 最小更新 `supportPage` 与 `howToPage`**

- FAQ 1 和 FAQ 6 使用相同的四步诊断导出流程：打开首页、长按居中标题 5 秒、在提示中选择导出、通过系统分享面板决定是否发送。
- FAQ 6 明确右上角两个箭头只负责训练记录导入/导出，并把自动精简 `.error` 引向隐私页的独立链路。
- iCloud FAQ 先写卡片状态、确认提示、进度、暂停/重新开始、网络重试，再把 Photos 完整播放降为补充步骤。
- how-to 第 3 步写明创建持久任务并返回首页、进程内串行、五类状态、播放/保存/删除/重启/取消、保存与生成分离，以及启动时将遗留任务标记为中断。

- [x] **Step 5: 运行内容测试并确认通过**

Run: Task 1 Step 3 的命令。

Expected: PASS。

---

### Task 3: 增加当前“已完成集锦任务”截图并锁定渲染

**Files:**
- Create: `frontend/project/shotmarker/assets/how-to/iphone-highlight-job-completed.png`
- Modify: `frontend/project/shotmarker/how-to-page-render.test.mjs`
- Modify: `frontend/project/shotmarker/app.tsx`
- Modify: `frontend/project/shotmarker/styles.css`

**Interfaces:**
- Consumes: ShotMarker main / `41bfda2` 的 iPhone 模拟器界面和 Task 2 的第 3 步正文。
- Produces: `completedHighlightJobImage` 静态资源导入、第 3 步三图布局，以及替代文本“iPhone 首页的集锦任务，显示已完成状态和播放、保存、删除入口”。

- [x] **Step 1: 在 SSR 测试中先写新增图片的失败断言**

在现有 `html` 断言后加入：

```js
const completedJobImage = html.match(
  /<img[^>]*alt="iPhone 首页的集锦任务，显示已完成状态和播放、保存、删除入口"[^>]*>/,
)?.[0];

assert.ok(completedJobImage);
assert.match(completedJobImage, /iphone-highlight-job-completed\.png/);
assert.doesNotMatch(html, /\starget=/);
```

- [x] **Step 2: 运行渲染测试并确认缺图失败**

```bash
PATH=/Users/runhaozhang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm --prefix frontend exec -- tsx --tsconfig tsconfig.app.json --test project/shotmarker/how-to-page-render.test.mjs
```

Expected: FAIL，找不到新增替代文本。

- [x] **Step 3: 从当前 ShotMarker 模拟器制作无私人数据截图**

- 在 iOS 26.5 的全新临时 iPhone 17 Pro 模拟器安装 ShotMarker main / `41bfda2` 的 Debug 构建。
- 使用 Debug 自带预览训练记录；在模拟器 App 容器的 `Application Support/ShotMarker/highlight-jobs.json` 注入一条仅含演示 UUID、演示日期和本地占位输出路径的 `completed` 任务。
- 重新启动 App，确认首页“集锦任务”显示“已完成”和“播放 / 保存 / 删除”三个入口。
- 用 `xcrun simctl io <UDID> screenshot` 捕获，不包含邮件、设备标识、真实照片、真实训练或其他用户数据；用 `sips` 核对像素尺寸和 PNG 格式。
- 将截图复制为 `frontend/project/shotmarker/assets/how-to/iphone-highlight-job-completed.png`，并用本地图片查看工具人工核对裁切与清晰度。

- [x] **Step 4: 在第 3 步渲染截图并补齐响应式布局**

在 `app.tsx` 导入新资源并把 `stepVisuals[2]` 改为 `className: "how-to-visual trio"`，保留原两张图并追加：

```tsx
{
  src: completedHighlightJobImage,
  alt: "iPhone 首页的集锦任务，显示已完成状态和播放、保存、删除入口",
}
```

在 `styles.css` 为 `.how-to-visual.trio` 使用三列等宽网格；920px 以下仍保持三列紧凑展示，560px 以下改为单列，并沿用现有圆角和阴影。

- [x] **Step 5: 运行渲染测试和全部 ShotMarker 前端测试**

```bash
PATH=/Users/runhaozhang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm --prefix frontend exec -- tsx --tsconfig tsconfig.app.json --test project/shotmarker/how-to-page-render.test.mjs
PATH=/Users/runhaozhang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm --prefix frontend test -- project/shotmarker/content.test.ts project/shotmarker/how-to-page-render.test.mjs project/shotmarker/shared/route.test.ts
```

Expected: PASS，相关链接仍无 `target`，三个公开路由测试保持通过。

---

### Task 4: 页面视觉验收、当前文档同步与归档

**Files:**
- Modify: `docs/current/project.md`
- Modify if full verification facts change: `docs/current/development.md`
- Modify: `docs/README.md`
- Move: `docs/changes/2026-08-19-shotmarker-public-content-spec.md` → `docs/archive/2026-08/2026-08-19-shotmarker-public-content-spec.md`
- Move: `docs/changes/2026-08-19-shotmarker-public-content-plan.md` → `docs/archive/2026-08/2026-08-19-shotmarker-public-content-plan.md`

**Interfaces:**
- Consumes: Tasks 1–3 的页面、测试和图片结果。
- Produces: 已核验的当前事实、完成态归档和无活动 ShotMarker Change 的文档入口。

- [x] **Step 1: 运行本地站点并做桌面/手机视觉检查**

用 ShotMarker Vite 开发服务器渲染三个路由，在 1440×1000 与 390×844 视口分别截图：

- `/shotmarker/support`
- `/shotmarker/privacy`
- `/shotmarker/how-to`

逐页确认标题、meta description、邮箱、内部链接、内容无横向溢出；how-to 新图裁切清晰且替代文本准确。发现布局问题时只调整 `styles.css` 并重新执行 Task 3 测试。

- [x] **Step 2: 运行完整质量检查**

```bash
PATH=/Users/runhaozhang/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin:$PATH npm run check
git diff --check
```

Expected: 根自动化、前端和后端测试全部通过；前端 lint、TypeScript 检查与四个生产构建通过；`git diff --check` 无输出。

- [x] **Step 3: 检查 Markdown 链接和标题锚点**

核对 `docs/README.md`、`docs/current/project.md`、spec 和 plan 的所有相对链接均指向存在文件；按 GitHub Markdown 规则核对本地 `#...` 标题锚点，无断链或重复标题造成的错误目标。

- [x] **Step 4: 用实现重新核对五项 App 事实**

再次读取 ShotMarker main / `41bfda2` 下的以下实现，不以本 spec 代替源码证据：

- `TrainingSessionListView.swift`：标题长按 5 秒和右上角训练记录导入/导出。
- `AppLogStore.swift`、`AppLogExportService.swift`：仅导出前显式 `cleanup()`。
- `GlitchTipCrashReporter.swift`、`AppLogger.swift` 及测试：自动崩溃、精简 `.error`、字段排除和关闭项。
- `TrainingSessionHighlightView.swift`、`SelectedTrainingVideoSelectionItem.swift`：准备确认、进度、暂停/重新开始。
- `HighlightJobStore.swift`、`HighlightJobManager.swift`、`HighlightJobListSection.swift`：持久化、串行执行、中断恢复和任务入口。

- [x] **Step 5: 更新 current，再归档 Change**

- 在 `docs/current/project.md` 的 ShotMarker 范围中记录 2026-08-19 已复核的三个公开页面、三条数据链路、诊断导出、视频准备和任务说明；不复制完整隐私正文，也不声称已发布。
- 仅在实际运行 `npm run check` 后，用真实输出更新 `docs/current/development.md` 的最近验证；不预写测试数量。
- 将 spec 状态改为“已实现”，把本 plan 中已完成步骤勾选。
- 先确认 current 已更新，再把 spec 和 plan 移到 `docs/archive/2026-08/`。
- 把 `docs/README.md` 的“当前 Change”恢复为“无”。`docs/current/track.md` 保持不变。

- [x] **Step 6: 对归档后的最终工作树重跑文档与 diff 检查**

```bash
git diff --check
git status --short
```

Expected: 只出现本 Change 预期的内容、测试、图片、current 和归档变更；没有生产发布、ShotMarker 仓库或无关文件改动。
