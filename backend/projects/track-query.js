import fs from 'node:fs'
import path from 'node:path'
import { setImmediate as yieldToEventLoop } from 'node:timers/promises'
import { createGunzip } from 'node:zlib'

const fileSystem = fs.promises

const TRACK_TIMEZONE = 'Asia/Shanghai'
const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000
const CURRENT_FILE = 'events.jsonl'
const ROTATED_FILE_PATTERN = /^events\.jsonl-(\d{8})(\.gz)?$/
const REQUEST_ID_PATTERN = /^[0-9a-f]{32}$/
const CLIENT_TIME_PATTERN = /^\d{10,16}$/
const DEVICE_ID_PATTERN = /^[A-Za-z0-9]{12}$/
const EVENT_PATTERN = /^[A-Za-z][A-Za-z0-9_.:-]{0,63}$/
const PROJECTS = new Set(['hub', 'cardgame'])

const DEFAULT_LIMITS = Object.freeze({
  timeoutMs: 20_000,
  maxDecodedBytes: 64 * 1024 * 1024,
  maxLineBytes: 32 * 1024,
  maxParamsBytes: 16 * 1024,
  maxUniqueDevices: 100_000,
  maxDimensionKeys: 10_000,
  yieldEveryLines: 500,
  readChunkBytes: 64 * 1024,
})

class SnapshotRaceError extends Error {}

const resolveLimits = (overrides = {}) => ({ ...DEFAULT_LIMITS, ...overrides })

const createDeadline = (timeoutMs) => {
  const controller = new AbortController()
  const deadlineMs = Date.now() + timeoutMs
  const timer = setTimeout(() => controller.abort(), timeoutMs)
  timer.unref()

  return {
    signal: controller.signal,
    check() {
      if (controller.signal.aborted || Date.now() >= deadlineMs) {
        throw new TrackQueryTimeoutError()
      }
    },
    close() {
      clearTimeout(timer)
    },
  }
}

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

const decodeParams = (encoded, maxParamsBytes) => {
  const decoded = decodeURIComponent(encoded.replace(/\+/g, ' '))
  if (Buffer.byteLength(decoded, 'utf8') > maxParamsBytes) return null
  const params = JSON.parse(decoded)
  return params && typeof params === 'object' && !Array.isArray(params) ? params : null
}

const isDimension = (value) => {
  return typeof value === 'string' && value.length >= 1 && value.length <= 128
}

