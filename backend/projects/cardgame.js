import express from 'express'
import { WebSocketServer } from 'ws'

export const CARD_GAME_PREFIX = '/api/cardgame'

const MAX_ROUNDS = 10
const HAND_SIZE = 5
const PICK_SIZE = 3
const BOT_RESPONSE_DELAY_MS = 1200

const ACTIONS = ['A', 'D', 'R']

const DELTA_MATRIX = {
  A: { A: [-2, -2], D: [-1, 0], R: [1, -2] },
  D: { A: [0, -1], D: [-1, -1], R: [0, 1] },
  R: { A: [-2, 1], D: [1, 0], R: [0, 0] },
}

const shuffle = (list) => {
  const items = [...list]
  for (let i = items.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[items[i], items[j]] = [items[j], items[i]]
  }
  return items
}

const buildDeck = () => shuffle([...Array(5).fill('A'), ...Array(5).fill('D'), ...Array(5).fill('R')])

const generateRoomId = (rooms) => {
  let roomId = ''
  do {
    roomId = String(Math.floor(1000 + Math.random() * 9000))
  } while (rooms.has(roomId))
  return roomId
}

const generatePlayerId = () => `user_${Math.random().toString(36).slice(2, 8)}`

const createBotPlayer = () => ({
  playerId: generatePlayerId(),
  name: '机器人',
  hp: 10,
  deck: buildDeck(),
  discard: [],
  hand: [],
  ws: null,
  isBot: true,
})

const send = (ws, message) => {
  if (!ws || ws.readyState !== 1) {
    return
  }
  ws.send(JSON.stringify(message))
}

const sendError = (ws, message) => {
  send(ws, { type: 'error', payload: { message } })
}

const resolveDelta = (card1, card2) => {
  return DELTA_MATRIX[card1]?.[card2] ?? [0, 0]
}

const drawHand = (player, count) => {
  const hand = []
  while (hand.length < count) {
    if (player.deck.length === 0) {
      if (player.discard.length === 0) {
        break
      }
      player.deck = shuffle(player.discard)
      player.discard = []
    }
    const next = player.deck.shift()
    if (next) {
      hand.push(next)
    }
  }
  return hand
}

const buildRoomState = (room) => ({
  roomId: room.roomId,
  status: room.status,
  round: room.round,
  players: room.players.map((player) => ({
    playerId: player.playerId,
    name: player.name,
    hp: player.hp,
    submitted: Boolean(room.actions[player.playerId]),
  })),
})

const buildRoomSummary = (room) => ({
  roomId: room.roomId,
  status: room.status,
  round: room.round,
  playersCount: room.players.length,
  hasBot: room.players.some((player) => player.isBot),
  players: room.players.map((player) => ({
    name: player.name,
    isBot: Boolean(player.isBot),
  })),
})

