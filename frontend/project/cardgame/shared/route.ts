import { useEffect, useState } from 'react'

export const CARDGAME_BASE_PATH = '/cardgame'
export const CARDGAME_RECOVERY_MESSAGE = '对局已结束或无法恢复，请重新开始。'
const CARDGAME_NAVIGATION_EVENT = 'cardgame:navigation'

export type CardgameEntryMode = 'create' | 'join' | 'ai'

export type CardgameRoute =
  | { name: 'entry' }
  | { name: CardgameEntryMode }
  | { name: 'rules' }
  | { name: 'room'; roomId: string }
  | { name: 'battle'; roomId: string }
  | { name: 'result'; roomId: string }
  | { name: 'not-found' }

export type CardgameNavigationMode = 'push' | 'replace'
export type CardgameNavigationSource = 'user' | 'server'
export type CardgameServerPhase = 'waiting' | 'playing' | 'round_hand' | 'game_over'

export type CardgameSession = {
  roomId: string
  playerId: string
}

export type CardgameSessionGuardContext = {
  session: CardgameSession | null
  gameResult: { roomId: string } | null
}

export type CardgameSessionRouteGuard =
  | { action: 'allow' }
  | { action: 'teardown' }
  | {
      action: 'recover'
      message: typeof CARDGAME_RECOVERY_MESSAGE
      navigationMode: 'replace'
      route: { name: 'entry' }
    }

const ROOM_ID_PATTERN = /^\d{4}$/

export const resolveCardgameRoute = (pathname: string): CardgameRoute => {
  const normalized =
    pathname.length > 1 && pathname.endsWith('/')
      ? pathname.slice(0, -1)
      : pathname

  if (normalized === CARDGAME_BASE_PATH) {
    return { name: 'entry' }
  }

  const staticMatch = normalized.match(/^\/cardgame\/(create|join|ai|rules)$/)
  if (staticMatch?.[1]) {
    return { name: staticMatch[1] as CardgameEntryMode | 'rules' }
  }

  const sessionMatch = normalized.match(/^\/cardgame\/(room|battle|result)\/(\d{4})$/)
  if (sessionMatch?.[1] && sessionMatch[2]) {
    return {
      name: sessionMatch[1] as 'room' | 'battle' | 'result',
      roomId: sessionMatch[2],
    }
  }

  return { name: 'not-found' }
}

const requireRoomId = (roomId: string) => {
  if (!ROOM_ID_PATTERN.test(roomId)) {
    throw new Error('CardGame routes require a four-digit room id')
  }
  return roomId
}

export const buildCardgamePath = (route: CardgameRoute): string => {
  switch (route.name) {
    case 'entry':
      return `${CARDGAME_BASE_PATH}/`
    case 'create':
    case 'join':
    case 'ai':
    case 'rules':
    case 'not-found':
      return `${CARDGAME_BASE_PATH}/${route.name}`
    case 'room':
    case 'battle':
    case 'result':
      return `${CARDGAME_BASE_PATH}/${route.name}/${requireRoomId(route.roomId)}`
  }
}

export const entryModeForRoute = (route: CardgameRoute): CardgameEntryMode | null => {
  if (route.name === 'entry') {
    return 'create'
  }
  if (route.name === 'create' || route.name === 'join' || route.name === 'ai') {
    return route.name
  }
  return null
}

export const isCardgameSessionRoute = (
  route: CardgameRoute,
): route is Extract<CardgameRoute, { roomId: string }> =>
  route.name === 'room' || route.name === 'battle' || route.name === 'result'

export const resolveServerRoute = (
  roomId: string,
  phase: CardgameServerPhase,
  options: { isRematch?: boolean } = {},
): Extract<CardgameRoute, { roomId: string }> => {
  requireRoomId(roomId)
  if (phase === 'waiting' && !options.isRematch) {
    return { name: 'room', roomId }
  }
  if (phase === 'game_over') {
    return { name: 'result', roomId }
  }
  return { name: 'battle', roomId }
}

export const getCardgameNavigationMode = (
  source: CardgameNavigationSource,
): CardgameNavigationMode => (source === 'user' ? 'push' : 'replace')

export const resolveExplicitLeaveNavigation = () => ({
  mode: 'replace' as const,
  route: { name: 'entry' as const },
})

export const resolveRematchTransition = (
  pending: boolean,
  event: 'request' | 'room-state' | 'error',
) => {
  if (event === 'request') {
    return pending
      ? { action: 'ignore' as const, pending: true, clearResult: false }
      : { action: 'begin' as const, pending: true, clearResult: false }
  }
  if (!pending) {
    return { action: 'ignore' as const, pending: false, clearResult: false }
  }
  if (event === 'error') {
    return { action: 'fail' as const, pending: false, clearResult: false }
  }
  return { action: 'succeed' as const, pending: false, clearResult: true }
}

export const resolveSessionRouteGuard = (
  route: CardgameRoute,
  context: CardgameSessionGuardContext,
): CardgameSessionRouteGuard => {
  const { session } = context
  const hasSession = Boolean(session?.roomId && session.playerId)

  if (isCardgameSessionRoute(route)) {
    const hasMatchingSession = hasSession && route.roomId === session?.roomId
    const hasMatchingResult =
      route.name !== 'result' || context.gameResult?.roomId === route.roomId
    if (hasMatchingSession && hasMatchingResult) {
      return { action: 'allow' }
    }
    return {
      action: 'recover',
      message: CARDGAME_RECOVERY_MESSAGE,
      navigationMode: 'replace',
      route: { name: 'entry' },
    }
  }

  if (hasSession) {
    return { action: 'teardown' }
  }

  return { action: 'allow' }
}

export const navigateCardgame = (
  route: CardgameRoute,
  mode: CardgameNavigationMode = 'push',
) => {
  const pathname = buildCardgamePath(route)
  if (window.location.pathname === pathname) {
    return
  }
  if (mode === 'replace') {
    window.history.replaceState({}, '', pathname)
  } else {
    window.history.pushState({}, '', pathname)
  }
  window.dispatchEvent(new Event(CARDGAME_NAVIGATION_EVENT))
}

export const useCardgamePathname = () => {
  const [pathname, setPathname] = useState(() => window.location.pathname)

  useEffect(() => {
    const handlePopstate = () => setPathname(window.location.pathname)
    window.addEventListener('popstate', handlePopstate)
    window.addEventListener(CARDGAME_NAVIGATION_EVENT, handlePopstate)
    return () => {
      window.removeEventListener('popstate', handlePopstate)
      window.removeEventListener(CARDGAME_NAVIGATION_EVENT, handlePopstate)
    }
  }, [])

  return pathname
}
