# Hub Article Content Management Implementation Plan

**Goal:** Replace the Hub's placeholder article data with real Markdown article
directories, generated metadata, numeric-ID detail routes, and OSS-hosted local
article images.

**Architecture:** A project-specific Node preparation module scans
`frontend/project/hub/content/articles`, validates each article, renders
Markdown, stages images, and writes a gitignored registry before the existing
Vite `dev` or `build` command starts. The Hub consumes that registry for list
and detail pages. The existing OSS publisher uploads the staged article images
after Vite copies them into `dist/hub/static`.

**Tech Stack:** Node.js ESM, `node:test`, `marked`, React, TypeScript, Vite,
Tailwind CSS, Aliyun OSS through the existing publishing scripts.

**Design:** `docs/superpowers/specs/2026-07-28-article-content-management-design.md`

---

## File Structure

Create:

- `frontend/project/hub/scripts/article-content-lib.mjs`
- `frontend/project/hub/scripts/article-content-lib.test.mjs`
- `frontend/project/hub/scripts/prepare-articles.mjs`
- `frontend/project/hub/scripts/prepare-articles.test.mjs`
- `frontend/project/hub/content/articles/README.md`
- `frontend/project/hub/shared/articles.ts`
- `frontend/project/hub/pages/article-detail-page.tsx`
- `frontend/project/hub/pages/article-detail-page.test.mjs`

Modify:

- `.gitignore`
- `frontend/tools/vite-project.mjs`
- `frontend/vite.config.ts`
- `frontend/project/hub/vite.config.ts`
- `frontend/project/hub/types.ts`
- `frontend/project/hub/shared/data.ts`
- `frontend/project/hub/shared/route.ts`
- `frontend/project/hub/shared/route.test.ts`
- `frontend/project/hub/shared/tracking.ts`
- `frontend/project/hub/pages/articles-page.tsx`
- `frontend/project/hub/pages/list-pages.test.mjs`
- `frontend/project/hub/app.tsx`
- `frontend/project/hub/index.css`

Delete:

- `frontend/project/hub/data/articles.json`

Generated and ignored:

- `frontend/project/hub/.generated/articles.json`
- `frontend/project/hub/.generated/public/static/articles/**/*`

---

### Task 1: Build The Article Directory And Markdown Parser

**Files:**

- Create: `frontend/project/hub/scripts/article-content-lib.mjs`
- Create: `frontend/project/hub/scripts/article-content-lib.test.mjs`

- [ ] **Step 1: Write failing directory-name tests**

Cover:

- `2026-07-26_100001_codex-subagent`
- Invalid separators.
- Invalid calendar dates.
- IDs shorter or longer than six digits.
- Uppercase, spaces, underscores, leading hyphens, and trailing hyphens in the
  readable suffix.

The valid parser result is:

```js
{
  directoryName: '2026-07-26_100001_codex-subagent',
  id: '100001',
  publishDate: '2026-07-26',
  description: 'codex-subagent',
}
```

- [ ] **Step 2: Run the tests and verify RED**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
node --test project/hub/scripts/article-content-lib.test.mjs
```

Expected: FAIL because the parser does not exist.

- [ ] **Step 3: Implement directory parsing**

Implement a pure `parseArticleDirectoryName` helper using the confirmed
structural pattern:

```regex
^\d{4}-\d{2}-\d{2}_\d{6}_[a-z0-9]+(?:-[a-z0-9]+)*$
```

Validate the date as a real calendar date rather than accepting only the string
shape.

- [ ] **Step 4: Write failing Markdown extraction tests**

Cover:

- First level-one heading becomes `name`.
- First paragraph after the heading becomes `summary`.
- First blockquote after the heading becomes `summary`.
- Later level-one headings do not replace the title.
- Missing title fails.
- Missing summary fails.
- Raw HTML fails because it is outside the supported authoring contract.

- [ ] **Step 5: Implement Markdown metadata extraction**

Use the installed `marked` lexer to inspect Markdown tokens. Return:

```js
{
  name,
  summary,
  contentHtml,
}
```

Remove the first title heading from `contentHtml`; the React detail page will
render the article title and publication date separately. Keep the summary block
in the rendered article body.

- [ ] **Step 6: Run parser tests and verify GREEN**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
node --test project/hub/scripts/article-content-lib.test.mjs
```

