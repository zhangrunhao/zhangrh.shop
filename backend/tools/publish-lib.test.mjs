import test from 'node:test'
import assert from 'node:assert/strict'

import {
  DEFAULT_COMPOSE_ROOT,
  DEFAULT_RSYNC_DEST,
  buildRemoteComposeCommand,
  buildRsyncArgs,
  ensureTrailingSlash,
} from './publish-lib.mjs'

test('backend publish default destination is the compose backend directory', () => {
  assert.equal(DEFAULT_RSYNC_DEST, '/opt/zhangrh-shop/backend')
})

test('backend compose root is the deployment root', () => {
  assert.equal(DEFAULT_COMPOSE_ROOT, '/opt/zhangrh-shop')
})

test('ensureTrailingSlash appends one trailing slash', () => {
  assert.equal(ensureTrailingSlash('/opt/zhangrh-shop/backend'), '/opt/zhangrh-shop/backend/')
  assert.equal(ensureTrailingSlash('/opt/zhangrh-shop/backend/'), '/opt/zhangrh-shop/backend/')
})

test('buildRsyncArgs includes Docker runtime files', () => {
  const args = buildRsyncArgs({
    remote: 'root@example.com',
    remoteDest: '/opt/zhangrh-shop/backend/',
  })

  assert.deepEqual(args.slice(0, 2), ['-avz', '--delete'])
  assert.ok(args.includes('.dockerignore'))
  assert.ok(args.includes('Dockerfile'))
  assert.ok(args.includes('server.js'))
  assert.ok(args.includes('package.json'))
  assert.ok(args.includes('package-lock.json'))
  assert.ok(args.includes('projects/***'))
  assert.equal(args.at(-1), 'root@example.com:/opt/zhangrh-shop/backend/')
})

test('buildRemoteComposeCommand rebuilds only backend service from deployment root', () => {
  assert.equal(
    buildRemoteComposeCommand('/opt/zhangrh-shop'),
    "cd '/opt/zhangrh-shop' && docker compose up -d --build backend",
  )
})
