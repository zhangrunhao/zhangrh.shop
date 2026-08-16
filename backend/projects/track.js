import express from 'express'

import {
  queryTrackTrend,
  TrackLogTooLargeError,
  TrackLogUnavailableError,
  TrackQueryTimeoutError,
} from './track-query.js'

const TREND_PATH = '/api/track/trend'
const PROJECTS = new Set(['hub', 'cardgame', 'shotmarker'])
const QUERY_PARAMETERS = new Set(['project', 'event', 'days'])
const DAYS_PATTERN = /^(?:1|7|30|90)$/
const EVENT_PATTERN = /^[a-z][a-z0-9_]{0,63}$/

const ERROR_MESSAGES = Object.freeze({
  missing_query_parameter: 'project, event, and days are required',
  invalid_days: 'days must be 1, 7, 30, or 90',
  invalid_project: 'project must be hub, cardgame, or shotmarker',
  invalid_event: 'event has an invalid format',
  duplicate_query_parameter: 'query parameters must not be repeated',
  unknown_query_parameter: 'unknown query parameter',
  track_log_unavailable: 'track log is unavailable',
  track_log_too_large: 'track log exceeds query limits',
  track_query_busy: 'another track query is already running',
  track_query_timeout: 'track query timed out',
  internal_error: 'internal server error',
})

const sendError = (res, status, code) => {
  return res.status(status).json({ error: { code, message: ERROR_MESSAGES[code] } })
}

const parseQuery = (originalUrl) => {
  const searchParams = new URL(originalUrl, 'http://localhost').searchParams
  const keys = [...new Set(searchParams.keys())]

  if (keys.some((key) => !QUERY_PARAMETERS.has(key))) {
    return { error: 'unknown_query_parameter' }
  }
  if (keys.some((key) => searchParams.getAll(key).length > 1)) {
    return { error: 'duplicate_query_parameter' }
  }
  if ([...QUERY_PARAMETERS].some((key) => !searchParams.has(key))) {
    return { error: 'missing_query_parameter' }
  }

  const daysValue = searchParams.get('days')
  const project = searchParams.get('project')
  const event = searchParams.get('event')

  if (!DAYS_PATTERN.test(daysValue)) return { error: 'invalid_days' }
  if (!PROJECTS.has(project)) return { error: 'invalid_project' }
  if (!EVENT_PATTERN.test(event)) return { error: 'invalid_event' }

  return { days: Number(daysValue), project, event }
}

const mapQueryError = (error) => {
  if (error instanceof TrackLogUnavailableError) return 'track_log_unavailable'
  if (error instanceof TrackLogTooLargeError) return 'track_log_too_large'
  if (error instanceof TrackQueryTimeoutError) return 'track_query_timeout'
  return 'internal_error'
}

const safeErrorType = (error) => {
  return typeof error?.name === 'string' && /^[A-Za-z][A-Za-z0-9]*Error$/.test(error.name)
    ? error.name
    : 'Error'
}

export function registerTrack(app, {
  logDir,
  queryTrend = queryTrackTrend,
  now = () => new Date(),
}) {
  const router = express.Router({ caseSensitive: true, strict: true })
  let activeQueries = 0

  router.get(TREND_PATH, async (req, res) => {
    res.set('Cache-Control', 'no-store')

    const query = parseQuery(req.originalUrl)
    if (query.error) return sendError(res, 400, query.error)

    if (activeQueries >= 1) {
      res.set('Retry-After', '2')
      return sendError(res, 503, 'track_query_busy')
    }

    activeQueries += 1
    try {
      const trend = await queryTrend({
        logDir,
        project: query.project,
        event: query.event,
        days: query.days,
        now: now(),
      })
      return res.json(trend)
    } catch (error) {
      const code = mapQueryError(error)
      console.error('track_query_failed', {
        code,
        error_type: safeErrorType(error),
      })
      return sendError(res, code === 'internal_error' ? 500 : 503, code)
    } finally {
      activeQueries -= 1
    }
  })

  app.use(router)
}
