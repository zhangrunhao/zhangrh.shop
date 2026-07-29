import assert from 'node:assert/strict'
import test from 'node:test'

import { resolveGameOverView } from './game-view'

const players = [
  { playerId: 'player-1' },
  { playerId: 'player-2' },
]

const p2Victory = {
  result: 'p2_win' as const,
  final: {
    p1: { hp: 0 },
    p2: { hp: 5 },
  },
}

test('resolveGameOverView projects a P2 victory from the P1 perspective', () => {
  assert.deepEqual(resolveGameOverView('player-1', players, p2Victory), {
    role: 'p1',
    outcome: 'loss',
    myHp: 0,
    opponentHp: 5,
  })
})

test('resolveGameOverView projects the same P2 victory from the P2 perspective', () => {
  assert.deepEqual(resolveGameOverView('player-2', players, p2Victory), {
    role: 'p2',
    outcome: 'win',
    myHp: 5,
    opponentHp: 0,
  })
})
