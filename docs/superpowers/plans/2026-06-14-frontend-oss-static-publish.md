# Frontend OSS Static Publish Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Publish Vite-generated frontend static assets to Aliyun OSS under `static.zhangrh.shop`, rewrite generated HTML to those URLs, and upload only HTML files to ECS.

**Architecture:** Keep `npm run build -- <project>` as a pure local Vite build. Add a post-build OSS publish script that uploads `dist/<project>/static/**/*` and rewrites `dist/<project>/**/*.html`, then change the existing ECS deploy script to rsync only HTML files. Use a small source-controlled OSS config module plus pure helper functions so path generation, HTML rewriting, and file discovery are testable without network access.

**Tech Stack:** Node.js ESM scripts, Vite, `node:test`, `ali-oss`, `rsync`, SSH, Aliyun OSS custom domain `https://static.zhangrh.shop`.

---

### File Structure

Create or modify these files:

- Create: `frontend/scripts/oss-static.config.mjs`
  - Holds non-secret OSS settings: region, bucket, public base URL, and upload root.
- Create: `frontend/scripts/oss-static-lib.mjs`
  - Pure helper functions for object keys, public URLs, file discovery, credential validation, client options, and HTML rewriting.
- Create: `frontend/scripts/oss-static-lib.test.mjs`
  - Unit tests for helper behavior without Aliyun network calls.
- Create: `frontend/scripts/publish-oss-assets.mjs`
  - CLI script used by `publish`; creates the OSS client, uploads static files, then rewrites HTML.
- Modify: `frontend/scripts/deploy-static.mjs`
  - Change rsync from full-directory upload with `--delete` to HTML-only upload without project-wide delete.
- Modify: `frontend/scripts/deploy-static.test.mjs`
  - Update deployment tests for HTML-only rsync arguments.
- Modify: `frontend/tools/publish.mjs`
  - Insert `publish-oss-assets.mjs` between build and ECS deploy.
- Modify: `frontend/package.json`
  - Remove Tencent COS SDK and add Aliyun OSS SDK.
- Modify: `frontend/package-lock.json`
  - Lock dependency changes through npm.
- Modify: `docs/deploy/zhangrh-shop-docker-compose.md`
  - Document new OSS/ECS split.
- Modify: `docs/deploy/zhangrh-shop-service-ledger.md`
  - Update `static.zhangrh.shop` from reserved/non-participating to frontend static asset host.
- Modify: `docs/deploy/zhangrh-shop-server-ledger.md`
  - Keep server ledger consistent with the new role of `static.zhangrh.shop`.

### Task 1: Swap Cloud SDK Dependency

**Files:**
- Modify: `frontend/package.json`
- Modify: `frontend/package-lock.json`

- [ ] **Step 1: Remove Tencent COS and add Aliyun OSS SDK**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
npm uninstall cos-nodejs-sdk-v5
npm install -D ali-oss@^6
```

Expected: `frontend/package.json` no longer contains `cos-nodejs-sdk-v5`; `frontend/package.json` contains `ali-oss` in `devDependencies`.

- [ ] **Step 2: Verify dependency names**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop
rg -n "cos-nodejs-sdk-v5|ali-oss" frontend/package.json frontend/package-lock.json
```

Expected: only `ali-oss` appears in `frontend/package.json` and `frontend/package-lock.json`.

- [ ] **Step 3: Commit dependency swap**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop
git add frontend/package.json frontend/package-lock.json
git commit -m "chore: 替换前端静态资源上传 SDK"
```

### Task 2: Add OSS Config And URL Helpers

**Files:**
- Create: `frontend/scripts/oss-static.config.mjs`
- Create: `frontend/scripts/oss-static-lib.mjs`
- Create: `frontend/scripts/oss-static-lib.test.mjs`

- [ ] **Step 1: Write failing helper tests**

Create `frontend/scripts/oss-static-lib.test.mjs`:

```js
import test from 'node:test'
import assert from 'node:assert/strict'

import { OSS_STATIC_CONFIG } from './oss-static.config.mjs'
import {
  buildOssClientOptions,
  buildPublicAssetUrl,
  buildPublicUrl,
  buildStaticObjectKey,
  readOssCredentials,
} from './oss-static-lib.mjs'

test('OSS static config uses the confirmed Aliyun bucket and public domain', () => {
  assert.deepEqual(OSS_STATIC_CONFIG, {
    region: 'oss-cn-beijing',
    bucket: 'zhangrunhao',
    publicBaseUrl: 'https://static.zhangrh.shop',
    uploadRoot: 'zhangrh-shop',
  })
})

test('buildStaticObjectKey maps project static files under upload root', () => {
  assert.equal(
    buildStaticObjectKey({
      config: OSS_STATIC_CONFIG,
      projectName: 'hub',
      relativeStaticPath: 'static/index-CWvyab_5.js',
    }),
    'zhangrh-shop/hub/static/index-CWvyab_5.js',
  )
})

