import fs from 'node:fs'
import path from 'node:path'
import { setImmediate as yieldToEventLoop } from 'node:timers/promises'

const fileSystem = fs.promises

const SHANGHAI_OFFSET_MS = 8 * 60 * 60 * 1000
const DAY_MS = 24 * 60 * 60 * 1000
const CURRENT_FILE = 'events.jsonl'
const RECORD_KEYS = ['device_id', 'event', 'project', 'time']
const DEVICE_ID_PATTERN = /^[A-Za-z0-9]{12}$/
const EVENT_PATTERN = /^[a-z][a-z0-9_]{0,63}$/
const ISO_TIME_PATTERN = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,3})?(?:Z|[+-]\d{2}:\d{2})$/
const PROJECTS = new Set(['hub', 'cardgame', 'shotmarker'])

const DEFAULT_LIMITS = Object.freeze({
  timeoutMs: 20_000,
  maxDecodedBytes: 64 * 1024 * 1024,
  maxLineBytes: 32 * 1024,
  yieldEveryLines: 500,
  readChunkBytes: 64 * 1024,
})

const resolveLimits = (overrides = {}) => ({ ...DEFAULT_LIMITS, ...overrides })

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

const formatShanghaiDate = (timeMs) => {
  return new Date(timeMs + SHANGHAI_OFFSET_MS).toISOString().slice(0, 10)
}

const buildRange = (days, now) => {
  const shanghaiNow = new Date(now.getTime() + SHANGHAI_OFFSET_MS)
  const startLocalMs = Date.UTC(
    shanghaiNow.getUTCFullYear(),
    shanghaiNow.getUTCMonth(),
    shanghaiNow.getUTCDate() - (days - 1),
  )

  return {
    fromMs: startLocalMs - SHANGHAI_OFFSET_MS,
    toMs: now.getTime(),
    dates: Array.from({ length: days }, (_, index) => {
      return new Date(startLocalMs + index * DAY_MS).toISOString().slice(0, 10)
    }),
  }
}

const parseRecord = (parsed) => {
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) return null

  const keys = Object.keys(parsed).sort()
  if (keys.length !== RECORD_KEYS.length) return null
  if (!keys.every((key, index) => key === RECORD_KEYS[index])) return null
  if (typeof parsed.project !== 'string' || !PROJECTS.has(parsed.project)) return null
  if (typeof parsed.event !== 'string' || !EVENT_PATTERN.test(parsed.event)) return null
  if (typeof parsed.device_id !== 'string' || !DEVICE_ID_PATTERN.test(parsed.device_id)) return null
  if (typeof parsed.time !== 'string' || !ISO_TIME_PATTERN.test(parsed.time)) return null

  const timeMs = Date.parse(parsed.time)
  if (!Number.isFinite(timeMs)) return null

  return {
    project: parsed.project,
    event: parsed.event,
    timeMs,
    deviceId: parsed.device_id,
  }
}

const createState = (range, project, event, limits, deadline) => ({
  range,
  project,
  event,
  limits,
  deadline,
  decodedBytes: 0,
  linesSinceYield: 0,
  daily: new Map(range.dates.map((date) => [
    date,
    { date, pv: 0, deviceIds: new Set() },
  ])),
})

const includeLine = (state, line) => {
  if (line.length === 0) return

  let parsed
  try {
    parsed = JSON.parse(line)
  } catch {
    return
  }

  const parsedRecord = parseRecord(parsed)
  if (!parsedRecord) return
  if (parsedRecord.timeMs < state.range.fromMs || parsedRecord.timeMs > state.range.toMs) return
  if (parsedRecord.project !== state.project || parsedRecord.event !== state.event) return

  const day = state.daily.get(formatShanghaiDate(parsedRecord.timeMs))
  if (!day) return

  day.pv += 1
  day.deviceIds.add(parsedRecord.deviceId)
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
  const normalized = lineBuffer.at(-1) === 0x0d
    ? lineBuffer.subarray(0, lineBuffer.length - 1)
    : lineBuffer
  includeLine(state, normalized.toString('utf8'))
  await maybeYield(state)
}

const closeSnapshot = async (snapshot) => {
  await snapshot?.handle.close().catch(() => {})
}

const openSnapshot = async (logDir, limits, deadline) => {
  const filePath = path.join(logDir, CURRENT_FILE)
  let handle

  try {
    deadline.check()
    const before = await fileSystem.lstat(filePath)
    deadline.check()
    if (!before.isFile()) throw new TrackLogUnavailableError()

    const noFollow = fs.constants.O_NOFOLLOW ?? 0
    handle = await fileSystem.open(filePath, fs.constants.O_RDONLY | noFollow)
    deadline.check()
    const after = await handle.stat()
    deadline.check()

    if (!after.isFile() || before.dev !== after.dev || before.ino !== after.ino) {
      throw new TrackLogUnavailableError()
    }
    if (after.size > limits.maxDecodedBytes) {
      throw new TrackLogTooLargeError()
    }

    return { handle, size: after.size }
  } catch (error) {
    await handle?.close().catch(() => {})
    if (
      error instanceof TrackLogUnavailableError
      || error instanceof TrackLogTooLargeError
      || error instanceof TrackQueryTimeoutError
    ) {
      throw error
    }
    throw new TrackLogUnavailableError(undefined, { cause: error })
  }
}

const readSnapshot = async (snapshot, state) => {
  if (snapshot.size === 0) return

  const stream = snapshot.handle.createReadStream({
    start: 0,
    end: snapshot.size - 1,
    autoClose: false,
    highWaterMark: state.limits.readChunkBytes,
    signal: state.deadline.signal,
  })
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
        const segment = chunk.subarray(chunkOffset, newlineIndex)
        const lineBytes = pending.length + segment.length
        if (lineBytes > state.limits.maxLineBytes) throw new TrackLogTooLargeError()

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
      if (pendingBytes > state.limits.maxLineBytes) throw new TrackLogTooLargeError()
      pending = pending.length === 0
        ? remainder
        : Buffer.concat([pending, remainder], pendingBytes)
    }

    state.deadline.check()
    if (pending.length > 0) {
      const normalized = pending.at(-1) === 0x0d
        ? pending.subarray(0, pending.length - 1)
        : pending
      try {
        JSON.parse(normalized.toString('utf8'))
        await processLineBuffer(state, pending)
      } catch (error) {
        if (error instanceof TrackQueryTimeoutError) throw error
      }
    }
  } catch (error) {
    state.deadline.check()
    if (error instanceof TrackLogTooLargeError || error instanceof TrackQueryTimeoutError) {
      throw error
    }
    throw new TrackLogUnavailableError(undefined, { cause: error })
  } finally {
    stream.destroy()
  }
}

const buildResponse = (state) => ({
  daily: [...state.daily.values()].map(({ date, pv, deviceIds }) => ({
    date,
    pv,
    uv: deviceIds.size,
  })),
})

export async function queryTrackTrend({ logDir, project, event, days, now, limits }) {
  const resolvedLimits = resolveLimits(limits)
  const deadline = createDeadline(resolvedLimits.timeoutMs)
  let snapshot = null

  try {
    deadline.check()
    const range = buildRange(days, now)
    const state = createState(range, project, event, resolvedLimits, deadline)
    snapshot = await openSnapshot(logDir, resolvedLimits, deadline)
    await readSnapshot(snapshot, state)
    deadline.check()
    return buildResponse(state)
  } finally {
    await closeSnapshot(snapshot)
    deadline.close()
  }
}
