import { useEffect, useState } from 'react'

type MatchPageProps = {
  roomId: string
  playerName: string
  playerId: string
  onBack: () => void
  onMatched: () => void
}

export function MatchPage({ roomId, playerName, playerId, onBack, onMatched }: MatchPageProps) {
  const hasPlayerInfo = Boolean(roomId && playerName && playerId)
  const [elapsedSeconds, setElapsedSeconds] = useState(0)

  useEffect(() => {
    if (!hasPlayerInfo) {
      return
    }

    const startTime = Date.now()
    const intervalId = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setElapsedSeconds(Math.min(elapsed, 3))
    }, 250)

    const timeoutId = window.setTimeout(() => {
      onMatched()
    }, 3000)

    return () => {
      window.clearInterval(intervalId)
      window.clearTimeout(timeoutId)
    }
  }, [onMatched, hasPlayerInfo])

  return (
    <section className="match">
      <header className="match__header">
        <p className="match__eyebrow">Matching Room</p>
        <h1 className="match__title">Finding an Opponent</h1>
        <p className="match__subtitle">Stay on this screen while we match you.</p>
      </header>

      <div className="match__panel">
        {hasPlayerInfo ? (
          <>
            <div className="match__row">
              <span className="match__label">Room</span>
              <span className="match__value">{roomId}</span>
            </div>
            <div className="match__row">
              <span className="match__label">Player</span>
              <span className="match__value">{playerName}</span>
            </div>
            <div className="match__row">
              <span className="match__label">User ID</span>
              <span className="match__value">{playerId}</span>
            </div>
            <div className="match__row">
              <span className="match__label">Wait Time</span>
              <span className="match__value">{elapsedSeconds}s</span>
            </div>
          </>
        ) : (
          <p className="match__empty">Missing room or player info. Please return to the lobby.</p>
        )}
      </div>

      <div className="match__actions">
        <button className="match__button match__button--ghost" onClick={onBack}>
          Back to Lobby
        </button>
      </div>
    </section>
  )
}