Expected: all directory and Markdown parser tests pass.

---

### Task 2: Validate Images And Generate The Article Registry

**Files:**

- Modify: `frontend/project/hub/scripts/article-content-lib.mjs`
- Modify: `frontend/project/hub/scripts/article-content-lib.test.mjs`
- Create: `frontend/project/hub/scripts/prepare-articles.mjs`
- Create: `frontend/project/hub/scripts/prepare-articles.test.mjs`

- [ ] **Step 1: Write failing image-resolution tests**

Cover:

- `./assets/context-flow.png` resolves within the article directory.
- A missing file fails.
- `../` traversal fails.
- An absolute local filesystem path fails.
- A Notion `prod-files-secure` signed image URL fails.
- A normal external hyperlink remains allowed because the restriction applies
  to images, not ordinary links.

- [ ] **Step 2: Add image validation and Markdown URL rewriting**

For each Markdown image:

1. Resolve it against the article directory.
2. Require it to remain under that directory's `assets` folder.
3. Require the file to exist.
4. Map it to `static/articles/<id>/<relative-asset-path>`.
5. Emit a development URL for development preparation.
6. Emit an absolute `static.zhangrh.shop` URL for production preparation.

- [ ] **Step 3: Write failing article-tree integration tests**

Use temporary directories. Cover:

- Empty source tree generates an empty array.
- One valid text-only article generates one registry entry.
- Multiple articles sort by `publishDate` descending.
- Duplicate IDs fail even when directory descriptions differ.
- A nested article image is copied to the expected generated staging path.
- An unrelated file at the article root is not treated as an article.
- A malformed article directory fails rather than being skipped.

- [ ] **Step 4: Implement the article-tree builder**

The pure builder accepts explicit paths and mode:

```js
prepareArticles({
  articlesRoot,
  generatedRoot,
  mode: 'development' | 'production',
})
```

It writes:

```text
.generated/
├── articles.json
└── public/static/articles/<id>/
```

Clean only the exact validated `.generated` target before regenerating it.
Never delete the content source tree.

- [ ] **Step 5: Add the thin preparation entry point**

`prepare-articles.mjs` resolves Hub-local default paths, accepts only an
explicit development or production mode, invokes the pure builder, and prints a
short count of prepared articles and images.

- [ ] **Step 6: Run generation tests**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
node --test \
  project/hub/scripts/article-content-lib.test.mjs \
  project/hub/scripts/prepare-articles.test.mjs
```

Expected: all parser, validation, registry, and image-staging tests pass.

---

### Task 3: Integrate Preparation With Existing Vite Commands

**Files:**

- Modify: `.gitignore`
- Modify: `frontend/tools/vite-project.mjs`
- Modify: `frontend/vite.config.ts`
- Modify: `frontend/project/hub/vite.config.ts`
- Test: `frontend/project/hub/scripts/prepare-articles.test.mjs`

- [ ] **Step 1: Ignore generated Hub files**

Add the exact Hub `.generated` path to `.gitignore`. Do not ignore the committed
`content/articles` source tree.

- [ ] **Step 2: Extend the shared Vite project config**

Allow `createProjectConfig` to accept an optional `publicDir`. Keep existing
projects unchanged when the option is omitted.

Pass `frontend/project/hub/.generated/public` from the Hub Vite config.

- [ ] **Step 3: Invoke preparation from the existing runner**

Before Vite starts:

- For `hub dev`, run `prepare-articles.mjs development`.
- For `hub build`, run `prepare-articles.mjs production`.
- For `hub preview`, use the existing built output and do not regenerate.
- For every non-Hub project, preserve current behavior.
- Stop immediately if article preparation fails.

This is internal behavior of existing commands. Do not add a new
author-facing package script.

- [ ] **Step 4: Verify development preparation**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
npm run dev -- hub -- --host 127.0.0.1
```

