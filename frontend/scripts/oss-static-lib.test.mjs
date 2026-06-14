import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

import { OSS_STATIC_CONFIG } from './oss-static.config.mjs'
import {
  buildOssClientOptions,
  buildPublicAssetUrl,
  buildPublicUrl,
  buildStaticObjectKey,
  escapeRegExp,
  listHtmlFiles,
  listStaticAssetEntries,
  relativePathFromDist,
  readOssCredentials,
  rewriteHtmlAssetUrls,
  rewriteHtmlFile,
} from './oss-static-lib.mjs'

const makeTempDir = () => fs.mkdtempSync(path.join(os.tmpdir(), 'oss-static-lib-'))

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

test('buildStaticObjectKey rejects static paths that traverse outside static directory', () => {
  assert.throws(
    () =>
      buildStaticObjectKey({
        config: OSS_STATIC_CONFIG,
        projectName: 'hub',
        relativeStaticPath: 'static/../index.html',
      }),
    /Expected static asset path/,
  )
})

test('buildStaticObjectKey rejects static paths with traversal segments before normalization', () => {
  assert.throws(
    () =>
      buildStaticObjectKey({
        config: OSS_STATIC_CONFIG,
        projectName: 'hub',
        relativeStaticPath: 'static/foo/../bar.js',
      }),
    /Expected static asset path/,
  )
})

test('buildStaticObjectKey rejects paths that start outside static directory', () => {
  assert.throws(
    () =>
      buildStaticObjectKey({
        config: OSS_STATIC_CONFIG,
        projectName: 'hub',
        relativeStaticPath: '../static/foo.js',
      }),
    /Expected static asset path/,
  )
})

