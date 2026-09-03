# WebTrace Website Release Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在 zhangrh.shop 建立并发布 WebTrace 首页、支持页和中英双语隐私政策页，供用户与 Chrome Web Store 使用。

**Architecture:** 新增独立 `frontend/project/webtrace` Vite + React 项目，沿用 ShotMarker 的 base-path 路由模式但保持独立内容、品牌和测试。项目只消费扩展仓库中已经确认的图标与合成截图，不调用 Backend 或 Track；现有自动发现发布流程负责构建和部署 `/webtrace/`。

**Tech Stack:** React 19、TypeScript 5.9、Vite 7、原生 CSS、Node.js 24 `node:test`、React DOM server rendering、现有 OSS + SSH/rsync 发布脚本。

**Spec:** `docs/changes/2026-09-03-webtrace-store-release-spec.md`

## Global Constraints

- 公开品牌名固定为 `WebTrace`；中文描述使用“网站时间追踪器”。
- 稳定公开路径为 `/webtrace/`、`/webtrace/support` 和 `/webtrace/privacy`。
- 官网不新增 Track、表单提交、账号、下载代理、远程字体、远程脚本或第三方嵌入。
- 数据处理、保留、删除、不共享和权限表述必须与 `chrome_plugin_time_tracker` 当前代码及发布手册一致。
- 不新增 Hub 作品卡，不修改 Backend、Nginx、DNS、证书或生产基础设施。
- 使用 Node.js 24；代码变更执行根目录 `npm run check`，完成前执行 `git diff --check` 和 Markdown 链接检查。
- 两仓库直接在各自 `main` 工作，保留无关修改，分别提交和推送。
- 提交信息使用中文，并采用规定的 conventional 前缀。
- 完成前先更新 current，再把本 spec 和 plan 移入 `docs/archive/2026-09/`。

---

### Task 1: 建立 WebTrace 路由、结构化内容与默认元数据

**Files:**
- Create: `frontend/project/webtrace/shared/route.ts`
- Create: `frontend/project/webtrace/shared/route.test.ts`
- Create: `frontend/project/webtrace/content.ts`
- Create: `frontend/project/webtrace/content.test.ts`

**Interfaces:**
- Produces: `resolveRoute(pathname): { name: "home" | "support" | "privacy" | "not-found" }`。
- Produces: `withBase(path): string` 和常量 `HOME_PATH`、`SUPPORT_PATH`、`PRIVACY_PATH`。
- Produces: `homeContent`、`supportPage`、`privacyPage` 结构化只读内容。

- [ ] **Step 1: 写路由失败测试**

在 `shared/route.test.ts` 断言：

```ts
assert.deepEqual(resolveRoute("/webtrace/"), { name: "home" });
assert.deepEqual(resolveRoute("/"), { name: "home" });
assert.deepEqual(resolveRoute("/webtrace/support"), { name: "support" });
assert.deepEqual(resolveRoute("/support"), { name: "support" });
assert.deepEqual(resolveRoute("/webtrace/privacy"), { name: "privacy" });
assert.deepEqual(resolveRoute("/privacy"), { name: "privacy" });
assert.deepEqual(resolveRoute("/webtrace/how-to"), { name: "not-found" });
```

- [ ] **Step 2: 写内容失败测试**

在 `content.test.ts` 聚合所有块文本，断言品牌名、邮箱和稳定 URL，并逐项匹配：

```ts
for (const phrase of [
  "网站名称和可注册主域名",
  "打开时间、结束时间和有效观看时长",
  "chrome.storage.local",
  "chrome.storage.session",
  "IndexedDB",
  "不保存完整 URL、路径、查询参数、网页标题、网页内容、输入内容或 Cookie",
  "不上传、不出售、不用于广告，也不与第三方共享",
  "默认长期保留",
  "删除历史会保留网站配置并继续统计",
  "Chrome Web Store User Data Policy",
  "Limited Use",
]) assert.match(allText, new RegExp(phrase));
```

英文文本必须包含相同数据范围、local-only、retention、deletion、no sharing 和 Limited Use 含义；测试同时断言不出现“已上架”“云同步”“限制使用时长”。

- [ ] **Step 3: 运行测试并确认失败**

Run: `npm --prefix frontend test -- --test-name-pattern='WebTrace|webtrace'`

Expected: FAIL，WebTrace 项目文件尚不存在。

