import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'

import {
  summarizeTrackEvents,
  TrackLogTooLargeError,
  TrackLogUnavailableError,
  TrackQueryTimeoutError,
} from '../projects/track-query.js'

const FIXED_NOW = new Date('2026-08-15T12:30:00.000Z')

const requestId = (value) => value.toString(16).padStart(32, '0')

const encodeParams = (params) => {
  const query = new URLSearchParams({ params: JSON.stringify(params) }).toString()
  return query.slice('params='.length)
}

const record = (overrides = {}) => ({
  schema_version: 1,
  request_id: requestId(1),
  received_at: '2026-08-15T12:00:00.000Z',
  client_time: '1786795200000',
  project: 'hub',
  device_id: 'Device000001',
  event: 'load_page',
  params_encoded: encodeParams({ page_name: 'home' }),
  ...overrides,
})

const jsonl = (...records) => `${records.map((entry) => JSON.stringify(entry)).join('\n')}\n`

const createLogDir = async (t) => {
  const logDir = await mkdtemp(path.join(os.tmpdir(), 'track-query-'))
  t.after(() => rm(logDir, { recursive: true, force: true }))
  return logDir
}

const writeCurrent = (logDir, content) => writeFile(path.join(logDir, 'events.jsonl'), content)

test('summarizes valid plain JSONL records across projects', async (t) => {
  const logDir = await createLogDir(t)
  await writeCurrent(
    logDir,
    jsonl(
      record({ request_id: requestId(1) }),
      record({
        request_id: requestId(2),
        project: 'cardgame',
        event: 'click',
        params_encoded: encodeParams({ button: 'create_room' }),
      }),
      record({
        request_id: requestId(3),
        device_id: 'Device000002',
        event: 'click',
        params_encoded: encodeParams({ button: 'nav_about' }),
      }),
    ),
  )

  const result = await summarizeTrackEvents({ logDir, days: 2, project: null, now: FIXED_NOW })

  assert.equal(result.range.days, 2)
  assert.equal(result.range.from, '2026-08-14T00:00:00+08:00')
  assert.equal(result.range.to, '2026-08-15T20:30:00.000+08:00')
  assert.equal(result.range.timezone, 'Asia/Shanghai')
  assert.deepEqual(result.filter, { project: null })
  assert.deepEqual(result.totals, {
    events: 3,
    devices: 2,
    earliest_received_at: '2026-08-15T12:00:00.000Z',
    latest_received_at: '2026-08-15T12:00:00.000Z',
  })
  assert.deepEqual(result.projects, [
    { project: 'cardgame', events: 1, devices: 1 },
    { project: 'hub', events: 2, devices: 2 },
  ])
  assert.deepEqual(result.event_breakdown, [
    { project: 'cardgame', event: 'click', events: 1, devices: 1 },
    { project: 'hub', event: 'click', events: 1, devices: 1 },
    { project: 'hub', event: 'load_page', events: 1, devices: 1 },
  ])
  assert.deepEqual(result.page_breakdown, [
    { project: 'hub', page_name: 'home', events: 1, devices: 1 },
  ])
  assert.deepEqual(result.button_breakdown, [
    { project: 'cardgame', button: 'create_room', events: 1, devices: 1 },
    { project: 'hub', button: 'nav_about', events: 1, devices: 1 },
  ])
  assert.deepEqual(result.daily, [
    { date: '2026-08-14', events: 0, devices: 0 },
    { date: '2026-08-15', events: 3, devices: 2 },
  ])
  assert.equal(result.diagnostics.files_read, 1)
  assert.equal(result.diagnostics.compressed_files_read, 0)
  assert.equal(result.diagnostics.lines_read, 3)
  assert.equal(result.diagnostics.included_records, 3)
  assert.doesNotMatch(JSON.stringify(result), /Device00000/)
})

test('returns ninety zero-filled Shanghai days for an empty readable directory', async (t) => {
  const logDir = await createLogDir(t)

  const result = await summarizeTrackEvents({ logDir, days: 90, project: null, now: FIXED_NOW })

  assert.deepEqual(result.totals, {
    events: 0,
    devices: 0,
    earliest_received_at: null,
    latest_received_at: null,
  })
  assert.equal(result.daily.length, 90)
  assert.deepEqual(result.daily[0], { date: '2026-05-18', events: 0, devices: 0 })
  assert.deepEqual(result.daily.at(-1), { date: '2026-08-15', events: 0, devices: 0 })
  assert.equal(result.diagnostics.files_read, 0)
})

