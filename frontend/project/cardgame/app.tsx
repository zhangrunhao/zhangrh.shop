import { useEffect, useMemo, useRef, useState } from 'react'
import { track } from '../../common/track'
import { CardgameIcon } from './components/icons'
import type { CardgameIconName } from './components/icons'
import { SurveyModal } from './components/survey-modal'

type CardType = 'A' | 'D' | 'R'

type PlayerSummary = {
  playerId: string
  name: string
  hp: number
  submitted: boolean
}

type RoomState = {
  roomId: string
  status: 'waiting' | 'playing' | 'finished'
  round: number
  players: PlayerSummary[]
}

type RoundHand = {
  roomId: string
  round: number
  hand: CardType[]
  requiredPickCount: number
  deck: CardType[]
  discard: CardType[]
  opponentDeck: CardType[]
  opponentDiscard: CardType[]
}

type RoundStep = {
  index: number
  p1Card: CardType
  p2Card: CardType
  p1Delta: number
  p2Delta: number
  p1Hp: number
  p2Hp: number
}

type RoundResult = {
  roomId: string
  round: number
  p1Id: string
  p2Id: string
  steps: RoundStep[]
  p1Hp: number
  p2Hp: number
}

type GameOver = {
  roomId: string
  round: number
  result: 'p1_win' | 'p2_win' | 'draw'
  final: {
    p1: { hp: number }
    p2: { hp: number }
  }
}

type PairLog = {
  index: number
  myCard: CardType
  oppCard: CardType
  myDelta: number
  oppDelta: number
}

type RoundLog = {
  round: number
  pairs: PairLog[]
}

type Route = 'entry' | 'rules' | 'battle' | 'result'
type EntryMode = 'create' | 'join' | 'ai'

type CardMeta = {
  label: string
  english: string
  tag: CardType
  tone: 'attack' | 'defense' | 'recover'
  icon: CardgameIconName
}

const CARD_META: Record<CardType, CardMeta> = {
  A: {
    label: '进攻',
    english: 'ATTACK',
    tag: 'A',
    tone: 'attack',
    icon: 'sword',
  },
  D: {
    label: '防守',
    english: 'DEFENSE',
    tag: 'D',
    tone: 'defense',
    icon: 'shield',
  },
  R: {
    label: '休养',
    english: 'RECOVER',
    tag: 'R',
    tone: 'recover',
    icon: 'heart',
  },
}

const ENTRY_MODES: Array<{ mode: EntryMode; title: string; subtitle: string; icon: CardgameIconName }> = [
  { mode: 'create', title: '创建房间', subtitle: '邀请好友对战', icon: 'create' },
  { mode: 'join', title: '加入房间', subtitle: '输入房间号加入', icon: 'join' },
  { mode: 'ai', title: '人机对战', subtitle: '与 AI 练习', icon: 'bot' },
]

const NICKNAME_PREFIX = ['疾风', '烈焰', '寒霜', '星尘', '黑曜', '青岚', '赤羽', '流光']
const NICKNAME_SUFFIX = ['牌手', '谋士', '旅人', '先锋', '骑士', '猎人', '学徒', '守卫']

const randomPick = (items: string[]) => items[Math.floor(Math.random() * items.length)]

const generateRecommendedNickname = () => {
  const serial = Math.floor(Math.random() * 90) + 10
  return `${randomPick(NICKNAME_PREFIX)}${randomPick(NICKNAME_SUFFIX)}${serial}`
}

const trackCardgameClick = (button: string) => {
  track({
    event: 'click',
    project: 'cardgame',
    params: { button },
  })
}