- [ ] **Step 4: 实现 base-path 路由**

`shared/route.ts` 使用：

```ts
export const RAW_BASE = import.meta.env?.BASE_URL ?? "/";
export const BASE_PATH = RAW_BASE === "/" ? "" : RAW_BASE.replace(/\/$/, "");
export const PROJECT_PATH = "/webtrace";
```

先去掉 Vite base，再去掉项目路径和尾斜杠，只匹配 `/`、`/support`、`/privacy`，其他路径返回 `not-found`。

- [ ] **Step 5: 编写结构化中英文内容**

`content.ts` 定义 `ContentBlock`、`ContentSection`、`ContentPage` 和首页 section 类型。固定：

```ts
export const APP_NAME = "WebTrace";
export const CONTACT_EMAIL = "zhangrhweb@gmail.com";
export const HOME_PATH = "/webtrace/";
export const SUPPORT_PATH = "/webtrace/support";
export const PRIVACY_PATH = "/webtrace/privacy";
export const EFFECTIVE_DATE = "September 3, 2026";
export const LAST_UPDATED = "2026-09-03";
```

首页、支持和隐私全文严格覆盖 spec，明确页面不提供商店下载链接。

- [ ] **Step 6: 运行路由和内容测试**

Run: `npm --prefix frontend test -- --test-name-pattern='WebTrace|webtrace'`

Expected: 新增测试 PASS。

- [ ] **Step 7: 提交内容与路由**

```bash
git add frontend/project/webtrace
git commit -m "feat: 建立 WebTrace 官网内容与路由"
```

---

### Task 2: 实现首页、支持页、隐私页和响应式视觉

**Files:**
- Create: `frontend/project/webtrace/app.tsx`
- Create: `frontend/project/webtrace/styles.css`
- Create: `frontend/project/webtrace/index.html`
- Create: `frontend/project/webtrace/main.tsx`
- Create: `frontend/project/webtrace/vite.config.ts`
- Create: `frontend/project/webtrace/page-render.test.mjs`
- Create: `frontend/project/webtrace/resources.test.mjs`
- Create: `frontend/project/webtrace/assets/icon-128.png`
- Create: `frontend/project/webtrace/assets/webtrace-dashboard.png`

**Interfaces:**
- Consumes: Task 1 的 `resolveRoute`、`withBase`、`homeContent`、`supportPage` 和 `privacyPage`。
- Consumes: 扩展仓库 `images/icon_128.png` 与 `store-assets/screenshots/01-dashboard-1280x800.png` 的确认版本。
- Produces: `HomePage`、`ContentPage`、`NotFoundPage` 和 `App` React components。

- [ ] **Step 1: 写 SSR 失败测试**

`page-render.test.mjs` 通过 Vite middleware `ssrLoadModule('/app.tsx')`，使用 `renderToStaticMarkup` 断言首页包含一个 h1、显著隐私卡、三步说明、真实截图及三个相关链接；支持页包含邮箱、首次记录、计时边界、排序和删除历史；隐私页包含中英文标题、Last updated 和 Limited Use。

核心断言：

```js
assert.match(homeHtml, /全部仅保存在本机/);
assert.match(homeHtml, /src="[^"]*webtrace-dashboard\.png"/);
assert.match(homeHtml, /href="\/webtrace\/support"/);
assert.match(homeHtml, /href="\/webtrace\/privacy"/);
assert.match(supportHtml, /离开并重新进入/);
assert.match(privacyHtml, /Chrome Web Store User Data Policy/);
```

- [ ] **Step 2: 写资源和元数据失败测试**

`resources.test.mjs` 读取 `index.html`、`styles.css` 和图片 header，断言默认标题/描述、没有 `http://` 或 `https://` 脚本/样式/图片资源、图标 128×128、截图 1280×800，并断言 CSS 有 390px media query 与 `prefers-reduced-motion`。

- [ ] **Step 3: 运行渲染测试并确认失败**

Run: `npm --prefix frontend test -- --test-name-pattern='WebTrace|webtrace'`

Expected: FAIL，组件、样式和资产尚未创建。

- [ ] **Step 4: 复制受控品牌资产**

从扩展仓库复制已通过尺寸和隐私检查的两个文件到 Task 文件路径。复制后比较 SHA-256，记录在测试输出或变更检查中，确保不是旧计时器图标或真实用户截图。

