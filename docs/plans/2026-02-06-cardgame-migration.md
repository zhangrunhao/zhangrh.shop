# Cardgame Migration Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Migrate the 20250126-card_game02 frontend/backend into the 20250120_cardgame project with a new API/WS prefix and register it in the backend server.

**Architecture:** Full copy of frontend project into the new directory, then update API/WS prefix strings. Backend clones the existing module, updates prefix/health metadata, and registers the new module in `server.js`. No gameplay changes.

**Tech Stack:** Vite + React (frontend), Express + ws (backend).

### Task 1: Copy Frontend Project

**Files:**
- Create: `/Users/runhaozhang/Documents/project/zhangrh.top/.worktrees/codex/migrate-cardgame-20250120/frontend/project/20250120_cardgame/*`
- Read: `/Users/runhaozhang/Documents/project/zhangrh.top/.worktrees/codex/migrate-cardgame-20250120/frontend/project/20250126-card_game02/*`

**Step 1: Create destination directory**

Run: `mkdir -p /Users/runhaozhang/Documents/project/zhangrh.top/.worktrees/codex/migrate-cardgame-20250120/frontend/project/20250120_cardgame`
Expected: directory exists.

**Step 2: Copy all files**

Run: `rsync -a --delete /Users/runhaozhang/Documents/project/zhangrh.top/.worktrees/codex/migrate-cardgame-20250120/frontend/project/20250126-card_game02/ /Users/runhaozhang/Documents/project/zhangrh.top/.worktrees/codex/migrate-cardgame-20250120/frontend/project/20250120_cardgame/`
Expected: new project matches source.

**Step 3: Commit**

Run:
```bash
git -C /Users/runhaozhang/Documents/project/zhangrh.top/.worktrees/codex/migrate-cardgame-20250120 add /Users/runhaozhang/Documents/project/zhangrh.top/.worktrees/codex/migrate-cardgame-20250120/frontend/project/20250120_cardgame

git -C /Users/runhaozhang/Documents/project/zhangrh.top/.worktrees/codex/migrate-cardgame-20250120 commit -m "chore: copy cardgame02 frontend to cardgame"
```
Expected: new frontend project committed.

### Task 2: Update Frontend API/WS Prefix

**Files:**
- Modify: `/Users/runhaozhang/Documents/project/zhangrh.top/.worktrees/codex/migrate-cardgame-20250120/frontend/project/20250120_cardgame/app.tsx`

**Step 1: Replace prefix strings**

Run: `rg -n "/api/20250126-card_game02" /Users/runhaozhang/Documents/project/zhangrh.top/.worktrees/codex/migrate-cardgame-20250120/frontend/project/20250120_cardgame/app.tsx`
Expected: occurrences found.

**Step 2: Update to new prefix**

Edit `app.tsx` to replace `/api/20250126-card_game02` with `/api/20250120_cardgame` (including WS URL construction).

**Step 3: Verify no old prefix remains**

Run: `rg -n "20250126-card_game02" /Users/runhaozhang/Documents/project/zhangrh.top/.worktrees/codex/migrate-cardgame-20250120/frontend/project/20250120_cardgame`
Expected: no matches.

**Step 4: Commit**

Run:
```bash
git -C /Users/runhaozhang/Documents/project/zhangrh.top/.worktrees/codex/migrate-cardgame-20250120 add /Users/runhaozhang/Documents/project/zhangrh.top/.worktrees/codex/migrate-cardgame-20250120/frontend/project/20250120_cardgame/app.tsx

git -C /Users/runhaozhang/Documents/project/zhangrh.top/.worktrees/codex/migrate-cardgame-20250120 commit -m "chore: update cardgame frontend api prefix"
```
Expected: prefix update committed.

### Task 3: Create Backend Module

