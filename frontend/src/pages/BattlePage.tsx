import { useEffect, useState } from 'react'
import type { RoomState, RoundResult } from '../types'

const actionCards = [
  {
    id: 'attack',
    title: 'Attack',
    description: 'Strike hard to pressure your opponent.',
  },
  {
    id: 'defend',
    title: 'Defend',
    description: 'Brace yourself and reduce losses.',
  },
  {
    id: 'rest',
    title: 'Rest',
    description: 'Recover and prepare for the next exchange.',
  },
]

type BattlePageProps = {
  playerId: string
  opponentId: string
  roomState: RoomState | null
  roundResult: RoundResult | null
  playerSide: 'p1' | 'p2' | null
  onPlayAction: (action: 'attack' | 'defend' | 'rest') => void
  onBack: () => void
}

export function BattlePage({
  playerId,
  opponentId,
  roomState,
  roundResult,
  playerSide,
  onPlayAction,
  onBack,
}: BattlePageProps) {
  const round = roomState?.round ?? 1
  const players = roomState?.players ?? []
  const self = players.find((player) => player.playerId === playerId)
  const opponent = players.find((player) => player.playerId !== playerId)
  const isSubmitted = self?.submitted ?? false
  const status = roomState?.status ?? 'waiting'
  const [selectedAction, setSelectedAction] = useState<'attack' | 'defend' | 'rest' | null>(null)

  const latestResult =
    roundResult && roomState && roundResult.round <= roomState.round ? roundResult : null
  const isPlayerOne = playerSide === 'p1'

  const displayPlayerName = self?.name || 'Unknown'
  const displayPlayerId = playerId || 'pending'
  const displayOpponentName = opponent?.name || 'Unknown'
  const displayOpponentId = opponent?.playerId || opponentId || 'pending'
  const playerHp = self?.hp ?? 10
  const opponentHp = opponent?.hp ?? 10

  const clampHp = (value: number) => Math.max(0, Math.min(10, value))
  const playerHpPercent = `${(clampHp(playerHp) / 10) * 100}%`
  const opponentHpPercent = `${(clampHp(opponentHp) / 10) * 100}%`

  useEffect(() => {
    setSelectedAction(null)
  }, [roomState?.round])

  const handleSelect = (action: 'attack' | 'defend' | 'rest') => {
    if (isSubmitted || status !== 'playing') {
      return
    }
    setSelectedAction(action)
    onPlayAction(action)
  }

  return (
    <section className="battle">
      <header className="battle__header">
        <div>
          <p className="battle__eyebrow">Round {round} / 10</p>
          <h1 className="battle__title">Duel in Progress</h1>
          <p className="battle__subtitle">Choose a card and wait for your opponent.</p>
        </div>
        <div className="battle__round">
          <span className="battle__round-label">Current</span>
          <span className="battle__round-value">{round}</span>
        </div>
      </header>
      <div className="battle__nav">
        <button className="battle__back" onClick={onBack}>
          Back to Lobby
        </button>
      </div>

      <div className="battle__players">
        <div className="battle__player-card">
          <p className="battle__player-role">You</p>
          <p className="battle__player-name">{displayPlayerName}</p>
          <p className="battle__player-id">ID {displayPlayerId}</p>
          <p className="battle__hp">HP {playerHp}</p>
          <p className="battle__hp-bar">
            <span style={{ width: playerHpPercent }} />
          </p>
        </div>
        <div className="battle__player-card battle__player-card--opponent">
          <p className="battle__player-role">Opponent</p>
          <p className="battle__player-name">{displayOpponentName}</p>
          <p className="battle__player-id">ID {displayOpponentId}</p>
          <p className="battle__hp">HP {opponentHp}</p>
          <p className="battle__hp-bar">
            <span style={{ width: opponentHpPercent }} />
          </p>
        </div>
      </div>

      <section className="battle__actions">
        <h2 className="battle__section-title">Choose Your Card</h2>
        <div className="battle__cards">
          {actionCards.map((card) => (
            <button
              className={`battle__card${
                selectedAction === card.id ? ' battle__card--selected' : ''
              }${isSubmitted || status !== 'playing' ? ' battle__card--disabled' : ''}`}
              key={card.id}
              onClick={() => handleSelect(card.id as 'attack' | 'defend' | 'rest')}
              disabled={isSubmitted || status !== 'playing'}
            >
              <span className="battle__card-title">{card.title}</span>
              <span className="battle__card-desc">{card.description}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="battle__status">
        <div className="battle__status-panel">
          <h3 className="battle__status-title">
            {isSubmitted ? 'Waiting for opponent' : 'Your move'}
          </h3>
          <p className="battle__status-text">
            {isSubmitted ? 'Card locked in. Await the other player.' : 'Pick a card to submit.'}
          </p>
          {selectedAction ? (
            <p className="battle__status-text">Selected: {selectedAction}</p>
          ) : null}
        </div>
        <div className="battle__status-panel battle__status-panel--result">
          <h3 className="battle__status-title">Latest Result</h3>
          {latestResult ? (
            <div className="battle__status-list">
              <div className="battle__status-row">
                <span>You</span>
                <span>
                  {(isPlayerOne ? latestResult.p1.action : latestResult.p2.action)} •{' '}
                  {(isPlayerOne ? latestResult.p1.delta : latestResult.p2.delta) > 0 ? '+' : ''}
                  {isPlayerOne ? latestResult.p1.delta : latestResult.p2.delta}
                </span>
              </div>
              <div className="battle__status-row">
                <span>Opponent</span>
                <span>
                  {(isPlayerOne ? latestResult.p2.action : latestResult.p1.action)} •{' '}
                  {(isPlayerOne ? latestResult.p2.delta : latestResult.p1.delta) > 0 ? '+' : ''}
                  {isPlayerOne ? latestResult.p2.delta : latestResult.p1.delta}
                </span>
              </div>
            </div>
          ) : (
            <p className="battle__status-text">Results will appear after both players act.</p>
          )}
        </div>
      </section>
    </section>
  )
}
