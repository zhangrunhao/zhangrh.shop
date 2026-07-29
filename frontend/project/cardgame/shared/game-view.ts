export type CardgamePlayerRole = 'p1' | 'p2'

type PlayerIdentity = {
  playerId: string
}

type GameOverSummary = {
  result: 'p1_win' | 'p2_win' | 'draw'
  final: {
    p1: { hp: number }
    p2: { hp: number }
  }
}

export const resolveCardgamePlayerRole = (
  playerId: string,
  players: readonly PlayerIdentity[],
): CardgamePlayerRole | null => {
  if (players[0]?.playerId === playerId) {
    return 'p1'
  }
  if (players[1]?.playerId === playerId) {
    return 'p2'
  }
  return null
}

export const resolveGameOverView = (
  playerId: string,
  players: readonly PlayerIdentity[],
  gameOver: GameOverSummary,
) => {
  const role = resolveCardgamePlayerRole(playerId, players)
  if (!role) {
    return null
  }

  const winner = gameOver.result === 'draw'
    ? null
    : gameOver.result === 'p1_win'
      ? 'p1'
      : 'p2'
  const opponentRole = role === 'p1' ? 'p2' : 'p1'

  return {
    role,
    outcome: winner === null ? 'draw' as const : winner === role ? 'win' as const : 'loss' as const,
    myHp: gameOver.final[role].hp,
    opponentHp: gameOver.final[opponentRole].hp,
  }
}
