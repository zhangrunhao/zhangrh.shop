# Legacy H5 Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build one `legacy-h5` frontend project in `zhangrh.shop` that preserves and displays `1904_tale`, `1905_word`, `1907_cp`, and `1908_parade` with local source/assets and no old backend, CDN, WeChat, tracking, sensitive-word, or save dependencies.

**Architecture:** Add a Vite multi-page project at `frontend/project/legacy-h5`. Each old H5 activity lives in its own subdirectory under that one project, while shared browser runtimes and compatibility shims live under `script/` and `legacy/`. The existing `frontend` build/deploy tools publish the whole migrated set once as `/legacy-h5/`.

**Tech Stack:** Vite 7, vanilla HTML/CSS/ES modules, legacy browser scripts (`Hilo`, jQuery, Zepto, Scroller), local compatibility shims, Node static audit script, Playwright CLI for browser verification.

---

## File Structure

Create or modify these files in `/Users/runhaozhang/Documents/project/zhangrh.shop`:

- Create: `frontend/project/legacy-h5/index.html` - root gallery linking the four migrated activities.
- Create: `frontend/project/legacy-h5/main.css` - root gallery styling only.
- Create: `frontend/project/legacy-h5/vite.config.ts` - Vite multi-page config and legacy aliases.
- Create: `frontend/project/legacy-h5/legacy/shims/hilo.js` - exports `window.Hilo`.
- Create: `frontend/project/legacy-h5/legacy/shims/jquery.js` - exports `window.$` or `window.jQuery`.
- Create: `frontend/project/legacy-h5/legacy/shims/scroller.js` - exports `window.Scroller`.
- Create: `frontend/project/legacy-h5/legacy/shims/wx.js` - no-op WeChat JS SDK object.
- Create: `frontend/project/legacy-h5/legacy/utils/legacy-utils.js` - local replacement for old shared utility imports.
- Create: `frontend/project/legacy-h5/legacy/utils/no-op-services.js` - local replacement for removed share/tracking/service calls.
- Create/copy: `frontend/project/legacy-h5/legacy/styles/reset.css` - local reset stylesheet for copied legacy entries.
- Create: `frontend/project/legacy-h5/legacy/audit.mjs` - static migration audit.
- Copy: `frontend/project/legacy-h5/script/` - local Hilo/jQuery/Zepto/Scroller browser scripts from `bantang/src/script`.
- Modify: `frontend/package.json` - add Less support for migrated `.less` imports.
- Modify: `frontend/package-lock.json` - lock Less dependency.
- Copy and modify: `frontend/project/legacy-h5/1904_tale/` - migrated `1904_tale`.
- Copy and modify: `frontend/project/legacy-h5/1905_word/` - migrated `1905_word`.
- Copy and modify: `frontend/project/legacy-h5/1907_cp/` - migrated `1907_cp`.
- Copy and modify: `frontend/project/legacy-h5/1908_parade/` - migrated `1908_parade`.

Read-only source paths in `/Users/runhaozhang/Documents/project/bantang`:

- `src/project/1904_tale`
- `src/project/1905_word`
- `src/project/1907_cp`
- `src/project/1908_parade`
- `src/script`
- `src/style/reset.css`
- `src/components/util/1.0.0/index.js`

Do not modify `bantang` during implementation.

---

### Task 1: Bootstrap `legacy-h5` Vite Project Shell

**Files:**
- Create: `frontend/project/legacy-h5/index.html`
- Create: `frontend/project/legacy-h5/main.css`
- Create: `frontend/project/legacy-h5/vite.config.ts`
- Create: `frontend/project/legacy-h5/1904_tale/index.html`
- Create: `frontend/project/legacy-h5/1904_tale/main.js`
- Create: `frontend/project/legacy-h5/1905_word/index.html`
- Create: `frontend/project/legacy-h5/1905_word/main.js`
- Create: `frontend/project/legacy-h5/1907_cp/index.html`
- Create: `frontend/project/legacy-h5/1907_cp/main.js`
- Create: `frontend/project/legacy-h5/1908_parade/index.html`
- Create: `frontend/project/legacy-h5/1908_parade/main.js`

- [ ] **Step 1: Run the failing build before creating the project shell**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
npm run build -- legacy-h5
```

Expected: FAIL with `Missing project name` or `Missing Vite config`, proving the project does not exist yet.

- [ ] **Step 2: Create `frontend/project/legacy-h5/vite.config.ts`**

Use this exact file content:

```ts
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, mergeConfig, type ConfigEnv, type UserConfig } from "vite";
import { createProjectConfig } from "../../vite.config";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const baseProjectConfig = createProjectConfig({ projectRoot }) as (
  env: ConfigEnv,
) => UserConfig;

const resolveProject = (...segments: string[]) => path.resolve(projectRoot, ...segments);