test('decodes form query params and keeps unknown dimension values', async (t) => {
  const logDir = await createLogDir(t)
  await writeCurrent(
    logDir,
    jsonl(
      record({
        request_id: requestId(10),
        event: 'future_event.v2',
        params_encoded: '%7B%22page_name%22%3A%22ideas%22%2C%22button%22%3A%22a+b%2Bc%22%2C%22extra%22%3A1%7D',
      }),
      record({
        request_id: requestId(11),
        project: 'cardgame',
        params_encoded: encodeParams({ button: 'create_room' }),
      }),
    ),
  )

  const result = await summarizeTrackEvents({ logDir, days: 1, project: 'hub', now: FIXED_NOW })

  assert.equal(result.totals.events, 1)
  assert.deepEqual(result.event_breakdown, [
    { project: 'hub', event: 'future_event.v2', events: 1, devices: 1 },
  ])
  assert.deepEqual(result.page_breakdown, [
    { project: 'hub', page_name: 'ideas', events: 1, devices: 1 },
  ])
  assert.deepEqual(result.button_breakdown, [
    { project: 'hub', button: 'a b+c', events: 1, devices: 1 },
  ])
  assert.equal(result.diagnostics.project_filtered_records, 1)
})

test('rejects invalid records and deduplicates valid request ids', async (t) => {
  const logDir = await createLogDir(t)
  const invalidRecords = [
    record({ request_id: requestId(20), schema_version: 2 }),
    record({ request_id: 'A'.repeat(32) }),
    record({ request_id: requestId(22), received_at: 'not-a-date' }),
    record({ request_id: requestId(23), client_time: '1e12' }),
    record({ request_id: requestId(24), project: 'audit' }),
    record({ request_id: requestId(25), device_id: 'short' }),
    record({ request_id: requestId(26), event: '1bad' }),
    record({ request_id: requestId(27), params_encoded: '%E0%A4%A' }),
    record({ request_id: requestId(28), params_encoded: encodeParams([]) }),
  ]
  const accepted = record({ request_id: requestId(29) })

  await writeCurrent(logDir, jsonl(...invalidRecords, accepted, accepted))

  const result = await summarizeTrackEvents({ logDir, days: 1, project: null, now: FIXED_NOW })

  assert.equal(result.totals.events, 1)
  assert.equal(result.diagnostics.rejected_records, invalidRecords.length)
  assert.equal(result.diagnostics.duplicate_records, 1)
  assert.equal(result.diagnostics.included_records, 1)
})

test('classifies every scanned line and ignores only invalid dimensions', async (t) => {
  const logDir = await createLogDir(t)
  const tooLong = 'x'.repeat(129)
  const content = [
    '',
    '{bad json}',
    JSON.stringify(record({ request_id: requestId(30), project: 'diagnostic' })),
    JSON.stringify(record({ request_id: requestId(31), received_at: '2026-08-14T15:59:59.999Z' })),
    JSON.stringify(record({ request_id: requestId(32), project: 'cardgame' })),
    JSON.stringify(record({
      request_id: requestId(33),
      params_encoded: encodeParams({ page_name: tooLong, button: 42 }),
    })),
    '{"schema_version":1',
  ].join('\n')
  await writeCurrent(logDir, content)

  const result = await summarizeTrackEvents({ logDir, days: 1, project: 'hub', now: FIXED_NOW })

  assert.equal(result.diagnostics.lines_read, 7)
  assert.equal(result.diagnostics.empty_lines, 1)
  assert.equal(result.diagnostics.invalid_json_lines, 1)
  assert.equal(result.diagnostics.rejected_records, 1)
  assert.equal(result.diagnostics.duplicate_records, 0)
  assert.equal(result.diagnostics.out_of_range_records, 1)
  assert.equal(result.diagnostics.project_filtered_records, 1)
  assert.equal(result.diagnostics.included_records, 1)
  assert.equal(result.diagnostics.ignored_dimensions, 2)
  assert.equal(result.diagnostics.partial_lines, 1)
  assert.equal(result.totals.events, 1)
})

test('accepts a complete final JSON object without a trailing newline', async (t) => {
  const logDir = await createLogDir(t)
  await writeCurrent(logDir, JSON.stringify(record({ request_id: requestId(34) })))

  const result = await summarizeTrackEvents({ logDir, days: 1, project: null, now: FIXED_NOW })

  assert.equal(result.totals.events, 1)
  assert.equal(result.diagnostics.lines_read, 1)
  assert.equal(result.diagnostics.partial_lines, 0)
})
