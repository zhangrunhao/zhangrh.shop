# Automation Restructure Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Move root-level tooling from `tools/` to `automation/` and split it into `publish` and `scheduler`.

**Architecture:** Keep runtime application code inside `frontend/` and `backend/`. Use `automation/publish` for interactive repo-level release helpers, and `automation/scheduler` for timed jobs such as track-log ingestion. If a scheduled task needs reusable business logic, that logic should live in `backend/`.

**Tech Stack:** Node.js, Python 3, npm scripts

### Task 1: Move root publish helpers

**Files:**
- Modify: `package.json`
- Modify: `frontend/tools/publish-lib.mjs`
- Modify: `automation/publish/workspace-runner.mjs`

**Step 1:** Point root npm scripts to `automation/publish/workspace-runner.mjs`.

**Step 2:** Fix path calculations after moving `workspace-runner.mjs` under `automation/publish`.

**Step 3:** Update cross-project imports that still reference the old root `tools/` path.

### Task 2: Define scheduler area

**Files:**
- Create: `automation/README.md`
- Create: `automation/scheduler/README.md`
- Create: `automation/scheduler/track_ingest.py`

**Step 1:** Document the boundary between app code and automation code.

**Step 2:** Add a minimal Python entry point for future track-log ingestion.

**Step 3:** Keep the first version preview-only until database schema and write path are defined.

### Task 3: Verify the restructure

**Files:**
- Verify: `package.json`
- Verify: `automation/publish/workspace-runner.mjs`
- Verify: `frontend/tools/publish-lib.mjs`

**Step 1:** Import the moved Node modules to confirm path correctness.

**Step 2:** Run the Python scheduler entry point against a sample JSONL file.

**Step 3:** Inspect `git status` to confirm the intended file moves and additions.
