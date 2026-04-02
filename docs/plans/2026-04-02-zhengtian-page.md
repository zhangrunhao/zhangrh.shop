# Zhengtian Page Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a new `/zhengtian` route in the `hub` frontend that reproduces the supplied Figma design as a standalone full-width page.

**Architecture:** Extend the existing `hub` SPA route resolver with a dedicated `zhengtian` route, render it through a standalone page layout that bypasses the shared site header/footer shell, and implement the Figma page with data-driven React sections plus Tailwind utilities tuned to the design. Keep verification lightweight by adding a route-resolution test and running type/build checks.

**Tech Stack:** React 19, TypeScript, Vite, Tailwind CSS, Node `node:test`, esbuild for local test bundling

### Task 1: Add the failing route test

**Files:**
- Create: `frontend/project/hub/shared/route.test.ts`
- Modify: none
- Test: `frontend/project/hub/shared/route.test.ts`

**Step 1: Write the failing test**

```ts
test("resolveRoute maps /zhengtian to the dedicated page", () => {
  assert.deepEqual(resolveRoute("/zhengtian"), { name: "zhengtian" });
});
```

**Step 2: Run test to verify it fails**

Run:

```bash
cd frontend
node <<'NODE'
import { build } from 'esbuild';
await build({
  entryPoints: ['project/hub/shared/route.test.ts'],
  bundle: true,
  platform: 'node',
  format: 'esm',
  outfile: '.tmp/route.test.mjs',
  define: { 'import.meta.env.BASE_URL': '"/"' },
});
NODE
node --test .tmp/route.test.mjs
```

Expected: FAIL with actual route `{ name: "not-found" }`

### Task 2: Wire the new route and standalone page shell

**Files:**
- Modify: `frontend/project/hub/shared/route.ts`
- Modify: `frontend/project/hub/shared/tracking.ts`
- Modify: `frontend/project/hub/app.tsx`
- Create: `frontend/project/hub/pages/zhengtian-page.tsx`

**Step 1: Add route support**

Update the route union and resolver so `/zhengtian` returns `{ name: "zhengtian" }`.

**Step 2: Add title and tracking support**

Extend the page-title map and tracking page-name union to include `zhengtian`.

**Step 3: Render without the default shell**

Branch in `app.tsx` so the `zhengtian` route renders its own full-width page and skips `AppHeader`, `AppFooter`, and the max-width main wrapper.

### Task 3: Implement the Figma page

**Files:**
- Create: `frontend/project/hub/pages/zhengtian-page.tsx`

**Step 1: Encode the page content as structured arrays**

Create arrays for the two left-nav groups and the 12 color swatches so the markup stays readable.

**Step 2: Build the standalone layout**

Implement the top bar, left navigation cards, and main color library content using Tailwind classes mapped from the Figma values.

**Step 3: Add responsive behavior**

Keep desktop proportions close to Figma while stacking the sidebar above content on small screens and collapsing the palette into fewer columns.

### Task 4: Verify green

**Files:**
- Test: `frontend/project/hub/shared/route.test.ts`
- Test: `frontend/project/hub/app.tsx`
- Test: `frontend/project/hub/pages/zhengtian-page.tsx`

**Step 1: Re-run the route test**

Expected: PASS

**Step 2: Run static verification**

Run:

```bash
cd frontend
npx tsc -p tsconfig.app.json
npm run build hub
```

Expected: typecheck and production build succeed
