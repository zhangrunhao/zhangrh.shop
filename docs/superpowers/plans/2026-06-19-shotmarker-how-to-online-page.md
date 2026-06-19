# ShotMarker Online How-To Page Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an online ShotMarker user instruction page at `/shotmarker/how-to`.

**Architecture:** Extend the existing `frontend/project/shotmarker` Vite app with a third content route. The how-to page uses structured React content and local screenshots copied into the project asset folder.

**Tech Stack:** React, TypeScript, Vite, Node test runner.

---

### Task 1: Route and Content Contract

**Files:**
- Modify: `frontend/project/shotmarker/shared/route.ts`
- Modify: `frontend/project/shotmarker/shared/route.test.ts`
- Modify: `frontend/project/shotmarker/content.ts`
- Modify: `frontend/project/shotmarker/content.test.ts`

- [ ] **Step 1: Write failing route tests**

Add assertions that `resolveRoute("/shotmarker/how-to")` and `resolveRoute("/how-to")` return `{ name: "how-to" }`.

- [ ] **Step 2: Write failing content tests**

Add assertions for `HOW_TO_PATH === "/shotmarker/how-to"` and required Chinese copy including `用 Apple Watch 给好球打点`, `打开 iPhone 里的训练记录`, and `选择视频，生成集锦`.

- [ ] **Step 3: Run tests and verify RED**

Run the frontend TypeScript check:

Run:

```bash
npm exec tsc -- --noEmit -p tsconfig.app.json
```

Expected: failures because the route and content do not exist yet.

- [ ] **Step 4: Implement route and content**

Add `how-to` to the route union, return it for `/how-to`, and add a structured `howToPage` export plus `HOW_TO_PATH`.

- [ ] **Step 5: Run tests and verify GREEN**

Run the same TypeScript check. Expected: it passes.

### Task 2: UI and Assets

**Files:**
- Modify: `frontend/project/shotmarker/app.tsx`
- Modify: `frontend/project/shotmarker/styles.css`
- Create: `frontend/project/shotmarker/assets/how-to/apple-watch-49mm.jpg`
- Create: `frontend/project/shotmarker/assets/how-to/iphone-training-records.png`
- Create: `frontend/project/shotmarker/assets/how-to/iphone-highlight-ready.png`
- Create: `frontend/project/shotmarker/assets/how-to/iphone-highlight-generate.png`

- [ ] **Step 1: Copy assets**

Copy the four existing screenshots from the ShotMarker app repository into the ShotMarker frontend project.

- [ ] **Step 2: Render the how-to route**

Add a `HowToPage` React component that uses imported image assets, renders the hero, three steps, and tips.

- [ ] **Step 3: Add focused CSS**

Add `.how-to-*` styles that keep the guide responsive and avoid changing the support/privacy page layout.

- [ ] **Step 4: Build**

Run:

```bash
npm run build -- shotmarker
```

Expected: Vite builds `dist/shotmarker` successfully.

### Task 3: Local Preview and Publish Path

**Files:**
- Read: `frontend/dist/shotmarker/index.html`

- [ ] **Step 1: Preview built page locally**

Run:

```bash
npm run preview -- shotmarker -- --host 127.0.0.1
```

Open `http://127.0.0.1:<port>/shotmarker/how-to` and verify page text and images load.

- [ ] **Step 2: Publish if credentials and clean pull permit**

Use the existing publishing flow:

```bash
npm run publish -- shotmarker
```

If the publish flow is blocked by dirty unrelated work, missing credentials, or remote access, report the exact blocker and provide the verified local URL/path.