const parseRecord = (parsed, diagnostics, limits) => {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null
  if (parsed.schema_version !== 1) return null
  if (typeof parsed.request_id !== 'string' || !REQUEST_ID_PATTERN.test(parsed.request_id)) return null
  if (typeof parsed.received_at !== 'string') return null

  const receivedMs = Date.parse(parsed.received_at)
  if (!Number.isFinite(receivedMs)) return null
  if (typeof parsed.client_time !== 'string' || !CLIENT_TIME_PATTERN.test(parsed.client_time)) return null
  if (typeof parsed.project !== 'string' || !PROJECTS.has(parsed.project)) return null
  if (typeof parsed.device_id !== 'string' || !DEVICE_ID_PATTERN.test(parsed.device_id)) return null
  if (typeof parsed.event !== 'string' || !EVENT_PATTERN.test(parsed.event)) return null
  if (typeof parsed.params_encoded !== 'string') return null

  let params
  try {
    params = decodeParams(parsed.params_encoded, limits.maxParamsBytes)
  } catch {
    return null
  }
  if (!params) return null

  const dimensions = {}
  for (const key of ['page_name', 'button']) {
    if (!Object.hasOwn(params, key)) continue
    if (isDimension(params[key])) {
      dimensions[key] = params[key]
    } else {
      diagnostics.ignored_dimensions += 1
    }
  }

  return {
    requestId: parsed.request_id,
    receivedMs,
    project: parsed.project,
    deviceId: parsed.device_id,
    event: parsed.event,
    ...dimensions,
  }
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

const createState = (range, project, limits, deadline) => ({
  range,
  project,
  limits,
  deadline,
  diagnostics: createDiagnostics(),
  decodedBytes: 0,
  linesSinceYield: 0,
  deviceIds: new Set(),
  projects: new Map(),
  events: new Map(),
  pages: new Map(),
  buttons: new Map(),
  daily: new Map(range.dates.map((date) => [date, { date, events: 0, deviceIds: new Set() }])),
  requestIds: new Set(),
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

  const parsedRecord = parseRecord(parsed, state.diagnostics, state.limits)
  if (!parsedRecord) {
    state.diagnostics.rejected_records += 1
    return
  }

  if (state.requestIds.has(parsedRecord.requestId)) {
    state.diagnostics.duplicate_records += 1
    return
  }
  state.requestIds.add(parsedRecord.requestId)

  const { receivedMs } = parsedRecord
  if (receivedMs < state.range.fromMs || receivedMs > state.range.toMs) {
    state.diagnostics.out_of_range_records += 1
    return
  }
  if (state.project && parsedRecord.project !== state.project) {
    state.diagnostics.project_filtered_records += 1
    return
  }

  const deviceId = parsedRecord.deviceId
  const eventKey = JSON.stringify([parsedRecord.project, parsedRecord.event])
  const pageKey = parsedRecord.page_name
    ? JSON.stringify([parsedRecord.project, parsedRecord.page_name])
    : null
  const buttonKey = parsedRecord.button
    ? JSON.stringify([parsedRecord.project, parsedRecord.button])
    : null

  if (!state.deviceIds.has(deviceId) && state.deviceIds.size >= state.limits.maxUniqueDevices) {
    throw new TrackLogTooLargeError()
  }
  for (const [map, key] of [
    [state.events, eventKey],
    [state.pages, pageKey],
    [state.buttons, buttonKey],
  ]) {
    if (key !== null && !map.has(key) && map.size >= state.limits.maxDimensionKeys) {
      throw new TrackLogTooLargeError()
    }
  }

  state.deviceIds.add(deviceId)
  addCount(state.projects, parsedRecord.project, { project: parsedRecord.project }, deviceId)
  addCount(
    state.events,
    eventKey,
    { project: parsedRecord.project, event: parsedRecord.event },
    deviceId,
  )

  if (parsedRecord.page_name) {
    addCount(
      state.pages,
      pageKey,
      { project: parsedRecord.project, page_name: parsedRecord.page_name },
      deviceId,
    )
  }
  if (parsedRecord.button) {
    addCount(
      state.buttons,
      buttonKey,
      { project: parsedRecord.project, button: parsedRecord.button },
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

const isValidRotationDate = (value) => {
  const year = Number(value.slice(0, 4))
  const month = Number(value.slice(4, 6))
  const day = Number(value.slice(6, 8))
  const parsed = new Date(0)
  parsed.setUTCHours(0, 0, 0, 0)
  parsed.setUTCFullYear(year, month - 1, day)

  return value === parsed.toISOString().slice(0, 10).replaceAll('-', '')
}

const discoverCandidates = async (logDir, deadline) => {
  let entries
  try {
    deadline.check()
    entries = await fileSystem.readdir(logDir, { withFileTypes: true })
    deadline.check()
  } catch (error) {
    if (error instanceof TrackQueryTimeoutError) throw error
    throw new TrackLogUnavailableError(undefined, { cause: error })
  }

  let current = null
  const rotations = new Map()
  for (const entry of entries) {
    if (!entry.isFile()) continue
    if (entry.name === CURRENT_FILE) {
      current = { name: entry.name, current: true, compressed: false }
      continue
    }

    const match = ROTATED_FILE_PATTERN.exec(entry.name)
    if (!match || !isValidRotationDate(match[1])) continue
    const candidate = {
      name: entry.name,
      date: match[1],
      current: false,
      compressed: Boolean(match[2]),
    }
    const existing = rotations.get(candidate.date)
    if (!existing || (existing.compressed && !candidate.compressed)) {
      rotations.set(candidate.date, candidate)
    }
  }

  const candidates = [...rotations.values()].sort((left, right) => left.date.localeCompare(right.date))
  if (current) candidates.push(current)
  return candidates
}

const closeSnapshot = async (snapshot) => {
  await Promise.all(snapshot.map((file) => file.handle.close().catch(() => {})))
}

const isSnapshotRaceError = (error) => {
  return error instanceof SnapshotRaceError || ['ENOENT', 'ELOOP', 'EISDIR'].includes(error?.code)
}

const openSnapshotAttempt = async (logDir, deadline) => {
  const candidates = await discoverCandidates(logDir, deadline)
  const snapshot = []

  try {
    for (const candidate of candidates) {
      deadline.check()
      const filePath = path.join(logDir, candidate.name)
      let before
      try {
        before = await fileSystem.lstat(filePath)
        deadline.check()
      } catch (error) {
        if (isSnapshotRaceError(error)) throw new SnapshotRaceError(undefined, { cause: error })
        throw error
      }
      if (!before.isFile()) throw new SnapshotRaceError()

      let handle
      try {
        const noFollow = fs.constants.O_NOFOLLOW ?? 0
        handle = await fileSystem.open(filePath, fs.constants.O_RDONLY | noFollow)
        deadline.check()
      } catch (error) {
        await handle?.close().catch(() => {})
        if (isSnapshotRaceError(error)) throw new SnapshotRaceError(undefined, { cause: error })
        throw error
      }

      let after
      try {
        after = await handle.stat()
        deadline.check()
        if (!after.isFile() || before.dev !== after.dev || before.ino !== after.ino) {
          throw new SnapshotRaceError()
        }
        snapshot.push({ ...candidate, handle, size: after.size })
      } catch (error) {
        await handle.close().catch(() => {})
        throw error
      }
    }
    return snapshot
  } catch (error) {
    await closeSnapshot(snapshot)
    throw error
  }
}

const openSnapshot = async (logDir, deadline) => {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    try {
      deadline.check()
      return await openSnapshotAttempt(logDir, deadline)
    } catch (error) {
      if (isSnapshotRaceError(error) && attempt === 0) continue
      if (error instanceof TrackQueryTimeoutError) throw error
      if (error instanceof TrackLogUnavailableError) throw error
      throw new TrackLogUnavailableError(undefined, { cause: error })
    }
  }
  throw new TrackLogUnavailableError()
}

const maybeYield = async (state) => {
  state.linesSinceYield += 1
  if (state.linesSinceYield < state.limits.yieldEveryLines) return

  state.linesSinceYield = 0
  await yieldToEventLoop()
  state.deadline.check()
}

const processLineBuffer = async (state, lineBuffer) => {
  state.deadline.check()
  const withoutCarriageReturn = lineBuffer.at(-1) === 0x0d
    ? lineBuffer.subarray(0, lineBuffer.length - 1)
    : lineBuffer
  includeLine(state, withoutCarriageReturn.toString('utf8'))
  await maybeYield(state)
}

const readSnapshotFile = async (snapshotFile, state) => {
  state.deadline.check()
  state.diagnostics.files_read += 1
  if (snapshotFile.compressed) state.diagnostics.compressed_files_read += 1
  if (snapshotFile.size === 0 && !snapshotFile.compressed) return
  if (snapshotFile.size === 0) throw new TrackLogUnavailableError()

  const readStream = snapshotFile.handle.createReadStream({
    start: 0,
    end: snapshotFile.size - 1,
    autoClose: false,
    highWaterMark: state.limits.readChunkBytes,
    signal: state.deadline.signal,
  })
  let stream = readStream
  if (snapshotFile.compressed) {
    const gunzip = createGunzip()
    readStream.once('error', (error) => gunzip.destroy(error))
    stream = readStream.pipe(gunzip)
  }

  let pending = Buffer.alloc(0)

  try {
    for await (const chunk of stream) {
      state.deadline.check()
      state.decodedBytes += chunk.length
      if (state.decodedBytes > state.limits.maxDecodedBytes) {
        throw new TrackLogTooLargeError()
      }

      let chunkOffset = 0
      let newlineIndex = chunk.indexOf(0x0a, chunkOffset)
      while (newlineIndex !== -1) {
        state.deadline.check()
        const segment = chunk.subarray(chunkOffset, newlineIndex)
        const lineBytes = pending.length + segment.length
        if (lineBytes > state.limits.maxLineBytes) {
          throw new TrackLogTooLargeError()
        }

        const lineBuffer = pending.length === 0
          ? segment
          : Buffer.concat([pending, segment], lineBytes)
        pending = Buffer.alloc(0)
        await processLineBuffer(state, lineBuffer)
        chunkOffset = newlineIndex + 1
        newlineIndex = chunk.indexOf(0x0a, chunkOffset)
      }

      const remainder = chunk.subarray(chunkOffset)
      const pendingBytes = pending.length + remainder.length
      if (pendingBytes > state.limits.maxLineBytes) {
        throw new TrackLogTooLargeError()
      }
      pending = pending.length === 0
        ? remainder
        : Buffer.concat([pending, remainder], pendingBytes)
    }

    state.deadline.check()
    if (pending.length > 0) {
      const finalBuffer = pending.at(-1) === 0x0d
        ? pending.subarray(0, pending.length - 1)
        : pending
      const finalLine = finalBuffer.toString('utf8')
      let isCompleteJson = true
      try {
        JSON.parse(finalLine)
      } catch {
        isCompleteJson = false
      }

      if (isCompleteJson) {
        await processLineBuffer(state, pending)
      } else {
        if (snapshotFile.current) {
          state.diagnostics.lines_read += 1
          state.diagnostics.partial_lines += 1
          await maybeYield(state)
        } else {
          await processLineBuffer(state, pending)
        }
      }
    }
  } catch (error) {
    state.deadline.check()
    if (
      error instanceof TrackLogUnavailableError
      || error instanceof TrackLogTooLargeError
      || error instanceof TrackQueryTimeoutError
    ) {
      throw error
    }
    throw new TrackLogUnavailableError(undefined, { cause: error })
  } finally {
    stream.destroy()
    if (stream !== readStream) readStream.destroy()
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

export async function summarizeTrackEvents({ logDir, days, project, now, limits }) {
  const resolvedLimits = resolveLimits(limits)
  const deadline = createDeadline(resolvedLimits.timeoutMs)
  let snapshot = []
  try {
    deadline.check()
    const range = buildRange(days, now)
    const state = createState(range, project, resolvedLimits, deadline)
    snapshot = await openSnapshot(logDir, deadline)
    for (const snapshotFile of snapshot) {
      deadline.check()
      await readSnapshotFile(snapshotFile, state)
    }
    deadline.check()
    return buildResponse(state)
  } finally {
    await closeSnapshot(snapshot)
    deadline.close()
  }
}