export const registerCardGame = ({ app, server }) => {
  const router = express.Router()

  router.get('/health', (_req, res) => {
    res.json({ ok: true, project: 'cardgame' })
  })

  app.use(CARD_GAME_PREFIX, router)

  const wss = new WebSocketServer({ noServer: true })
  const wsPath = `${CARD_GAME_PREFIX}/ws`

  const handleUpgrade = (req, socket, head) => {
    if (!req.url) {
      return
    }
    const { pathname } = new URL(req.url, 'http://localhost')
    if (pathname !== wsPath) {
      return
    }
    if (!req.headers.upgrade) {
      req.headers.upgrade = 'websocket'
    }
    if (!req.headers['sec-websocket-version']) {
      req.headers['sec-websocket-version'] = '13'
    }
    wss.handleUpgrade(req, socket, head, (client) => {
      wss.emit('connection', client, req)
    })
  }

  server.on('upgrade', handleUpgrade)

  const rooms = new Map()

  router.get('/rooms', (_req, res) => {
    const roomsList = Array.from(rooms.values()).map((room) => buildRoomSummary(room))
    res.json({ rooms: roomsList })
  })

  const broadcastRoomState = (room) => {
    const payload = buildRoomState(room)
    room.players.forEach((player) => {
      send(player.ws, { type: 'room_state', payload })
    })
  }

  const broadcastToRoom = (room, message) => {
    room.players.forEach((player) => {
      send(player.ws, message)
    })
  }

  const getBotPlayer = (room) => room.players.find((player) => player.isBot)
  const roomHasBot = (room) => Boolean(getBotPlayer(room))

  const clearBotTimer = (room) => {
    if (room.botTimeout) {
      clearTimeout(room.botTimeout)
      room.botTimeout = null
    }
  }

  const startRound = (room) => {
    room.players.forEach((player) => {
      player.hand = drawHand(player, HAND_SIZE)
      const opponent = room.players.find((entry) => entry.playerId !== player.playerId)
      if (!player.isBot) {
        send(player.ws, {
          type: 'round_hand',
          payload: {
            roomId: room.roomId,
            round: room.round,
            hand: player.hand,
            requiredPickCount: Math.min(PICK_SIZE, player.hand.length),
            deck: [...player.deck],
            discard: [...player.discard],
            opponentDeck: opponent ? [...opponent.deck] : [],
            opponentDiscard: opponent ? [...opponent.discard] : [],
          },
        })
      }
    })
  }

  const pickBotCards = (hand) => {
    const shuffled = shuffle(hand)
    return shuffled.slice(0, Math.min(PICK_SIZE, shuffled.length))
  }

  const scheduleBotAction = (room) => {
    if (!roomHasBot(room) || room.botTimeout) {
      return
    }

    room.botTimeout = setTimeout(() => {
      room.botTimeout = null
      const botPlayer = getBotPlayer(room)
      if (!botPlayer || room.status !== 'playing') {
        return
      }
      if (room.actions[botPlayer.playerId]) {
        return
      }

      room.actions[botPlayer.playerId] = pickBotCards(botPlayer.hand)
      broadcastRoomState(room)
      maybeResolveRound(room)
    }, BOT_RESPONSE_DELAY_MS)
  }

  const finalizeRound = (room, steps, p1, p2) => {
    broadcastToRoom(room, {
      type: 'round_result',
      payload: {
        roomId: room.roomId,
        round: room.round,
        p1Id: p1.playerId,
        p2Id: p2.playerId,
        steps,
        p1Hp: p1.hp,
        p2Hp: p2.hp,
      },
    })

    p1.discard.push(...p1.hand)
    p2.discard.push(...p2.hand)
    p1.hand = []
    p2.hand = []

    const shouldFinish = p1.hp <= 0 || p2.hp <= 0 || room.round >= MAX_ROUNDS
    room.actions = {}

    if (shouldFinish) {
      room.status = 'finished'
      broadcastRoomState(room)

      let result = 'draw'
      if (p1.hp !== p2.hp) {
        result = p1.hp > p2.hp ? 'p1_win' : 'p2_win'
      }

      broadcastToRoom(room, {
        type: 'game_over',
        payload: {
          roomId: room.roomId,
          round: room.round,
          result,
          final: {
            p1: { hp: p1.hp },
            p2: { hp: p2.hp },
          },
        },
      })
      return
    }

    room.awaitingConfirm = true
    room.confirmed = new Set()
    broadcastRoomState(room)
  }

  const maybeResolveRound = (room) => {
    if (room.players.length < 2) {
      return
    }

    const actions = room.players.map((entry) => room.actions[entry.playerId])
    if (actions.some((value) => !value)) {
      return
    }

    clearBotTimer(room)

    const [p1, p2] = room.players
    const [seq1, seq2] = actions

    broadcastToRoom(room, {
      type: 'round_reveal',
      payload: {
        roomId: room.roomId,
        round: room.round,
        p1Id: p1.playerId,
        p2Id: p2.playerId,
        p1: seq1,
        p2: seq2,
      },
    })

    const steps = []
    let p1Hp = p1.hp
    let p2Hp = p2.hp
    const totalSteps = Math.max(seq1.length, seq2.length)

    for (let i = 0; i < totalSteps; i += 1) {
      const card1 = seq1[i]
      const card2 = seq2[i]
      const [delta1, delta2] = resolveDelta(card1, card2)
      p1Hp += delta1
      p2Hp += delta2
      if (p1Hp < 0) {
        p1Hp = 0
      }
      if (p2Hp < 0) {
        p2Hp = 0
      }
      steps.push({
        index: i + 1,
        p1Card: card1,
        p2Card: card2,
        p1Delta: delta1,
        p2Delta: delta2,
        p1Hp,
        p2Hp,
      })
    }

    p1.hp = p1Hp
    p2.hp = p2Hp

    finalizeRound(room, steps, p1, p2)
  }

  const validatePicks = ({ hand, picks }) => {
    const requiredPickCount = Math.min(PICK_SIZE, hand.length)
    if (!Array.isArray(picks) || picks.length !== requiredPickCount) {
      return { ok: false, message: `Must submit ${requiredPickCount} cards.` }
    }

    if (picks.every((item) => typeof item === 'number')) {
      const indices = picks.map((value) => Number(value))
      const unique = new Set(indices)
      if (unique.size !== indices.length) {
        return { ok: false, message: 'Duplicate card selections are not allowed.' }
      }
      if (indices.some((value) => !Number.isInteger(value) || value < 0 || value >= hand.length)) {
        return { ok: false, message: 'Card index out of range.' }
      }
      return { ok: true, sequence: indices.map((idx) => hand[idx]) }
    }

    if (picks.every((item) => typeof item === 'string')) {
      const values = picks.map((value) => value.toUpperCase())
      if (values.some((value) => !ACTIONS.includes(value))) {
        return { ok: false, message: 'Invalid card type.' }
      }
      const handCounts = ACTIONS.reduce((acc, key) => {
        acc[key] = 0
        return acc
      }, {})
      hand.forEach((card) => {
        handCounts[card] += 1
      })
      const pickCounts = ACTIONS.reduce((acc, key) => {
        acc[key] = 0
        return acc
      }, {})
      values.forEach((card) => {
        pickCounts[card] += 1
      })
      if (ACTIONS.some((card) => pickCounts[card] > handCounts[card])) {
        return { ok: false, message: 'Selected cards exceed hand count.' }
      }
      return { ok: true, sequence: values }
    }

    return { ok: false, message: 'Invalid picks format.' }
  }

  wss.on('connection', (ws) => {
    send(ws, { type: 'connected', payload: { message: 'ws ready' } })

    ws.on('message', (data) => {
      let message
      try {
        message = JSON.parse(data.toString())
      } catch (error) {
        sendError(ws, 'Invalid JSON payload.')
        return
      }

      const { type, payload } = message || {}
      if (!type) {
        sendError(ws, 'Missing message type.')
        return
      }

      if (type === 'start_bot') {
        if (ws.roomId && rooms.has(ws.roomId)) {
          sendError(ws, 'Room already exists for this connection.')
          return
        }

        const playerName = payload?.playerName?.trim() || '玩家'
        const roomId = generateRoomId(rooms)
        const playerId = payload?.playerId?.trim() || generatePlayerId()
        const botPlayer = createBotPlayer()

        const room = {
          roomId,
          round: 1,
          status: 'playing',
          players: [
            {
              playerId,
              name: playerName,
              hp: 10,
              deck: buildDeck(),
              discard: [],
              hand: [],
              ws,
              isBot: false,
            },
            botPlayer,
          ],
          actions: {},
          rematchReady: new Set(),
          awaitingConfirm: false,
          confirmed: new Set(),
          botTimeout: null,
        }

        rooms.set(roomId, room)
        ws.roomId = roomId
        ws.playerId = playerId

        send(ws, { type: 'room_created', payload: { roomId, playerId } })
        broadcastRoomState(room)
        startRound(room)
        scheduleBotAction(room)
        return
      }

      if (type === 'create_room') {
        const playerName = payload?.playerName?.trim()
        if (!playerName) {
          sendError(ws, 'Player name is required.')
          return
        }

        const requestedRoomId = payload?.roomId
        const roomId =
          typeof requestedRoomId === 'string' && /^\d{4}$/.test(requestedRoomId) && !rooms.has(requestedRoomId)
            ? requestedRoomId
            : generateRoomId(rooms)
        const playerId = payload?.playerId?.trim() || generatePlayerId()

        const room = {
          roomId,
          round: 1,
          status: 'waiting',
          players: [
            {
              playerId,
              name: playerName,
              hp: 10,
              deck: buildDeck(),
              discard: [],
              hand: [],
              ws,
              isBot: false,
            },
          ],
          actions: {},
          rematchReady: new Set(),
          awaitingConfirm: false,
          confirmed: new Set(),
          botTimeout: null,
        }

        rooms.set(roomId, room)
        ws.roomId = roomId
        ws.playerId = playerId

        send(ws, { type: 'room_created', payload: { roomId, playerId } })
        broadcastRoomState(room)
        return
      }

      if (type === 'create_room_bot') {
        const playerName = payload?.playerName?.trim()
        if (!playerName) {
          sendError(ws, 'Player name is required.')
          return
        }

        const roomId = generateRoomId(rooms)
        const playerId = payload?.playerId?.trim() || generatePlayerId()
        const botPlayer = createBotPlayer()

        const room = {
          roomId,
          round: 1,
          status: 'playing',
          players: [
            {
              playerId,
              name: playerName,
              hp: 10,
              deck: buildDeck(),
              discard: [],
              hand: [],
              ws,
              isBot: false,
            },
            botPlayer,
          ],
          actions: {},
          rematchReady: new Set(),
          awaitingConfirm: false,
          confirmed: new Set(),
          botTimeout: null,
        }

        rooms.set(roomId, room)
        ws.roomId = roomId
        ws.playerId = playerId

        send(ws, { type: 'room_created', payload: { roomId, playerId } })
        broadcastRoomState(room)
        startRound(room)
        scheduleBotAction(room)
        return
      }

      if (type === 'join_room') {
        const roomId = payload?.roomId
        const playerName = payload?.playerName?.trim()
        if (!roomId || typeof roomId !== 'string') {
          sendError(ws, 'Room ID is required.')
          return
        }
        if (!playerName) {
          sendError(ws, 'Player name is required.')
          return
        }

        const room = rooms.get(roomId)
        if (!room) {
          sendError(ws, 'Room not found.')
          return
        }
        if (room.status === 'finished') {
          sendError(ws, 'Room already finished.')
          return
        }
        if (room.players.length >= 2) {
          sendError(ws, 'Room is full.')
          return
        }

        const playerId = payload?.playerId?.trim() || generatePlayerId()
        room.players.push({
          playerId,
          name: playerName,
          hp: 10,
          deck: buildDeck(),
          discard: [],
          hand: [],
          ws,
          isBot: false,
        })
        room.status = room.players.length === 2 ? 'playing' : 'waiting'

        ws.roomId = roomId
        ws.playerId = playerId

        send(ws, { type: 'room_joined', payload: { roomId, playerId } })
        broadcastRoomState(room)

        if (room.status === 'playing') {
          startRound(room)
        }
        return
      }

      if (type === 'play_cards') {
        const roomId = payload?.roomId
        const playerId = payload?.playerId
        const picks = payload?.picks
        const round = payload?.round

        if (!roomId || !playerId) {
          sendError(ws, 'Room ID and player ID are required.')
          return
        }

        const room = rooms.get(roomId)
        if (!room) {
          sendError(ws, 'Room not found.')
          return
        }
        if (room.status === 'finished') {
          return
        }
        if (round && round !== room.round) {
          sendError(ws, 'Round mismatch.')
          return
        }

        const player = room.players.find((entry) => entry.playerId === playerId)
        if (!player) {
          sendError(ws, 'Player not in room.')
          return
        }
        if (player.isBot) {
          sendError(ws, 'Bot action is not allowed.')
          return
        }
        if (room.actions[playerId]) {
          sendError(ws, 'Cards already submitted.')
          return
        }

        const validation = validatePicks({ hand: player.hand, picks })
        if (!validation.ok) {
          sendError(ws, validation.message)
          return
        }

        room.actions[playerId] = validation.sequence
        broadcastRoomState(room)

        const botPlayer = getBotPlayer(room)
        if (botPlayer && !room.actions[botPlayer.playerId]) {
          scheduleBotAction(room)
        }

        maybeResolveRound(room)
        return
      }

      if (type === 'round_confirm') {
        const roomId = payload?.roomId
        const playerId = payload?.playerId
        const round = payload?.round

        if (!roomId || !playerId) {
          sendError(ws, 'Room ID and player ID are required.')
          return
        }

        const room = rooms.get(roomId)
        if (!room) {
          sendError(ws, 'Room not found.')
          return
        }
        if (room.status === 'finished') {
          sendError(ws, 'Game is already finished.')
          return
        }
        if (!room.awaitingConfirm) {
          sendError(ws, 'Round is not awaiting confirmation.')
          return
        }
        if (round && round !== room.round) {
          sendError(ws, 'Round mismatch.')
          return
        }

        const player = room.players.find((entry) => entry.playerId === playerId)
        if (!player || player.isBot) {
          sendError(ws, 'Invalid player.')
          return
        }

        room.confirmed.add(playerId)
        const pendingIds = room.players.filter((entry) => !entry.isBot).map((entry) => entry.playerId)
        const allConfirmed = pendingIds.every((id) => room.confirmed.has(id))
        if (!allConfirmed) {
          return
        }

        room.awaitingConfirm = false
        room.confirmed.clear()
        room.round += 1
        broadcastRoomState(room)
        startRound(room)
        scheduleBotAction(room)
        return
      }

      if (type === 'rematch') {
        const roomId = payload?.roomId
        const playerId = payload?.playerId
        if (!roomId || !playerId) {
          sendError(ws, 'Room ID and player ID are required.')
          return
        }

        const room = rooms.get(roomId)
        if (!room) {
          sendError(ws, 'Room not found.')
          return
        }
        if (room.status === 'playing') {
          sendError(ws, 'Rematch is only available after game over.')
          return
        }

        if (roomHasBot(room)) {
          clearBotTimer(room)
          room.round = 1
          room.status = 'playing'
          room.actions = {}
          room.awaitingConfirm = false
          room.confirmed.clear()
          room.players.forEach((player) => {
            player.hp = 10
            player.deck = buildDeck()
            player.discard = []
            player.hand = []
          })
          room.rematchReady.clear()
          broadcastRoomState(room)
          startRound(room)
          scheduleBotAction(room)
          return
        }

        room.rematchReady.add(playerId)
        room.status = 'waiting'
        broadcastRoomState(room)

        if (room.rematchReady.size < 2) {
          return
        }

        room.round = 1
        room.status = 'playing'
        room.actions = {}
        room.awaitingConfirm = false
        room.confirmed.clear()
        room.players.forEach((player) => {
          player.hp = 10
          player.deck = buildDeck()
          player.discard = []
          player.hand = []
        })
        room.rematchReady.clear()
        broadcastRoomState(room)
        startRound(room)
        return
      }

      sendError(ws, `Unknown message type: ${type}`)
    })

    ws.on('close', () => {
      const roomId = ws.roomId
      if (!roomId) {
        return
      }

      const room = rooms.get(roomId)
      if (!room) {
        return
      }

      room.players = room.players.filter((player) => player.ws !== ws)
      room.actions = {}
      room.status = room.players.length === 2 ? 'playing' : 'waiting'
      if (room.rematchReady) {
        room.rematchReady.delete(ws.playerId)
      }

      if (room.players.length === 0 || room.players.every((player) => player.isBot)) {
        clearBotTimer(room)
        rooms.delete(roomId)
        return
      }

      broadcastRoomState(room)
    })
  })

  return wss
}
