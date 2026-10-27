// Deliberately bounded fields: never pass arbitrary client text into public aggregates.
export const EXTENSION_KEYS = ['distribution', 'is_self_use', 'app_version', 'app_build', 'operation_id', 'stage', 'reason']
export const AUDIENCES = new Set(['self', 'production', 'test', 'unknown', 'all'])
export const isVersion = (value) => typeof value === 'string' && value.length <= 32 && /^(?:unknown|\d+(?:\.\d+)*)$/.test(value)
const stages = new Set(['received', 'decode', 'import', 'ack', 'validation', 'queue', 'export', 'commit', 'permission', 'photos_write', 'local_state'])
const reasons = new Set(['invalid_input', 'decode_failed', 'import_failed', 'ack_failed', 'before_cutover', 'background', 'busy', 'invalid_task', 'revision_conflict', 'source_unavailable', 'export_failed', 'output_commit_failed', 'permission_denied', 'missing_output', 'photos_write_failed', 'state_update_failed', 'user_cancelled', 'backgrounded', 'cancelled', 'interrupted', 'unknown'])
const flowNames = ['training_sync', 'highlight_generate', 'highlight_save']
const events = new Set(['app_launch', 'training_sync_started', 'training_sync_succeeded', 'training_sync_failed', 'training_sync_ignored', 'training_sync_ack_failed', 'highlight_generate_started', 'highlight_generate_succeeded', 'highlight_generate_failed', 'highlight_generate_cancelled', 'highlight_save_started', 'highlight_save_succeeded', 'highlight_save_failed', 'highlight_save_cancelled', 'highlight_save_state_failed'])

export const parseExtension = (record) => {
  const values = EXTENSION_KEYS.map((key) => record[key])
  if (values.every((value) => value === undefined || value === '')) {
    return { audience: 'unknown', version: 'unknown', operationId: null, stage: '', reason: '' }
  }
  if (record.project !== 'shotmarker' || !events.has(record.event)) return null
  if (values.some((value) => value !== undefined && typeof value !== 'string')) return null
  if (!['app_store', 'test', 'unknown'].includes(record.distribution)) return null
  if (!['true', 'false'].includes(record.is_self_use)) return null
  const version = record.app_version || 'unknown'
  const build = record.app_build || 'unknown'
  if (!isVersion(version) || build.length > 32 || !/^(?:unknown|\d+)$/.test(build)) return null
  const operationId = record.operation_id || ''
  const stage = record.stage || ''
  const reason = record.reason || ''
  if ((stage && !stages.has(stage)) || (reason && !reasons.has(reason))) return null
  if (record.event === 'app_launch') {
    if (operationId || stage || reason) return null
  } else if (!/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(operationId)) return null
  return {
    audience: record.is_self_use === 'true' ? 'self' : ({ app_store: 'production', test: 'test', unknown: 'unknown' })[record.distribution],
    version, operationId: operationId || null, stage, reason,
  }
}

export const matchesFilters = (record, { audience, version }) =>
  (!audience || audience === 'all' || record.audience === audience) && (!version || record.version === version)

export const createFlowState = () => ({ operations: new Map(), issues: new Map() })
export const includeFlowRecord = (state, record) => {
  const flow = flowNames.find((name) => record.event.startsWith(`${name}_`))
  if (!flow || !events.has(record.event)) return
  const suffix = record.event.slice(flow.length + 1)
  // Historical records cannot reconstruct or deduplicate operations.
  if (!record.operationId) return
  const key = `${record.deviceId}:${record.operationId}:${flow}`
  let operation = state.operations.get(key)
  if (!operation) {
    operation = { flow, deviceId: record.deviceId, started: false, outcomes: new Set(), issues: new Set() }
    state.operations.set(key, operation)
  }
  if (suffix === 'started') operation.started = true
  else if (['succeeded', 'failed', 'cancelled', 'ignored'].includes(suffix)) operation.outcomes.add(suffix)
  if (['failed', 'ack_failed', 'state_failed'].includes(suffix)) {
    const issueKey = JSON.stringify([flow, record.event, record.stage, record.reason])
    if (!operation.issues.has(issueKey)) {
      operation.issues.add(issueKey)
      state.issues.set(issueKey, (state.issues.get(issueKey) || 0) + 1)
    }
  }
}
export const buildFlowResponse = (state, deadline) => ({
  flows: flowNames.map((flow) => {
    const row = { flow, attempts: 0, installations: 0, succeeded: 0, failed: 0, cancelled: 0, ignored: 0, unknown: 0, missing_start: 0, conflicts: 0 }
    const devices = new Set()
    for (const operation of state.operations.values()) {
      deadline.check()
      if (operation.flow !== flow) continue
      if (operation.started) { row.attempts += 1; devices.add(operation.deviceId) }
      if (operation.outcomes.size > 1) row.conflicts += 1
      else if (!operation.started && operation.outcomes.size) row.missing_start += 1
      else if (operation.started && operation.outcomes.size === 0) row.unknown += 1
      else if (operation.started) row[[...operation.outcomes][0]] += 1
    }
    row.installations = devices.size
    return row
  }),
  issues: [...state.issues].map(([key, count]) => {
    const [flow, event, stage, reason] = JSON.parse(key)
    return { flow, event, stage, reason, count }
  }).sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b))),
})
