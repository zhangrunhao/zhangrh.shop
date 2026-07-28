# Hub Article Content Management Design

## Goal

Add real article content to the Hub while keeping the authoring and publishing workflow simple:

- Draft and manage article status in the existing Notion `Articles` database.
- Manually export selected articles from Notion as Markdown.
- Store published articles and their images in Git.
- Derive article metadata from the directory name and Markdown body.
- Generate the article registry automatically during Hub development and builds.
- Publish article images through the existing Vite and Aliyun OSS release flow.

## Current State

- The Hub article page reads manually maintained placeholder data from
  `frontend/project/hub/data/articles.json`.
- The current `Article` model contains `id`, `name`, `summary`, and `publishDate`.
- The Hub has an article list route but no article detail route.
- Vite writes Hub build assets under `frontend/dist/hub/static`.
- The existing publish flow uploads everything under `dist/hub/static` to Aliyun
  OSS and uploads generated HTML files to ECS.
- The existing Notion `Articles` database already tracks writing status, planned
  publication channels, the cnblogs URL, and the zhangrh.shop URL.

## Confirmed Decisions

- Notion remains the writing and editorial-management workspace.
- Git-hosted Markdown is the source used to build the website.
- Publishing remains manual: export from Notion, add files to the repository,
  commit, and run the existing publish flow.
- Do not add an article-creation command.
- Do not add a custom Vite plugin.
- Do not require YAML Front Matter in article Markdown.
- Use one directory per article, including articles that currently have no images.
- Use a stable six-digit numeric ID in the public article URL.
- Generate the article list from article directories instead of maintaining
  `articles.json` by hand.

## Source Layout

Article sources live under:

```text
frontend/project/hub/content/articles/
```

Each article is a self-contained directory:

```text
frontend/project/hub/content/articles/
└── 2026-07-26_100001_codex-subagent/
    ├── index.md
    └── assets/
        └── context-flow.png
```

The `assets` directory is optional. A text-only article contains only `index.md`.

## Directory Naming Contract

Every article directory must match:

```text
YYYY-MM-DD_XXXXXX_short-english-name
```

The exact structural pattern is:

```regex
^\d{4}-\d{2}-\d{2}_\d{6}_[a-z0-9]+(?:-[a-z0-9]+)*$
```

Example:

```text
2026-07-26_100001_codex-subagent
```

The three segments mean:

| Segment | Meaning |
| --- | --- |
| `2026-07-26` | First publication date on zhangrh.shop |
| `100001` | Permanent six-digit article ID |
| `codex-subagent` | Human-readable directory description |

Rules:

- The publication date uses a valid `YYYY-MM-DD` calendar date.
- The ID is exactly six decimal digits and is unique across all articles.
- IDs are selected manually. Using the current maximum ID plus one is the
  recommended convention, starting from `100001`.
- The final segment uses lowercase ASCII letters, digits, and hyphens.
- The final segment is only for repository readability. It is not a public route
  key and may change without changing the article URL.
- The numeric ID is permanent after first publication.

## Markdown Contract

`index.md` does not contain Front Matter. Its structure provides the remaining
article metadata:

```md
# Codex Subagent：如何隔离 Coding Agent 的上下文

> Subagent：管理上下文的一种方法

正文……
```

Rules:

- The first level-one heading is the article title.
- The first non-empty textual block after the title is the article summary.
- A paragraph or blockquote may supply the summary.
- The remainder of the Markdown file is the article body.
- Raw HTML is outside the first version's supported authoring contract.
- Normal external links are allowed.
- Article images must use local relative paths under the same article's
  `assets` directory.

## Derived Article Data

The build preparation step derives:

```ts
type ArticleMetadata = {
  id: string
  name: string
  summary: string
  publishDate: string
}
```

Sources:

| Generated field | Source |
| --- | --- |
| `id` | Six-digit directory segment |
| `publishDate` | Date directory segment |
| `name` | First level-one Markdown heading |
| `summary` | First textual block after the title |

The generated article record also contains rendered article content for the
detail page. Rendered content is payload, not hand-maintained metadata.

The first version does not add:

- slug
- tags
- category
- draft state
- updated date
- Notion URL
- cnblogs URL
- image-list metadata

Notion continues to own editorial status and publication-channel links. After
the website is published, its stable article URL is written back to the existing
`zhang.shop地址` property.

## Generated Data

A normal Node build-preparation module scans the article source tree before Vite
starts. It:

1. Discovers article directories.
2. Validates directory names and unique IDs.
3. Reads each `index.md`.
4. Extracts the title and summary.
5. Renders the Markdown body.
6. Validates and rewrites local article image references.
7. Produces a temporary generated article registry.
8. Stages article images for Vite output.

Generated files live under a gitignored Hub-local `.generated` directory. The
intended shape is:

```text
frontend/project/hub/.generated/
├── articles.json
└── public/
    └── static/
        └── articles/
            └── 100001/
                └── context-flow.png
```

The generated registry is never edited manually and is not committed.

