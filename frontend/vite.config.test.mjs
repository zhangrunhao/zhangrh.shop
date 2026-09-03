import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { resolveConfig } from 'vite'

import { escapeRegExp } from './scripts/oss-static-lib.mjs'

const frontendRoot = path.dirname(fileURLToPath(import.meta.url))
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'vite-oss-assets-'))
const ossBase = 'https://static.zhangrh.shop/zhangrh-shop'
const publishOssAssetsEnv = 'ZHANGRH_SHOP_PUBLISH_OSS_ASSETS'
const hubConfigPath = path.join(frontendRoot, 'project', 'hub', 'vite.config.ts')

after(() => {
  fs.rmSync(tempRoot, { recursive: true, force: true })
})

const buildProject = ({ projectName, publishOssAssets }) => {
  const outDir = path.join(tempRoot, `${projectName}-${publishOssAssets ? 'oss' : 'local'}`)
  const env = { ...process.env }
  delete env[publishOssAssetsEnv]
  if (publishOssAssets) {
    env[publishOssAssetsEnv] = '1'
  }

  const result = spawnSync(
    process.execPath,
    [
      path.join(frontendRoot, 'tools', 'vite-project.mjs'),
      'build',
      projectName,
      '--outDir',
      outDir,
    ],
    {
      cwd: frontendRoot,
      encoding: 'utf8',
      env,
    },
  )

  assert.equal(
    result.status,
    0,
    `Build failed for ${projectName}:\n${result.stdout}\n${result.stderr}`,
  )

  const staticDir = path.join(outDir, 'static')
  const staticFileNames = fs.readdirSync(staticDir)
  const bundlePath = staticFileNames
    .map((fileName) => path.join(staticDir, fileName))
    .find((filePath) => /^index-.+\.js$/.test(path.basename(filePath)))
  assert.ok(bundlePath, `Missing JavaScript bundle for ${projectName}`)

  return {
    bundle: fs.readFileSync(bundlePath, 'utf8'),
    coverFileNames: staticFileNames.filter((fileName) => /^cover-.+\.[^.]+$/.test(fileName)),
    html: fs.readFileSync(path.join(outDir, 'index.html'), 'utf8'),
    outDir,
  }
}

const resolveHubServeConfig = ({ isPreview }) =>
  resolveConfig(
    {
      configFile: hubConfigPath,
      logLevel: 'silent',
    },
    'serve',
    isPreview ? 'production' : 'development',
    isPreview ? 'production' : 'development',
    isPreview,
  )

test('Hub preview serves its built project pathname base', async () => {
  const config = await resolveHubServeConfig({ isPreview: true })

  assert.equal(config.base, '/hub/')
})

test('Hub dev server keeps its root base', async () => {
  const config = await resolveHubServeConfig({ isPreview: false })

  assert.equal(config.base, '/')
})

test('Hub OSS publish build keeps pathname routing while rendering assets on OSS', () => {
  const { bundle, coverFileNames, html } = buildProject({
    projectName: 'hub',
    publishOssAssets: true,
  })
  const projectOssBase = `${ossBase}/hub/`
  const escapedProjectOssBase = escapeRegExp(projectOssBase)

  assert.match(html, new RegExp(`${escapedProjectOssBase}static/[^"]+\\.js`))
  assert.match(html, new RegExp(`${escapedProjectOssBase}static/[^"]+\\.css`))

  assert.ok(coverFileNames.length > 0)
  for (const coverFileName of coverFileNames) {
    assert.ok(bundle.includes(`${projectOssBase}static/${coverFileName}`))
  }
  assert.doesNotMatch(bundle, /(?<!zhangrh-shop)\/hub\/static\/cover-/)
  assert.match(bundle, /["']\/hub\/["']/)
  assert.doesNotMatch(
    bundle,
    new RegExp(`${escapedProjectOssBase}(?:products|articles|about)`),
  )
})

test('Hub local build keeps pathname asset URLs when OSS publishing is disabled', () => {
  const { bundle, coverFileNames, html } = buildProject({
    projectName: 'hub',
    publishOssAssets: false,
  })

  assert.match(html, /\/hub\/static\/[^"]+\.js/)
  assert.match(html, /\/hub\/static\/[^"]+\.css/)
  assert.doesNotMatch(html, /https:\/\/static\.zhangrh\.shop/)

  assert.ok(coverFileNames.length > 0)
  for (const coverFileName of coverFileNames) {
    assert.ok(bundle.includes(`/hub/static/${coverFileName}`))
  }
  assert.doesNotMatch(bundle, /https:\/\/static\.zhangrh\.shop/)
  assert.match(bundle, /["']\/hub\/["']/)
})

test('ShotMarker OSS publish build keeps its pathname routing base', () => {
  const { bundle, html } = buildProject({
    projectName: 'shotmarker',
    publishOssAssets: true,
  })
  const projectOssBase = `${ossBase}/shotmarker/`
  const escapedProjectOssBase = escapeRegExp(projectOssBase)

  assert.match(html, new RegExp(`${escapedProjectOssBase}static/[^"]+\\.js`))
  assert.match(html, new RegExp(`${escapedProjectOssBase}static/[^"]+\\.css`))
  assert.match(bundle, /["']\/shotmarker\/["']/)
  assert.doesNotMatch(
    bundle,
    new RegExp(`${escapedProjectOssBase}(?:support|privacy|how-to)`),
  )
})

test('WebTrace OSS publish build keeps its pathname routing base', () => {
  const { bundle, html, outDir } = buildProject({
    projectName: 'webtrace',
    publishOssAssets: true,
  })
  const projectOssBase = `${ossBase}/webtrace/`
  const escapedProjectOssBase = escapeRegExp(projectOssBase)

  assert.match(html, new RegExp(`${escapedProjectOssBase}static/[^"]+\\.js`))
  assert.match(html, new RegExp(`${escapedProjectOssBase}static/[^"]+\\.css`))
  assert.match(bundle, /["']\/webtrace\/["']/)
  assert.match(bundle, /["']\/webtrace\/support["']/)
  assert.match(bundle, /["']\/webtrace\/privacy["']/)
  assert.equal(
    fs.readFileSync(path.join(outDir, 'support', 'index.html'), 'utf8'),
    html,
  )
  assert.equal(
    fs.readFileSync(path.join(outDir, 'privacy', 'index.html'), 'utf8'),
    html,
  )
  assert.doesNotMatch(
    bundle,
    new RegExp(`${escapedProjectOssBase}(?:support|privacy)`),
  )
})