**Files:**
- Create: `/Users/runhaozhang/Documents/project/zhangrh.top/.worktrees/codex/migrate-cardgame-20250120/backend/projects/20250120_cardgame.js`
- Read: `/Users/runhaozhang/Documents/project/zhangrh.top/.worktrees/codex/migrate-cardgame-20250120/backend/projects/20250126-card_game02.js`

**Step 1: Copy backend module**

Run: `cp /Users/runhaozhang/Documents/project/zhangrh.top/.worktrees/codex/migrate-cardgame-20250120/backend/projects/20250126-card_game02.js /Users/runhaozhang/Documents/project/zhangrh.top/.worktrees/codex/migrate-cardgame-20250120/backend/projects/20250120_cardgame.js`
Expected: new file created.

**Step 2: Update prefix and metadata**

Edit `20250120_cardgame.js`:
- Change export prefix constant name/value to `/api/20250120_cardgame`.
- Update health response `project` string to `20250120_cardgame`.
- Rename `registerCardGame02` to `registerCardGame20250120` (or similar consistent name) and update export.

**Step 3: Commit**

Run:
```bash
git -C /Users/runhaozhang/Documents/project/zhangrh.top/.worktrees/codex/migrate-cardgame-20250120 add /Users/runhaozhang/Documents/project/zhangrh.top/.worktrees/codex/migrate-cardgame-20250120/backend/projects/20250120_cardgame.js

git -C /Users/runhaozhang/Documents/project/zhangrh.top/.worktrees/codex/migrate-cardgame-20250120 commit -m "feat: add cardgame backend module"
```
Expected: new backend module committed.

### Task 4: Register Backend Module

**Files:**
- Modify: `/Users/runhaozhang/Documents/project/zhangrh.top/.worktrees/codex/migrate-cardgame-20250120/backend/server.js`

**Step 1: Add import**

Edit `server.js` to import the new module, e.g.:
`import { registerCardGame20250120 } from './projects/20250120_cardgame.js'`

**Step 2: Register module**

Add `registerCardGame20250120({ app, server })` near existing registrations.

**Step 3: Commit**

Run:
```bash
git -C /Users/runhaozhang/Documents/project/zhangrh.top/.worktrees/codex/migrate-cardgame-20250120 add /Users/runhaozhang/Documents/project/zhangrh.top/.worktrees/codex/migrate-cardgame-20250120/backend/server.js

git -C /Users/runhaozhang/Documents/project/zhangrh.top/.worktrees/codex/migrate-cardgame-20250120 commit -m "chore: register cardgame backend"
```
Expected: server registration committed.

### Task 5: Sanity Checks (No Tests)

**Files:**
- Read: `/Users/runhaozhang/Documents/project/zhangrh.top/.worktrees/codex/migrate-cardgame-20250120/frontend/project/20250120_cardgame/app.tsx`
- Read: `/Users/runhaozhang/Documents/project/zhangrh.top/.worktrees/codex/migrate-cardgame-20250120/backend/projects/20250120_cardgame.js`
- Read: `/Users/runhaozhang/Documents/project/zhangrh.top/.worktrees/codex/migrate-cardgame-20250120/backend/server.js`

**Step 1: Confirm no old prefix**

Run: `rg -n "20250126-card_game02" /Users/runhaozhang/Documents/project/zhangrh.top/.worktrees/codex/migrate-cardgame-20250120/frontend/project/20250120_cardgame`
Expected: no matches.

**Step 2: Confirm new prefix**

Run: `rg -n "20250120_cardgame" /Users/runhaozhang/Documents/project/zhangrh.top/.worktrees/codex/migrate-cardgame-20250120/backend/projects/20250120_cardgame.js /Users/runhaozhang/Documents/project/zhangrh.top/.worktrees/codex/migrate-cardgame-20250120/frontend/project/20250120_cardgame/app.tsx`
Expected: matches for prefix and health metadata.

**Step 3: Commit**

Run:
```bash
git -C /Users/runhaozhang/Documents/project/zhangrh.top/.worktrees/codex/migrate-cardgame-20250120 status -sb
```
Expected: clean working tree.