test('buildStaticObjectKey rejects invalid project names', () => {
  for (const projectName of [
    '',
    '.',
    '..',
    'nested/project',
    'nested\\project',
    'foo bar',
    'foo?bar',
    'foo#bar',
  ]) {
    assert.throws(
      () =>
        buildStaticObjectKey({
          config: OSS_STATIC_CONFIG,
          projectName,
          relativeStaticPath: 'static/index-CWvyab_5.js',
        }),
      /Invalid project name/,
    )
  }
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

test('buildPublicUrl rejects traversal object keys', () => {
  assert.throws(
    () =>
      buildPublicUrl({
        config: OSS_STATIC_CONFIG,
        objectKey: '../x',
      }),
    /Invalid OSS object key/,
  )
})

test('buildPublicUrl rejects embedded traversal object keys before normalization', () => {
  for (const objectKey of [
    'zhangrh-shop/hub/../admin/static/a.js',
    'zhangrh-shop/hub/static/../x.js',
    'zhangrh-shop\\hub\\..\\admin\\static\\a.js',
  ]) {
    assert.throws(
      () =>
        buildPublicUrl({
          config: OSS_STATIC_CONFIG,
          objectKey,
        }),
      /Invalid OSS object key/,
    )
  }
})

test('buildPublicUrl rejects empty and dot object keys', () => {
  for (const objectKey of ['', '.']) {
    assert.throws(
      () =>
        buildPublicUrl({
          config: OSS_STATIC_CONFIG,
          objectKey,
        }),
      /Invalid OSS object key/,
    )
  }
})

test('buildPublicAssetUrl maps project static path to static.zhangrh.shop', () => {
  assert.equal(
    buildPublicAssetUrl({
      config: OSS_STATIC_CONFIG,
      projectName: 'shotmaker',
      relativeStaticPath: 'static/index-EcMJOixg.js',
    }),
    'https://static.zhangrh.shop/zhangrh-shop/shotmaker/static/index-EcMJOixg.js',
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

test('readOssCredentials treats whitespace-only values as missing', () => {
  assert.throws(
    () =>
      readOssCredentials({
        OSS_ACCESS_KEY_ID: '   ',
        OSS_ACCESS_KEY_SECRET: 'secret',
      }),
    /Missing OSS_ACCESS_KEY_ID/,
  )
})

test('readOssCredentials returns trimmed credential values', () => {
  assert.deepEqual(
    readOssCredentials({
      OSS_ACCESS_KEY_ID: ' id ',
      OSS_ACCESS_KEY_SECRET: '\tsecret\n',
    }),
    {
      accessKeyId: 'id',
      accessKeySecret: 'secret',
    },
  )
})

test('readOssCredentials rejects internal whitespace in access key id', () => {
  for (const OSS_ACCESS_KEY_ID of ['i d', 'i\td', 'i\nd']) {
    assert.throws(
      () =>
        readOssCredentials({
          OSS_ACCESS_KEY_ID,
          OSS_ACCESS_KEY_SECRET: 'secret',
        }),
      /Invalid OSS_ACCESS_KEY_ID/,
    )
  }
})

test('readOssCredentials rejects internal whitespace in access key secret', () => {
  for (const OSS_ACCESS_KEY_SECRET of ['sec ret', 'sec\tret', 'sec\nret']) {
    assert.throws(
      () =>
        readOssCredentials({
          OSS_ACCESS_KEY_ID: 'id',
          OSS_ACCESS_KEY_SECRET,
        }),
      /Invalid OSS_ACCESS_KEY_SECRET/,
    )
  }
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

test('relativePathFromDist returns normalized relative path for nested dist files', () => {
  assert.equal(
    relativePathFromDist({
      distDir: '/repo/frontend/dist/hub',
      filePath: '/repo/frontend/dist/hub/static/index-CWvyab_5.js',
    }),
    'static/index-CWvyab_5.js',
  )
})

test('relativePathFromDist rejects files outside dist directory', () => {
  assert.throws(
    () =>
      relativePathFromDist({
        distDir: '/repo/frontend/dist/hub',
        filePath: '/repo/frontend/dist/index.html',
      }),
    /Expected file path inside dist directory/,
  )
})

test('relativePathFromDist rejects the dist directory itself', () => {
  assert.throws(
    () =>
      relativePathFromDist({
        distDir: '/repo/frontend/dist/hub',
        filePath: '/repo/frontend/dist/hub',
      }),
    /Expected file path inside dist directory/,
  )
})

test('listStaticAssetEntries includes static files and maps object keys and public URLs', () => {
  const rootDir = makeTempDir()
  const distDir = path.join(rootDir, 'dist', 'hub')
  fs.mkdirSync(path.join(distDir, 'static', 'assets'), { recursive: true })
  fs.writeFileSync(path.join(distDir, 'index.html'), '<html></html>')
  fs.writeFileSync(path.join(distDir, 'static', 'index-CWvyab_5.js'), 'console.log("hub")')
  fs.writeFileSync(path.join(distDir, 'static', 'assets', 'logo.png'), 'png')

  assert.deepEqual(
    listStaticAssetEntries({
      distDir,
      config: OSS_STATIC_CONFIG,
      projectName: 'hub',
    }),
    [
      {
        localPath: path.join(distDir, 'static', 'assets', 'logo.png'),
        relativeStaticPath: 'static/assets/logo.png',
        objectKey: 'zhangrh-shop/hub/static/assets/logo.png',
        publicUrl: 'https://static.zhangrh.shop/zhangrh-shop/hub/static/assets/logo.png',
      },
      {
        localPath: path.join(distDir, 'static', 'index-CWvyab_5.js'),
        relativeStaticPath: 'static/index-CWvyab_5.js',
        objectKey: 'zhangrh-shop/hub/static/index-CWvyab_5.js',
        publicUrl: 'https://static.zhangrh.shop/zhangrh-shop/hub/static/index-CWvyab_5.js',
      },
    ],
  )
})

test('listStaticAssetEntries fails when static output is missing', () => {
  const rootDir = makeTempDir()
  const distDir = path.join(rootDir, 'dist', 'hub')
  fs.mkdirSync(distDir, { recursive: true })

  assert.throws(
    () =>
      listStaticAssetEntries({
        distDir,
        config: OSS_STATIC_CONFIG,
        projectName: 'hub',
      }),
    new RegExp(`Build static output not found: ${escapeRegExp(path.join(distDir, 'static'))}`),
  )
})

test('listHtmlFiles includes nested HTML files and excludes files under static', () => {
  const rootDir = makeTempDir()
  const distDir = path.join(rootDir, 'dist', 'hub')
  fs.mkdirSync(path.join(distDir, 'products'), { recursive: true })
  fs.mkdirSync(path.join(distDir, 'static'), { recursive: true })
  fs.writeFileSync(path.join(distDir, 'index.html'), '<html></html>')
  fs.writeFileSync(path.join(distDir, 'products', 'index.html'), '<html></html>')
  fs.writeFileSync(path.join(distDir, 'static', 'index.html'), '<html></html>')
  fs.writeFileSync(path.join(distDir, 'static', 'index-CWvyab_5.js'), 'console.log("hub")')

  assert.deepEqual(listHtmlFiles({ distDir }), [
    {
      localPath: path.join(distDir, 'index.html'),
      relativeHtmlPath: 'index.html',
    },
    {
      localPath: path.join(distDir, 'products', 'index.html'),
      relativeHtmlPath: 'products/index.html',
    },
  ])
})

test('rewriteHtmlAssetUrls rewrites only current project static asset URLs', () => {
  const html = [
    '<script type="module" src="/hub/static/index-CWvyab_5.js"></script>',
    '<link rel="stylesheet" href="/hub/static/index-BCVh40yg.css">',
  ].join('\n')

  assert.equal(
    rewriteHtmlAssetUrls({
      html,
      config: OSS_STATIC_CONFIG,
      projectName: 'hub',
    }),
    [
      '<script type="module" src="https://static.zhangrh.shop/zhangrh-shop/hub/static/index-CWvyab_5.js"></script>',
      '<link rel="stylesheet" href="https://static.zhangrh.shop/zhangrh-shop/hub/static/index-BCVh40yg.css">',
    ].join('\n'),
  )
})

test('rewriteHtmlAssetUrls preserves external URLs, app routes, business data URLs, and other project static paths', () => {
  const html = [
    '<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+SC" rel="stylesheet">',
    '<script src="https://hm.baidu.com/hm.js?abc"></script>',
    '<a href="/hub/products/card-game">Card game</a>',
    '<img src="https://zhangrunhao.oss-cn-beijing.aliyuncs.com/business/card.png">',
    '<script src="/cardgame/static/index-B3F7aiyZ.js"></script>',
  ].join('\n')

  assert.equal(
    rewriteHtmlAssetUrls({
      html,
      config: OSS_STATIC_CONFIG,
      projectName: 'hub',
    }),
    html,
  )
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

test('rewriteHtmlFile rewrites file contents and reports whether a file changed', () => {
  const rootDir = makeTempDir()
  const htmlPath = path.join(rootDir, 'index.html')
  fs.writeFileSync(htmlPath, '<script src="/hub/static/index-CWvyab_5.js"></script>')

  assert.deepEqual(
    rewriteHtmlFile({
      htmlPath,
      config: OSS_STATIC_CONFIG,
      projectName: 'hub',
    }),
    {
      changed: true,
      htmlPath,
    },
  )
  assert.equal(
    fs.readFileSync(htmlPath, 'utf8'),
    '<script src="https://static.zhangrh.shop/zhangrh-shop/hub/static/index-CWvyab_5.js"></script>',
  )

  assert.deepEqual(
    rewriteHtmlFile({
      htmlPath,
      config: OSS_STATIC_CONFIG,
      projectName: 'hub',
    }),
    {
      changed: false,
      htmlPath,
    },
  )
})