- [ ] **Step 5: 创建入口和默认元数据**

`vite.config.ts` 调用 `createProjectConfig({ projectRoot })`；`main.tsx` 引入 `styles.css` 并把 `<App />` 挂载到 `#root`。`index.html` 使用 `lang="zh-CN"`、标题 `WebTrace - 网站时间追踪器`、描述“WebTrace 在本机记录已配置网站的打开次数与有效观看时长。”和本地图标路径。

- [ ] **Step 6: 实现页面组件**

`App` 监听 `popstate`，按 route 渲染。route 变化时设置 `document.title` 和 `<meta name="description">`。首页使用语义化 section：hero、`.privacy-callout`、`.steps-grid`、`.feature-grid`、`.data-boundary` 和 `.related-links`；政策页逐块渲染 paragraph、heading、list、email 与 internalLink，不使用 `dangerouslySetInnerHTML`。

- [ ] **Step 7: 实现响应式视觉**

CSS 使用扩展的 `#315f49` 森林绿、`#fffefb` 暖白和 `#17211b` 深色文字；桌面 hero 为左右两栏，390px 变为单栏。截图使用固定 aspect-ratio 和 `object-fit: cover`；所有链接有 focus-visible；装饰过渡在 `prefers-reduced-motion: reduce` 下关闭。政策正文宽度不超过 880px。

- [ ] **Step 8: 运行项目测试和生产构建**

Run: `npm --prefix frontend test -- --test-name-pattern='WebTrace|webtrace'`

Expected: PASS。

Run: `npm --prefix frontend run build -- webtrace`

Expected: `dist/webtrace/index.html` 生成，资源路径以 `/webtrace/` 开头。

- [ ] **Step 9: 提交页面视觉**

```bash
git add frontend/project/webtrace
git commit -m "feat: 完成 WebTrace 公开页面"
```

---

### Task 3: 把 WebTrace 纳入完整检查和发布入口

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/vite.config.test.mjs`
- Modify: `frontend/project/webtrace/resources.test.mjs`
- Modify: `RUNBOOK.md`

**Interfaces:**
- Produces: `npm --prefix frontend run build:all` 构建 `hub`、`cardgame`、`shotmarker`、`analytics`、`webtrace`。
- Produces: OSS publish build 保持路由 `/webtrace/`，静态资源使用 `https://static.zhangrh.shop/zhangrh-shop/webtrace/static/`。

- [ ] **Step 1: 写失败测试锁定完整构建和 OSS base**

在 `resources.test.mjs` 读取前端 package script 并断言 `build:all` 含 `npm run build webtrace`。在 `vite.config.test.mjs` 增加 WebTrace OSS build：

