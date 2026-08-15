import http from 'http'
import express from 'express'
import cors from 'cors'
import { registerCardGame } from './projects/cardgame.js'
import { registerTrack } from './projects/track.js'

const PORT = Number(process.env.PORT) || 3001
const TRACK_LOG_DIR = process.env.TRACK_LOG_DIR || '/var/log/nginx/track'

const app = express()
app.use(cors())

app.get('/health', (_req, res) => {
  res.json({ ok: true })
})

registerTrack(app, { logDir: TRACK_LOG_DIR })

const server = http.createServer(app)
registerCardGame({ app, server })

server.listen(PORT, () => {
  console.log(`Backend listening on http://localhost:${PORT}`)
})
