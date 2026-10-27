import assert from 'node:assert/strict'
import { mkdtemp, rm, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import * as track from '../projects/track-query.js'

const now = new Date('2026-10-27T04:00:00Z')
const id = (n) => `00000000-0000-4000-8000-${String(n).padStart(12, '0')}`
const entry = (event, n = 1, extra = {}) => ({ project: 'shotmarker', event,
  time: '2026-10-27T10:00:00+08:00', device_id: 'AbCd1234Ef56', distribution: 'app_store',
  is_self_use: 'false', app_version: '1.3', app_build: '4', operation_id: id(n), stage: '', reason: '', ...extra })
const legacy = { project: 'shotmarker', event: 'highlight_save_succeeded', time: '2026-10-27T10:00:00+08:00', device_id: 'ZyXw9876Vu54' }
const setup = async (t, entries) => {
  const logDir = await mkdtemp(path.join(os.tmpdir(), 'shotmarker-steps-'))
  t.after(() => rm(logDir, { recursive: true, force: true }))
  await writeFile(path.join(logDir, 'events.jsonl'), entries.map(JSON.stringify).join('\n'))
  return { logDir, days: 1, now }
}

test('pairs out of order, deduplicates per installation, separates incomplete/conflicting outcomes and diagnostics', async (t) => {
  const options = await setup(t, [
    entry('training_sync_succeeded'), entry('training_sync_started'), entry('training_sync_succeeded'),
    entry('training_sync_ack_failed', 1, { stage: 'ack', reason: 'ack_failed' }),
    entry('training_sync_ack_failed', 1, { stage: 'ack', reason: 'ack_failed' }),
    entry('training_sync_started', 2),
    entry('training_sync_failed', 3, { stage: 'decode', reason: 'decode_failed' }),
    entry('training_sync_started', 4), entry('training_sync_succeeded', 4), entry('training_sync_failed', 4),
    entry('training_sync_started', 1, { device_id: 'ZyXw9876Vu54' }),
    entry('highlight_save_started'), entry('highlight_save_succeeded'),
    entry('highlight_save_state_failed', 1, { stage: 'local_state', reason: 'state_update_failed' }),
    legacy,
  ])
  assert.equal(typeof track.queryShotMarker, 'function')
  const result = await track.queryShotMarker({ ...options, audience: 'all' })
  assert.deepEqual(result.flows[0], { flow: 'training_sync', attempts: 4, installations: 2,
    succeeded: 1, failed: 0, cancelled: 0, ignored: 0, unknown: 2, missing_start: 1, conflicts: 1 })
  assert.equal(result.flows[2].succeeded, 1)
  assert.equal(result.flows[2].failed, 0)
  assert.equal(result.flows[2].missing_start, 0)
  assert.ok(result.issues.some((issue) => issue.event === 'training_sync_ack_failed' && issue.count === 1))
  assert.ok(result.issues.some((issue) => issue.event === 'highlight_save_state_failed' && issue.count === 1))
  assert.doesNotMatch(JSON.stringify(result), /AbCd|ZyXw|00000000|device_id|operation_id/)
})

test('filters audience/version, keeps legacy unknown and rejects malformed extensions instead of downgrading', async (t) => {
  const options = await setup(t, [legacy,
    entry('highlight_save_succeeded'),
    entry('highlight_save_succeeded', 2, { distribution: 'test' }),
    entry('highlight_save_succeeded', 3, { is_self_use: 'true' }),
    entry('highlight_save_succeeded', 4, { distribution: 'unknown' }),
    entry('highlight_save_succeeded', 5, { is_self_use: false }),
    entry('highlight_save_succeeded', 6, { app_version: 'bad' }),
    entry('highlight_save_succeeded', 7, { operation_id: 'business-id' }),
    entry('highlight_save_succeeded', 8, { reason: 'raw error' }),
    { ...legacy, distribution: '', is_self_use: '', app_version: '', app_build: '', operation_id: '', stage: '', reason: '' },
  ])
  for (const [audience, expected] of [['production', 1], ['test', 1], ['self', 1], ['unknown', 3], ['all', 6]]) {
    const result = await track.queryTrackTrend({ ...options, project: 'shotmarker', event: 'highlight_save_succeeded', audience })
    assert.equal(result.daily[0].pv, expected, audience)
  }
  assert.equal((await track.queryTrackTrend({ ...options, project: 'shotmarker', event: 'highlight_save_succeeded', version: '1.3' })).daily[0].pv, 4)
})

test('does not pair across date boundaries and keeps ignored/cancelled outcomes separate', async (t) => {
  const options = await setup(t, [
    entry('training_sync_started', 1, { time: '2026-10-26T23:59:59+08:00' }),
    entry('training_sync_ignored', 1, { stage: 'import', reason: 'before_cutover' }),
    entry('highlight_generate_started', 2), entry('highlight_generate_cancelled', 2),
    entry('highlight_generate_started', 3), entry('highlight_generate_succeeded', 3, { time: '2026-10-27T12:00:01+08:00' }),
  ])
  const result = await track.queryShotMarker(options)
  assert.equal(result.flows[0].missing_start, 1)
  assert.equal(result.flows[0].ignored, 0)
  assert.equal(result.flows[1].cancelled, 1)
  assert.equal(result.flows[1].unknown, 1)
})

test('extended log format preserves old web traffic and rejects mixed invalid metadata', async (t) => {
  const blank = { distribution: '', is_self_use: '', app_version: '', app_build: '', operation_id: '', stage: '', reason: '' }
  const options = await setup(t, [
    { ...legacy, ...blank, project: 'hub', event: 'home_page_load' },
    entry('app_launch', 1, { operation_id: '' }),
    entry('app_launch', 2),
    entry('highlight_save_started', 3, { stage: 'private stage' }),
    entry('highlight_save_started', 4, { app_build: '4.2' }),
    entry('highlight_save_started', 5, { app_version: '1'.repeat(33) }),
    entry('highlight_save_started', 6, { operation_id: id(6).toUpperCase().replace('00000000', 'ABCDEF00') }),
    entry('highlight_save_started', 7, { app_version: undefined, app_build: undefined }),
  ])
  assert.equal((await track.queryTrackTrend({ ...options, project: 'hub', event: 'home_page_load' })).daily[0].pv, 1)
  assert.equal((await track.queryTrackTrend({ ...options, project: 'shotmarker', event: 'app_launch', audience: 'production' })).daily[0].pv, 1)
  const summary = await track.queryShotMarker(options)
  assert.equal(summary.flows[2].attempts, 1)
  assert.equal(summary.flows[2].unknown, 1)
  await assert.rejects(() => track.queryShotMarker({ ...options, limits: { maxDecodedBytes: 4 } }), track.TrackLogTooLargeError)
  await assert.rejects(() => track.queryShotMarker({ ...options, limits: { maxLineBytes: 4 } }), track.TrackLogTooLargeError)
  await assert.rejects(() => track.queryShotMarker({ ...options, limits: { timeoutMs: 0 } }), track.TrackQueryTimeoutError)
})