test('buildStaticObjectKey normalizes leading slashes and backslashes', () => {
  assert.equal(
    buildStaticObjectKey({
      config: OSS_STATIC_CONFIG,
      projectName: 'cardgame',
      relativeStaticPath: '\\static\\index-B3F7aiyZ.js',
    }),
    'zhangrh-shop/cardgame/static/index-B3F7aiyZ.js',
  )
})

test('buildStaticObjectKey rejects files outside static directory', () => {
  assert.throws(
    () =>
      buildStaticObjectKey({
        config: OSS_STATIC_CONFIG,
        projectName: 'hub',
        relativeStaticPath: 'index.html',
      }),
    /Expected static asset path/,
  )
})

test('buildPublicUrl joins public base and object key', () => {
  assert.equal(
    buildPublicUrl({
      config: OSS_STATIC_CONFIG,
      objectKey: 'zhangrh-shop/hub/static/index-CWvyab_5.js',
    }),
    'https://static.zhangrh.shop/zhangrh-shop/hub/static/index-CWvyab_5.js',
  )
})

test('buildPublicAssetUrl maps project static path to static.zhangrh.shop', () => {
  assert.equal(
    buildPublicAssetUrl({
      config: OSS_STATIC_CONFIG,
      projectName: 'shotmarker',
      relativeStaticPath: 'static/index-EcMJOixg.js',
    }),
    'https://static.zhangrh.shop/zhangrh-shop/shotmarker/static/index-EcMJOixg.js',
  )
})

test('readOssCredentials returns credentials from environment-like object', () => {
  assert.deepEqual(
    readOssCredentials({
      OSS_ACCESS_KEY_ID: 'id',
      OSS_ACCESS_KEY_SECRET: 'secret',
    }),
    {
      accessKeyId: 'id',
      accessKeySecret: 'secret',
    },
  )
})

test('readOssCredentials reports missing key names', () => {
  assert.throws(
    () =>
      readOssCredentials({
        OSS_ACCESS_KEY_ID: 'id',
      }),
    /Missing OSS_ACCESS_KEY_SECRET/,
  )
})

