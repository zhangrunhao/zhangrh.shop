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