Expected before stopping the server:

- Article preparation runs once.
- `.generated/articles.json` exists.
- The Vite development server starts normally.

- [ ] **Step 5: Verify production preparation**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
npm run build -- hub
```

Expected:

- Production article preparation runs first.
- Vite builds `dist/hub`.
- No custom Vite plugin is introduced.

---

### Task 4: Replace Placeholder Article Data

**Files:**

- Create: `frontend/project/hub/shared/articles.ts`
- Modify: `frontend/project/hub/types.ts`
- Modify: `frontend/project/hub/shared/data.ts`
- Modify: `frontend/project/hub/pages/articles-page.tsx`
- Modify: `frontend/project/hub/pages/list-pages.test.mjs`
- Delete: `frontend/project/hub/data/articles.json`

- [ ] **Step 1: Update failing list-page tests**

Replace the placeholder-data assertions with assertions that:

- `data/articles.json` no longer exists.
- The article page reads generated articles.
- Each article card links to `/articles/<six-digit-id>`.
- The old placeholder explanation is removed.
- The page provides a clear empty state when the generated array is empty.

- [ ] **Step 2: Add the generated-registry adapter**

Use Vite's built-in `import.meta.glob` with a literal path to load
`.generated/articles.json` eagerly without requiring the generated file to
exist during a standalone TypeScript check.

Validate the generated value at the adapter boundary and export a typed,
date-sorted `ARTICLES` array.

- [ ] **Step 3: Update the article types**

Keep metadata small:

```ts
type Article = {
  id: string
  name: string
  summary: string
  publishDate: string
  contentHtml: string
}
```

Do not add slug, tags, category, draft state, or image metadata.

- [ ] **Step 4: Update the list page**

Render generated article metadata and wrap each article card in the existing
internal `Link` component targeting `/articles/<id>`.

Retain descending date ordering and add an empty-state message for a repository
with no published Markdown articles.

- [ ] **Step 5: Run list-page tests**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
node --test project/hub/pages/list-pages.test.mjs
```

Expected: all updated Hub list-page assertions pass.

---

### Task 5: Add Numeric Article Detail Routing And Rendering

**Files:**

- Modify: `frontend/project/hub/shared/route.ts`
- Modify: `frontend/project/hub/shared/route.test.ts`
- Modify: `frontend/project/hub/shared/tracking.ts`
- Create: `frontend/project/hub/pages/article-detail-page.tsx`
- Create: `frontend/project/hub/pages/article-detail-page.test.mjs`
- Modify: `frontend/project/hub/app.tsx`
- Modify: `frontend/project/hub/index.css`

- [ ] **Step 1: Write failing route tests**

Cover:

- `/articles/100001` returns
  `{ name: "article-detail", articleId: "100001" }`.
- `/hub/articles/100001` works through existing base-path normalization.
- IDs with fewer or more than six digits return not-found.
- Non-numeric IDs return not-found.
- Extra path segments return not-found.

- [ ] **Step 2: Implement the route**

Add `article-detail` to the route union and match exactly:

```regex
^/articles/(\d{6})$
```

- [ ] **Step 3: Write failing detail-page source tests**

Assert that the detail page:

- Looks up the article by numeric ID.
- Renders title and publication date.
- Renders prepared `contentHtml`.
- Uses the existing not-found page for an unknown ID.
- Does not contain a slug-based lookup.

- [ ] **Step 4: Implement the detail page**

Render:

- A back link to `/articles`.
- Article title.
- Publication date.
- The prepared Markdown body.

Use `dangerouslySetInnerHTML` only with build-generated HTML. The preparation
layer rejects raw HTML and validates image sources before this rendering point.

