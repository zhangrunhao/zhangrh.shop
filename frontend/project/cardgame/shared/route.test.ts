import assert from 'node:assert/strict'
import test from 'node:test'

import {
  CARDGAME_RECOVERY_MESSAGE,
  buildCardgamePath,
  entryModeForRoute,
  getCardgameNavigationMode,
  isCardgameSessionRoute,
  resolveCardgameRoute,
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
})

test('user navigation pushes while server phase navigation replaces', () => {
  assert.equal(getCardgameNavigationMode('user'), 'push')
  assert.equal(getCardgameNavigationMode('server'), 'replace')
})

test('session route guard allows only a matching in-memory session', () => {
  const route = { name: 'battle', roomId: '0123' } as const

  assert.equal(isCardgameSessionRoute(route), true)
  assert.deepEqual(
    resolveSessionRouteGuard(route, { roomId: '0123', playerId: 'player-1' }),
    { action: 'allow' },
  )

  for (const session of [
    null,
    { roomId: '', playerId: '' },
    { roomId: '9999', playerId: 'player-1' },
    { roomId: '0123', playerId: '' },
  ]) {
    assert.deepEqual(resolveSessionRouteGuard(route, session), {
      action: 'recover',
      message: CARDGAME_RECOVERY_MESSAGE,
      navigationMode: 'replace',
      route: { name: 'entry' },
    })
  }
})

test('session route guard requests teardown when an active session leaves its dynamic route', () => {
  assert.deepEqual(
    resolveSessionRouteGuard(
      { name: 'create' },
      { roomId: '0123', playerId: 'player-1' },
    ),
    { action: 'teardown' },
  )

  assert.deepEqual(
    resolveSessionRouteGuard(
      { name: 'battle', roomId: '0123' },
      { roomId: '0123', playerId: 'player-1' },
    ),
    { action: 'allow' },
  )
})
