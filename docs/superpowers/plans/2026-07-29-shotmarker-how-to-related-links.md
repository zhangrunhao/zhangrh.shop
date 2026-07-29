# ShotMarker How-to Related Links Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the Hub ShotMarker card open the How-to page and add Support, Privacy, and zhangrh.shop navigation cards to the bottom of that page.

**Architecture:** Keep the Hub destination in the existing `works.json` contract. Define the three How-to navigation items once in ShotMarker's content module, render them through the existing custom How-to page, and verify both data and SSR output with Node tests.

**Tech Stack:** React 19, TypeScript, Vite SSR, CSS, Node.js test runner

---

## File map

- Modify `frontend/project/hub/data/works.json`: change the only ShotMarker destination URL.
- Modify `frontend/project/hub/data/works.test.mjs`: lock the new absolute Hub destination.
- Modify `frontend/project/shotmarker/content.ts`: own the three related-link records and their URLs.
- Modify `frontend/project/shotmarker/app.tsx`: render the related-link records at the bottom of `HowToPage`.
- Modify `frontend/project/shotmarker/styles.css`: add the responsive three-card presentation.
- Create `frontend/project/shotmarker/how-to-page-render.test.mjs`: load ShotMarker through Vite SSR and verify the data and rendered links.

### Task 1: Point the Hub work card to ShotMarker How-to

**Files:**

- Modify: `frontend/project/hub/data/works.test.mjs:12-14`
- Modify: `frontend/project/hub/data/works.json:6`

- [ ] **Step 1: Change the data-contract test first**

Replace the expected link in `frontend/project/hub/data/works.test.mjs`:

```js
const expectedWorkLinks = {
  "20260517_shotmarker": "https://zhangrh.shop/shotmarker/how-to",
};
```

- [ ] **Step 2: Run the focused test and verify it fails**

Run:

```bash
cd frontend
node --test project/hub/data/works.test.mjs
```

Expected: FAIL because `works.json` still contains `https://zhangrh.shop/shotmarker/support`.

- [ ] **Step 3: Make the minimal data change**

Set the ShotMarker record in `frontend/project/hub/data/works.json` to:

```json
{
  "id": "20260517_shotmarker",
  "name": "ShotMarker Support",
  "summary": "ShotMarker 的支持与隐私页面，承载产品发布后的公开信息。",
  "link": "https://zhangrh.shop/shotmarker/how-to",
  "coverImage": "works/20260517_shotmarker/cover.png",
  "status": "active"
}
```

Do not change the data shape, ID, cover path, status, name, or summary in this task.

- [ ] **Step 4: Run the focused test and verify it passes**

Run:

```bash
cd frontend
node --test project/hub/data/works.test.mjs
```

Expected: 1 test passes, 0 fail.

- [ ] **Step 5: Commit the Hub link change**

```bash
git add frontend/project/hub/data/works.json frontend/project/hub/data/works.test.mjs
git commit -m "fix: 更新 ShotMarker 作品入口"
```

### Task 2: Add related navigation cards to the How-to page

**Files:**

- Create: `frontend/project/shotmarker/how-to-page-render.test.mjs`
- Modify: `frontend/project/shotmarker/content.ts:1-38`
- Modify: `frontend/project/shotmarker/app.tsx:2-12,119-186`
- Modify: `frontend/project/shotmarker/styles.css:161-164,354-379,431-483`

- [ ] **Step 1: Create the failing SSR render test**

Create `frontend/project/shotmarker/how-to-page-render.test.mjs`:

```js
import assert from "node:assert/strict";
import { access, mkdtemp, rm } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const configFile = path.join(currentDir, "vite.config.ts");

const escapeRegExp = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

test("How-to page renders the confirmed related links", async () => {
  const cacheDir = await mkdtemp(
    path.join(os.tmpdir(), "shotmarker-how-to-render-test-"),
  );
  let server;

  try {
    server = await createServer({
      appType: "custom",
      cacheDir,
      configFile,
      logLevel: "silent",
      optimizeDeps: {
        noDiscovery: true,
        include: [],
      },
      server: {
        middlewareMode: true,
        ws: false,
      },
    });

    const { HowToPage } = await server.ssrLoadModule("/app.tsx");
    const { HOW_TO_RELATED_LINKS } = await server.ssrLoadModule("/content.ts");

    assert.equal(typeof HowToPage, "function");
    assert.deepEqual(HOW_TO_RELATED_LINKS, [
      {
        title: "ShotMarker Support",
        description: "获取使用帮助、反馈问题。",
        href: "/shotmarker/support",
      },
      {
        title: "Privacy Policy",
        description: "查看 ShotMarker 隐私政策。",
        href: "/shotmarker/privacy",
      },
      {
        title: "zhangrh.shop",
        description: "返回 zhangrh.shop 作品主页。",
        href: "https://zhangrh.shop/hub/",
      },
    ]);

    const html = renderToStaticMarkup(createElement(HowToPage));

    assert.match(html, /<h2 id="how-to-related-links-title">相关链接<\/h2>/);

    for (const link of HOW_TO_RELATED_LINKS) {
      const anchor = html.match(
        new RegExp(
          `<a[^>]*href="${escapeRegExp(link.href)}"[^>]*>[\\s\\S]*?<\\/a>`,
        ),
      )?.[0];

      assert.ok(anchor);
      assert.ok(anchor.includes(link.title));
      assert.ok(anchor.includes(link.description));
      assert.doesNotMatch(anchor, /\starget=/);
    }
  } finally {
    try {
      await server?.close();
    } finally {
      await rm(cacheDir, { force: true, recursive: true });
      await assert.rejects(
        access(cacheDir),
        (error) => error?.code === "ENOENT",
      );
    }
  }
});
```

