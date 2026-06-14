# Frontend OSS Static Publish Design

## Goal

Move frontend static asset publishing from ECS-hosted files to Aliyun OSS while keeping HTML entry files on the current ECS/nginx deployment.

The normal frontend release command stays:

```bash
cd frontend
npm run publish -- <project>
```

After this change, `publish` builds locally, uploads Vite static assets to Aliyun OSS, rewrites generated HTML to reference `static.zhangrh.shop`, and uploads only HTML files to ECS.

## Current State

- Frontend projects live under `frontend/project/<project>`.
- `npm run build -- <project>` uses Vite and writes output to `frontend/dist/<project>`.
- Vite currently emits JS, CSS, favicon, and image assets under `frontend/dist/<project>/static`.
- Generated HTML currently references project-local asset paths such as `/hub/static/index-CWvyab_5.js`.
- `frontend/scripts/deploy-static.mjs` currently uploads the whole `dist/<project>/` directory to `root@101.200.185.29:/opt/zhangrh-shop/site/<project>/`.
- There is no active Tencent Cloud COS upload script in the current publish path, but `cos-nodejs-sdk-v5` remains in `frontend/package.json` and `frontend/package-lock.json`.

## Confirmed Decisions

- Use Aliyun OSS bucket `zhangrunhao` in region `oss-cn-beijing`.
- Use custom public domain `https://static.zhangrh.shop`.
- Use OSS upload root `zhangrh-shop`.
- Store each frontend project under its own OSS directory.
- Do not delete old OSS objects during publish.
- Upload all generated HTML files to ECS.
- Do not upload JS, CSS, images, favicons, or other `static/` files to ECS.
- Keep `npm run build -- <project>` as a pure local build command that does not require OSS credentials.
- Put non-secret OSS configuration in source-controlled code.
- Read only Aliyun credentials from environment variables.
- Remove Tencent Cloud COS dependency.

## OSS Layout

Static asset object keys use:

```txt
zhangrh-shop/<project>/static/<file>
```

Public URLs use:

```txt
https://static.zhangrh.shop/zhangrh-shop/<project>/static/<file>
```

Examples:

```txt
dist/hub/static/index-CWvyab_5.js
-> zhangrh-shop/hub/static/index-CWvyab_5.js
-> https://static.zhangrh.shop/zhangrh-shop/hub/static/index-CWvyab_5.js

dist/cardgame/static/index-B3F7aiyZ.js
-> zhangrh-shop/cardgame/static/index-B3F7aiyZ.js
-> https://static.zhangrh.shop/zhangrh-shop/cardgame/static/index-B3F7aiyZ.js
```

This keeps the bucket root clean and leaves room for future projects such as calorie-note or editing tools.

## Configuration

Create a source-controlled config module, for example:

```txt
frontend/scripts/oss-static.config.mjs
```

It contains:

```js
export const OSS_STATIC_CONFIG = {
  region: 'oss-cn-beijing',
  bucket: 'zhangrunhao',
  publicBaseUrl: 'https://static.zhangrh.shop',
  uploadRoot: 'zhangrh-shop',
}
```

Credentials are not stored in the repo. The upload script reads:

```txt
OSS_ACCESS_KEY_ID
OSS_ACCESS_KEY_SECRET
```

The Aliyun OSS client should enable V4 authorization.

## Publish Flow

`frontend/tools/publish.mjs` becomes the complete release orchestrator:

```txt
git pull
npm run build -- <project>
node scripts/publish-oss-assets.mjs <project>
node scripts/deploy-static.mjs <project>
```

`npm run build -- <project>` remains unchanged in responsibility: it only creates local dist output.

`publish-oss-assets.mjs` does two things:

1. Uploads every file under `dist/<project>/static/**/*` to OSS.
2. Rewrites every generated HTML file under `dist/<project>/**/*.html`.

`deploy-static.mjs` then uploads only generated HTML files to ECS, preserving their relative paths under:

```txt
/opt/zhangrh-shop/site/<project>/
```

## HTML Rewrite Rules

The HTML rewrite step scans:

```txt
frontend/dist/<project>/**/*.html
```

It rewrites only current-project static asset references:

```txt
/<project>/static/<file>
```

into:

```txt
https://static.zhangrh.shop/zhangrh-shop/<project>/static/<file>
```

It must not rewrite:

