import http from 'http'
import express from 'express'
import cors from 'cors'
import { registerCardGame01 } from './projects/20250120_card-game01.js'
import { registerCardGame02 } from './projects/20250126-card_game02.js'
import { registerCardGame20250120 } from './projects/20250120_cardgame.js'

const PORT = Number(process.env.PORT) || 3001

const app = express()
app.use(cors())

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

const server = http.createServer(app)
registerCardGame01({ app, server })
registerCardGame02({ app, server })
registerCardGame20250120({ app, server })

server.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`)
})
