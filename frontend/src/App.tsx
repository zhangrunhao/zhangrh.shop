import { useEffect, useState } from 'react'
import './App.css'
import { BattlePage } from './pages/BattlePage'
import { CreateRoomPage } from './pages/CreateRoomPage'
import { EntryPage } from './pages/EntryPage'
import { MatchPage } from './pages/MatchPage'

type Route =
  | { name: 'entry' }
  | { name: 'create' }
  | { name: 'match'; roomId: string }
  | { name: 'battle' }

const resolveRoute = (): Route => {
  const path = window.location.pathname
  if (path === '/battle') {
    return { name: 'battle' }
  }

  if (path === '/create') {
    return { name: 'create' }
  }

  const match = path.match(/^\/match\/(\d+)$/)
  if (match) {
    return { name: 'match', roomId: match[1] }
  }

  return { name: 'entry' }
}

function App() {
  const [route, setRoute] = useState<Route>(resolveRoute)
  const [playerInfo, setPlayerInfo] = useState({
    roomId: '',
    playerName: '',
    playerId: '',
    opponentId: '',
  })

  const generateRoomId = () => String(Math.floor(1000 + Math.random() * 9000))
  const generateUserId = () => `user_${Math.random().toString(36).slice(2, 8)}`

  useEffect(() => {
    const handlePopState = () => {
      setRoute(resolveRoute())
    }

    window.addEventListener('popstate', handlePopState)
    return () => window.removeEventListener('popstate', handlePopState)
  }, [])

  useEffect(() => {
    if (route.name === 'match' && route.roomId !== playerInfo.roomId) {
      setPlayerInfo((prev) => ({ ...prev, roomId: route.roomId }))
    }
  }, [route, playerInfo.roomId])

  const navigateToEntry = () => {
    if (route.name === 'entry') {
      return
    }

    window.history.pushState({}, '', '/')
    setRoute({ name: 'entry' })
  }

  const navigateToCreate = () => {
    if (route.name === 'create') {
      return
    }

    window.history.pushState({}, '', '/create')
    setRoute({ name: 'create' })
  }

  const navigateToMatch = (roomId: string) => {
    if (route.name === 'match' && route.roomId === roomId) {
      return
    }

    window.history.pushState({}, '', `/match/${roomId}`)
    setRoute({ name: 'match', roomId })
  }

  const navigateToBattle = () => {
    if (route.name === 'battle') {
      return
    }

    window.history.pushState({}, '', '/battle')
    setRoute({ name: 'battle' })
  }

  return (
    <div className="app">
      {route.name === 'entry' ? (
        <EntryPage
          onCreate={navigateToCreate}
          onJoin={({ roomId, playerName }) => {
            setPlayerInfo({
              roomId,
              playerName,
              playerId: generateUserId(),
              opponentId: '',
            })
            navigateToMatch(roomId)
          }}
        />
      ) : null}
      {route.name === 'create' ? (
        <CreateRoomPage
          onBack={navigateToEntry}
          onCreate={({ playerName }) => {
            const roomId = generateRoomId()
            setPlayerInfo({
              roomId,
              playerName,
              playerId: generateUserId(),
              opponentId: '',
            })
            navigateToMatch(roomId)
          }}
        />
      ) : null}
      {route.name === 'match' ? (
        <MatchPage
          roomId={route.roomId}
          playerName={playerInfo.playerName}
          playerId={playerInfo.playerId}
          onBack={navigateToEntry}
          onMatched={() => {
            setPlayerInfo((prev) => ({
              ...prev,
              opponentId: prev.opponentId || generateUserId(),
            }))
            navigateToBattle()
          }}
        />
      ) : null}
      {route.name === 'battle' ? (
        <BattlePage
          playerId={playerInfo.playerId}
          opponentId={playerInfo.opponentId}
          onBack={navigateToEntry}
        />
      ) : null}
    </div>
  )
}

export default App