export default defineConfig((env) =>
  mergeConfig(baseProjectConfig(env), {
    resolve: {
      alias: {
        hilo: resolveProject("legacy/shims/hilo.js"),
        $: resolveProject("legacy/shims/jquery.js"),
        Scroller: resolveProject("legacy/shims/scroller.js"),
        wx: resolveProject("legacy/shims/wx.js"),
      },
    },
    build: {
      rollupOptions: {
        input: {
          index: resolveProject("index.html"),
          "1904_tale/index": resolveProject("1904_tale/index.html"),
          "1905_word/index": resolveProject("1905_word/index.html"),
          "1907_cp/index": resolveProject("1907_cp/index.html"),
          "1908_parade/index": resolveProject("1908_parade/index.html"),
        },
      },
    },
  }),
);
```

- [ ] **Step 3: Create `frontend/project/legacy-h5/index.html`**

Use this exact file content:

```html
<!doctype html>
<html lang="zh-Hans">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Legacy H5</title>
    <link rel="stylesheet" href="./main.css" />
  </head>
  <body>
    <main class="legacy-shell">
      <header class="legacy-header">
        <p class="eyebrow">Legacy H5 Archive</p>
        <h1>旧 H5 活动合集</h1>
        <p class="summary">四个历史活动已迁移为本地静态资源版本，可直接体验。</p>
      </header>
      <nav class="legacy-grid" aria-label="旧 H5 活动列表">
        <a class="legacy-link" href="./1904_tale/">
          <span class="year">1904</span>
          <strong>被遗忘的童话故事</strong>
          <span>Hilo 画布叙事</span>
        </a>
        <a class="legacy-link" href="./1905_word/">
          <span class="year">1905</span>
          <strong>第一届拼字大会</strong>
          <span>拼字互动游戏</span>
        </a>
        <a class="legacy-link" href="./1907_cp/">
          <span class="year">1907</span>
          <strong>台湾剧 CP</strong>
          <span>问答结果生成</span>
        </a>
        <a class="legacy-link" href="./1908_parade/">
          <span class="year">1908</span>
          <strong>新中国阅兵回顾</strong>
          <span>滑动视频长页</span>
        </a>
      </nav>
    </main>
  </body>
</html>
```

- [ ] **Step 4: Create `frontend/project/legacy-h5/main.css`**

Use this exact file content:

```css
:root {
  color: #1e2329;
  background: #f6f7f8;
  font-family:
    Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
}

* {
  box-sizing: border-box;
}

body {
  min-height: 100vh;
  margin: 0;
}

.legacy-shell {
  width: min(1040px, calc(100vw - 40px));
  margin: 0 auto;
  padding: 64px 0;
}

.legacy-header {
  max-width: 680px;
  margin-bottom: 28px;
}

.eyebrow {
  margin: 0 0 10px;
  color: #68707d;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: 36px;
  line-height: 1.15;
}

.summary {
  margin: 14px 0 0;
  color: #5d6570;
  font-size: 16px;
  line-height: 1.7;
}

.legacy-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.legacy-link {
  display: flex;
  min-height: 156px;
  flex-direction: column;
  justify-content: space-between;
  padding: 18px;
  border: 1px solid #d8dde4;
  border-radius: 8px;
  color: inherit;
  background: #fff;
  text-decoration: none;
}

.legacy-link:hover {
  border-color: #9aa7b7;
}

.legacy-link strong {
  display: block;
  font-size: 18px;
  line-height: 1.35;
}

.legacy-link span:last-child {
  color: #68707d;
  font-size: 14px;
}

.year {
  color: #3867d6;
  font-size: 13px;
  font-weight: 700;
}

@media (max-width: 860px) {
  .legacy-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .legacy-shell {
    width: min(100vw - 28px, 520px);
    padding: 36px 0;
  }

  h1 {
    font-size: 28px;
  }

  .legacy-grid {
    grid-template-columns: 1fr;
  }
}
```

- [ ] **Step 5: Create initial activity page files**

Create each activity page with this content, replacing `TITLE` and `ENTRY` per page:

| File | TITLE | ENTRY |
| --- | --- | --- |
| `frontend/project/legacy-h5/1904_tale/index.html` | `被遗忘的童话故事` | `./main.js` |
| `frontend/project/legacy-h5/1905_word/index.html` | `第一届拼字大会` | `./main.js` |
| `frontend/project/legacy-h5/1907_cp/index.html` | `台湾剧 CP` | `./main.js` |
| `frontend/project/legacy-h5/1908_parade/index.html` | `新中国阅兵回顾` | `./main.js` |

```html
<!doctype html>
<html lang="zh-Hans">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
    <title>TITLE</title>
  </head>
  <body>
    <div id="app"></div>
    <script type="module" src="ENTRY"></script>
  </body>
</html>
```

Create each `main.js` with this content, replacing the label per page:

```js
document.getElementById("app").textContent = "Legacy H5 activity bootstrapped";
```

- [ ] **Step 6: Run build to verify the shell passes**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
npm run build -- legacy-h5
```

Expected: PASS and output under `frontend/dist/legacy-h5`.

