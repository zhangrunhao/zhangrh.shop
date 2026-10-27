// Local-only fixture. Does not make network requests or use production paths.
import { mkdtemp, writeFile } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
const logDir = await mkdtemp(path.join(os.tmpdir(), 'shotmarker-track-sample-'))
const time = new Date().toISOString()
const record = (event, operation, extra = {}) => ({ project: 'shotmarker', event, time,
  device_id: 'Sample000001', distribution: 'app_store', is_self_use: 'false', app_version: '1.3', app_build: '42',
  operation_id: `00000000-0000-4000-8000-${String(operation).padStart(12, '0')}`, stage: '', reason: '', ...extra })
const records = [
  record('app_launch', 0, { operation_id: '' }),
  record('training_sync_succeeded', 1), record('training_sync_started', 1), record('training_sync_succeeded', 1),
  record('training_sync_ack_failed', 1, { stage: 'ack', reason: 'ack_failed' }),
  record('training_sync_started', 2), record('training_sync_failed', 2, { stage: 'decode', reason: 'decode_failed' }),
  record('training_sync_started', 3), record('training_sync_ignored', 3, { stage: 'import', reason: 'before_cutover' }),
  record('highlight_generate_started', 4), record('highlight_generate_cancelled', 4, { stage: 'export', reason: 'backgrounded' }),
  record('highlight_generate_started', 5),
  record('highlight_generate_failed', 6, { stage: 'validation', reason: 'invalid_input' }),
  record('highlight_generate_started', 7), record('highlight_generate_failed', 7), record('highlight_generate_succeeded', 7),
  record('highlight_save_started', 8), record('highlight_save_succeeded', 8),
  record('highlight_save_state_failed', 8, { stage: 'local_state', reason: 'state_update_failed' }),
  record('highlight_save_started', 9, { distribution: 'test' }), record('highlight_save_failed', 9, { distribution: 'test', stage: 'permission', reason: 'permission_denied' }),
  record('training_sync_started', 10, { is_self_use: 'true', app_version: '1.4' }),
  { project: 'shotmarker', event: 'app_launch', time, device_id: 'Sample000002' },
]
await writeFile(path.join(logDir, 'events.jsonl'), `${records.map((entry) => JSON.stringify(entry)).join('\n')}\n`)
console.log(logDir)