const App = () => {
  const [route, setRoute] = useState<Route>('entry')
  const [entryMode, setEntryMode] = useState<EntryMode>('create')

  const [roomState, setRoomState] = useState<RoomState | null>(null)
  const [roundHand, setRoundHand] = useState<RoundHand | null>(null)
  const [selectedSlots, setSelectedSlots] = useState<Array<number | null>>([null, null, null])
  const [roundResult, setRoundResult] = useState<RoundResult | null>(null)
  const [stepIndex, setStepIndex] = useState(0)
  const [showDelta, setShowDelta] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [roundBaseHp, setRoundBaseHp] = useState({ my: 10, opponent: 10 })
  const [roundLogs, setRoundLogs] = useState<RoundLog[]>([])
  const [gameOver, setGameOver] = useState<GameOver | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [connectionState, setConnectionState] = useState<'idle' | 'connecting' | 'connected'>('idle')
  const [roomId, setRoomId] = useState('')
  const [playerId, setPlayerId] = useState('')
  const [playerName, setPlayerName] = useState(() => generateRecommendedNickname())
  const [joinRoomCode, setJoinRoomCode] = useState('')
  const [surveyOpen, setSurveyOpen] = useState(false)
  const [surveyRenderKey, setSurveyRenderKey] = useState(0)

  const pendingMessageRef = useRef<string | null>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const dragIndexRef = useRef<{ source: 'hand' | 'selected'; index: number } | null>(null)
  const startedRef = useRef(false)
  const sessionActiveRef = useRef(false)

  const me = useMemo(() => roomState?.players.find((player) => player.playerId === playerId) ?? null, [
    roomState,
    playerId,
  ])

  const opponent = useMemo(
    () => roomState?.players.find((player) => player.playerId !== playerId) ?? null,
    [roomState, playerId],
  )

  useEffect(() => {
    if (!modalOpen || !roundResult) {
      return
    }
    if (stepIndex >= roundResult.steps.length) {
      return
    }

    if (!showDelta) {
      const timer = window.setTimeout(() => {
        setShowDelta(true)
      }, 320)
      return () => window.clearTimeout(timer)
    }

    const timer = window.setTimeout(() => {
      setShowDelta(false)
      setStepIndex((prev) => prev + 1)
    }, 760)
    return () => window.clearTimeout(timer)
  }, [modalOpen, roundResult, stepIndex, showDelta])

  useEffect(() => {
    sessionActiveRef.current = Boolean(roomId && playerId)
  }, [roomId, playerId])

  const openSurvey = () => {
    setSurveyRenderKey((prev) => prev + 1)
    setSurveyOpen(true)
  }

  const closeSurvey = () => {
    setSurveyOpen(false)
  }

  const refreshRecommendedNickname = () => {
    setPlayerName(generateRecommendedNickname())
  }

  const buildWsUrls = () => {
    const wsProto = window.location.protocol === 'https:' ? 'wss' : 'ws'
    const wsPath = '/api/cardgame/ws'
    if (import.meta.env.DEV) {
      const proxyUrl = `${wsProto}://${window.location.host}${wsPath}`
      const directUrl = `${wsProto}://${window.location.hostname}:3001${wsPath}`
      return Array.from(new Set([proxyUrl, directUrl]))
    }
    return [`${wsProto}://${window.location.host}${wsPath}`]
  }

  const connectSocket = () => {
    const existing = wsRef.current
    if (existing && existing.readyState !== WebSocket.CLOSED) {
      return existing
    }

    const urls = buildWsUrls()
    let attempt = 0
    let opened = false

    const openWithUrl = (url: string) => {
      setConnectionState('connecting')
      const ws = new WebSocket(url)
      wsRef.current = ws

      ws.addEventListener('open', () => {
        opened = true
        setConnectionState('connected')
        setErrorMessage(null)
        if (pendingMessageRef.current) {
          ws.send(pendingMessageRef.current)
          pendingMessageRef.current = null
        }
      })

      ws.addEventListener('message', (event) => {
        handleSocketMessage(event.data.toString())
      })

      ws.addEventListener('error', () => {
        if (!opened && attempt < urls.length - 1) {
          attempt += 1
          openWithUrl(urls[attempt])
          return
        }
        setErrorMessage('连接失败，请确认后端 3001 已启动。')
      })

      ws.addEventListener('close', () => {
        if (wsRef.current === ws) {
          wsRef.current = null
        }
        startedRef.current = false
        setConnectionState('idle')
      })
    }

    openWithUrl(urls[attempt])
    return wsRef.current!
  }

  const sendMessage = (message: object) => {
    const ws = connectSocket()
    const payload = JSON.stringify(message)
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(payload)
      return
    }
    pendingMessageRef.current = payload
  }

  const resetSession = () => {
    setRoomState(null)
    setRoundHand(null)
    setSelectedSlots([null, null, null])
    setRoundResult(null)
    setGameOver(null)
    setErrorMessage(null)
    setRoomId('')
    setPlayerId('')
    setRoundLogs([])
    setStepIndex(0)
    setShowDelta(false)
    setModalOpen(false)
    sessionActiveRef.current = false
  }

  const appendRoundLog = (payload: RoundResult) => {
    const iAmP1InPayload = payload.p1Id === playerId
    const pairs: PairLog[] = payload.steps.map((step) => ({
      index: step.index,
      myCard: iAmP1InPayload ? step.p1Card : step.p2Card,
      oppCard: iAmP1InPayload ? step.p2Card : step.p1Card,
      myDelta: iAmP1InPayload ? step.p1Delta : step.p2Delta,
      oppDelta: iAmP1InPayload ? step.p2Delta : step.p1Delta,
    }))

    setRoundLogs((prev) => {
      if (prev.some((entry) => entry.round === payload.round)) {
        return prev
      }
      return [...prev, { round: payload.round, pairs }]
    })
  }

  const handleSocketMessage = (raw: string) => {
    let message: { type: string; payload?: unknown }
    try {
      message = JSON.parse(raw)
    } catch {
      return
    }

    if (message.type === 'error') {
      const payload = message.payload as { message?: string }
      setErrorMessage(payload?.message ?? '服务器错误')
      if (!sessionActiveRef.current) {
        startedRef.current = false
      }
      return
    }

    if (message.type === 'room_created' || message.type === 'room_joined') {
      const payload = message.payload as { roomId?: string; playerId?: string }
      if (payload?.roomId && payload?.playerId) {
        setRoomId(payload.roomId)
        setPlayerId(payload.playerId)
        setRoute('battle')
      }
      return
    }

    if (message.type === 'room_state') {
      const payload = message.payload as RoomState
      setRoomState(payload)
      return
    }

    if (message.type === 'round_hand') {
      const payload = message.payload as RoundHand
      setRoundHand(payload)
      setSelectedSlots([null, null, null])
      setRoundResult(null)
      setStepIndex(0)
      setShowDelta(false)
      if (roomState) {
        const meEntry = roomState.players.find((player) => player.playerId === playerId)
        const oppEntry = roomState.players.find((player) => player.playerId !== playerId)
        if (meEntry && oppEntry) {
          setRoundBaseHp({ my: meEntry.hp, opponent: oppEntry.hp })
        }
      }
      return
    }

    if (message.type === 'round_result') {
      const payload = message.payload as RoundResult
      appendRoundLog(payload)
      setRoundResult(payload)
      setModalOpen(true)
      setStepIndex(0)
      setShowDelta(false)
      return
    }

    if (message.type === 'game_over') {
      const payload = message.payload as GameOver
      setGameOver(payload)
      if (!modalOpen) {
        setRoute('result')
      }
      return
    }
  }

  const handleStartBotMatch = () => {
    if (startedRef.current) {
      return
    }
    startedRef.current = true
    resetSession()
    setErrorMessage(null)
    sendMessage({ type: 'start_bot', payload: { playerName: playerName.trim() || '玩家' } })
  }

  const handleCreateRoom = () => {
    if (startedRef.current) {
      return
    }
    const trimmedName = playerName.trim()
    if (!trimmedName) {
      setErrorMessage('请先输入昵称')
      return
    }
    startedRef.current = true
    resetSession()
    setErrorMessage(null)
    sendMessage({ type: 'create_room', payload: { playerName: trimmedName } })
  }

  const handleJoinRoom = () => {
    if (startedRef.current) {
      return
    }
    const trimmedName = playerName.trim()
    if (!trimmedName) {
      setErrorMessage('请先输入昵称')
      return
    }
    const normalizedRoomId = joinRoomCode.trim()
    if (!/^\d{4}$/.test(normalizedRoomId)) {
      setErrorMessage('房间号需要 4 位数字')
      return
    }
    startedRef.current = true
    resetSession()
    setErrorMessage(null)
    sendMessage({
      type: 'join_room',
      payload: {
        roomId: normalizedRoomId,
        playerName: trimmedName,
      },
    })
  }

  const handleEntryAction = () => {
    if (entryMode === 'create') {
      trackCardgameClick('create_room')
      handleCreateRoom()
      return
    }
    if (entryMode === 'join') {
      trackCardgameClick('join_room')
      handleJoinRoom()
      return
    }
    trackCardgameClick('ai_battle')
    handleStartBotMatch()
  }

  const handleSubmit = () => {
    if (!roomState || !roundHand) {
      return
    }
    const required = roundHand.requiredPickCount
    const picks = selectedSlots.filter((value): value is number => value !== null)
    if (picks.length !== required) {
      return
    }
    trackCardgameClick('play_cards')
    sendMessage({
      type: 'play_cards',
      payload: {
        roomId: roomState.roomId,
        playerId,
        round: roomState.round,
        picks,
      },
    })
  }

  const handleRematch = () => {
    trackCardgameClick('play_again')
    if (!roomId || !playerId) {
      return
    }
    setGameOver(null)
    setRoundLogs([])
    setErrorMessage(null)
    sendMessage({
      type: 'rematch',
      payload: {
        roomId,
        playerId,
      },
    })
    setRoute('battle')
  }

  const handleLeaveGame = () => {
    startedRef.current = false
    const ws = wsRef.current
    if (ws && ws.readyState !== WebSocket.CLOSED) {
      ws.close()
    }
    resetSession()
    setRoute('entry')
  }

  const toggleSelect = (index: number) => {
    if (!roundHand || !roomState || roomState.status !== 'playing') {
      return
    }
    if (me?.submitted || modalOpen) {
      return
    }
    const required = roundHand.requiredPickCount
    setSelectedSlots((prev) => {
      if (prev.includes(index)) {
        return prev
      }
      const filled = prev.filter((value) => value !== null).length
      if (filled >= required) {
        return prev
      }
      const next = [...prev]
      const emptyIndex = next.findIndex((value) => value === null)
      if (emptyIndex === -1) {
        return prev
      }
      next[emptyIndex] = index
      return next
    })
  }

  const removeSelected = (orderIndex: number) => {
    if (me?.submitted || modalOpen) {
      return
    }
    setSelectedSlots((prev) => {
      const next = [...prev]
      next[orderIndex] = null
      return next
    })
  }

  const handleDragStart = (source: 'hand' | 'selected', index: number) => {
    dragIndexRef.current = { source, index }
  }

  const handleDrop = (index: number) => {
    const dragInfo = dragIndexRef.current
    if (!dragInfo) {
      return
    }
    setSelectedSlots((prev) => {
      const next = [...prev]
      if (dragInfo.source === 'selected') {
        if (dragInfo.index === index) {
          return prev
        }
        const temp = next[index]
        next[index] = next[dragInfo.index]
        next[dragInfo.index] = temp
        return next
      }
      if (dragInfo.source === 'hand') {
        if (next.includes(dragInfo.index)) {
          return prev
        }
        if (next[index] !== null) {
          return prev
        }
        next[index] = dragInfo.index
        return next
      }
      return prev
    })
    dragIndexRef.current = null
  }

  const renderStatusBadge = (type: 'game' | 'connection') => {
    if (type === 'game') {
      const label =
        roomState?.status === 'playing'
          ? '进行中'
          : roomState?.status === 'finished'
            ? '已结束'
            : '等待中'
      return <span className={`status-badge ${roomState?.status === 'playing' ? 'blue' : 'gray'}`}>{label}</span>
    }

    return (
      <span className={`status-badge ${connectionState === 'connected' ? 'green' : 'gray'}`}>
        {connectionState === 'connected' ? '已连接' : connectionState === 'connecting' ? '连接中' : '未连接'}
      </span>
    )
  }

  const iAmP1 = roundResult ? roundResult.p1Id === playerId : true
  const resolvedIndex = showDelta ? stepIndex : stepIndex - 1
  const resolvedStep =
    modalOpen && roundResult && resolvedIndex >= 0 ? roundResult.steps[Math.min(resolvedIndex, roundResult.steps.length - 1)] : null

  const myFinalHp = resolvedStep
    ? iAmP1
      ? resolvedStep.p1Hp
      : resolvedStep.p2Hp
    : me?.hp ?? roundBaseHp.my

  const opponentFinalHp = resolvedStep
    ? iAmP1
      ? resolvedStep.p2Hp
      : resolvedStep.p1Hp
    : opponent?.hp ?? roundBaseHp.opponent

  const selectedCount = selectedSlots.filter((value) => value !== null).length
  const canSubmit =
    roundHand &&
    roomState?.status === 'playing' &&
    !me?.submitted &&
    !modalOpen &&
    selectedCount === roundHand.requiredPickCount

  const displayRoomId = roomState?.roomId ?? roomId
  const myName = me?.name || playerName || '我方'
  const opponentName = opponent?.name || '对手'

  return (
    <div className="app-root">
      <div className="unsupported-screen">
        <h2>请在 PC 浏览器中打开</h2>
        <p>该 Demo 仅支持桌面端（最小宽度 1200px）。</p>
      </div>

      <div className="app-shell">
        <button className="survey-fab" onClick={openSurvey} type="button">
          问卷
        </button>

        {route === 'entry' && (
          <section className="entry-wrap">
            <header className="entry-header">
              <h1>Card Clash</h1>
              <p className="entry-subtitle">策略卡牌对战游戏</p>
              <div className="entry-tags">
                <span>10回合制</span>
                <span>•</span>
                <span>3张牌对决</span>
                <span>•</span>
                <span>策略致胜</span>
              </div>
            </header>

            <div className="entry-panel">
              <div className="field-head">
                <label className="field-label">游戏昵称</label>
                <button className="field-action" onClick={refreshRecommendedNickname} type="button">
                  换一个
                </button>
              </div>
              <input
                className="text-input"
                value={playerName}
                onChange={(event) => setPlayerName(event.target.value)}
                placeholder="输入你的昵称"
                maxLength={20}
              />

              {entryMode === 'join' && (
                <>
                  <label className="field-label">房间号</label>
                  <input
                    className="text-input"
                    value={joinRoomCode}
                    onChange={(event) => {
                      const digitsOnly = event.target.value.replace(/\D/g, '').slice(0, 4)
                      setJoinRoomCode(digitsOnly)
                    }}
                    inputMode="numeric"
                    placeholder="输入4位房间号"
                  />
                </>
              )}

              <div className="mode-grid">
                {ENTRY_MODES.map((mode) => (
                  <button
                    key={mode.mode}
                    className={`mode-card ${entryMode === mode.mode ? 'active' : ''}`}
                    onClick={() => setEntryMode(mode.mode)}
                    type="button"
                  >
                    <CardgameIcon name={mode.icon} className="mode-icon" />
                    <div className="mode-title">{mode.title}</div>
                    <div className="mode-subtitle">{mode.subtitle}</div>
                  </button>
                ))}
              </div>

              <button
                className="primary-button large"
                onClick={handleEntryAction}
                disabled={
                  !playerName.trim() ||
                  (entryMode === 'join' && !/^\d{4}$/.test(joinRoomCode.trim()))
                }
              >
                {entryMode === 'create' ? '创建房间' : entryMode === 'join' ? '加入房间' : '开始游戏'}
              </button>

              {errorMessage && <p className="error-text">{errorMessage}</p>}
            </div>

            <button className="rules-link" onClick={() => setRoute('rules')} type="button">
              <CardgameIcon name="help" />
              <span>查看游戏规则</span>
            </button>
          </section>
        )}

        {route === 'rules' && (
          <section className="rules-page">
            <header className="rules-header">
              <button className="back-link" onClick={() => setRoute('entry')} type="button">
                <CardgameIcon name="back" />
                <span>返回</span>
              </button>
              <h2>游戏规则</h2>
              <div className="spacer" />
            </header>

            <div className="rules-panel">
              <h3>基本规则</h3>
              <div className="rule-list">
                <div className="rule-item">
                  <span className="rule-index">1</span>
                  <div>
                    <h4>回合制对战</h4>
                    <p>
                      游戏共 10 回合，双方初始 HP 为 10 点。每回合双方同时行动，先将对手 HP 降至 0
                      或以下的玩家获胜。
                    </p>
                  </div>
                </div>
                <div className="rule-item">
                  <span className="rule-index">2</span>
                  <div>
                    <h4>抽牌与出牌</h4>
                    <p>每回合开始时抽取 5 张牌，从中选择 3 张并按顺序排列。双方同时提交后，按顺序逐对揭示并结算。</p>
                  </div>
                </div>
                <div className="rule-item">
                  <span className="rule-index">3</span>
                  <div>
                    <h4>逐对结算</h4>
                    <p>第一张对第一张，第二张对第二张，第三张对第三张。每对牌根据类型克制关系决定结果。</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="rules-panel">
              <h3>卡牌类型</h3>
              <div className="rules-card-grid">
                {(['A', 'D', 'R'] as CardType[]).map((card) => {
                  const meta = CARD_META[card]
                  return (
                    <div key={card} className="rules-card-column">
                      <div className={`game-card tone-${meta.tone}`}>
                        <div className="card-badge">{meta.tag}</div>
                        <CardgameIcon name={meta.icon} className="card-icon" />
                        <div className="card-title">{meta.label}</div>
                        <div className="card-subtitle">{meta.english}</div>
                      </div>
                      <div className={`rules-card-title tone-${meta.tone}`}>
                        <CardgameIcon name={meta.icon} />
                        <span>
                          {meta.label} ({card === 'A' ? 'Attack' : card === 'D' ? 'Defense' : 'Recover'})
                        </span>
                      </div>
                      <p className="rules-card-desc">
                        {card === 'A' && '对休养造成 2 点伤害，被防守完全抵挡，与进攻互相抵消。'}
                        {card === 'D' && '完全抵挡进攻，与休养互相抵消，与防守互相抵消。'}
                        {card === 'R' && '被进攻打断损失 2 HP，与防守互相抵消，双方休养各回复 1 HP。'}
                      </p>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="rules-panel">
              <h3>对冲矩阵</h3>
              <table className="matrix-table">
                <thead>
                  <tr>
                    <th>我方 ↓ vs 对手 →</th>
                    <th className="head-a">进攻 (A)</th>
                    <th className="head-d">防守 (D)</th>
                    <th className="head-r">休养 (R)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <th className="row-a">进攻 (A)</th>
                    <td>
                      <strong>平局</strong>
                      <span>双方 0 HP</span>
                    </td>
                    <td>
                      <strong className="text-danger">防守完胜</strong>
                      <span>双方 0 HP</span>
                    </td>
                    <td>
                      <strong className="text-success">进攻得手</strong>
                      <span>对手 -2 HP</span>
                    </td>
                  </tr>
                  <tr>
                    <th className="row-d">防守 (D)</th>
                    <td>
                      <strong className="text-success">防守完胜</strong>
                      <span>双方 0 HP</span>
                    </td>
                    <td>
                      <strong>平局</strong>
                      <span>双方 0 HP</span>
                    </td>
                    <td>
                      <strong>平局</strong>
                      <span>双方 0 HP</span>
                    </td>
                  </tr>
                  <tr>
                    <th className="row-r">休养 (R)</th>
                    <td>
                      <strong className="text-danger">被打断</strong>
                      <span>我方 -2 HP</span>
                    </td>
                    <td>
                      <strong>平局</strong>
                      <span>双方 0 HP</span>
                    </td>
                    <td>
                      <strong className="text-success">双方回血</strong>
                      <span>双方 +1 HP</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="rules-panel">
              <h3>策略提示</h3>
              <ul className="tips-list">
                <li>
                  <span>💡</span>
                  <p>
                    <strong>预判对手：</strong>根据对手的 HP 和历史出牌习惯，预测他们可能的选择。
                  </p>
                </li>
                <li>
                  <span>💡</span>
                  <p>
                    <strong>顺序很重要：</strong>合理安排三张牌的顺序，可以在关键位置取得优势。
                  </p>
                </li>
                <li>
                  <span>💡</span>
                  <p>
                    <strong>把握时机：</strong>在优势时可以选择休养回血，在劣势时需要冒险进攻。
                  </p>
                </li>
                <li>
                  <span>💡</span>
                  <p>
                    <strong>心理博弈：</strong>有时候“不合理”的出牌反而能出奇制胜。
                  </p>
                </li>
              </ul>
            </div>

            <div className="rules-footer">
              <button className="primary-button large" onClick={() => setRoute('entry')} type="button">
                开始游戏
              </button>
            </div>
          </section>
        )}

        {route === 'battle' && (
          <section className="battle-page">
            <div className="hud-card">
              <div className="hud-left">
                <div className="hud-block">
                  <div className="hud-label">回合</div>
                  <div className="hud-value">{roomState?.round ?? 1} / 10</div>
                </div>
                <div className="hud-divider" />
                <div className="hud-block">
                  <div className="hud-label">房间号</div>
                  <div className="hud-room">{displayRoomId || '----'}</div>
                </div>
              </div>

              <div className="hud-right">
                {renderStatusBadge('game')}
                {renderStatusBadge('connection')}
                <button className="ghost-button" onClick={handleLeaveGame} type="button">
                  离开游戏
                </button>
              </div>
            </div>

            <div className="hp-stack">
              <div className="hp-row">
                <div className="hp-meta left">
                  <span className="hp-name">{myName}</span>
                  <span className="hp-num">
                    <span className="hp-main">{myFinalHp}</span>
                    <span className="hp-total">/ 10</span>
                  </span>
                </div>
                <div className="hp-track">
                  <div className="hp-fill" style={{ width: `${Math.max(0, Math.min(100, (myFinalHp / 10) * 100))}%` }} />
                  <div className="hp-center">
                    <CardgameIcon name="hp" />
                    <span>HP</span>
                  </div>
                </div>
              </div>

              <div className="hp-row">
                <div className="hp-track">
                  <div
                    className="hp-fill"
                    style={{ width: `${Math.max(0, Math.min(100, (opponentFinalHp / 10) * 100))}%` }}
                  />
                  <div className="hp-center">
                    <CardgameIcon name="hp" />
                    <span>HP</span>
                  </div>
                </div>
                <div className="hp-meta right">
                  <span className="hp-name">{opponentName}</span>
                  <span className="hp-num">
                    <span className="hp-main">{opponentFinalHp}</span>
                    <span className="hp-total">/ 10</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="battle-grid">
              <div className="battle-main">
                <div className="battle-panel">
                  <h3>选择出牌</h3>

                  <div className="slots-area">
                    <div className="slot-row">
                      {[0, 1, 2].map((slot) => {
                        const handIndex = selectedSlots[slot]
                        const card = handIndex !== null && roundHand ? roundHand.hand[handIndex] : null

                        if (!card) {
                          return (
                            <div
                              key={`slot-${slot}`}
                              className="card-slot"
                              onDragOver={(event) => event.preventDefault()}
                              onDrop={() => handleDrop(slot)}
                            >
                              <div className="slot-order">第 {slot + 1} 张</div>
                              <div className="slot-plus">+</div>
                              <div className="slot-hint">拖拽卡牌至此</div>
                            </div>
                          )
                        }

                        const meta = CARD_META[card]
                        return (
                          <div key={`slot-${slot}`} className="card-slot filled">
                            <div className="slot-order">第 {slot + 1} 张</div>
                            <div
                              className={`game-card tone-${meta.tone}`}
                              draggable={!me?.submitted && roomState?.status === 'playing'}
                              onDragStart={() => handleDragStart('selected', slot)}
                              onDragOver={(event) => event.preventDefault()}
                              onDrop={() => handleDrop(slot)}
                            >
                              <div className="card-badge">{meta.tag}</div>
                              <CardgameIcon name={meta.icon} className="card-icon" />
                              <div className="card-title">{meta.label}</div>
                              <div className="card-subtitle">{meta.english}</div>
                            </div>
                            <button
                              className="slot-remove"
                              type="button"
                              onClick={() => removeSelected(slot)}
                              aria-label="移除"
                            >
                              ×
                            </button>
                          </div>
                        )
                      })}
                    </div>

                    <div className="submit-area">
                      <button className="primary-button" disabled={!canSubmit} onClick={handleSubmit} type="button">
                        {canSubmit ? '确认出牌' : `请选择${roundHand?.requiredPickCount ?? 3}张牌`}
                      </button>
                    </div>
                  </div>

                  <div className="hand-section">
                    <div className="hand-label">手牌 ({roundHand?.hand.length ?? 0} 张)</div>
                    <div className="hand-row">
                      {roundHand?.hand.map((card, index) => {
                        const meta = CARD_META[card]
                        const selected = selectedSlots.includes(index)
                        return (
                          <button
                            key={`${card}-${index}`}
                            className={`hand-card ${selected ? 'used' : ''}`}
                            onClick={() => toggleSelect(index)}
                            type="button"
                            disabled={selected || Boolean(me?.submitted) || roomState?.status !== 'playing' || modalOpen}
                            draggable={!selected && !me?.submitted && roomState?.status === 'playing'}
                            onDragStart={() => handleDragStart('hand', index)}
                          >
                            <div className={`game-card tone-${meta.tone}`}>
                              <div className="card-badge">{meta.tag}</div>
                              <CardgameIcon name={meta.icon} className="card-icon" />
                              <div className="card-title">{meta.label}</div>
                              <div className="card-subtitle">{meta.english}</div>
                            </div>
                          </button>
                        )
                      })}
                    </div>
                  </div>

                  {roomState?.status === 'waiting' && <p className="helper-text">等待另一位玩家加入房间…</p>}
                  {me?.submitted && <p className="helper-text">已提交，等待对手出牌…</p>}
                  {errorMessage && <p className="error-text">{errorMessage}</p>}
                </div>

                <div className="info-grid">
                  <div className="info-panel">
                    <h4>我方信息</h4>
                    <div className="info-row">
                      <div className="info-card">
                        <CardgameIcon name="deck" />
                        <div>
                          <span>牌库</span>
                          <strong>{roundHand?.deck.length ?? 0}</strong>
                        </div>
                      </div>
                      <div className="info-card">
                        <CardgameIcon name="discard" />
                        <div>
                          <span>弃牌堆</span>
                          <strong>{roundHand?.discard.length ?? 0}</strong>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="info-panel">
                    <h4>对手信息</h4>
                    <div className="info-row">
                      <div className="info-card">
                        <CardgameIcon name="deck" />
                        <div>
                          <span>牌库</span>
                          <strong>{roundHand?.opponentDeck.length ?? 0}</strong>
                        </div>
                      </div>
                      <div className="info-card">
                        <CardgameIcon name="discard" />
                        <div>
                          <span>弃牌堆</span>
                          <strong>{roundHand?.opponentDiscard.length ?? 0}</strong>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="effect-panel">
                  <CardgameIcon name="alert" />
                  <div>
                    <strong>状态效果区（预留）</strong>
                    <p>未来版本将显示能量、护盾、持续效果等</p>
                  </div>
                </div>
              </div>

              <aside className="log-panel">
                <div className="log-header">
                  <h4>对战日志</h4>
                  <p>点击展开查看详情</p>
                </div>

                {roundLogs.length === 0 ? (
                  <div className="log-empty">
                    <div>📜</div>
                    <p>暂无对战记录</p>
                  </div>
                ) : (
                  <div className="log-list">
                    {[...roundLogs]
                      .sort((a, b) => b.round - a.round)
                      .map((roundEntry) => {
                        const totalMy = roundEntry.pairs.reduce((sum, item) => sum + item.myDelta, 0)
                        const totalOpp = roundEntry.pairs.reduce((sum, item) => sum + item.oppDelta, 0)
                        return (
                          <details key={roundEntry.round} className="log-round" open={roundEntry.round === (roomState?.round ?? 1) - 1}>
                            <summary>
                              <span className="round-chip">{roundEntry.round}</span>
                              <span>
                                <strong>第 {roundEntry.round} 回合</strong>
                                <small>
                                  我方 {totalMy >= 0 ? '+' : ''}
                                  {totalMy} HP, 对手 {totalOpp >= 0 ? '+' : ''}
                                  {totalOpp} HP
                                </small>
                              </span>
                            </summary>
                            <div className="log-lines">
                              {roundEntry.pairs.map((pair) => (
                                <div key={`${roundEntry.round}-${pair.index}`} className="log-line">
                                  <span>第 {pair.index} 张</span>
                                  <span>
                                    {pair.myCard} vs {pair.oppCard}
                                  </span>
                                  <span>
                                    我方 {pair.myDelta >= 0 ? '+' : ''}
                                    {pair.myDelta}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </details>
                        )
                      })}
                  </div>
                )}
              </aside>
            </div>
          </section>
        )}

        {modalOpen && roundResult && (
          <div className="result-modal-backdrop">
            <div className="result-modal">
              <h3>{stepIndex === 0 ? '回合结算' : `第 ${Math.min(stepIndex + 1, roundResult.steps.length)} 对`}</h3>
              <p>
                {stepIndex < roundResult.steps.length
                  ? showDelta
                    ? '卡牌对决中...'
                    : '准备揭示卡牌...'
                  : '本回合结算完成'}
              </p>

              <div className="modal-progress">
                {roundResult.steps.map((step, index) => {
                  const active = index < stepIndex || (index === stepIndex && showDelta)
                  return <span key={step.index} className={active ? 'active' : ''} />
                })}
              </div>

              {stepIndex < roundResult.steps.length && (
                <div className="modal-content">
                  <div className="modal-cards">
                    <div>
                      <span>你</span>
                      <div className={`game-card tone-${CARD_META[iAmP1 ? roundResult.steps[stepIndex].p1Card : roundResult.steps[stepIndex].p2Card].tone}`}>
                        <div className="card-badge">{iAmP1 ? roundResult.steps[stepIndex].p1Card : roundResult.steps[stepIndex].p2Card}</div>
                        <CardgameIcon
                          name={CARD_META[iAmP1 ? roundResult.steps[stepIndex].p1Card : roundResult.steps[stepIndex].p2Card].icon}
                          className="card-icon"
                        />
                        <div className="card-title">{CARD_META[iAmP1 ? roundResult.steps[stepIndex].p1Card : roundResult.steps[stepIndex].p2Card].label}</div>
                        <div className="card-subtitle">{CARD_META[iAmP1 ? roundResult.steps[stepIndex].p1Card : roundResult.steps[stepIndex].p2Card].english}</div>
                      </div>
                    </div>

                    <div className="modal-vs">VS</div>

                    <div>
                      <span>对手</span>
                      <div className={`game-card tone-${CARD_META[iAmP1 ? roundResult.steps[stepIndex].p2Card : roundResult.steps[stepIndex].p1Card].tone}`}>
                        <div className="card-badge">{iAmP1 ? roundResult.steps[stepIndex].p2Card : roundResult.steps[stepIndex].p1Card}</div>
                        <CardgameIcon
                          name={CARD_META[iAmP1 ? roundResult.steps[stepIndex].p2Card : roundResult.steps[stepIndex].p1Card].icon}
                          className="card-icon"
                        />
                        <div className="card-title">{CARD_META[iAmP1 ? roundResult.steps[stepIndex].p2Card : roundResult.steps[stepIndex].p1Card].label}</div>
                        <div className="card-subtitle">{CARD_META[iAmP1 ? roundResult.steps[stepIndex].p2Card : roundResult.steps[stepIndex].p1Card].english}</div>
                      </div>
                    </div>
                  </div>

                  <div className="modal-delta">
                    <div>
                      <span>你的 HP 变化</span>
                      <strong className={(iAmP1 ? roundResult.steps[stepIndex].p1Delta : roundResult.steps[stepIndex].p2Delta) > 0 ? 'up' : (iAmP1 ? roundResult.steps[stepIndex].p1Delta : roundResult.steps[stepIndex].p2Delta) < 0 ? 'down' : ''}>
                        {(iAmP1 ? roundResult.steps[stepIndex].p1Delta : roundResult.steps[stepIndex].p2Delta) >= 0 ? '+' : ''}
                        {iAmP1 ? roundResult.steps[stepIndex].p1Delta : roundResult.steps[stepIndex].p2Delta}
                      </strong>
                    </div>
                    <div>
                      <span>对手 HP 变化</span>
                      <strong className={(iAmP1 ? roundResult.steps[stepIndex].p2Delta : roundResult.steps[stepIndex].p1Delta) > 0 ? 'up' : (iAmP1 ? roundResult.steps[stepIndex].p2Delta : roundResult.steps[stepIndex].p1Delta) < 0 ? 'down' : ''}>
                        {(iAmP1 ? roundResult.steps[stepIndex].p2Delta : roundResult.steps[stepIndex].p1Delta) >= 0 ? '+' : ''}
                        {iAmP1 ? roundResult.steps[stepIndex].p2Delta : roundResult.steps[stepIndex].p1Delta}
                      </strong>
                    </div>
                  </div>
                </div>
              )}

              {stepIndex < roundResult.steps.length ? (
                <button
                  className="skip-button"
                  onClick={() => {
                    setStepIndex(roundResult.steps.length)
                    setShowDelta(false)
                  }}
                  type="button"
                >
                  跳过动画
                </button>
              ) : (
                <div className="modal-actions">
                  <button
                    className="primary-button"
                    onClick={() => {
                      trackCardgameClick('round_confirm')
                      if (roomState && playerId && !gameOver) {
                        sendMessage({
                          type: 'round_confirm',
                          payload: {
                            roomId: roomState.roomId,
                            playerId,
                            round: roomState.round,
                          },
                        })
                      }
                      setModalOpen(false)
                      setShowDelta(false)
                      setStepIndex(0)
                      setRoundResult(null)
                      setRoundHand(null)
                      if (gameOver) {
                        setRoute('result')
                      }
                    }}
                    type="button"
                  >
                    继续游戏
                  </button>
                  <button className="survey-inline-button" onClick={openSurvey} type="button">
                    问卷
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {route === 'result' && (
          <section className="result-page">
            <div className="result-card">
              <h2>对局结束</h2>
              <p className="result-title">
                {gameOver?.result === 'draw'
                  ? '平局'
                  : gameOver?.result === (iAmP1 ? 'p1_win' : 'p2_win')
                    ? '胜利'
                    : '失败'}
              </p>
              <div className="result-grid">
                <div>
                  <span>我方最终血量</span>
                  <strong>{myFinalHp}</strong>
                </div>
                <div>
                  <span>对手最终血量</span>
                  <strong>{opponentFinalHp}</strong>
                </div>
              </div>
              <p className="result-round">回合数：{gameOver?.round ?? roomState?.round ?? 0}</p>
              <div className="result-actions">
                <button className="primary-button" onClick={handleRematch} type="button">
                  再来一局
                </button>
                <button className="survey-inline-button" onClick={openSurvey} type="button">
                  问卷
                </button>
                <button className="ghost-button" onClick={handleLeaveGame} type="button">
                  返回首页
                </button>
              </div>
            </div>
          </section>
        )}

        <SurveyModal key={surveyRenderKey} isOpen={surveyOpen} onClose={closeSurvey} />
      </div>
    </div>
  )
}

export default App