- [ ] **Step 7: Commit the shell**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop
git add frontend/project/legacy-h5
git commit -m "feat: 搭建 legacy-h5 多页面项目"
```

---

### Task 2: Add Legacy Runtime Scripts, Shims, Utilities, And Audit

**Files:**
- Create/copy: `frontend/project/legacy-h5/script/**`
- Create: `frontend/project/legacy-h5/legacy/shims/hilo.js`
- Create: `frontend/project/legacy-h5/legacy/shims/jquery.js`
- Create: `frontend/project/legacy-h5/legacy/shims/scroller.js`
- Create: `frontend/project/legacy-h5/legacy/shims/wx.js`
- Create: `frontend/project/legacy-h5/legacy/utils/legacy-utils.js`
- Create: `frontend/project/legacy-h5/legacy/utils/no-op-services.js`
- Create/copy: `frontend/project/legacy-h5/legacy/styles/reset.css`
- Create: `frontend/project/legacy-h5/legacy/audit.mjs`
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`

- [ ] **Step 1: Install Less support for migrated activity styles**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
npm install --save-dev less
```

Expected: `frontend/package.json` contains `less` in `devDependencies`, and `frontend/package-lock.json` is updated.

- [ ] **Step 2: Copy browser runtime scripts and reset CSS**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop
mkdir -p frontend/project/legacy-h5/script
mkdir -p frontend/project/legacy-h5/legacy/styles
rsync -a /Users/runhaozhang/Documents/project/bantang/src/script/hilo frontend/project/legacy-h5/script/
rsync -a /Users/runhaozhang/Documents/project/bantang/src/script/jquery frontend/project/legacy-h5/script/
rsync -a /Users/runhaozhang/Documents/project/bantang/src/script/zepto frontend/project/legacy-h5/script/
rsync -a /Users/runhaozhang/Documents/project/bantang/src/script/scroller frontend/project/legacy-h5/script/
cp /Users/runhaozhang/Documents/project/bantang/src/style/reset.css frontend/project/legacy-h5/legacy/styles/reset.css
```

Expected: local script files exist, including `frontend/project/legacy-h5/script/hilo/1.6.0/hilo-min.js`, and `frontend/project/legacy-h5/legacy/styles/reset.css` exists.

- [ ] **Step 3: Create `frontend/project/legacy-h5/legacy/shims/hilo.js`**

Use this exact file content:

```js
const Hilo = window.Hilo;

if (!Hilo) {
  throw new Error("Legacy runtime Hilo is missing. Load script/hilo before the module entry.");
}

export default Hilo;
```

- [ ] **Step 4: Create `frontend/project/legacy-h5/legacy/shims/jquery.js`**

Use this exact file content:

```js
const $ = window.$ || window.jQuery || window.Zepto;

if (!$) {
  throw new Error("Legacy runtime $ is missing. Load jquery or zepto before the module entry.");
}

export default $;
```

- [ ] **Step 5: Create `frontend/project/legacy-h5/legacy/shims/scroller.js`**

Use this exact file content:

```js
const Scroller = window.Scroller;

if (!Scroller) {
  throw new Error("Legacy runtime Scroller is missing. Load script/scroller before the module entry.");
}

export default Scroller;
```

- [ ] **Step 6: Create `frontend/project/legacy-h5/legacy/shims/wx.js`**

Use this exact file content:

```js
const noop = () => {};

const wx = window.wx || {
  config: noop,
  ready(callback) {
    if (typeof callback === "function") callback();
  },
  error: noop,
  onMenuShareTimeline: noop,
  onMenuShareAppMessage: noop,
  updateAppMessageShareData: noop,
  updateTimelineShareData: noop,
};

export default wx;
```

- [ ] **Step 7: Create `frontend/project/legacy-h5/legacy/utils/legacy-utils.js`**

Use this exact file content:

```js
export const toPercent = (point) => `${Number(point * 100).toFixed(2)}%`;

export const isFunc = (func) => func instanceof Function;

export const getRandomElementFromArray = (arr) =>
  arr[Math.floor(Math.random() * arr.length)];

export const isWeixin = () => false;

export const isAndroid = () => {
  const ua = navigator.userAgent;
  return ua.includes("Android") || ua.includes("Adr");
};

export const isIOS = () => /\(i[^;]+;( U;)? CPU.+Mac OS X/.test(navigator.userAgent);

export const getRandomNumBoth = (min, max) => {
  const range = max - min;
  return min + Math.round(Math.random() * range);
};

export const getStringCodeLength = (str) =>
  String(str)
    .split("")
    .reduce((length, char) => length + (char.charCodeAt(0) < 299 ? 1 : 2), 0);

export const produceRandomString = (length = 5) =>
  Array.from({ length }, () => Math.floor(Math.random() * 36).toString(36)).join("");
```

- [ ] **Step 8: Create `frontend/project/legacy-h5/legacy/utils/no-op-services.js`**

Use this exact file content:

```js
export const bindWX = () => {};

export const eventTracking = () => {};

export const allowSensitiveText = (value) => ({
  allowed: String(value).trim().length > 0,
  reason: String(value).trim().length > 0 ? "" : "empty",
});

export const getLocalUserInfo = () => ({
  id: "legacy-local-user",
  nickName: "本地体验用户",
  headUrl: "",
});

export const saveLocalResult = () => true;
```

- [ ] **Step 9: Create `frontend/project/legacy-h5/legacy/audit.mjs`**

Use this exact file content:

```js
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

const requiredPaths = [
  "index.html",
  "vite.config.ts",
  "legacy/shims/hilo.js",
  "legacy/shims/jquery.js",
  "legacy/shims/scroller.js",
  "legacy/shims/wx.js",
  "legacy/utils/legacy-utils.js",
  "legacy/utils/no-op-services.js",
  "script/hilo/1.4.2/hilo-min.js",
  "script/hilo/1.6.0/hilo-min.js",
  "script/jquery/3.4.1/jquery.min.js",
  "script/zepto/1.2.0/zepto.min.js",
  "script/scroller/1.2.2/Animate.js",
  "script/scroller/1.2.2/Scroller.js",
  "legacy/styles/reset.css",
  "1904_tale/index.html",
  "1905_word/index.html",
  "1907_cp/index.html",
  "1908_parade/index.html",
];

const forbiddenPatterns = [
  { pattern: /\{\{htmlWebpackPlugin/g, label: "html-webpack-plugin template variable" },
  { pattern: /\{\{!--/g, label: "handlebars comment" },
  { pattern: /assetCDNPath|scriptCDNPath/g, label: "legacy CDN template variable" },
  { pattern: /api\.k\.sohu\.com/g, label: "old Sohu API host" },
  { pattern: /\/api\/spell\//g, label: "old spell API" },
  { pattern: /getWeiXin|weiXinRegister|WeiXinJsSign/g, label: "WeChat backend flow" },
  { pattern: /open\.weixin\.qq\.com/g, label: "WeChat OAuth redirect" },
  { pattern: /res2\.wx\.qq\.com\/open\/js\/jweixin/g, label: "remote WeChat JS SDK" },
  { pattern: /sugar\.k\.sohu\.com/g, label: "old sugar host" },
  { pattern: /k\.sohu\.com\/static\/sugar-workshop\/19/g, label: "old project CDN path" },
  { pattern: /config\/Env\.json/g, label: "missing legacy Env config" },
  { pattern: /components\/(common|util)\//g, label: "old shared component import" },
];

const scanExtensions = new Set([".html", ".js", ".css", ".less", ".ts"]);

const walk = (dir) => {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  return entries.flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    const rel = path.relative(projectRoot, fullPath);
    if (entry.isDirectory()) {
      if (rel.startsWith("script")) return [];
      return walk(fullPath);
    }
    return scanExtensions.has(path.extname(entry.name)) ? [fullPath] : [];
  });
};

let failed = false;

for (const rel of requiredPaths) {
  if (!fs.existsSync(path.join(projectRoot, rel))) {
    console.error(`Missing required path: ${rel}`);
    failed = true;
  }
}

for (const filePath of walk(projectRoot)) {
  const rel = path.relative(projectRoot, filePath);
  const text = fs.readFileSync(filePath, "utf8");
  for (const item of forbiddenPatterns) {
    if (item.pattern.test(text)) {
      console.error(`Forbidden ${item.label} in ${rel}`);
      failed = true;
    }
    item.pattern.lastIndex = 0;
  }
}

if (failed) {
  process.exit(1);
}

console.log("legacy-h5 audit passed");
```

- [ ] **Step 10: Run audit and build**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
node project/legacy-h5/legacy/audit.mjs
npm run build -- legacy-h5
```

Expected: both commands PASS for the shell state.

- [ ] **Step 11: Commit runtime compatibility layer**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop
git add frontend/package.json frontend/package-lock.json frontend/project/legacy-h5
git commit -m "feat: 添加 legacy-h5 运行时兼容层"
```

---

### Task 3: Migrate `1904_tale`

**Files:**
- Copy/modify: `frontend/project/legacy-h5/1904_tale/**`

- [ ] **Step 1: Copy the legacy source and assets**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop
rsync -a --delete /Users/runhaozhang/Documents/project/bantang/src/project/1904_tale/ frontend/project/legacy-h5/1904_tale/
mv frontend/project/legacy-h5/1904_tale/index.hbs frontend/project/legacy-h5/1904_tale/index.html
```

Expected: `frontend/project/legacy-h5/1904_tale/js/index.js` and `frontend/project/legacy-h5/1904_tale/asset/audio/audio.mp3` exist.

- [ ] **Step 2: Replace `frontend/project/legacy-h5/1904_tale/index.html`**

Use this exact file content:

```html
<!doctype html>
<html lang="zh-Hans">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no" />
    <title>被遗忘的童话故事</title>
  </head>
  <body>
    <h1 style="display: none">被遗忘的童话故事</h1>
    <div id="app">
      <div id="loading">
        <div class="rotate_bg">
          <img class="rotateImages" src="./asset/image/other/loading.png" alt="" />
          <div id="loadingRate"></div>
        </div>
      </div>
      <div id="stage"></div>
    </div>
    <script src="../script/hilo/1.6.0/hilo-min.js"></script>
    <script src="../script/zepto/1.2.0/zepto.min.js"></script>
    <script src="../script/scroller/1.2.2/Animate.js"></script>
    <script src="../script/scroller/1.2.2/Scroller.js"></script>
    <script type="module" src="./js/index.js"></script>
  </body>
</html>
```

- [ ] **Step 3: Remove startup service calls in `1904_tale/js/index.js`**

Modify `frontend/project/legacy-h5/1904_tale/js/index.js` so `init()` no longer calls `util.eventTracking()` or `util.bindWX()`, and `initAudio()` uses a local module URL:

```js
  init: function () {
    this.initAudio()
    // 加载静态资源
    Global.asset = new Asset()
```

```js
  initAudio: function () {
    var myaudio = Global.myAudio = new Hilo.HTMLAudio({
      src: new URL('../asset/audio/audio.mp3', import.meta.url).href,
      loop: true
    })
    myaudio.load()
  },
```

- [ ] **Step 4: Replace asset root in `1904_tale/js/class/Asset.js`**

Modify `frontend/project/legacy-h5/1904_tale/js/class/Asset.js` by replacing `let host = ''` and the old `src/project/tale` path with:

```js
const assetRoot = new URL('../../asset/image', import.meta.url).href.replace(/\/$/, '')
```

and:

```js
          src: `${assetRoot}/${sceneName}/${String(index + 1)}/${fileName}`
```

- [ ] **Step 5: Disable removed service methods in `1904_tale/js/util/util.js`**

Modify `bindWX` and `eventTracking` to no-op functions:

```js
  bindWX: function () {
  },
```

```js
  eventTracking: function () {
  },
```

- [ ] **Step 6: Run audit and build**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
node project/legacy-h5/legacy/audit.mjs
npm run build -- legacy-h5
```

Expected: PASS. If audit reports an old API/CDN pattern inside `1904_tale`, remove the service call or localize the path before continuing.

- [ ] **Step 7: Commit `1904_tale` migration**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop
git add frontend/project/legacy-h5
git commit -m "feat: 迁移 1904_tale 到 legacy-h5"
```

---

### Task 4: Migrate `1907_cp`

**Files:**
- Copy/modify: `frontend/project/legacy-h5/1907_cp/**`

- [ ] **Step 1: Copy the legacy source and assets**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop
rsync -a --delete /Users/runhaozhang/Documents/project/bantang/src/project/1907_cp/ frontend/project/legacy-h5/1907_cp/
mv frontend/project/legacy-h5/1907_cp/index.hbs frontend/project/legacy-h5/1907_cp/index.html
```

Expected: `frontend/project/legacy-h5/1907_cp/js/index.js` and `frontend/project/legacy-h5/1907_cp/asset/topic1/question.mp4` exist.

- [ ] **Step 2: Mechanically convert `1907_cp/index.html`**

Run this mechanical rewrite:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend/project/legacy-h5
node - <<'NODE'
const fs = require('node:fs')
const file = '1907_cp/index.html'
let html = fs.readFileSync(file, 'utf8')
html = html.replace(/\{\{!--[\s\S]*?--\}\}/g, '')
html = html.replaceAll('{{htmlWebpackPlugin.options.assetCDNPath}}/asset', './asset')
html = html.replaceAll('{{htmlWebpackPlugin.options.scriptCDNPath}}', '../script')
html = html.replaceAll('{{htmlWebpackPlugin.options.stamp}}', '')
html = html.replace('</body>', '  <script type="module" src="./js/index.js"></script>\n</body>')
fs.writeFileSync(file, html, 'utf8')
NODE
```

Expected: `1907_cp/index.html` uses `./asset` and `../script` only.

Also normalize the copied reset stylesheet import:

```bash
perl -0pi -e "s#import '../../../style/reset.css'#import '../../legacy/styles/reset.css'#g" 1907_cp/js/index.js
```

- [ ] **Step 3: Replace `1907_cp/js/Class/Global.js`**

Use this exact file content:

```js
// 全局对象, 单例模式, 保持唯一
const width = 750
const height = 1464
const publicPath = new URL('../../asset', import.meta.url).href.replace(/\/$/, '')

export default {
  width, // 舞台宽高
  height,
  crossOrigin: false,
  timeStamp: 'legacy-local',
  publicPath
}
```

- [ ] **Step 4: Replace old shared util imports in `1907_cp`**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend/project/legacy-h5/1907_cp
rg -l "\\.\\./\\.\\./\\.\\./\\.\\./components/util/1\\.0\\.0/index" js | xargs perl -0pi -e "s#\\.\\./\\.\\./\\.\\./\\.\\./components/util/1\\.0\\.0/index#../../../legacy/utils/legacy-utils.js#g"
rg -l "\\.\\./\\.\\./\\.\\./\\.\\./\\.\\./components/util/1\\.0\\.0/index" js | xargs perl -0pi -e "s#\\.\\./\\.\\./\\.\\./\\.\\./\\.\\./components/util/1\\.0\\.0/index#../../../../legacy/utils/legacy-utils.js#g"
```

Then inspect with:

```bash
rg "components/util|components/common" js
```

Expected: no matches for `components/util` remain. Only `components/common` imports in `js/Class/App.js` may remain; they are handled in the next step.

- [ ] **Step 5: Remove `bindWX` and tracking imports from `1907_cp/js/Class/App.js`**

Modify `frontend/project/legacy-h5/1907_cp/js/Class/App.js` so it imports only local utilities and does not call `bindWX` or `eventTracking`. Remove these imports:

```js
import {
  eventTracking
} from '../../../../components/common/1.0.0/record'
import bindWX from '../../../../components/common/1.0.0/bindwx'
```

The import section should include:

```js
import {
  isFunc
} from '../../../legacy/utils/legacy-utils.js'
```

The constructor should be:

```js
  constructor () {
    this.delayTime = 1500
    this.animationTime = 1000
    this.audio = document.getElementById('audio')
    this.answer = []
    this.nowPageIndex = 0
    this.pages = []
    this.stage = null
  }
```

- [ ] **Step 6: Replace sensitive-word API in `1907_cp/js/pages/information/index.js`**

Replace `checkNameLegal(name, cb)` with a local-only check:

```js
  checkNameLegal (name, cb) {
    if (!name) return cb(false, 'empty')
    if (getStringCodeLength(name) > 12) return cb(false, 'tooLong')
    cb(true)
    return true
  }
```

Keep the existing `submit()` flow so it still calls `this.checkNameLegal(...)`, shows local validation art, and fires `submit` when valid.

- [ ] **Step 7: Run audit and build**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
node project/legacy-h5/legacy/audit.mjs
npm run build -- legacy-h5
```

Expected: PASS. If build fails due to a wrong relative import from `1907_cp`, fix that import path before continuing.

- [ ] **Step 8: Commit `1907_cp` migration**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop
git add frontend/project/legacy-h5
git commit -m "feat: 迁移 1907_cp 到 legacy-h5"
```

---

### Task 5: Migrate `1908_parade`

**Files:**
- Copy/modify: `frontend/project/legacy-h5/1908_parade/**`

- [ ] **Step 1: Copy the legacy source and assets**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop
rsync -a --delete /Users/runhaozhang/Documents/project/bantang/src/project/1908_parade/ frontend/project/legacy-h5/1908_parade/
mv frontend/project/legacy-h5/1908_parade/index.hbs frontend/project/legacy-h5/1908_parade/index.html
```

Expected: `frontend/project/legacy-h5/1908_parade/js/index.js` and `frontend/project/legacy-h5/1908_parade/asset/common/bgm.mp3` exist.

- [ ] **Step 2: Mechanically convert `1908_parade/index.html`**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend/project/legacy-h5
node - <<'NODE'
const fs = require('node:fs')
const file = '1908_parade/index.html'
let html = fs.readFileSync(file, 'utf8')
html = html.replace(/\{\{!--[\s\S]*?--\}\}/g, '')
html = html.replaceAll('{{htmlWebpackPlugin.options.assetCDNPath}}/asset', './asset')
html = html.replaceAll('{{htmlWebpackPlugin.options.scriptCDNPath}}', '../script')
html = html.replaceAll('{{htmlWebpackPlugin.options.stamp}}', '')
html = html.replace('</body>', '  <script type="module" src="./js/index.js"></script>\n</body>')
fs.writeFileSync(file, html, 'utf8')
NODE
```

Expected: `1908_parade/index.html` uses `./asset` and `../script` only.

Also normalize the copied reset stylesheet import:

```bash
perl -0pi -e "s#import '../../../style/reset.css'#import '../../legacy/styles/reset.css'#g" 1908_parade/js/index.js
```

- [ ] **Step 3: Replace `1908_parade/js/Class/Global.js`**

Use this exact file content:

```js
// 全局对象, 单例模式, 保持唯一
const width = 750
const height = 1206
const publicPath = new URL('../../asset', import.meta.url).href.replace(/\/$/, '')

export default {
  width, // 舞台宽高
  height,
  needScrollDistance: 50,
  transferHeight: 3800,
  crossOrigin: false,
  timeStamp: 'legacy-local',
  publicPath
}
```

- [ ] **Step 4: Replace old shared util imports in `1908_parade`**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend/project/legacy-h5/1908_parade
rg -l "\\.\\./\\.\\./\\.\\./\\.\\./components/util/1\\.0\\.0/index" js | xargs perl -0pi -e "s#\\.\\./\\.\\./\\.\\./\\.\\./components/util/1\\.0\\.0/index#../../../legacy/utils/legacy-utils.js#g"
```

Then inspect with:

```bash
rg "components/util|components/common" js
```

Expected: only `components/common` imports remain in `js/Class/App.js`, handled in the next step.

- [ ] **Step 5: Remove `bindWX` and tracking imports from `1908_parade/js/Class/App.js`**

Modify `frontend/project/legacy-h5/1908_parade/js/Class/App.js` so it does not import from `components/common`, does not import `bindWX`, and does not call `bindWX(...)`. Remove these imports:

```js
import {
  eventTracking
} from '../../../../components/common/1.0.0/record'
import bindWX from '../../../../components/common/1.0.0/bindwx'
```

The constructor should be:

```js
  constructor () {
    this[index] = 0
    this[isRunTransfer] = false
    this.bgmPlaying = false
    this.shareCovar = null
    this.loadingDom = new LoadingDom()
  }
```

- [ ] **Step 6: Run audit and build**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
node project/legacy-h5/legacy/audit.mjs
npm run build -- legacy-h5
```

Expected: PASS. If build fails due to a wrong relative import from `1908_parade`, fix that import path before continuing.

- [ ] **Step 7: Commit `1908_parade` migration**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop
git add frontend/project/legacy-h5
git commit -m "feat: 迁移 1908_parade 到 legacy-h5"
```

---

### Task 6: Migrate `1905_word`

**Files:**
- Copy/modify: `frontend/project/legacy-h5/1905_word/**`

- [ ] **Step 1: Copy the legacy source and assets**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop
rsync -a --delete /Users/runhaozhang/Documents/project/bantang/src/project/1905_word/ frontend/project/legacy-h5/1905_word/
mv frontend/project/legacy-h5/1905_word/index.hbs frontend/project/legacy-h5/1905_word/index.html
```

Expected: `frontend/project/legacy-h5/1905_word/js/index.js` and `frontend/project/legacy-h5/1905_word/asset/video/begin.mp4` exist.

- [ ] **Step 2: Replace `frontend/project/legacy-h5/1905_word/index.html`**

Use this exact file content:

```html
<!doctype html>
<html lang="zh-Hans">
  <head>
    <meta charset="UTF-8" />
    <meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1" />
    <meta name="x5-orientation" content="portrait" />
    <meta name="screen-orientation" content="portrait" />
    <meta
      name="viewport"
      content="width=device-width, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no"
    />
    <link rel="icon" href="./asset/image/favicon.ico" type="image/x-icon" />
    <title>第一届拼字大会</title>
  </head>
  <body>
    <div id="loading">
      <img id="loading_img" src="./asset/image/loading.gif" alt="" />
      <div id="loadingRate"></div>
    </div>
    <div id="app">
      <div id="begin">
        <div id="begin_bg">
          <img src="./asset/image/game/bg/0.jpg" alt="" />
          <img src="./asset/image/game/bg/star/0.png" alt="" />
        </div>
        <div id="begin_clcik">
          <video
            id="video"
            src="./asset/video/begin.mp4"
            preload="auto"
            webkit-playsinline="true"
            playsinline="true"
            x-webkit-airplay="allow"
            x5-video-player-type="h5"
            x5-video-player-fullscreen="true"
            x5-video-orientation="portraint"
            muted="muted"
          ></video>
        </div>
      </div>
      <div id="game">
        <div id="game_stage"></div>
      </div>
      <div id="share">
        <div id="share_stage"></div>
        <img id="share_img" alt="" />
      </div>
    </div>
    <script src="../script/hilo/1.4.2/hilo-min.js"></script>
    <script src="../script/zepto/1.2.0/zepto.min.js"></script>
    <script type="module" src="./js/index.js"></script>
  </body>
</html>
```

Then normalize the copied reset stylesheet import:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend/project/legacy-h5
perl -0pi -e "s#import '../../../style/reset.css'#import '../../legacy/styles/reset.css'#g" 1905_word/js/index.js
```

- [ ] **Step 3: Localize assets in `1905_word/js/Class/Resource.js`**

Modify `getAssetPath()` to return:

```js
  getAssetPath () {
    return new URL('../../asset/image/', import.meta.url).href
  }
```

- [ ] **Step 4: Force non-WeChat mode in `1905_word/js/Class/Global.js`**

Modify the exported global object so `isWX` is always false:

```js
  isWX: false,
```

If `Global.js` computes `isWX` from `getIsInWeXin()`, remove that import and use the literal `false`.

- [ ] **Step 5: Remove WeChat and tracking logic from `1905_word/js/Util/util.js`**

Modify these functions to no-op or local-only behavior:

```js
export const eventTracking = function () {
}
```

```js
export const bindWX = function () {
}
```

Keep `getQueryString`, `getUserh5Cid`, and local cookie helpers because they do not block display.

- [ ] **Step 6: Remove OAuth and avatar API flow from `1905_word/js/Page/begin.js`**

Modify `init(cb)` so it always calls `cb()` after any local setup:

```js
  init (cb) {
    cb()
  }
```

Remove or leave unused `getAvatar` and `getWXCode` methods only if they no longer contain forbidden `/api/spell` or WeChat host strings. The audit must pass.

- [ ] **Step 7: Remove save API from `1905_word/js/Area/Drag/DragArea.js`**

Modify `findRightResult(res)` so it always proceeds locally after share assets load:

```js
  findRightResult (res) {
    const assteMap = this.result.createShareAsset(res)
    const realMap = []
    Object.keys(assteMap).map(i => {
      if (assteMap[i] instanceof Array) {
        assteMap[i].forEach(ii => {
          realMap.push(`${ii}`)
        })
      } else {
        Object.keys(assteMap[i]).forEach(ii => {
          realMap.push(`${assteMap[i][ii]}`)
        })
      }
    })
    this.result.toLoadShareAsset(realMap, (queue) => {
      this.fireGoSharePage(res, assteMap, queue)
    })
  }
```

- [ ] **Step 8: Remove user info API from `1905_word/js/Area/ShareStage.js`**

Modify `getResultCount(resInfo, parent)` so it uses the existing local-storage branch unconditionally:

```js
  getResultCount (resInfo, parent) {
    let resArray = []
    const storage = localStorage.getItem('wrodResultStorage')
    if (storage) {
      resArray = JSON.parse(storage)
      localStorage.removeItem('wrodResultStorage')
    }
    const inArray = resArray.filter(i => {
      return i.id === resInfo.info.id
    })
    if (inArray.length === 0) resArray.push(resInfo.info)
    const count = resArray.length
    localStorage.setItem('wrodResultStorage', JSON.stringify(resArray))
    this.drawCount(count, parent)
  }
```

- [ ] **Step 9: Run audit and build**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
node project/legacy-h5/legacy/audit.mjs
npm run build -- legacy-h5
```

Expected: PASS. If audit reports old `/api/spell` or WeChat strings inside `1905_word`, remove those code paths before continuing.

- [ ] **Step 10: Commit `1905_word` migration**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop
git add frontend/project/legacy-h5
git commit -m "feat: 迁移 1905_word 到 legacy-h5"
```

---

### Task 7: Normalize Shared Imports And Static Resource Paths

**Files:**
- Modify: `frontend/project/legacy-h5/**/*.js`
- Modify: `frontend/project/legacy-h5/**/*.html`
- Modify: `frontend/project/legacy-h5/**/*.css`
- Modify: `frontend/project/legacy-h5/**/*.less`

- [ ] **Step 1: Run the static audit as the failing detector**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
node project/legacy-h5/legacy/audit.mjs
```

