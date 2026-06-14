import test from 'node:test'
import assert from 'node:assert/strict'
import {
  DEFAULT_PROJECT_NAME,
  DEFAULT_RSYNC_DEST,
  DEFAULT_RSYNC_HOST,
  DEFAULT_RSYNC_USER,
  distDirForProject,
  ensureTrailingSlash,
  remoteDirForProject,
  shellEscape,
} from './deploy-static.mjs'

test('defaults use compose site rsync target', () => {
  assert.equal(DEFAULT_PROJECT_NAME, 'hub')
  assert.equal(DEFAULT_RSYNC_USER, 'root')
  assert.equal(DEFAULT_RSYNC_HOST, '101.200.185.29')
  assert.equal(DEFAULT_RSYNC_DEST, '/opt/zhangrh-shop/site')
})

test('distDirForProject points to dist/<project>', () => {
  assert.equal(distDirForProject('hub'), 'dist/hub')
})

test('remoteDirForProject joins base and project', () => {
  assert.equal(remoteDirForProject('/opt/zhangrh-shop/site', 'hub'), '/opt/zhangrh-shop/site/hub')
  assert.equal(remoteDirForProject('/opt/zhangrh-shop/site/', 'hub'), '/opt/zhangrh-shop/site/hub')
})

test('ensureTrailingSlash appends once', () => {
  assert.equal(ensureTrailingSlash('/opt/zhangrh-shop/site/hub'), '/opt/zhangrh-shop/site/hub/')
  assert.equal(ensureTrailingSlash('/opt/zhangrh-shop/site/hub/'), '/opt/zhangrh-shop/site/hub/')
})

test('shellEscape quotes safely', () => {
  assert.equal(shellEscape('/opt/zhangrh-shop/site/hub'), "'/opt/zhangrh-shop/site/hub'")
  assert.equal(shellEscape("abc'def"), "'abc'\\''def'")
})

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