- External URLs such as Google Fonts or Baidu analytics.
- Normal app routes such as `/hub/products/...`.
- Remote business data URLs, including existing product image URLs in `frontend/project/hub/data/products.json`.
- Any path outside `/<project>/static/`.

The script should be idempotent: running it again after a successful rewrite should not double-prefix existing OSS URLs.

## ECS Upload Rules

`deploy-static.mjs` changes from full-directory upload to HTML-only upload:

- Include `dist/<project>/**/*.html`.
- Preserve relative paths, so nested HTML remains nested under `/opt/zhangrh-shop/site/<project>/`.
- Do not use a project-wide `--delete`, because ECS may still contain old static files or operational files from previous releases.
- Do not upload `dist/<project>/static`.

Normal frontend projects currently have only `index.html`, but the script should support multiple HTML files for future multi-entry projects.

## Dependencies

Remove:

```txt
cos-nodejs-sdk-v5
```

Add:

```txt
ali-oss
```

Keep using existing Node scripts and tests. Do not introduce a Vite plugin for this first version.

## Error Handling

- If `dist/<project>` does not exist, fail with a message telling the user to build the project first.
- If `dist/<project>/static` does not exist, fail during OSS publishing.
- If OSS credentials are missing, fail before HTML rewriting or ECS upload.
- If any OSS upload fails, stop the publish flow.
- If HTML rewriting fails, stop the publish flow.
- If ECS HTML upload fails, leave OSS objects in place and report the ECS failure. No rollback is attempted.

This prevents publishing HTML that points to missing OSS files.

## Cache And Cleanup

The first implementation does not delete old OSS objects.

The first implementation does not add a custom OSS cleanup policy or release-retention policy. Vite-generated hashed filenames make this safe for browser sessions that still reference older HTML.

Explicit cache headers are not part of the first implementation. Existing OSS or CDN defaults remain in effect until a separate cache policy is designed.

## Testing

Add focused Node tests for the helper logic:

- Generate object key:
  - `hub`, `static/index.js` -> `zhangrh-shop/hub/static/index.js`
- Generate public URL:
  - `zhangrh-shop/hub/static/index.js` -> `https://static.zhangrh.shop/zhangrh-shop/hub/static/index.js`
- Rewrite HTML:
  - `/hub/static/index.js` becomes the OSS URL.
  - External URLs remain unchanged.
  - Normal routes remain unchanged.
  - Already rewritten OSS URLs remain unchanged.
- Discover upload files:
  - Files under `dist/<project>/static/**/*` are included for OSS upload.
  - HTML files are excluded from OSS upload.
- Discover ECS files:
  - `dist/<project>/**/*.html` is included.
  - `dist/<project>/static/**/*` is excluded.
- `deploy-static.mjs` command construction:
  - Uploads only HTML files.
  - Does not use project-wide `--delete`.

Manual verification after implementation:

```bash
cd frontend
npm run lint
npx tsc -p tsconfig.app.json
node --test scripts/*.test.mjs tools/*.test.mjs
npm run build -- hub
node scripts/publish-oss-assets.mjs hub
rg 'https://static.zhangrh.shop/zhangrh-shop/hub/static/' dist/hub/index.html
```

Full production verification requires valid OSS credentials and SSH access:

```bash
cd frontend
npm run publish -- hub
curl -I https://static.zhangrh.shop/zhangrh-shop/hub/static/<built-file>
curl -k https://zhangrh.shop/hub/
```

## Documentation Updates

Update deployment docs to describe the new split:

- OSS owns generated static assets under `https://static.zhangrh.shop/zhangrh-shop/<project>/static/`.
- ECS owns generated HTML files under `/opt/zhangrh-shop/site/<project>/`.
- `npm run publish -- <project>` remains the normal command.
- `npm run build -- <project>` remains local-only.
- `OSS_ACCESS_KEY_ID` and `OSS_ACCESS_KEY_SECRET` are required only for publishing.

Relevant docs:

- `docs/deploy/zhangrh-shop-docker-compose.md`
- `docs/deploy/zhangrh-shop-service-ledger.md`

## Out Of Scope

- Deleting or pruning old OSS files.
- Migrating existing business data image URLs in `products.json`.
- Changing nginx routing for `zhangrh.shop`.
- Changing backend publish behavior.
- Moving HTML files to OSS.
- Implementing a Vite plugin.
- Configuring CDN cache, OSS lifecycle rules, or cache-control headers.