The preparation module is invoked automatically by the existing Hub `dev` and
`build` entry points. It is an internal build step, not a new author-facing
command.

The Hub imports `.generated/articles.json` as its article registry. The Hub Vite
configuration uses `.generated/public` as its generated `publicDir`, allowing
the development server and production build to serve the same staged article
assets.

## Image Management

Source Markdown references an image with a relative path:

```md
![上下文隔离流程](./assets/context-flow.png)
```

The preparation step:

- Resolves the path relative to the article directory.
- Rejects path traversal outside that article directory.
- Requires the resolved file to exist.
- Copies the image into the generated static staging tree under the article ID.
- Rewrites the rendered image URL for the current environment.

Development URLs use the local Vite server:

```text
/static/articles/100001/context-flow.png
```

Production URLs use the existing OSS public base:

```text
https://static.zhangrh.shop/zhangrh-shop/hub/static/articles/100001/context-flow.png
```

Vite copies the staged `static/articles` tree into:

```text
frontend/dist/hub/static/articles/
```

The existing OSS publisher already uploads nested files under
`dist/hub/static`, so article images require no separate manual upload step.

Notion's temporary signed image URLs are not valid article image sources.
Images exported from Notion must be stored in the article's local `assets`
directory and referenced relatively.

## Build Integration

The flow for Hub development is:

```text
prepare generated article data and images
→ start the existing Vite development server
```

The flow for a Hub production build is:

```text
prepare generated article data and images
→ run the existing Vite build
→ emit Hub assets under dist/hub/static
```

The flow for publishing remains:

```text
git pull
→ Hub build, including article preparation
→ upload dist/hub/static recursively to OSS
→ upload generated HTML to ECS
```

No custom Vite plugin is required. The task is file discovery, validation,
Markdown conversion, JSON generation, and file copying; a normal Node module is
smaller, easier to test, and consistent with the repository's existing script
structure.

The first version does not provide live Markdown regeneration while an already
running Vite development server remains open. Restarting the development server
regenerates article data after source changes.

## Routing And Rendering

The article list remains:

```text
/hub/articles
```

Each article detail page uses only the permanent numeric ID:

```text
/hub/articles/100001
```

The route resolver accepts exactly six digits for an article detail route. The
detail page looks up that ID in the generated registry.

- A matching ID renders the generated article body.
- A well-formed but unknown ID renders the Hub not-found page.
- The directory date and human-readable suffix do not appear in the public URL.
- Renaming the title or directory suffix does not change the URL as long as the
  numeric ID remains unchanged.

The article list sorts by `publishDate` descending and links each card to its
numeric detail route.

## Validation And Error Handling

Article preparation fails with an actionable message when:

- A directory name does not match the required naming contract.
- A date is not a valid calendar date.
- An ID is not six digits.
- Two directories contain the same ID.
- `index.md` is missing.
- The Markdown has no level-one title.
- A summary cannot be extracted.
- A relative image is outside the article directory.
- A referenced local image does not exist.
- A Notion temporary signed image URL remains in the Markdown.

Failure stops development startup or the production build. Invalid articles are
not silently omitted.

## Testing

Add focused tests for the preparation logic:

- Parse a valid directory name into date, ID, and description.
- Reject invalid date, ID, separator, and description formats.
- Reject duplicate IDs.
- Extract a title from the first level-one heading.
- Extract a summary from a paragraph.
- Extract a summary from a blockquote.
- Reject Markdown without a title or summary.
- Sort generated article metadata by publication date descending.
- Resolve a valid local image under `assets`.
- Reject missing images and traversal paths.
- Reject Notion temporary signed image URLs.
- Generate local development image URLs.
- Generate production OSS image URLs.
- Produce the expected registry shape.

Routing tests cover:

- `/articles/100001` resolves to an article-detail route.
- Non-six-digit article IDs do not resolve as article-detail routes.
- An unknown six-digit ID renders not-found behavior.

Build verification covers:

- A Hub build succeeds with a representative Markdown article.
- The generated article appears in the list registry.
- The detail route renders its content.
- Its image exists under `dist/hub/static/articles/<id>/`.
- The production content uses the expected OSS image URL.

## Manual Publishing Workflow

For each selected article:

1. Finish the article in Notion and mark it ready to publish.
2. Export the page and its images as Markdown.
3. Manually create a directory using the confirmed naming contract.
4. Put the article body in `index.md`.
5. Put exported images in `assets` and use relative Markdown paths.
6. Ensure the first level-one heading and summary block are present.
7. Commit the article directory.
8. Run the existing Hub publish flow.
9. Write `/hub/articles/<id>` back to Notion's `zhang.shop地址`.

## Out Of Scope

- Automatic Notion synchronization.
- A Notion API integration.
- An article-creation command.
- A custom Vite plugin.
- A browser-based CMS or editor.
- Draft preview URLs.
- Tags, categories, search, pagination, RSS, or an article sitemap.
- Importing all historical cnblogs posts automatically.
- Live article-source regeneration without restarting the Vite development
  server.
