import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CARDGAME_RECOVERY_MESSAGE,
  buildCardgamePath,
  entryModeForRoute,
  getCardgameNavigationMode,
  isCardgameSessionRoute,
  navigateCardgame,
  resolveCardgameRoute,
  resolveExplicitLeaveNavigation,
  resolveRematchTransition,
  resolveRoomStateRouteDecision,
  resolveServerRoute,
  resolveSessionRouteGuard,
} from './route'

test('resolveCardgameRoute accepts the CardGame entry and static routes with optional trailing slashes', () => {
  assert.deepEqual(resolveCardgameRoute('/cardgame'), { name: 'entry' })
  assert.deepEqual(resolveCardgameRoute('/cardgame/'), { name: 'entry' })

  for (const name of ['create', 'join', 'ai', 'rules'] as const) {
    assert.deepEqual(resolveCardgameRoute(`/cardgame/${name}`), { name })
    assert.deepEqual(resolveCardgameRoute(`/cardgame/${name}/`), { name })
  }
})

test('resolveCardgameRoute accepts session routes only with a four-digit room id', () => {
  for (const name of ['room', 'battle', 'result'] as const) {
    assert.deepEqual(resolveCardgameRoute(`/cardgame/${name}/0123`), {
      name,
      roomId: '0123',
    })
    assert.deepEqual(resolveCardgameRoute(`/cardgame/${name}/0123/`), {
      name,
      roomId: '0123',
    })
  }
})

test('resolveCardgameRoute rejects unknown paths, extra segments, and malformed room ids', () => {
  for (const pathname of [
    '/',
    '/cardgame/missing',
    '/cardgame//',
    '/cardgame/create//',
    '/cardgame/create/more',
    '/cardgame/room',
    '/cardgame/room/123',
    '/cardgame/room/12345',
    '/cardgame/room/abcd',
    '/cardgame/battle/1234/more',
    '/cardgame/battle/1234//',
    '/cardgame/result/１２３４',
  ]) {
    assert.deepEqual(resolveCardgameRoute(pathname), { name: 'not-found' })
  }
})

test('buildCardgamePath creates canonical CardGame URLs', () => {
  assert.equal(buildCardgamePath({ name: 'entry' }), '/cardgame/')
  assert.equal(buildCardgamePath({ name: 'create' }), '/cardgame/create')
  assert.equal(buildCardgamePath({ name: 'join' }), '/cardgame/join')
  assert.equal(buildCardgamePath({ name: 'ai' }), '/cardgame/ai')
  assert.equal(buildCardgamePath({ name: 'rules' }), '/cardgame/rules')
  assert.equal(buildCardgamePath({ name: 'room', roomId: '0123' }), '/cardgame/room/0123')
  assert.equal(buildCardgamePath({ name: 'battle', roomId: '0123' }), '/cardgame/battle/0123')
  assert.equal(buildCardgamePath({ name: 'result', roomId: '0123' }), '/cardgame/result/0123')
  assert.equal(buildCardgamePath({ name: 'not-found' }), '/cardgame/not-found')
  assert.throws(
    () => buildCardgamePath({ name: 'battle', roomId: '123' }),
    /four-digit room id/,
  )
})

test('entryModeForRoute derives the entry selection from the URL route', () => {
  assert.equal(entryModeForRoute({ name: 'entry' }), 'create')
  assert.equal(entryModeForRoute({ name: 'create' }), 'create')
  assert.equal(entryModeForRoute({ name: 'join' }), 'join')
  assert.equal(entryModeForRoute({ name: 'ai' }), 'ai')
  assert.equal(entryModeForRoute({ name: 'rules' }), null)
})

test('resolveServerRoute maps server phases to session routes', () => {
  assert.deepEqual(resolveServerRoute('0123', 'waiting'), { name: 'room', roomId: '0123' })
  assert.deepEqual(resolveServerRoute('0123', 'playing'), { name: 'battle', roomId: '0123' })
  assert.deepEqual(resolveServerRoute('0123', 'round_hand'), { name: 'battle', roomId: '0123' })
  assert.deepEqual(resolveServerRoute('0123', 'game_over'), { name: 'result', roomId: '0123' })
  assert.deepEqual(resolveServerRoute('0123', 'waiting', { isRematch: true }), {
    name: 'battle',
    roomId: '0123',
  })
})

test('user navigation pushes while server phase navigation replaces', () => {
  assert.equal(getCardgameNavigationMode('user'), 'push')
  assert.equal(getCardgameNavigationMode('server'), 'replace')
})

test('navigateCardgame uses the requested history method and emits an app navigation event', () => {
  const historyCalls: string[] = []
  const eventTypes: string[] = []
  const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'window')
  const popStateEventDescriptor = Object.getOwnPropertyDescriptor(globalThis, 'PopStateEvent')
  const location = { pathname: '/cardgame/' }

  Object.defineProperty(globalThis, 'window', {
    configurable: true,
    value: {
      location,
      history: {
        pushState: (_state: unknown, _unused: string, pathname: string) => {
          historyCalls.push(`push:${pathname}`)
          location.pathname = pathname
        },
        replaceState: (_state: unknown, _unused: string, pathname: string) => {
          historyCalls.push(`replace:${pathname}`)
          location.pathname = pathname
        },
      },
      dispatchEvent: (event: Event) => {
        eventTypes.push(event.type)
        return true
      },
    },
  })
  Object.defineProperty(globalThis, 'PopStateEvent', {
    configurable: true,
    value: class extends Event {},
  })

  try {
    navigateCardgame({ name: 'create' }, 'push')
    navigateCardgame({ name: 'rules' }, 'replace')

    assert.deepEqual(historyCalls, [
      'push:/cardgame/create',
      'replace:/cardgame/rules',
    ])
    assert.deepEqual(eventTypes, [
      'cardgame:navigation',
      'cardgame:navigation',
    ])
    assert.equal(eventTypes.includes('popstate'), false)
  } finally {
    if (windowDescriptor) {
      Object.defineProperty(globalThis, 'window', windowDescriptor)
    } else {
      Reflect.deleteProperty(globalThis, 'window')
    }
    if (popStateEventDescriptor) {
      Object.defineProperty(globalThis, 'PopStateEvent', popStateEventDescriptor)
    } else {
      Reflect.deleteProperty(globalThis, 'PopStateEvent')
    }
  }
})