- [ ] **Step 2: Run the new test and verify it fails**

Run:

```bash
cd frontend
node --test project/shotmarker/how-to-page-render.test.mjs
```

Expected: FAIL because `HowToPage` and `HOW_TO_RELATED_LINKS` are not exported yet.

- [ ] **Step 3: Define the related-link content**

After the existing path constants in `frontend/project/shotmarker/content.ts`, add:

```ts
export const ZHANGRH_SHOP_URL = "https://zhangrh.shop/hub/";

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
```

- [ ] **Step 4: Render the related links in `HowToPage`**

Add `HOW_TO_RELATED_LINKS` to the import from `./content` in `frontend/project/shotmarker/app.tsx`.

Change the declaration to export the page:

```tsx
export const HowToPage = () => (
```

Immediately after the existing `how-to-tips` section and before `</main>`, add:

```tsx
    <section
      className="how-to-related-links"
      aria-labelledby="how-to-related-links-title"
    >
      <div className="how-to-section-title compact">
        <h2 id="how-to-related-links-title">相关链接</h2>
      </div>
      <div className="how-to-related-link-grid">
        {HOW_TO_RELATED_LINKS.map((link) => (
          <a className="how-to-related-link" href={link.href} key={link.href}>
            <h3>{link.title}</h3>
            <p>{link.description}</p>
            <span aria-hidden="true">→</span>
          </a>
        ))}
      </div>
    </section>
```

Do not add `target` or `rel`; all three links intentionally navigate in the current tab.

- [ ] **Step 5: Add the responsive card styles**

Extend the shared width selector in `frontend/project/shotmarker/styles.css`:

```css
.how-to-hero-inner,
.how-to-steps,
.how-to-tips,
.how-to-related-links {
  width: min(1120px, 100%);
  margin: 0 auto;
}
```

After the `.how-to-tip span` rule, add:

```css
.how-to-page .how-to-related-links {
  padding: 18px 24px 92px;
}

.how-to-related-link-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 14px;
  border-top: 1px solid #d7d7dc;
  padding-top: 28px;
}

.how-to-related-link {
  min-height: 156px;
  position: relative;
  display: grid;
  align-content: start;
  gap: 10px;
  border: 1px solid #d7d7dc;
  border-radius: 8px;
  background: #ffffff;
  color: #111111;
  padding: 22px 52px 22px 22px;
  text-decoration: none;
  transition:
    border-color 160ms ease,
    transform 160ms ease;
}

.how-to-related-link:hover,
.how-to-related-link:focus-visible {
  border-color: #0071e3;
  transform: translateY(-2px);
}

.how-to-related-link:focus-visible {
  outline: 3px solid rgba(0, 113, 227, 0.22);
  outline-offset: 3px;
}

.how-to-related-link h3 {
  margin: 0;
  font-size: 20px;
  line-height: 1.2;
}

.how-to-related-link p {
  margin: 0;
  color: #6e6e73;
  font-size: 15px;
  line-height: 1.5;
  font-weight: 500;
}

.how-to-related-link span {
  position: absolute;
  top: 20px;
  right: 22px;
  color: #0071e3;
  font-size: 22px;
  line-height: 1;
}
```

In the existing `@media (max-width: 920px)` block, extend the single-column rule:

```css
.how-to-tip-grid,
.how-to-related-link-grid {
  grid-template-columns: 1fr;
}
```

In the existing `@media (max-width: 560px)` block, extend the horizontal-padding selector:

```css
.how-to-page .how-to-steps,
.how-to-page .how-to-tips,
.how-to-page .how-to-related-links {
  padding-left: 18px;
  padding-right: 18px;
}
```

- [ ] **Step 6: Run the focused render test and verify it passes**

Run:

```bash
cd frontend
node --test project/shotmarker/how-to-page-render.test.mjs
```

Expected: 1 test passes, 0 fail.

- [ ] **Step 7: Commit the How-to related links**

