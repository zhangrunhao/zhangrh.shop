# About Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Complete the Hub `/about` page using only the user-provided “关于我” copy and contact details.

**Architecture:** Keep the feature local to the existing Hub page component. Add a focused Node source test that reads `about-page.tsx` and `constants.ts`, matching the repository’s current lightweight page tests. Render the copy in `AboutPage` with the existing `Link`, icon, and shared contact constants.

**Tech Stack:** React 19, TypeScript TSX, Tailwind CSS, Node `node:test`, Vite.

---

## File Structure

- Create `frontend/project/hub/pages/about-page.test.mjs`: source-level regression tests for the required about copy, contact details, and removed old copy.
- Modify `frontend/project/hub/pages/about-page.tsx`: replace the current placeholder-like page with a正文型 page using the provided text and contact details.

## Task 1: About Page Content

**Files:**
- Create: `frontend/project/hub/pages/about-page.test.mjs`
- Modify: `frontend/project/hub/pages/about-page.tsx`
- Test: `frontend/project/hub/pages/about-page.test.mjs`

- [ ] **Step 1: Write the failing test**

Create `frontend/project/hub/pages/about-page.test.mjs` with this content:

```js
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const hubRoot = path.resolve(currentDir, "..");

const readHubFile = (relativePath) =>
  fs.readFileSync(path.join(hubRoot, relativePath), "utf8");

test("about page uses the provided copy", () => {
  const aboutPage = readHubFile("pages/about-page.tsx");

  assert.match(aboutPage, />\s*关于我\s*</);
  assert.match(aboutPage, /我是一个前端开发者。/);
  assert.match(aboutPage, /这个网站用来放我做过的作品和写过的文章。/);
  assert.match(
    aboutPage,
    /我正在尝试用 AI 编程做一些真实项目，也会记录项目过程中的思考、问题和复盘。/,
  );
  assert.match(
    aboutPage,
    /你可以在这里看到我的作品、文章，以及我对 AI 编程和独立开发的一些实践。/,
  );
});

test("about page shows the provided contact details", () => {
  const aboutPage = readHubFile("pages/about-page.tsx");
  const constants = readHubFile("shared/constants.ts");

  assert.match(aboutPage, />\s*联系方式\s*</);
  assert.match(aboutPage, /GitHub:\s*/);
  assert.match(aboutPage, /Email:\s*/);
  assert.match(aboutPage, /https:\/\/github\.com\/zhangrunhao/);
  assert.match(aboutPage, /runhaozhang\.dev@gmail\.com/);
  assert.match(constants, /GITHUB_LINK = "https:\/\/github\.com\/zhangrunhao"/);
  assert.match(constants, /EMAIL_LINK = "mailto:runhaozhang\.dev@gmail\.com"/);
});

test("about page removes old introduction copy", () => {
  const aboutPage = readHubFile("pages/about-page.tsx");

  assert.doesNotMatch(aboutPage, /个人产品实践者/);
  assert.doesNotMatch(aboutPage, /持续用设计和开发把想法变成可用的产品/);
  assert.doesNotMatch(aboutPage, /欢迎交流产品、设计和工程实现。/);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run:

```bash
cd frontend
node --test project/hub/pages/about-page.test.mjs
```

Expected: FAIL because `about-page.tsx` still contains the old intro copy and does not yet include every provided paragraph/contact detail.

- [ ] **Step 3: Replace the AboutPage implementation**

Replace `frontend/project/hub/pages/about-page.tsx` with this content:

```tsx
import { EMAIL_LINK, GITHUB_LINK } from "../shared/constants";
import { ExternalIcon, GitHubIcon, MailIcon } from "../components/icons";
import { Link } from "../components/link";

const aboutParagraphs = [
  "我是一个前端开发者。",
  "这个网站用来放我做过的作品和写过的文章。",
  "我正在尝试用 AI 编程做一些真实项目，也会记录项目过程中的思考、问题和复盘。",
  "你可以在这里看到我的作品、文章，以及我对 AI 编程和独立开发的一些实践。",
] as const;

export const AboutPage = () => (
  <section className="pb-16 pt-10 md:pt-14">
    <div className="border-b border-[#e5e5e5] pb-10">
      <h1 className="text-[32px] font-semibold leading-10 tracking-normal text-[#171717] md:text-[40px] md:leading-[48px]">
        关于我
      </h1>
    </div>

    <div className="grid gap-6 pt-8 lg:grid-cols-[minmax(0,1fr)_360px]">
      <article className="rounded-lg border border-[#e5e5e5] bg-white p-6 md:p-8">
        <div className="max-w-3xl space-y-5 text-base leading-8 tracking-normal text-[#404040]">
          {aboutParagraphs.map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
      </article>

      <aside className="rounded-lg border border-[#e5e5e5] bg-white p-6">
        <h2 className="text-[22px] font-semibold leading-8 tracking-normal text-[#171717]">
          联系方式
        </h2>

        <dl className="mt-5 space-y-4 text-sm leading-6 tracking-normal">
          <div>
            <dt className="font-medium text-[#171717]">GitHub:</dt>
            <dd className="mt-1 break-all text-[#525252]">
              https://github.com/zhangrunhao
            </dd>
          </div>
          <div>
            <dt className="font-medium text-[#171717]">Email:</dt>
            <dd className="mt-1 break-all text-[#525252]">
              runhaozhang.dev@gmail.com
            </dd>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to={EMAIL_LINK}
            className="inline-flex h-10 items-center gap-2 rounded-lg bg-[#009966] px-4 text-sm font-medium tracking-normal text-white transition-colors hover:bg-[#00885c]"
          >
            <MailIcon />
            Email
          </Link>
          <Link
            to={GITHUB_LINK}
            className="inline-flex h-10 items-center gap-2 rounded-lg border border-[#d4d4d4] bg-white px-4 text-sm font-medium tracking-normal text-[#404040] transition-colors hover:border-[#171717] hover:text-[#171717]"
          >
            <GitHubIcon />
            GitHub
            <ExternalIcon />
          </Link>
        </div>
      </aside>
    </div>
  </section>
);
```

- [ ] **Step 4: Run the focused test to verify it passes**

Run:

```bash
cd frontend
node --test project/hub/pages/about-page.test.mjs
```

Expected: PASS with output containing `# pass 3` and `# fail 0`.

- [ ] **Step 5: Run related Hub page tests**

Run:

```bash
cd frontend
node --test project/hub/pages/about-page.test.mjs project/hub/pages/home-page-layout.test.mjs project/hub/pages/list-pages.test.mjs
```

Expected: PASS with output containing no failing tests.

- [ ] **Step 6: Build the Hub project**

Run:

```bash
cd frontend
npm run build hub
```

Expected: Vite completes successfully and writes the Hub build output.

- [ ] **Step 7: Commit the implementation**

Run:

```bash
git add frontend/project/hub/pages/about-page.tsx frontend/project/hub/pages/about-page.test.mjs
git commit -m "feat: 完成关于我页面"
```

Expected: commit succeeds and includes only the about page implementation and its focused test.
