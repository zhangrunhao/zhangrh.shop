import fs from 'node:fs'
import path from 'node:path'

const fileSystem = fs.promises

const TRACK_TIMEZONE = 'Asia/Shanghai'
const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000

export class TrackLogUnavailableError extends Error {
  constructor(message = 'track log is unavailable', options) {
    super(message, options)
    this.name = 'TrackLogUnavailableError'
  }
}

export class TrackLogTooLargeError extends Error {
  constructor(message = 'track log exceeds query limits', options) {
    super(message, options)
    this.name = 'TrackLogTooLargeError'
  }
}

export class TrackQueryTimeoutError extends Error {
  constructor(message = 'track query timed out', options) {
    super(message, options)
    this.name = 'TrackQueryTimeoutError'
  }
}

const formatShanghaiDate = (date) => {
  return new Date(date.getTime() + SHANGHAI_OFFSET_MS).toISOString().slice(0, 10)
}

const formatShanghaiIso = (date) => {
  return new Date(date.getTime() + SHANGHAI_OFFSET_MS).toISOString().replace('Z', '+08:00')
}

const buildRange = (days, now) => {
  const shanghaiNow = new Date(now.getTime() + SHANGHAI_OFFSET_MS)
  const startLocalMs = Date.UTC(
    shanghaiNow.getUTCFullYear(),
    shanghaiNow.getUTCMonth(),
    shanghaiNow.getUTCDate() - (days - 1),
  )
  const startDate = new Date(startLocalMs)
  const fromMs = startLocalMs - SHANGHAI_OFFSET_MS
  const dates = Array.from({ length: days }, (_, index) => {
    return new Date(startLocalMs + index * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
  })

  return {
    days,
    fromMs,
    toMs: now.getTime(),
    dates,
    response: {
      days,
      from: `${startDate.toISOString().slice(0, 10)}T00:00:00+08:00`,
      to: formatShanghaiIso(now),
      timezone: TRACK_TIMEZONE,
    },
  }
}

const createDiagnostics = () => ({
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
})

const decodeParams = (encoded) => {
  const decoded = decodeURIComponent(encoded.replace(/\+/g, ' '))
  const params = JSON.parse(decoded)
  return params && typeof params === 'object' && !Array.isArray(params) ? params : null
}

const addCount = (map, key, values, deviceId) => {
  let entry = map.get(key)
  if (!entry) {
    entry = { ...values, events: 0, deviceIds: new Set() }
    map.set(key, entry)
  }
  entry.events += 1
  entry.deviceIds.add(deviceId)
}

const serializeCounts = (map, keys) => {
  return [...map.values()]
    .sort((left, right) => {
      for (const key of keys) {
        const comparison = left[key].localeCompare(right[key])
        if (comparison !== 0) return comparison
      }
      return 0
    })
    .map(({ deviceIds, ...entry }) => ({ ...entry, devices: deviceIds.size }))
}

const createState = (range, project) => ({
  range,
  project,
  diagnostics: createDiagnostics(),
  deviceIds: new Set(),
  projects: new Map(),
  events: new Map(),
  pages: new Map(),
  buttons: new Map(),
  daily: new Map(range.dates.map((date) => [date, { date, events: 0, deviceIds: new Set() }])),
  earliestMs: null,
  latestMs: null,
})

const includeLine = (state, line) => {
  state.diagnostics.lines_read += 1
  if (line.length === 0) {
    state.diagnostics.empty_lines += 1
    return
  }

  let parsed
  try {
    parsed = JSON.parse(line)
  } catch {
    state.diagnostics.invalid_json_lines += 1
    return
  }

  let params
  try {
    params = decodeParams(parsed.params_encoded)
  } catch {
    state.diagnostics.rejected_records += 1
    return
  }
  if (!params) {
    state.diagnostics.rejected_records += 1
    return
  }

  const receivedMs = Date.parse(parsed.received_at)
  if (!Number.isFinite(receivedMs)) {
    state.diagnostics.rejected_records += 1
    return
  }
  if (receivedMs < state.range.fromMs || receivedMs > state.range.toMs) {
    state.diagnostics.out_of_range_records += 1
    return
  }
  if (state.project && parsed.project !== state.project) {
    state.diagnostics.project_filtered_records += 1
    return
  }

  const deviceId = parsed.device_id
  state.deviceIds.add(deviceId)
  addCount(state.projects, parsed.project, { project: parsed.project }, deviceId)
  addCount(
    state.events,
    JSON.stringify([parsed.project, parsed.event]),
    { project: parsed.project, event: parsed.event },
    deviceId,
  )

  if (typeof params.page_name === 'string' && params.page_name.length > 0) {
    addCount(
      state.pages,
      JSON.stringify([parsed.project, params.page_name]),
      { project: parsed.project, page_name: params.page_name },
      deviceId,
    )
  }
  if (typeof params.button === 'string' && params.button.length > 0) {
    addCount(
      state.buttons,
      JSON.stringify([parsed.project, params.button]),
      { project: parsed.project, button: params.button },
      deviceId,
    )
  }

  const day = state.daily.get(formatShanghaiDate(new Date(receivedMs)))
  if (day) {
    day.events += 1
    day.deviceIds.add(deviceId)
  }

  state.earliestMs = state.earliestMs === null ? receivedMs : Math.min(state.earliestMs, receivedMs)
  state.latestMs = state.latestMs === null ? receivedMs : Math.max(state.latestMs, receivedMs)
  state.diagnostics.included_records += 1
}

const readCurrentFile = async (logDir, state) => {
  let entries
  try {
    entries = await fileSystem.readdir(logDir, { withFileTypes: true })
  } catch (error) {
    throw new TrackLogUnavailableError(undefined, { cause: error })
  }

  const currentEntry = entries.find((entry) => entry.name === 'events.jsonl' && entry.isFile())
  if (!currentEntry) return

  let fileHandle
  try {
    fileHandle = await fileSystem.open(path.join(logDir, currentEntry.name), 'r')
    const stats = await fileHandle.stat()
    state.diagnostics.files_read += 1
    if (stats.size === 0) return

    const stream = fileHandle.createReadStream({
      start: 0,
      end: stats.size - 1,
      autoClose: false,
    })
    let pending = ''
    for await (const chunk of stream) {
      pending += chunk.toString('utf8')
      let newlineIndex = pending.indexOf('\n')
      while (newlineIndex !== -1) {
        const line = pending.slice(0, newlineIndex).replace(/\r$/, '')
        pending = pending.slice(newlineIndex + 1)
        includeLine(state, line)
        newlineIndex = pending.indexOf('\n')
      }
    }
    if (pending.length > 0) includeLine(state, pending.replace(/\r$/, ''))
  } catch (error) {
    if (error instanceof TrackLogUnavailableError) throw error
    throw new TrackLogUnavailableError(undefined, { cause: error })
  } finally {
    await fileHandle?.close().catch(() => {})
  }
}

const buildResponse = (state) => ({
  generated_at: new Date().toISOString(),
  range: state.range.response,
  filter: { project: state.project },
  totals: {
    events: state.diagnostics.included_records,
    devices: state.deviceIds.size,
    earliest_received_at: state.earliestMs === null ? null : new Date(state.earliestMs).toISOString(),
    latest_received_at: state.latestMs === null ? null : new Date(state.latestMs).toISOString(),
  },
  projects: serializeCounts(state.projects, ['project']),
  event_breakdown: serializeCounts(state.events, ['project', 'event']),
  page_breakdown: serializeCounts(state.pages, ['project', 'page_name']),
  button_breakdown: serializeCounts(state.buttons, ['project', 'button']),
  daily: [...state.daily.values()].map(({ deviceIds, ...entry }) => ({
    ...entry,
    devices: deviceIds.size,
  })),
  diagnostics: state.diagnostics,
})

export async function summarizeTrackEvents({ logDir, days, project, now }) {
  const range = buildRange(days, now)
  const state = createState(range, project)
  await readCurrentFile(logDir, state)
  return buildResponse(state)
}