- [ ] **Step 5: Wire the app and tracking**

Update:

- App route rendering.
- Page-title behavior.
- `HubPageName` with `article_detail`.
- `resolvePageName`.

- [ ] **Step 6: Add focused article typography**

Add `.article-content` styles for:

- Paragraphs and spacing.
- Headings.
- Lists.
- Blockquotes.
- Inline code and fenced code blocks.
- Tables.
- Links.
- Responsive images.

Keep the selectors scoped so existing Hub pages do not change.

- [ ] **Step 7: Run route and page tests**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
node --test \
  project/hub/shared/route.test.ts \
  project/hub/pages/article-detail-page.test.mjs \
  project/hub/pages/list-pages.test.mjs
```

Expected: article list, detail rendering, tracking references, and numeric
routing assertions pass.

---

### Task 6: Document The Manual Article Workflow

**Files:**

- Create: `frontend/project/hub/content/articles/README.md`

- [ ] **Step 1: Add the authoring instructions**

Document:

- Directory format:
  `YYYY-MM-DD_XXXXXX_short-english-name`.
- Date means first zhangrh.shop publication date.
- ID is six digits, permanent, and manually selected.
- `index.md` requires an H1 title and a summary paragraph or blockquote.
- No Front Matter.
- Images live under the article-local `assets` directory.
- Markdown uses `./assets/...` paths.
- Notion signed image URLs are invalid.
- Public article URLs use `/hub/articles/<id>`.
- No article-creation command exists.

- [ ] **Step 2: Confirm README does not become article data**

Run the preparation tests and a Hub build. The root README must not be treated
as an article directory.

---

### Task 7: Full Verification

- [ ] **Step 1: Run every article and Hub test**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
node --test \
  project/hub/scripts/*.test.mjs \
  project/hub/shared/*.test.ts \
  project/hub/pages/*.test.mjs \
  project/hub/data/*.test.mjs
```

Expected: zero failures.

- [ ] **Step 2: Run the TypeScript check**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
npm exec tsc -- --noEmit -p tsconfig.app.json
```

Expected: zero TypeScript errors.

- [ ] **Step 3: Run lint**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
npm run lint
```

Expected: zero lint errors.

- [ ] **Step 4: Build the Hub**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
npm run build -- hub
```

Expected:

- Article preparation succeeds.
- The Hub build succeeds.
- Generated article data is bundled.
- Staged article images, when present, land below
  `dist/hub/static/articles/<id>/`.

- [ ] **Step 5: Inspect generated production URLs**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
rg -n "static\\.zhangrh\\.shop/zhangrh-shop/hub/static/articles/" \
  project/hub/.generated/articles.json dist/hub/static || true
```

Expected: any generated article image references use the OSS public base. An
empty article repository legitimately produces no match.

- [ ] **Step 6: Preview the built routes**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
npm run preview -- hub -- --host 127.0.0.1
```

Verify:

- `/hub/articles` renders the generated list or the intended empty state.
- If the user has supplied a real article, it opens at `/hub/articles/<id>`.
- If the repository is still empty, representative article behavior remains
  covered by the temporary-directory integration tests.
- An unknown six-digit ID renders not-found.
- Desktop and mobile widths do not overflow.
- Images load when a supplied article contains images.
- Browser console has no new errors.

- [ ] **Step 7: Review the final Git diff**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop
git status --short
git diff --check
git diff --stat
```

Confirm:

- `.generated` files are not staged.
- No real article content was invented or imported without the user's choice.
- No article-creation command or custom Vite plugin was added.
- Only files required by this plan changed.

## Not Included In This Plan

- Selecting or importing the first real Notion article.
- Publishing to production.
- Automatically updating Notion after deployment.
- Migrating historical cnblogs articles.
- Home-page featured-article automation.
- Tags, categories, search, pagination, RSS, or sitemap generation.
- Live Markdown regeneration while an already running Vite dev server remains
  open.