```js
const { bundle, html } = buildProject({ projectName: 'webtrace', publishOssAssets: true });
const projectOssBase = `${ossBase}/webtrace/`;
assert.match(html, new RegExp(`${escapeRegExp(projectOssBase)}static/[^"]+\\.js`));
assert.match(bundle, /["']\/webtrace\/["']/);
assert.doesNotMatch(bundle, new RegExp(`${escapeRegExp(projectOssBase)}(?:support|privacy)`));
```

- [ ] **Step 2: 运行定向测试并确认失败**

Run: `npm --prefix frontend test -- --test-name-pattern='WebTrace|webtrace'`

Expected: FAIL，`build:all` 尚未包含 WebTrace。

- [ ] **Step 3: 更新完整构建和运行手册**

在 `frontend/package.json` 的 `build:all` 末尾加入 `&& npm run build webtrace`。RUNBOOK 的项目数量改为五个，在本地启动、单独构建、直接发布和发布后 HEAD 检查中加入 `webtrace`，并列出三个产品路由。

- [ ] **Step 4: 运行定向和完整检查**

Run: `npm --prefix frontend test -- --test-name-pattern='WebTrace|webtrace'`

Expected: PASS。

Run: `npm run check`

Expected: 根自动化、前端、后端测试、lint、TypeScript 和五个前端生产构建全部 PASS。

- [ ] **Step 5: 提交构建集成**

```bash
git add frontend/package.json frontend/vite.config.test.mjs frontend/project/webtrace/resources.test.mjs RUNBOOK.md
git commit -m "chore: 将 WebTrace 纳入完整构建"
```

---

### Task 4: 本地浏览器验收、current 文档和 main 推送

**Files:**
- Modify: `docs/current/project.md`
- Modify: `docs/current/deployment.md`
- Modify: `docs/current/development.md`
- Modify: `docs/current/automation.md`

**Interfaces:**
- Produces: 本地构建与浏览器验证证据、待发布 main revision。

- [ ] **Step 1: 本地预览浏览器验收**

启动 `npm --prefix frontend run preview -- webtrace --host 127.0.0.1`。使用 Playwright 在 1280×800 和 390×844 打开 `/webtrace/`、`/webtrace/support`、`/webtrace/privacy`，检查标题、meta description、正文、截图、所有页内链接、404、控制台、失败请求和 `document.documentElement.scrollWidth <= window.innerWidth`。

- [ ] **Step 2: 更新 current 实现事实**

`project.md` 把组件数改为五个前端并记录 WebTrace 三页、无网页埋点和数据口径；`deployment.md` 加入 `/webtrace/` 拓扑和“尚未公网验证”；`development.md` 记录本次 `npm run check` 数量和五个构建；`automation.md` 记录目录扫描已自动发现 WebTrace。每份 current 保持不超过 300 行。

- [ ] **Step 3: 校验文档和工作区**

Run: `git diff --check`

Run: `wc -l docs/current/*.md`

Run: 使用 Node 脚本解析所有相对 Markdown 链接并断言目标文件存在、标题锚点可解析。

Expected: 无空白错误、断链或超 300 行 current，Git 只含本任务文件。

- [ ] **Step 4: 提交 current 并推送 main**

```bash
git add docs/current
git commit -m "docs: 记录 WebTrace 官网实现状态"
git push origin main
```

---

### Task 5: 发布 WebTrace 官网并完成变更归档

**Files:**
- Modify: `docs/current/project.md`
- Modify: `docs/current/deployment.md`
- Modify: `docs/current/development.md`
- Modify: `docs/README.md`
- Move: `docs/changes/2026-09-03-webtrace-store-release-spec.md` to `docs/archive/2026-09/2026-09-03-webtrace-store-release-spec.md`
- Move: `docs/changes/2026-09-03-webtrace-store-release-plan.md` to `docs/archive/2026-09/2026-09-03-webtrace-store-release-plan.md`

**Interfaces:**
- Consumes: 已推送的 zhangrh.shop main 和发布所需本机 SSH/OSS 凭据。
- Produces: 三个已验证 HTTPS 页面、最终 current/归档文档和干净的 main。

- [ ] **Step 1: 执行现有 WebTrace 前端发布流程**

Run: `npm --prefix frontend run publish -- webtrace`

Expected: 脚本成功拉取 main、构建 WebTrace、上传受控静态资源并发布 HTML；不得选择或发布 Backend、Hub、Cardgame、ShotMarker 或 Analytics。

- [ ] **Step 2: 公网只读验证**

Run:

```bash
curl --fail --head https://zhangrh.shop/webtrace/
curl --fail --head https://zhangrh.shop/webtrace/support
curl --fail --head https://zhangrh.shop/webtrace/privacy
```

打开三个页面并重复 1280×800、390×844 浏览器检查；确认 HTML 引用的 JS、CSS、图标和截图均为成功响应，控制台无错误或警告。

- [ ] **Step 3: 写入带日期公网事实并归档**

把发布 revision、2026-09-03、三个 HTTP 成功结果和浏览器场景写入 `project.md` 与 `deployment.md`；`development.md` 保留最终验证数量。更新 `docs/README.md` 为“当前 Change 无”，将 spec/plan 用 apply_patch 移到 `docs/archive/2026-09/` 并修复链接。

- [ ] **Step 4: 运行最终完整检查**

Run: `npm run check`

Run: `git diff --check`

Run: `wc -l docs/current/*.md`

Expected: 全部 PASS；current 均不超过 300 行，文档无断链。

- [ ] **Step 5: 提交归档并推送 main**

```bash
git add docs
git commit -m "docs: 更新 WebTrace 官网发布状态并归档变更"
git push origin main
```

- [ ] **Step 6: 向扩展计划提供跨仓库证据**

记录最终 `git rev-parse --short HEAD`、三条公网 URL 和验证摘要，供扩展仓库 Task 5 更新发布手册和 Notion。最终 `git status --short --branch` 必须显示 `main...origin/main` 且工作区干净。
