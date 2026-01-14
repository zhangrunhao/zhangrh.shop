import { useState } from 'react'

type EntryPageProps = {
  onJoin: (payload: { roomId: string; playerName: string }) => void
  onCreate: () => void
}

export function EntryPage({ onJoin, onCreate }: EntryPageProps) {
  const [roomId, setRoomId] = useState('')
  const [playerName, setPlayerName] = useState('')
  const [error, setError] = useState('')

  const validate = () => {
    const trimmedRoomId = roomId.trim()
    const trimmedName = playerName.trim()

    if (!trimmedRoomId) {
      setError('Room ID is required.')
      return false
    }

    if (!/^\d+$/.test(trimmedRoomId)) {
      setError('Room ID must be numeric.')
      return false
    }

    if (!trimmedName) {
      setError('Player name is required.')
      return false
    }

    setError('')
    return true
  }

  const handleJoin = () => {
    if (!validate()) {
      return
    }

    onJoin({
      roomId: roomId.trim(),
      playerName: playerName.trim(),
    })
  }

  return (
    <section className="entry">
      <header className="entry__header">
        <p className="entry__eyebrow">Card Duel Lobby</p>
        <h1 className="entry__title">Create or Join a Room</h1>
        <p className="entry__subtitle">
          Enter a room ID and your name to get ready for a match.
        </p>
      </header>

      <div className="entry__form">
        <label className="entry__field">
          <span className="entry__label">Room ID</span>
          <input
            className={`entry__input ${error && !roomId.trim() ? 'entry__input--error' : ''}`}
            placeholder="e.g. 1001"
            value={roomId}
            inputMode="numeric"
            pattern="[0-9]*"
            onChange={(event) => setRoomId(event.target.value.replace(/\D/g, ''))}
          />
        </label>

        <label className="entry__field">
          <span className="entry__label">Player Name</span>
          <input
            className={`entry__input ${error && !playerName.trim() ? 'entry__input--error' : ''}`}
            placeholder="e.g. Alex"
            value={playerName}
            onChange={(event) => setPlayerName(event.target.value)}
          />
        </label>

        {error ? <p className="entry__error">{error}</p> : null}

        <div className="entry__actions">
          <button className="entry__button entry__button--ghost" onClick={onCreate}>
            Create Room
          </button>
          <button className="entry__button" onClick={handleJoin}>
            Join Room
          </button>
        </div>
      </div>
    </section>
  )
}
