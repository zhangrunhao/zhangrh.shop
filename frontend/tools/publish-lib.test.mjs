import test from 'node:test'
import assert from 'node:assert/strict'

import {
  PUBLISH_OSS_ASSETS_ENV,
  buildNpmBuildArgs,
  buildPublishBuildEnv,
  resolvePublishProject,
} from './publish-lib.mjs'

test('buildNpmBuildArgs keeps the selected project pathname base', () => {
  assert.deepEqual(
    buildNpmBuildArgs({
      projectName: 'hub',
    }),
    ['run', 'build', '--', 'hub'],
  )
})

test('buildPublishBuildEnv enables OSS asset rendering in the build subprocess', () => {
  assert.deepEqual(
    buildPublishBuildEnv({
      env: {
        PATH: '/test/bin',
        EXISTING_VALUE: 'preserved',
      },
    }),
    {
      PATH: '/test/bin',
      EXISTING_VALUE: 'preserved',
      [PUBLISH_OSS_ASSETS_ENV]: '1',
    },
  )
})

test('resolvePublishProject prefers direct project arg', async () => {
  const project = await resolvePublishProject({
    projects: ['cardgame', 'hub'],
    argv: ['hub'],
    npmConfigArgvRaw: null,
    isInteractive: true,
    lastProject: null,
    askChoice: async () => 'cardgame',
  })

  assert.equal(project, 'hub')
})

test('resolvePublishProject falls back to npm_config_argv project', async () => {
  const project = await resolvePublishProject({
    projects: ['cardgame', 'hub'],
    argv: ['publish'],
    npmConfigArgvRaw: JSON.stringify({
      original: ['run', 'publish', 'cardgame'],
    }),
    isInteractive: true,
    lastProject: null,
    askChoice: async () => 'hub',
  })

  assert.equal(project, 'cardgame')
})

test('resolvePublishProject asks interactively when no project provided', async () => {
  let asked = false
  const project = await resolvePublishProject({
    projects: ['cardgame', 'hub'],
    argv: [],
    npmConfigArgvRaw: null,
    isInteractive: true,
    lastProject: 'hub',
    askChoice: async ({ defaultValue }) => {
      asked = true
      assert.equal(defaultValue, 'hub')
      return 'hub'
    },
  })

  assert.equal(project, 'hub')
  assert.equal(asked, true)
})

test('resolvePublishProject returns null when no TTY and no project arg', async () => {
  const project = await resolvePublishProject({
    projects: ['cardgame', 'hub'],
    argv: [],
    npmConfigArgvRaw: null,
    isInteractive: false,
    lastProject: null,
    askChoice: async () => 'hub',
  })

  assert.equal(project, null)
})