```bash
git add \
  frontend/project/shotmarker/content.ts \
  frontend/project/shotmarker/app.tsx \
  frontend/project/shotmarker/styles.css \
  frontend/project/shotmarker/how-to-page-render.test.mjs
git commit -m "feat: 添加 ShotMarker 相关链接"
```

### Task 3: Run complete local verification

**Files:**

- Verify only; no planned source changes.

- [ ] **Step 1: Run every JavaScript test in the frontend**

Run:

```bash
cd frontend
rg --files . -g '*.test.mjs' -0 | sort -z | xargs -0 node --test
```

Expected: all tests pass with 0 failures, including `how-to-page-render.test.mjs`.

- [ ] **Step 2: Run TypeScript and lint checks**

Run:

```bash
cd frontend
npx tsc -b --pretty false
npm run lint
```

Expected: both commands exit 0 with no TypeScript or ESLint errors.

- [ ] **Step 3: Build both affected projects**

Run:

```bash
cd frontend
npm run build -- hub
npm run build -- shotmarker
```

Expected:

- `dist/hub/index.html` and hashed files under `dist/hub/static/`.
- `dist/shotmarker/index.html` and hashed files under `dist/shotmarker/static/`.
- both Vite builds exit 0.

- [ ] **Step 4: Run workspace publishing tests and repository checks**

Run:

```bash
npm test
git diff --check
git status --short
```

Expected:

- root tests pass with 0 failures;
- `git diff --check` prints nothing;
- no generated `dist`, cache, lockfile, or unrelated file is listed.

### Task 4: Push and publish the verified Hub and ShotMarker builds

**Files:**

- Publish verified committed source; do not modify source during this task.

- [ ] **Step 1: Confirm the branch contains only the intended lineage**

Run:

```bash
git log --oneline --decorate origin/main..HEAD
git status --short --branch
```

Expected: only the design, plan, Hub-link, and How-to-related-link commits are ahead of `origin/main`; the worktree is clean.

- [ ] **Step 2: Dry-run and push the reviewed branch to remote `main`**

Run:

```bash
git push --dry-run https://github.com/zhangrunhao/zhangrh.shop.git HEAD:main
git push https://github.com/zhangrunhao/zhangrh.shop.git HEAD:main
```

Expected: a fast-forward update of remote `main`; no force push.

- [ ] **Step 3: Build, upload, and deploy Hub from the exact pushed commit**

Run:

```bash
cd frontend
ZHANGRH_SHOP_PUBLISH_OSS_ASSETS=1 npm run build -- hub
node scripts/publish-oss-assets.mjs hub
node scripts/deploy-static.mjs hub
```

Expected: Hub JS, CSS, favicon, and cover are uploaded to OSS; the rewritten Hub HTML is deployed to `/opt/zhangrh-shop/site/hub/`.

- [ ] **Step 4: Build, upload, and deploy ShotMarker from the exact pushed commit**

Run:

```bash
cd frontend
ZHANGRH_SHOP_PUBLISH_OSS_ASSETS=1 npm run build -- shotmarker
node scripts/publish-oss-assets.mjs shotmarker
node scripts/deploy-static.mjs shotmarker
```

Expected: ShotMarker JS, CSS, favicon, and How-to images are uploaded to OSS; the rewritten HTML is deployed to `/opt/zhangrh-shop/site/shotmarker/`.

- [ ] **Step 5: Verify the production entry points and assets**

Run:

```bash
hub_html=$(mktemp)
shotmarker_html=$(mktemp)

curl -fsS --max-time 20 -H 'Cache-Control: no-cache' \
  'https://zhangrh.shop/hub/?verify=shotmarker-how-to-links' \
  -o "$hub_html"
curl -fsS --max-time 20 -H 'Cache-Control: no-cache' \
  'https://zhangrh.shop/shotmarker/how-to?verify=related-links' \
  -o "$shotmarker_html"

hub_js=$(rg -o 'https://static\.zhangrh\.shop/[^" ]+\.js' "$hub_html" | head -n 1)
shotmarker_js=$(rg -o 'https://static\.zhangrh\.shop/[^" ]+\.js' "$shotmarker_html" | head -n 1)

test -n "$hub_js"
test -n "$shotmarker_js"
curl -fsS --max-time 20 "$hub_js" | rg -q 'https://zhangrh\.shop/shotmarker/how-to'
curl -fsS --max-time 20 "$shotmarker_js" | rg -q '/shotmarker/support'
curl -fsS --max-time 20 "$shotmarker_js" | rg -q '/shotmarker/privacy'
curl -fsS --max-time 20 "$shotmarker_js" | rg -q 'https://zhangrh\.shop/hub/'
```

Expected: both production HTML documents and both OSS JavaScript bundles return successfully, and all four confirmed destination URLs are present in the deployed bundles.