Expected: PASS. If it fails, the output gives exact files containing old backend/CDN/template/shared-import patterns.

- [ ] **Step 2: Normalize copied reset imports**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend/project/legacy-h5
perl -0pi -e "s#import '../../../style/reset.css'#import '../../legacy/styles/reset.css'#g" 1905_word/js/index.js 1907_cp/js/index.js 1908_parade/js/index.js
rg "style/reset.css|legacy/styles/reset.css" 1905_word/js/index.js 1907_cp/js/index.js 1908_parade/js/index.js
```

Expected: all three files import `../../legacy/styles/reset.css`; no file imports `../../../style/reset.css`.

- [ ] **Step 3: Inspect remaining legacy imports**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend/project/legacy-h5
rg "from ['\"](hilo|\\$|Scroller|wx)['\"]|components/|config/Env|api\\.k\\.sohu|/api/spell|htmlWebpackPlugin|assetCDNPath|scriptCDNPath" .
```

Expected allowed matches:

- `from 'hilo'`
- `from '$'`
- `from 'Scroller'`
- `from 'wx'`

Expected disallowed matches:

- `components/`
- `config/Env`
- `api.k.sohu`
- `/api/spell`
- `htmlWebpackPlugin`
- `assetCDNPath`
- `scriptCDNPath`

