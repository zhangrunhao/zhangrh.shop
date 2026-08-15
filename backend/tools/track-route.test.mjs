import assert from 'node:assert/strict'
import test from 'node:test'

import express from 'express'

import {
  TrackLogTooLargeError,
  TrackLogUnavailableError,
  TrackQueryTimeoutError,
} from '../projects/track-query.js'
import { registerTrack } from '../projects/track.js'

const FIXED_NOW = new Date('2026-08-15T12:30:00.000Z')

const sampleSummary = {
  generated_at: '2026-08-15T12:30:01.000Z',
  range: {
    days: 30,
    from: '2026-07-17T00:00:00+08:00',
    to: '2026-08-15T20:30:00.000+08:00',
    timezone: 'Asia/Shanghai',
  },
  filter: { project: null },
  totals: { events: 0, devices: 0, earliest_received_at: null, latest_received_at: null },
  projects: [],
  event_breakdown: [],
  page_breakdown: [],
  button_breakdown: [],
  daily: [],
  diagnostics: {
    files_read: 0,
    compressed_files_read: 0,
    lines_read: 0,
    included_records: 0,
    empty_lines: 0,
    invalid_json_lines: 0,
    rejected_records: 0,
    duplicate_records: 0,
    out_of_range_records: 0,
    project_filtered_records: 0,
    ignored_dimensions: 0,
    partial_lines: 0,
  },
}

const startApp = async (t, options = {}) => {
  const app = express()
  app.get('/unrelated', (_req, res) => res.json({ ok: true }))
  registerTrack(app, {
    logDir: '/test/track',
    summarize: async () => sampleSummary,
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

test('accepts only the exact lowercase summary route and valid query values', async (t) => {
  const calls = []
  const origin = await startApp(t, {
    summarize: async (options) => {
      calls.push(options)
      return sampleSummary
    },
  })

  const defaultResponse = await fetch(`${origin}/api/track/summary`)
  assert.equal(defaultResponse.status, 200)
  assert.equal(defaultResponse.headers.get('cache-control'), 'no-store')
  assert.equal(defaultResponse.headers.get('content-type'), 'application/json; charset=utf-8')
  assert.equal(defaultResponse.headers.has('www-authenticate'), false)
  assert.equal(calls[0].days, 30)
  assert.equal(calls[0].project, null)
  assert.equal(calls[0].logDir, '/test/track')
  assert.equal(calls[0].now, FIXED_NOW)

  assert.equal((await fetch(`${origin}/api/track/summary?days=1&project=hub`)).status, 200)
  assert.equal((await fetch(`${origin}/api/track/summary?days=90&project=cardgame`)).status, 200)

  for (const pathname of [
    '/api/track/summary/',
    '/api/Track/summary',
    '/API/track/summary',
    '/api/track/other',
  ]) {
    assert.equal((await fetch(`${origin}${pathname}`)).status, 404, pathname)
  }
})

test('rejects malformed duplicate and unknown query parameters before scanning', async (t) => {
  let calls = 0
  const origin = await startApp(t, {
    summarize: async () => {
      calls += 1
      return sampleSummary
    },
  })

  const cases = [
    ['?days=', 'invalid_days'],
    ['?days=0', 'invalid_days'],
    ['?days=91', 'invalid_days'],
    ['?days=1.5', 'invalid_days'],
    ['?days=1e1', 'invalid_days'],
    ['?days=%201', 'invalid_days'],
    ['?project=', 'invalid_project'],
    ['?project=all', 'invalid_project'],
    ['?days=1&days=2', 'duplicate_query_parameter'],
    ['?project=hub&project=hub', 'duplicate_query_parameter'],
    ['?unknown=1', 'unknown_query_parameter'],
  ]

  for (const [query, code] of cases) {
    const response = await fetch(`${origin}/api/track/summary${query}`)
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
    summarize: async () => {
      callCount += 1
      if (callCount === 1) await firstScan
      return sampleSummary
    },
  })

  const firstResponsePromise = fetch(`${origin}/api/track/summary`)
  while (callCount === 0) await new Promise((resolve) => setImmediate(resolve))

  const busyResponse = await fetch(`${origin}/api/track/summary`)
  assert.equal(busyResponse.status, 503)
  assert.equal(busyResponse.headers.get('retry-after'), '2')
  assert.equal((await busyResponse.json()).error.code, 'track_query_busy')

  releaseFirst()
  assert.equal((await firstResponsePromise).status, 200)
  assert.equal((await fetch(`${origin}/api/track/summary`)).status, 200)
})

test('maps known query errors and isolates unexpected errors', async (t) => {
  const cases = [
    [new TrackLogUnavailableError(), 'track_log_unavailable'],
    [new TrackLogTooLargeError(), 'track_log_too_large'],
    [new TrackQueryTimeoutError(), 'track_query_timeout'],
  ]

  for (const [error, code] of cases) {
    const origin = await startApp(t, { summarize: async () => { throw error } })
    const response = await fetch(`${origin}/api/track/summary`)
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
    summarize: async () => {
      throw new Error('/var/log/nginx/track Device000001 raw payload')
    },
  })
  const response = await fetch(`${origin}/api/track/summary`)

  assert.equal(response.status, 500)
  assert.equal(response.headers.get('cache-control'), 'no-store')
  assert.equal((await response.json()).error.code, 'internal_error')
  assert.doesNotMatch(JSON.stringify(logged), /\/var\/log\/nginx|Device000001|raw payload/)
})
