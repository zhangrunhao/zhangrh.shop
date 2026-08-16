import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import test from 'node:test'

import express from 'express'

import {
  TrackLogTooLargeError,
  TrackLogUnavailableError,
  TrackQueryTimeoutError,
} from '../projects/track-query.js'
import { registerTrack } from '../projects/track.js'

const FIXED_NOW = new Date('2026-08-16T04:00:00.000Z')
const sampleTrend = {
  daily: [{ date: '2026-08-16', pv: 2, uv: 1 }],
}
const validPath = '/api/track/trend?project=hub&event=home_page_load&days=1'

const startApp = async (t, options = {}) => {
  const app = express()
  app.get('/unrelated', (_req, res) => res.json({ ok: true }))
  registerTrack(app, {
    logDir: '/test/track',
    queryTrend: async () => sampleTrend,
    now: () => FIXED_NOW,
    ...options,
  })

  const server = app.listen(0, '127.0.0.1')
  await new Promise((resolve, reject) => {
    server.once('listening', resolve)
    server.once('error', reject)
  })
  t.after(() => new Promise((resolve) => server.close(resolve)))

  const address = server.address()
  return `http://127.0.0.1:${address.port}`
}

test('server registers Track with the configured read-only log directory', async () => {
  const source = await readFile(new URL('../server.js', import.meta.url), 'utf8')
  assert.match(source, /import \{ registerTrack \} from ['"]\.\/projects\/track\.js['"]/)
  assert.match(source, /process\.env\.TRACK_LOG_DIR/)
  assert.match(source, /\/var\/log\/nginx\/track/)
  assert.match(source, /registerTrack\(app,/)
})

test('accepts only the exact trend route with all three valid query parameters', async (t) => {
  const calls = []
  const origin = await startApp(t, {
    queryTrend: async (options) => {
      calls.push(options)
      return sampleTrend
    },
  })

  for (const [project, event, days] of [
    ['hub', 'home_page_load', 1],
    ['cardgame', 'cardgame_page_load', 7],
    ['shotmarker', 'app_launch', 90],
    ['hub', 'custom_event', 30],
  ]) {
    const response = await fetch(
      `${origin}/api/track/trend?project=${project}&event=${event}&days=${days}`,
    )
    assert.equal(response.status, 200)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    assert.deepEqual(await response.json(), sampleTrend)
  }

  assert.deepEqual(calls[0], {
    logDir: '/test/track',
    project: 'hub',
    event: 'home_page_load',
    days: 1,
    now: FIXED_NOW,
  })

  for (const pathname of [
    '/api/track/trend/',
    '/api/Track/trend',
    '/API/track/trend',
    '/api/track/summary',
    '/api/track/other',
  ]) {
    assert.equal((await fetch(`${origin}${pathname}`)).status, 404, pathname)
  }
})

test('requires project, event, and days without scanning', async (t) => {
  let calls = 0
  const origin = await startApp(t, {
    queryTrend: async () => {
      calls += 1
      return sampleTrend
    },
  })

  for (const query of [
    '?event=home_page_load&days=1',
    '?project=hub&days=1',
    '?project=hub&event=home_page_load',
    '',
  ]) {
    const response = await fetch(`${origin}/api/track/trend${query}`)
    assert.equal(response.status, 400, query)
    assert.equal((await response.json()).error.code, 'missing_query_parameter', query)
  }
  assert.equal(calls, 0)
})

test('rejects invalid, duplicate, and unknown query parameters before scanning', async (t) => {
  let calls = 0
  const origin = await startApp(t, {
    queryTrend: async () => {
      calls += 1
      return sampleTrend
    },
  })

  const cases = [
    ['?project=hub&event=home_page_load&days=', 'invalid_days'],
    ['?project=hub&event=home_page_load&days=2', 'invalid_days'],
    ['?project=hub&event=home_page_load&days=91', 'invalid_days'],
    ['?project=unknown&event=home_page_load&days=1', 'invalid_project'],
    ['?project=&event=home_page_load&days=1', 'invalid_project'],
    ['?project=hub&event=&days=1', 'invalid_event'],
    ['?project=hub&event=HomePageLoad&days=1', 'invalid_event'],
    ['?project=hub&event=1bad&days=1', 'invalid_event'],
    ['?project=hub&project=hub&event=home_page_load&days=1', 'duplicate_query_parameter'],
    ['?project=hub&event=home_page_load&event=home_page_load&days=1', 'duplicate_query_parameter'],
    ['?project=hub&event=home_page_load&days=1&days=1', 'duplicate_query_parameter'],
    ['?project=hub&event=home_page_load&days=1&unknown=1', 'unknown_query_parameter'],
  ]

  for (const [query, code] of cases) {
    const response = await fetch(`${origin}/api/track/trend${query}`)
    assert.equal(response.status, 400, query)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    assert.equal((await response.json()).error.code, code, query)
  }
  assert.equal(calls, 0)
})

test('allows one scan and rejects concurrent requests without leaking the counter', async (t) => {
  let releaseFirst
  let callCount = 0
  const firstScan = new Promise((resolve) => {
    releaseFirst = resolve
  })
  const origin = await startApp(t, {
    queryTrend: async () => {
      callCount += 1
      if (callCount === 1) await firstScan
      return sampleTrend
    },
  })

  const firstResponsePromise = fetch(`${origin}${validPath}`)
  for (let attempt = 0; callCount === 0 && attempt < 100; attempt += 1) {
    await new Promise((resolve) => setImmediate(resolve))
  }
  assert.equal(callCount, 1)

  const busyResponse = await fetch(`${origin}${validPath}`)
  assert.equal(busyResponse.status, 503)
  assert.equal(busyResponse.headers.get('retry-after'), '2')
  assert.equal((await busyResponse.json()).error.code, 'track_query_busy')

  releaseFirst()
  assert.equal((await firstResponsePromise).status, 200)
  assert.equal((await fetch(`${origin}${validPath}`)).status, 200)
})

test('maps known query errors and isolates unexpected errors', async (t) => {
  const cases = [
    [new TrackLogUnavailableError(), 'track_log_unavailable'],
    [new TrackLogTooLargeError(), 'track_log_too_large'],
    [new TrackQueryTimeoutError(), 'track_query_timeout'],
  ]

  for (const [error, code] of cases) {
    const origin = await startApp(t, { queryTrend: async () => { throw error } })
    const response = await fetch(`${origin}${validPath}`)
    assert.equal(response.status, 503)
    assert.equal(response.headers.get('cache-control'), 'no-store')
    assert.equal((await response.json()).error.code, code)
    assert.equal((await fetch(`${origin}/unrelated`)).status, 200)
  }
})

test('returns a sanitized internal error without logging raw exception content', async (t) => {
  const logged = []
  const originalError = console.error
  console.error = (...args) => logged.push(args)
  t.after(() => {
    console.error = originalError
  })

  const origin = await startApp(t, {
    queryTrend: async () => {
      throw new Error('/var/log/nginx/track Device000001 raw payload')
    },
  })
  const response = await fetch(`${origin}${validPath}`)

  assert.equal(response.status, 500)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.equal((await response.json()).error.code, 'internal_error')
  assert.doesNotMatch(JSON.stringify(logged), /\/var\/log\/nginx|Device000001|raw payload/)
})