Remove every disallowed match.

- [ ] **Step 4: Verify no network dependencies remain in migrated source**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend/project/legacy-h5
rg "https?://|//k\\.sohu|//api\\.k\\.sohu|res2\\.wx\\.qq\\.com|open\\.weixin\\.qq\\.com" 1904_tale 1905_word 1907_cp 1908_parade
```

Expected: no matches. If matches remain in comments that are copied into shipped files, remove those comments.

- [ ] **Step 5: Run build**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
npm run build -- legacy-h5
```

Expected: PASS.

- [ ] **Step 6: Commit normalization**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop
git add frontend/project/legacy-h5
git commit -m "refactor: 清理 legacy-h5 旧服务依赖"
```

---

### Task 8: Browser Verification And Final Readiness

**Files:**
- No source file changes expected unless verification exposes a defect.

- [ ] **Step 1: Start the dev server**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
npm run dev -- legacy-h5
```

Expected: Vite dev server starts. In development, use root-relative dev URLs:

- `http://localhost:5173/`
- `http://localhost:5173/1904_tale/`
- `http://localhost:5173/1905_word/`
- `http://localhost:5173/1907_cp/`
- `http://localhost:5173/1908_parade/`

- [ ] **Step 2: Open the root page with Playwright CLI**

Run in another terminal:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
export PWCLI="$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh"
"$PWCLI" open http://localhost:5173/
```

Expected: page title `Legacy H5`, with four links visible.

- [ ] **Step 3: Open each activity with Playwright CLI**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
export CODEX_HOME="${CODEX_HOME:-$HOME/.codex}"
export PWCLI="$CODEX_HOME/skills/playwright/scripts/playwright_cli.sh"
"$PWCLI" open http://localhost:5173/1904_tale/
"$PWCLI" open http://localhost:5173/1905_word/
"$PWCLI" open http://localhost:5173/1907_cp/
"$PWCLI" open http://localhost:5173/1908_parade/
```

