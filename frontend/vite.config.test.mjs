import test, { after } from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { escapeRegExp } from './scripts/oss-static-lib.mjs'

const frontendRoot = path.dirname(fileURLToPath(import.meta.url))
const tempRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'vite-oss-assets-'))
const ossBase = 'https://static.zhangrh.shop/zhangrh-shop'

after(() => {
  fs.rmSync(tempRoot, { recursive: true, force: true })
})

const buildForOssPublish = (projectName) => {
  const outDir = path.join(tempRoot, projectName)
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
      env: {
        ...process.env,
        ZHANGRH_SHOP_PUBLISH_OSS_ASSETS: '1',
      },
    },
  )

  assert.equal(
    result.status,
    0,
    `Build failed for ${projectName}:\n${result.stdout}\n${result.stderr}`,
  )

  const staticDir = path.join(outDir, 'static')
  const bundlePath = fs
    .readdirSync(staticDir)
    .map((fileName) => path.join(staticDir, fileName))
    .find((filePath) => /^index-.+\.js$/.test(path.basename(filePath)))
  assert.ok(bundlePath, `Missing JavaScript bundle for ${projectName}`)

  return {
    bundle: fs.readFileSync(bundlePath, 'utf8'),
    html: fs.readFileSync(path.join(outDir, 'index.html'), 'utf8'),
  }
}

test('Hub OSS publish build keeps pathname routing while rendering assets on OSS', () => {
  const { bundle, html } = buildForOssPublish('hub')
  const projectOssBase = `${ossBase}/hub/`
  const escapedProjectOssBase = escapeRegExp(projectOssBase)

  assert.match(html, new RegExp(`${escapedProjectOssBase}static/[^"]+\\.js`))
  assert.match(html, new RegExp(`${escapedProjectOssBase}static/[^"]+\\.css`))

  const coverUrls =
    bundle.match(
      /https:\/\/static\.zhangrh\.shop\/zhangrh-shop\/hub\/static\/cover-[A-Za-z0-9_-]+\.png/g,
    ) ?? []
  assert.equal(new Set(coverUrls).size, 2)
  assert.match(bundle, /["']\/hub\/["']/)
  assert.doesNotMatch(
    bundle,
    new RegExp(`${escapedProjectOssBase}(?:products|articles|about)`),
  )
})

test('ShotMarker OSS publish build keeps its pathname routing base', () => {
  const { bundle, html } = buildForOssPublish('shotmarker')
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