test('buildOssClientOptions enables V4 authorization', () => {
  assert.deepEqual(
    buildOssClientOptions({
      config: OSS_STATIC_CONFIG,
      credentials: {
        accessKeyId: 'id',
        accessKeySecret: 'secret',
      },
    }),
    {
      region: 'oss-cn-beijing',
      bucket: 'zhangrunhao',
      accessKeyId: 'id',
      accessKeySecret: 'secret',
      authorizationV4: true,
    },
  )
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
node --test scripts/oss-static-lib.test.mjs
```

Expected: FAIL because `oss-static.config.mjs` and `oss-static-lib.mjs` do not exist.

- [ ] **Step 3: Add source-controlled OSS config**

Create `frontend/scripts/oss-static.config.mjs`:

```js
export const OSS_STATIC_CONFIG = {
  region: 'oss-cn-beijing',
  bucket: 'zhangrunhao',
  publicBaseUrl: 'https://static.zhangrh.shop',
  uploadRoot: 'zhangrh-shop',
}
```

- [ ] **Step 4: Add URL and credential helpers**

Create `frontend/scripts/oss-static-lib.mjs`:

```js
import path from 'node:path'

export const normalizeRelativePath = (value) =>
  String(value).replace(/\\/g, '/').replace(/^\/+/, '')

export const trimSlashes = (value) => String(value).replace(/^\/+|\/+$/g, '')

export const trimTrailingSlashes = (value) => String(value).replace(/\/+$/g, '')

export const buildStaticObjectKey = ({ config, projectName, relativeStaticPath }) => {
  const relativePath = normalizeRelativePath(relativeStaticPath)
  if (!relativePath.startsWith('static/')) {
    throw new Error(`Expected static asset path under static/: ${relativeStaticPath}`)
  }

  return [trimSlashes(config.uploadRoot), projectName, relativePath]
    .filter(Boolean)
    .join('/')
}

export const buildPublicUrl = ({ config, objectKey }) =>
  `${trimTrailingSlashes(config.publicBaseUrl)}/${normalizeRelativePath(objectKey)}`

export const buildPublicAssetUrl = ({ config, projectName, relativeStaticPath }) =>
  buildPublicUrl({
    config,
    objectKey: buildStaticObjectKey({ config, projectName, relativeStaticPath }),
  })

export const readOssCredentials = (env = process.env) => {
  const missing = []
  if (!env.OSS_ACCESS_KEY_ID) {
    missing.push('OSS_ACCESS_KEY_ID')
  }
  if (!env.OSS_ACCESS_KEY_SECRET) {
    missing.push('OSS_ACCESS_KEY_SECRET')
  }
  if (missing.length) {
    throw new Error(`Missing ${missing.join(' and ')}`)
  }

  return {
    accessKeyId: env.OSS_ACCESS_KEY_ID,
    accessKeySecret: env.OSS_ACCESS_KEY_SECRET,
  }
}

export const buildOssClientOptions = ({ config, credentials }) => ({
  region: config.region,
  bucket: config.bucket,
  accessKeyId: credentials.accessKeyId,
  accessKeySecret: credentials.accessKeySecret,
  authorizationV4: true,
})

export const relativePathFromDist = ({ distDir, filePath }) =>
  normalizeRelativePath(path.relative(distDir, filePath))
```

- [ ] **Step 5: Run helper tests**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
node --test scripts/oss-static-lib.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit helper foundation**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop
git add frontend/scripts/oss-static.config.mjs frontend/scripts/oss-static-lib.mjs frontend/scripts/oss-static-lib.test.mjs
git commit -m "feat: 添加 OSS 静态资源路径配置"
```

### Task 3: Add File Discovery And HTML Rewrite Helpers

**Files:**
- Modify: `frontend/scripts/oss-static-lib.mjs`
- Modify: `frontend/scripts/oss-static-lib.test.mjs`

- [ ] **Step 1: Extend tests for static file discovery and HTML rewriting**

Append this to `frontend/scripts/oss-static-lib.test.mjs`:

```js
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import {
  listHtmlFiles,
  listStaticAssetEntries,
  rewriteHtmlAssetUrls,
} from './oss-static-lib.mjs'

const makeTempDist = () => fs.mkdtempSync(path.join(os.tmpdir(), 'oss-static-dist-'))

test('listStaticAssetEntries includes static files and excludes html', () => {
  const distDir = makeTempDist()
  fs.mkdirSync(path.join(distDir, 'static', 'nested'), { recursive: true })
  fs.writeFileSync(path.join(distDir, 'index.html'), '<html></html>')
  fs.writeFileSync(path.join(distDir, 'static', 'index.js'), 'console.log(1)')
  fs.writeFileSync(path.join(distDir, 'static', 'nested', 'app.css'), 'body{}')

  assert.deepEqual(
    listStaticAssetEntries({
      distDir,
      config: OSS_STATIC_CONFIG,
      projectName: 'hub',
    }).map((entry) => ({
      relativeStaticPath: entry.relativeStaticPath,
      objectKey: entry.objectKey,
      publicUrl: entry.publicUrl,
    })),
    [
      {
        relativeStaticPath: 'static/index.js',
        objectKey: 'zhangrh-shop/hub/static/index.js',
        publicUrl: 'https://static.zhangrh.shop/zhangrh-shop/hub/static/index.js',
      },
      {
        relativeStaticPath: 'static/nested/app.css',
        objectKey: 'zhangrh-shop/hub/static/nested/app.css',
        publicUrl: 'https://static.zhangrh.shop/zhangrh-shop/hub/static/nested/app.css',
      },
    ],
  )
})

test('listStaticAssetEntries fails when static directory is missing', () => {
  const distDir = makeTempDist()
  assert.throws(
    () =>
      listStaticAssetEntries({
        distDir,
        config: OSS_STATIC_CONFIG,
        projectName: 'hub',
      }),
    /Build static output not found/,
  )
})

test('listHtmlFiles includes nested html files and excludes static files', () => {
  const distDir = makeTempDist()
  fs.mkdirSync(path.join(distDir, 'support'), { recursive: true })
  fs.mkdirSync(path.join(distDir, 'static'), { recursive: true })
  fs.writeFileSync(path.join(distDir, 'index.html'), '<html></html>')
  fs.writeFileSync(path.join(distDir, 'support', 'index.html'), '<html></html>')
  fs.writeFileSync(path.join(distDir, 'static', 'index.js'), 'console.log(1)')

  assert.deepEqual(
    listHtmlFiles({ distDir }).map((entry) => entry.relativeHtmlPath),
    ['index.html', 'support/index.html'],
  )
})

test('rewriteHtmlAssetUrls rewrites only current project static asset paths', () => {
  const html = [
    '<script type="module" src="/hub/static/index-CWvyab_5.js"></script>',
    '<link href="/hub/static/index-BCVh40yg.css" rel="stylesheet">',
    '<link href="https://fonts.googleapis.com/css2?family=Space+Grotesk" rel="stylesheet">',
    '<script src="https://hm.baidu.com/hm.js?abc"></script>',
    '<a href="/hub/products/card-game">product</a>',
    '<img src="https://zhangrunhao.oss-cn-beijing.aliyuncs.com/assets/cardgame.png">',
    '<script src="/cardgame/static/index-B3F7aiyZ.js"></script>',
  ].join('\n')

  const rewritten = rewriteHtmlAssetUrls({
    html,
    config: OSS_STATIC_CONFIG,
    projectName: 'hub',
  })

  assert.match(
    rewritten,
    /src="https:\/\/static\.zhangrh\.shop\/zhangrh-shop\/hub\/static\/index-CWvyab_5\.js"/,
  )
  assert.match(
    rewritten,
    /href="https:\/\/static\.zhangrh\.shop\/zhangrh-shop\/hub\/static\/index-BCVh40yg\.css"/,
  )
  assert.match(rewritten, /https:\/\/fonts\.googleapis\.com/)
  assert.match(rewritten, /https:\/\/hm\.baidu\.com/)
  assert.match(rewritten, /href="\/hub\/products\/card-game"/)
  assert.match(rewritten, /https:\/\/zhangrunhao\.oss-cn-beijing\.aliyuncs\.com\/assets\/cardgame\.png/)
  assert.match(rewritten, /src="\/cardgame\/static\/index-B3F7aiyZ\.js"/)
})

test('rewriteHtmlAssetUrls is idempotent for already rewritten URLs', () => {
  const html =
    '<script src="https://static.zhangrh.shop/zhangrh-shop/hub/static/index-CWvyab_5.js"></script>'

  assert.equal(
    rewriteHtmlAssetUrls({
      html,
      config: OSS_STATIC_CONFIG,
      projectName: 'hub',
    }),
    html,
  )
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
node --test scripts/oss-static-lib.test.mjs
```

Expected: FAIL because `listStaticAssetEntries`, `listHtmlFiles`, and `rewriteHtmlAssetUrls` are not implemented.

- [ ] **Step 3: Replace helper implementation with recursive discovery and HTML rewrite**

Replace the entire `frontend/scripts/oss-static-lib.mjs` file with:

```js
import fs from 'node:fs'
import path from 'node:path'

export const normalizeRelativePath = (value) =>
  String(value).replace(/\\/g, '/').replace(/^\/+/, '')

export const trimSlashes = (value) => String(value).replace(/^\/+|\/+$/g, '')

export const trimTrailingSlashes = (value) => String(value).replace(/\/+$/g, '')

export const buildStaticObjectKey = ({ config, projectName, relativeStaticPath }) => {
  const relativePath = normalizeRelativePath(relativeStaticPath)
  if (!relativePath.startsWith('static/')) {
    throw new Error(`Expected static asset path under static/: ${relativeStaticPath}`)
  }

  return [trimSlashes(config.uploadRoot), projectName, relativePath]
    .filter(Boolean)
    .join('/')
}

export const buildPublicUrl = ({ config, objectKey }) =>
  `${trimTrailingSlashes(config.publicBaseUrl)}/${normalizeRelativePath(objectKey)}`

export const buildPublicAssetUrl = ({ config, projectName, relativeStaticPath }) =>
  buildPublicUrl({
    config,
    objectKey: buildStaticObjectKey({ config, projectName, relativeStaticPath }),
  })

export const readOssCredentials = (env = process.env) => {
  const missing = []
  if (!env.OSS_ACCESS_KEY_ID) {
    missing.push('OSS_ACCESS_KEY_ID')
  }
  if (!env.OSS_ACCESS_KEY_SECRET) {
    missing.push('OSS_ACCESS_KEY_SECRET')
  }
  if (missing.length) {
    throw new Error(`Missing ${missing.join(' and ')}`)
  }

  return {
    accessKeyId: env.OSS_ACCESS_KEY_ID,
    accessKeySecret: env.OSS_ACCESS_KEY_SECRET,
  }
}

export const buildOssClientOptions = ({ config, credentials }) => ({
  region: config.region,
  bucket: config.bucket,
  accessKeyId: credentials.accessKeyId,
  accessKeySecret: credentials.accessKeySecret,
  authorizationV4: true,
})

export const relativePathFromDist = ({ distDir, filePath }) =>
  normalizeRelativePath(path.relative(distDir, filePath))

export const listFilesRecursive = (rootDir) => {
  const entries = []

  const visit = (currentDir) => {
    for (const entry of fs.readdirSync(currentDir, { withFileTypes: true })) {
      const entryPath = path.join(currentDir, entry.name)
      if (entry.isDirectory()) {
        visit(entryPath)
        continue
      }
      if (entry.isFile()) {
        entries.push(entryPath)
      }
    }
  }

  visit(rootDir)
  return entries.sort()
}

export const listStaticAssetEntries = ({ distDir, config, projectName }) => {
  const staticDir = path.join(distDir, 'static')
  if (!fs.existsSync(staticDir)) {
    throw new Error(`Build static output not found: ${staticDir}`)
  }

  return listFilesRecursive(staticDir).map((localPath) => {
    const relativeStaticPath = relativePathFromDist({ distDir, filePath: localPath })
    const objectKey = buildStaticObjectKey({
      config,
      projectName,
      relativeStaticPath,
    })

    return {
      localPath,
      relativeStaticPath,
      objectKey,
      publicUrl: buildPublicUrl({ config, objectKey }),
    }
  })
}

export const listHtmlFiles = ({ distDir }) => {
  if (!fs.existsSync(distDir)) {
    throw new Error(`Build output not found: ${distDir}`)
  }

  return listFilesRecursive(distDir)
    .filter((filePath) => filePath.endsWith('.html'))
    .map((localPath) => ({
      localPath,
      relativeHtmlPath: relativePathFromDist({ distDir, filePath: localPath }),
    }))
}

export const escapeRegExp = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

export const rewriteHtmlAssetUrls = ({ html, config, projectName }) => {
  const escapedProjectName = escapeRegExp(projectName)
  const staticAssetPattern = new RegExp(
    `(^|["'=\\s(])/${escapedProjectName}/static/([^"'\\s)<>]+)`,
    'g',
  )

  return html.replace(staticAssetPattern, (_match, prefix, assetPath) => {
    const relativeStaticPath = `static/${assetPath}`
    return `${prefix}${buildPublicAssetUrl({
      config,
      projectName,
      relativeStaticPath,
    })}`
  })
}

export const rewriteHtmlFile = ({ htmlPath, config, projectName }) => {
  const original = fs.readFileSync(htmlPath, 'utf8')
  const rewritten = rewriteHtmlAssetUrls({
    html: original,
    config,
    projectName,
  })

  if (rewritten !== original) {
    fs.writeFileSync(htmlPath, rewritten, 'utf8')
  }

  return {
    changed: rewritten !== original,
    htmlPath,
  }
}
```

- [ ] **Step 4: Run helper tests**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
node --test scripts/oss-static-lib.test.mjs
```

Expected: PASS.

- [ ] **Step 5: Commit file discovery and HTML rewrite helpers**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop
git add frontend/scripts/oss-static-lib.mjs frontend/scripts/oss-static-lib.test.mjs
git commit -m "feat: 添加 OSS 静态资源 HTML 重写"
```

### Task 4: Add OSS Publish Script

**Files:**
- Create: `frontend/scripts/publish-oss-assets.mjs`

- [ ] **Step 1: Create post-build OSS publish CLI**

Create `frontend/scripts/publish-oss-assets.mjs`:

```js
import OSS from 'ali-oss'
import path from 'node:path'
import { pathToFileURL } from 'node:url'

import { OSS_STATIC_CONFIG } from './oss-static.config.mjs'
import {
  buildOssClientOptions,
  listHtmlFiles,
  listStaticAssetEntries,
  readOssCredentials,
  rewriteHtmlFile,
} from './oss-static-lib.mjs'

const usage = () => {
  console.log('Usage: node scripts/publish-oss-assets.mjs <project-name>')
  console.log('Requires: OSS_ACCESS_KEY_ID and OSS_ACCESS_KEY_SECRET')
}

export const publishOssAssets = async ({
  projectName,
  cwd = process.cwd(),
  config = OSS_STATIC_CONFIG,
  env = process.env,
  createClient = (options) => new OSS(options),
}) => {
  if (!projectName) {
    throw new Error('Missing project name.')
  }

  const distDir = path.resolve(cwd, 'dist', projectName)
  const credentials = readOssCredentials(env)
  const client = createClient(buildOssClientOptions({ config, credentials }))
  const assetEntries = listStaticAssetEntries({ distDir, config, projectName })
  const htmlEntries = listHtmlFiles({ distDir })

  for (const entry of assetEntries) {
    await client.put(entry.objectKey, entry.localPath)
    console.log(`Uploaded OSS asset: ${entry.relativeStaticPath} -> ${entry.publicUrl}`)
  }

  const rewrites = htmlEntries.map((entry) =>
    rewriteHtmlFile({
      htmlPath: entry.localPath,
      config,
      projectName,
    }),
  )

  for (const rewrite of rewrites) {
    console.log(
      `${rewrite.changed ? 'Rewrote' : 'Checked'} HTML: ${path.relative(distDir, rewrite.htmlPath)}`,
    )
  }

  return {
    uploadedCount: assetEntries.length,
    htmlCount: htmlEntries.length,
  }
}

export async function main() {
  const projectName = process.argv[2]
  if (!projectName) {
    usage()
    process.exit(1)
  }

  const result = await publishOssAssets({ projectName })
  console.log(
    `Published OSS assets for ${projectName}: ${result.uploadedCount} assets, ${result.htmlCount} HTML files`,
  )
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error('OSS publish failed:', error instanceof Error ? error.message : String(error))
    process.exit(1)
  })
}
```

- [ ] **Step 2: Verify missing credential failure**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
env -u OSS_ACCESS_KEY_ID -u OSS_ACCESS_KEY_SECRET node scripts/publish-oss-assets.mjs hub
```