Expected for each page:

- No console error for missing `Hilo`, `$`, `Scroller`, or `wx`.
- No console error caused by `/api/spell`, `api.k.sohu.com`, `res2.wx.qq.com`, or old CDN assets.
- Main loading or first interactive screen appears.

- [ ] **Step 4: Run final audit and build**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
node project/legacy-h5/legacy/audit.mjs
npm run build -- legacy-h5
```

Expected: both commands PASS.

- [ ] **Step 5: Verify production-style output paths**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
find dist/legacy-h5 -maxdepth 2 -type f \( -name 'index.html' -o -name '*.js' -o -name '*.css' \) | sort | sed -n '1,120p'
```

Expected output includes:

```text
dist/legacy-h5/index.html
dist/legacy-h5/1904_tale/index.html
dist/legacy-h5/1905_word/index.html
dist/legacy-h5/1907_cp/index.html
dist/legacy-h5/1908_parade/index.html
```

- [ ] **Step 6: Commit final verification fixes if any were needed**

If verification required source changes:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop
git add frontend/project/legacy-h5
git commit -m "fix: 修复 legacy-h5 展示问题"
```

If verification required no source changes, do not create an empty commit.

- [ ] **Step 7: Report deploy command**

Do not deploy unless explicitly requested. Report this deploy command:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
npm run deploy -- legacy-h5
```

---

## Self-Review Checklist

- Spec coverage: Tasks create one independent `legacy-h5` project, migrate all four activities, localize assets/scripts, remove backend/WeChat/tracking/sensitive/save dependencies, and verify build/browser/deploy readiness.
- No backend behavior remains: audit checks old API hosts, `/api/spell`, WeChat OAuth/signature strings, Sohu CDN paths, HBS template variables, missing `Env.json`, and old shared component imports.
- Type consistency: shim export names match Vite aliases; local utility exports match old component utility names used by `1907_cp` and `1908_parade`.
- Deployment consistency: the final project uses existing `npm run build -- legacy-h5` and `npm run deploy -- legacy-h5`.