test('explicit leave navigation replaces the current session route', () => {
  assert.deepEqual(resolveExplicitLeaveNavigation(), {
    mode: 'replace',
    route: { name: 'entry' },
  })
})

test('session route guard allows only a matching in-memory session', () => {
  const route = { name: 'battle', roomId: '0123' } as const

  assert.equal(isCardgameSessionRoute(route), true)
  assert.deepEqual(
    resolveSessionRouteGuard(route, {
      session: { roomId: '0123', playerId: 'player-1' },
      gameResult: null,
    }),
    { action: 'allow' },
  )

  for (const session of [
    null,
    { roomId: '', playerId: '' },
    { roomId: '9999', playerId: 'player-1' },
    { roomId: '0123', playerId: '' },
  ]) {
    assert.deepEqual(resolveSessionRouteGuard(route, { session, gameResult: null }), {
      action: 'recover',
      message: CARDGAME_RECOVERY_MESSAGE,
      navigationMode: 'replace',
      route: { name: 'entry' },
    })
  }
})

test('result route guard requires a matching in-memory game result', () => {
  const route = { name: 'result', roomId: '0123' } as const
  const session = { roomId: '0123', playerId: 'player-1' }
  const recovery = {
    action: 'recover',
    message: CARDGAME_RECOVERY_MESSAGE,
    navigationMode: 'replace',
    route: { name: 'entry' },
  } as const

  assert.deepEqual(
    resolveSessionRouteGuard(route, { session, gameResult: null }),
    recovery,
  )
  assert.deepEqual(
    resolveSessionRouteGuard(route, {
      session,
      gameResult: { roomId: '9999' },
    }),
    recovery,
  )
  assert.deepEqual(
    resolveSessionRouteGuard(route, {
      session,
      gameResult: { roomId: '0123' },
    }),
    { action: 'allow' },
  )
})

test('session route guard requests teardown when an active session leaves its dynamic route', () => {
  assert.deepEqual(
    resolveSessionRouteGuard(
      { name: 'create' },
      {
        session: { roomId: '0123', playerId: 'player-1' },
        gameResult: null,
      },
    ),
    { action: 'teardown' },
  )

  assert.deepEqual(
    resolveSessionRouteGuard(
      { name: 'battle', roomId: '0123' },
      {
        session: { roomId: '0123', playerId: 'player-1' },
        gameResult: null,
      },
    ),
    { action: 'allow' },
  )
})

test('rematch transition preserves results until success and blocks duplicate requests', () => {
  assert.deepEqual(resolveRematchTransition('idle', 'request'), {
    action: 'begin',
    state: 'pending',
    clearResult: false,
  })
  assert.deepEqual(resolveRematchTransition('pending', 'request'), {
    action: 'ignore',
    state: 'pending',
    clearResult: false,
  })
  assert.deepEqual(resolveRematchTransition('pending', 'error'), {
    action: 'fail',
    state: 'idle',
    clearResult: false,
  })
})

test('room state routing keeps both clients able to complete a two-player rematch', () => {
  const aWaiting = resolveRoomStateRouteDecision('0123', 'waiting', {
    rematchState: 'pending',
    gameResultRoomId: '0123',
  })
  assert.deepEqual(aWaiting, {
    route: { name: 'battle', roomId: '0123' },
    rematchState: 'accepted',
    clearResult: true,
  })

  const bWaiting = resolveRoomStateRouteDecision('0123', 'waiting', {
    rematchState: 'idle',
    gameResultRoomId: '0123',
  })
  assert.deepEqual(bWaiting, {
    route: null,
    rematchState: 'idle',
    clearResult: false,
  })

  const bRequest = resolveRematchTransition(
    bWaiting.rematchState,
    'request',
  )
  assert.equal(bRequest.state, 'pending')
  const bAccepted = resolveRoomStateRouteDecision('0123', 'waiting', {
    rematchState: bRequest.state,
    gameResultRoomId: '0123',
  })
  assert.deepEqual(bAccepted, {
    route: { name: 'battle', roomId: '0123' },
    rematchState: 'accepted',
    clearResult: true,
  })

  assert.deepEqual(
    resolveRoomStateRouteDecision('0123', 'playing', {
      rematchState: aWaiting.rematchState,
      gameResultRoomId: null,
    }),
    {
      route: { name: 'battle', roomId: '0123' },
      rematchState: 'idle',
      clearResult: false,
    },
  )
  assert.deepEqual(
    resolveRoomStateRouteDecision('0123', 'playing', {
      rematchState: bAccepted.rematchState,
      gameResultRoomId: null,
    }),
    {
      route: { name: 'battle', roomId: '0123' },
      rematchState: 'idle',
      clearResult: false,
    },
  )

  assert.deepEqual(resolveRoomStateRouteDecision('0123', 'waiting', {
    rematchState: 'idle',
    gameResultRoomId: null,
  }), {
    route: { name: 'room', roomId: '0123' },
    rematchState: 'idle',
    clearResult: false,
  })
})