Expected: FAIL with `OSS publish failed: Missing OSS_ACCESS_KEY_ID and OSS_ACCESS_KEY_SECRET`.

- [ ] **Step 3: Verify script imports after dependency install**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
node --test scripts/oss-static-lib.test.mjs
```

Expected: PASS.

- [ ] **Step 4: Commit OSS publish script**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop
git add frontend/scripts/publish-oss-assets.mjs
git commit -m "feat: 添加前端 OSS 静态资源发布脚本"
```

### Task 5: Make ECS Deploy HTML-Only

**Files:**
- Modify: `frontend/scripts/deploy-static.mjs`
- Modify: `frontend/scripts/deploy-static.test.mjs`

- [ ] **Step 1: Write failing deploy-static tests**

Append this to `frontend/scripts/deploy-static.test.mjs`:

```js
import { buildHtmlOnlyRsyncArgs } from './deploy-static.mjs'

test('HTML-only rsync args include directories and html files only', () => {
  assert.deepEqual(
    buildHtmlOnlyRsyncArgs({
      localDist: '/tmp/dist/hub',
      remote: 'root@example.com',
      remoteProjectDir: '/opt/zhangrh-shop/site/hub',
    }),
    [
      '-avz',
      '--include',
      '*/',
      '--include',
      '*.html',
      '--exclude',
      '*',
      '/tmp/dist/hub/',
      'root@example.com:/opt/zhangrh-shop/site/hub/',
    ],
  )
})

test('HTML-only rsync args do not delete the remote project directory', () => {
  assert.equal(
    buildHtmlOnlyRsyncArgs({
      localDist: '/tmp/dist/hub',
      remote: 'root@example.com',
      remoteProjectDir: '/opt/zhangrh-shop/site/hub',
    }).includes('--delete'),
    false,
  )
})
```

