import assert from 'node:assert/strict'
import { appendFile, mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import {
  queryTrackTrend,
  TrackLogTooLargeError,
  TrackLogUnavailableError,
  TrackQueryTimeoutError,
} from '../projects/track-query.js'

const FIXED_NOW = new Date('2026-08-16T04:00:00.000Z')

const record = (overrides = {}) => ({
  project: 'hub',
  event: 'home_page_load',
  time: '2026-08-16T10:00:00+08:00',
  device_id: 'AbCd1234Ef56',
  ...overrides,
})

const createLogDir = async (t) => {
  const logDir = await mkdtemp(path.join(os.tmpdir(), 'track-trend-test-'))
  t.after(() => rm(logDir, { force: true, recursive: true }))
  return logDir
}

const encodeLine = (entry) => typeof entry === 'string' ? entry : JSON.stringify(entry)

const writeEvents = async (logDir, entries, { trailingNewline = true } = {}) => {
  const body = entries.map(encodeLine).join('\n')
  await writeFile(
    path.join(logDir, 'events.jsonl'),
    body.length > 0 && trailingNewline ? `${body}\n` : body,
  )
}

const query = (logDir, overrides = {}) => queryTrackTrend({
  logDir,
  project: 'hub',
  event: 'home_page_load',
  days: 2,
  now: FIXED_NOW,
  ...overrides,
})

test('calculates daily PV and UV for one project and event in Shanghai', async (t) => {
  const logDir = await createLogDir(t)
  await writeEvents(logDir, [
    record({ time: '2026-08-15T00:00:00+08:00' }),
    record({ time: '2026-08-15T23:59:59+08:00' }),
    record({ time: '2026-08-16T08:00:00+08:00' }),
    record({ time: '2026-08-16T09:00:00+08:00', device_id: 'ZyXw9876Vu54' }),
    record({ time: '2026-08-14T23:59:59.999+08:00' }),
    record({ time: '2026-08-16T12:00:00.001+08:00' }),
    record({ event: 'products_page_load' }),
    record({ project: 'cardgame', event: 'home_page_load' }),
  ])

  const result = await query(logDir)

  assert.deepEqual(result, {
    daily: [
      { date: '2026-08-15', pv: 2, uv: 1 },
      { date: '2026-08-16', pv: 2, uv: 2 },
    ],
  })
  assert.deepEqual(Object.keys(result), ['daily'])
  assert.doesNotMatch(JSON.stringify(result), /device_id|totals|breakdown|diagnostics/)
})

test('returns complete consecutive zero trends for every supported range', async (t) => {
  const logDir = await createLogDir(t)
  await writeEvents(logDir, [])

  for (const days of [1, 7, 30, 90]) {
    const result = await query(logDir, { days, event: 'event_without_records' })
    assert.equal(result.daily.length, days)
    assert.equal(result.daily.at(-1).date, '2026-08-16')
    assert.equal(new Set(result.daily.map(({ date }) => date)).size, days)
    assert.ok(result.daily.every(({ pv, uv }) => pv === 0 && uv === 0))

    for (let index = 1; index < result.daily.length; index += 1) {
      const previous = Date.parse(`${result.daily[index - 1].date}T00:00:00Z`)
      const current = Date.parse(`${result.daily[index].date}T00:00:00Z`)
      assert.equal(current - previous, 24 * 60 * 60 * 1000)
    }
  }
})

test('ignores invalid JSON, old schemas, extra fields, and invalid field values', async (t) => {
  const logDir = await createLogDir(t)
  const oldSchema = {
    schema_version: 1,
    request_id: '0'.repeat(32),
    received_at: '2026-08-16T02:00:00.000Z',
    client_time: '1786845600000',
    project: 'hub',
    device_id: 'AbCd1234Ef56',
    event: 'load_page',
    params_encoded: '%7B%7D',
  }
  await writeEvents(logDir, [
    '',
    '{bad json}',
    '[]',
    oldSchema,
    { ...record(), extra: true },
    { project: 'hub', event: 'home_page_load', time: record().time },
    record({ project: 'backend' }),
    record({ project: '' }),
    record({ event: 'HomePageLoad' }),
    record({ event: `a${'b'.repeat(64)}` }),
    record({ event: '' }),
    record({ time: 'not-a-date' }),
    record({ time: 1786845600000 }),
    record({ device_id: 'short' }),
    record({ device_id: 'AbCd1234Ef5-' }),
    record(),
  ])

  assert.deepEqual((await query(logDir, { days: 1 })).daily, [
    { date: '2026-08-16', pv: 1, uv: 1 },
  ])
})

test('accepts a complete final JSON object and ignores an incomplete current tail', async (t) => {
  const completeDir = await createLogDir(t)
  await writeEvents(completeDir, [record()], { trailingNewline: false })
  assert.equal((await query(completeDir, { days: 1 })).daily[0].pv, 1)

  const partialDir = await createLogDir(t)
  await writeFile(
    path.join(partialDir, 'events.jsonl'),
    `${JSON.stringify(record())}\n{"project":"hub"`,
  )
  assert.equal((await query(partialDir, { days: 1 })).daily[0].pv, 1)
})

test('reads only the current events.jsonl file', async (t) => {
  const logDir = await createLogDir(t)
  await writeEvents(logDir, [record()])
  await writeFile(path.join(logDir, 'events.jsonl-20260815'), `${JSON.stringify(record())}\n`)
  await writeFile(path.join(logDir, 'events.jsonl-20260814.gz'), Buffer.from('not gzip'))

  assert.equal((await query(logDir, { days: 1 })).daily[0].pv, 1)
})

test('returns zeroes for an empty readable file and maps a missing file to unavailable', async (t) => {
  const emptyDir = await createLogDir(t)
  await writeEvents(emptyDir, [])
  assert.deepEqual((await query(emptyDir, { days: 1 })).daily, [
    { date: '2026-08-16', pv: 0, uv: 0 },
  ])

  const missingDir = await createLogDir(t)
  await assert.rejects(() => query(missingDir), TrackLogUnavailableError)
})

test('does not include bytes appended after the current-file snapshot', async (t) => {
  const logDir = await createLogDir(t)
  const initial = Array.from({ length: 500 }, (_, index) => record({
    device_id: `Device${String(index).padStart(6, '0')}`,
  }))
  await writeEvents(logDir, initial)

  const resultPromise = query(logDir, {
    days: 1,
    limits: { readChunkBytes: 128, yieldEveryLines: 1 },
  })
  await new Promise((resolve) => setTimeout(resolve, 5))
  await appendFile(path.join(logDir, 'events.jsonl'), `${JSON.stringify(record())}\n`)

  const result = await resultPromise
  assert.deepEqual(result.daily, [{ date: '2026-08-16', pv: 500, uv: 500 }])
})

test('enforces decoded-byte and timeout limits with stable error types', async (t) => {
  const logDir = await createLogDir(t)
  await writeEvents(logDir, [record()])

  await assert.rejects(
    () => query(logDir, { limits: { maxDecodedBytes: 16 } }),
    TrackLogTooLargeError,
  )
  await assert.rejects(
    () => query(logDir, { limits: { timeoutMs: 0 } }),
    TrackQueryTimeoutError,
  )
})
