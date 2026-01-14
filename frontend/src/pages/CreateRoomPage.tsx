import { useState } from 'react'

type CreateRoomPageProps = {
  onCreate: (payload: { playerName: string }) => void
  onBack: () => void
}

export function CreateRoomPage({ onCreate, onBack }: CreateRoomPageProps) {
  const [playerName, setPlayerName] = useState('')
  const [error, setError] = useState('')

  const handleCreate = () => {
    const trimmedName = playerName.trim()
    if (!trimmedName) {
      setError('Player name is required.')
      return
    }

    setError('')
    onCreate({ playerName: trimmedName })
  }

  return (
    <section className="entry">
      <header className="entry__header">
        <p className="entry__eyebrow">Create Room</p>
        <h1 className="entry__title">Start a New Match</h1>
        <p className="entry__subtitle">Enter your name to generate a room.</p>
      </header>

      <div className="entry__form">
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
          <button className="entry__button entry__button--ghost" onClick={onBack}>
            Back to Lobby
          </button>
          <button className="entry__button" onClick={handleCreate}>
            Create Room
          </button>
        </div>
      </div>
    </section>
  )
}