- [ ] **Step 2: Run tests to verify they fail**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
node --test scripts/deploy-static.test.mjs
```

Expected: FAIL because `buildHtmlOnlyRsyncArgs` is not exported.

- [ ] **Step 3: Add HTML-only rsync helper**

Add this export to `frontend/scripts/deploy-static.mjs` after `shellEscape`:

```js
export const buildHtmlOnlyRsyncArgs = ({ localDist, remote, remoteProjectDir }) => [
  '-avz',
  '--include',
  '*/',
  '--include',
  '*.html',
  '--exclude',
  '*',
  ensureTrailingSlash(localDist),
  `${remote}:${ensureTrailingSlash(remoteProjectDir)}`,
]
```

- [ ] **Step 4: Replace full-directory rsync call**

In `frontend/scripts/deploy-static.mjs`, replace:

```js
  run('rsync', [
    '-avz',
    '--delete',
    ensureTrailingSlash(localDist),
    `${remote}:${ensureTrailingSlash(remoteProjectDir)}`,
  ])
```

with:

```js
  run('rsync', buildHtmlOnlyRsyncArgs({ localDist, remote, remoteProjectDir }))
```

Replace the final log line:

```js
  console.log(`Deployed: ${localDist} -> ${remote}:${ensureTrailingSlash(remoteProjectDir)}`)
```

with:

```js
  console.log(`Deployed HTML: ${localDist} -> ${remote}:${ensureTrailingSlash(remoteProjectDir)}`)
```

- [ ] **Step 5: Run deploy-static tests**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
node --test scripts/deploy-static.test.mjs
```

Expected: PASS.

- [ ] **Step 6: Commit HTML-only ECS deploy**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop
git add frontend/scripts/deploy-static.mjs frontend/scripts/deploy-static.test.mjs
git commit -m "feat: 仅发布前端 HTML 到服务器"
```

### Task 6: Wire OSS Publish Into Frontend Publish Flow

**Files:**
- Modify: `frontend/tools/publish.mjs`

- [ ] **Step 1: Update publish usage text**

In `frontend/tools/publish.mjs`, replace:

```js
  console.log('Publish flow: git pull -> build -> upload to 101.200.185.29')
```

with:

```js
  console.log('Publish flow: git pull -> build -> upload static assets to OSS -> upload HTML to 101.200.185.29')
```

- [ ] **Step 2: Insert OSS publish script after build**

In `frontend/tools/publish.mjs`, replace:

```js
  run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build', '--', project], { cwd })
  run(process.execPath, [path.join(cwd, 'scripts', 'deploy-static.mjs'), project], { cwd })
```

with:

```js
  run(process.platform === 'win32' ? 'npm.cmd' : 'npm', ['run', 'build', '--', project], { cwd })
  run(process.execPath, [path.join(cwd, 'scripts', 'publish-oss-assets.mjs'), project], { cwd })
  run(process.execPath, [path.join(cwd, 'scripts', 'deploy-static.mjs'), project], { cwd })
```

- [ ] **Step 3: Verify missing credentials stop before ECS deploy**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
env -u OSS_ACCESS_KEY_ID -u OSS_ACCESS_KEY_SECRET node tools/publish.mjs hub
```

Expected: command runs `git pull` and `npm run build -- hub`, then fails at `publish-oss-assets.mjs` with missing credential output. It must not print `Deployed HTML`.

- [ ] **Step 4: Commit publish orchestration**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop
git add frontend/tools/publish.mjs
git commit -m "feat: 接入前端 OSS 静态资源发布流程"
```

### Task 7: Update Deployment Documentation

**Files:**
- Modify: `docs/deploy/zhangrh-shop-docker-compose.md`
- Modify: `docs/deploy/zhangrh-shop-service-ledger.md`
- Modify: `docs/deploy/zhangrh-shop-server-ledger.md`

- [ ] **Step 1: Update Docker Compose deployment frontend section**

In `docs/deploy/zhangrh-shop-docker-compose.md`, replace the current "前端发布" section with:

````markdown
## 前端发布

前端发布分为两部分：

- JS / CSS / 图片 / favicon 等 Vite 生成的静态资源发布到阿里云 OSS。
- HTML 入口文件发布到 main 机器的 `/opt/zhangrh-shop/site`。

OSS 静态资源路径：

```txt
https://static.zhangrh.shop/zhangrh-shop/<project>/static/<file>
```

ECS HTML 路径：

```txt
dist/<project>/**/*.html -> /opt/zhangrh-shop/site/<project>/**/*.html
```

发布前需要在本机配置：

```bash
export OSS_ACCESS_KEY_ID='你的 AccessKeyId'
export OSS_ACCESS_KEY_SECRET='你的 AccessKeySecret'
```

正常发布命令：

```bash
cd frontend
npm run publish -- hub
npm run publish -- cardgame
npm run publish -- shotmarker
```

底层流程：

```txt
git pull
npm run build -- <project>
node scripts/publish-oss-assets.mjs <project>
node scripts/deploy-static.mjs <project>
```

前端发布后不需要 reload Nginx。
````

- [ ] **Step 2: Update Docker Compose mapping text**

In `docs/deploy/zhangrh-shop-docker-compose.md`, replace the old mapping block:

```txt
dist/hub/       -> /opt/zhangrh-shop/site/hub/
dist/cardgame/  -> /opt/zhangrh-shop/site/cardgame/
dist/shotmarker/ -> /opt/zhangrh-shop/site/shotmarker/
dist/legacy-h5/ -> /opt/zhangrh-shop/site/legacy-h5/
```

with:

```txt
dist/hub/**/*.html       -> /opt/zhangrh-shop/site/hub/
dist/cardgame/**/*.html  -> /opt/zhangrh-shop/site/cardgame/
dist/shotmarker/**/*.html -> /opt/zhangrh-shop/site/shotmarker/
dist/<project>/static/*  -> https://static.zhangrh.shop/zhangrh-shop/<project>/static/
```

- [ ] **Step 3: Update service ledger domain status**

In `docs/deploy/zhangrh-shop-service-ledger.md`, replace every statement that says `static.zhangrh.shop` is reserved or does not participate in current application publishing with this meaning:

```markdown
`static.zhangrh.shop` 是阿里云 OSS 自定义域名，用于承载前端构建生成的 JS / CSS / 图片 / favicon 等静态资源。HTML 入口仍发布到 main 机器的 `/opt/zhangrh-shop/site/<project>/`。
```

Keep `zhangrh.shop` as the main HTML/nginx entry and keep backend routing unchanged.

- [ ] **Step 4: Update server ledger static domain row**

In `docs/deploy/zhangrh-shop-server-ledger.md`, replace the `static.zhangrh.shop` row description:

```markdown
| `static.zhangrh.shop` | 非 ECS | OSS 静态资源 | 不参与当前应用发布 |
```

with:

```markdown
| `static.zhangrh.shop` | 非 ECS | OSS 静态资源 | 承载前端构建生成的 JS / CSS / 图片 / favicon 等静态资源 |
```

- [ ] **Step 5: Commit deployment docs**

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop
git add docs/deploy/zhangrh-shop-docker-compose.md docs/deploy/zhangrh-shop-service-ledger.md docs/deploy/zhangrh-shop-server-ledger.md
git commit -m "docs: 更新前端 OSS 静态资源发布说明"
```

### Task 8: Local Verification

**Files:**
- Verify: `frontend/scripts/oss-static-lib.test.mjs`
- Verify: `frontend/scripts/deploy-static.test.mjs`
- Verify: `frontend/dist/hub/index.html`

- [ ] **Step 1: Run frontend script tests**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
node --test scripts/oss-static-lib.test.mjs scripts/deploy-static.test.mjs
```

Expected: PASS.

- [ ] **Step 2: Run existing frontend tool tests**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
node --test tools/*.test.mjs
```

Expected: PASS.

- [ ] **Step 3: Run lint and TypeScript checks**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
npm run lint
npx tsc -p tsconfig.app.json
```

Expected: both commands PASS.

- [ ] **Step 4: Build hub locally**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
npm run build -- hub
```

Expected: Vite build succeeds and writes `frontend/dist/hub/index.html` plus `frontend/dist/hub/static/*`.

- [ ] **Step 5: Verify missing credentials fail before HTML rewrite**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
cp dist/hub/index.html /tmp/hub-index-before-oss-rewrite.html
env -u OSS_ACCESS_KEY_ID -u OSS_ACCESS_KEY_SECRET node scripts/publish-oss-assets.mjs hub
cmp dist/hub/index.html /tmp/hub-index-before-oss-rewrite.html
```

Expected: `publish-oss-assets.mjs` fails with missing credentials and `cmp` exits successfully, proving HTML was not rewritten.

- [ ] **Step 6: Verify HTML rewrite with mocked client from Node**

Run this one-off command:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
node --input-type=module <<'EOF'
import { publishOssAssets } from './scripts/publish-oss-assets.mjs'

const uploads = []
await publishOssAssets({
  projectName: 'hub',
  env: {
    OSS_ACCESS_KEY_ID: 'test-id',
    OSS_ACCESS_KEY_SECRET: 'test-secret',
  },
  createClient: () => ({
    async put (objectKey, localPath) {
      uploads.push({ objectKey, localPath })
    },
  }),
})

if (!uploads.length) {
  throw new Error('Expected at least one mocked OSS upload')
}
console.log(JSON.stringify(uploads.map((upload) => upload.objectKey), null, 2))
EOF
rg 'https://static.zhangrh.shop/zhangrh-shop/hub/static/' dist/hub/index.html
```

Expected: command prints uploaded OSS object keys and `rg` finds rewritten OSS URLs in `dist/hub/index.html`.

- [ ] **Step 7: Commit any verification-only fixture changes if they exist**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop
git status --short
```

Expected: no uncommitted changes from verification except generated `frontend/dist` files if the repo does not track them. Do not commit generated `dist` files unless they are already tracked and intentionally changed.

### Task 9: Production Publish Verification

**Files:**
- Verify: `frontend/tools/publish.mjs`
- Verify: Aliyun OSS object URLs
- Verify: `https://zhangrh.shop/hub/`

- [ ] **Step 1: Configure OSS credentials in the shell**

Run:

```bash
export OSS_ACCESS_KEY_ID='你的 AccessKeyId'
export OSS_ACCESS_KEY_SECRET='你的 AccessKeySecret'
```

Expected: shell has both variables for the current publish session.

- [ ] **Step 2: Publish hub**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
npm run publish -- hub
```

Expected:

- `npm run build -- hub` succeeds.
- `publish-oss-assets.mjs` logs uploaded OSS assets.
- `deploy-static.mjs` logs `Deployed HTML`.
- ECS upload does not mention `--delete`.

- [ ] **Step 3: Verify generated HTML references OSS**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop/frontend
rg 'https://static.zhangrh.shop/zhangrh-shop/hub/static/' dist/hub/index.html
```

Expected: HTML contains OSS URLs for JS, CSS, and favicon.

- [ ] **Step 4: Verify one OSS asset URL**

Pick one asset name from `dist/hub/index.html`, then run:

```bash
curl -I https://static.zhangrh.shop/zhangrh-shop/hub/static/<built-file>
```

Expected: HTTP `200` or `304`.

- [ ] **Step 5: Verify production HTML**

Run:

```bash
curl -k https://zhangrh.shop/hub/ | rg 'https://static.zhangrh.shop/zhangrh-shop/hub/static/'
```

Expected: production HTML references `static.zhangrh.shop`.

- [ ] **Step 6: Commit final verified state if any tracked files changed**

Run:

```bash
cd /Users/runhaozhang/Documents/project/zhangrh.shop
git status --short
```

If only source, tests, dependency files, and docs are changed, commit them with:

```bash
git add frontend/package.json frontend/package-lock.json frontend/scripts frontend/tools/publish.mjs docs/deploy
git commit -m "feat: 发布前端静态资源到阿里云 OSS"
```

Expected: final source commit contains implementation and docs, with no generated `frontend/dist` files unless they were already tracked intentionally.
