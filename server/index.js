import http from 'http'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import { randomUUID } from 'crypto'
import express from 'express'
import cors from 'cors'
import { Server } from 'socket.io'
import { Room } from './room.js'

const PORT = process.env.PORT || 4000
const app = express()
app.use(cors())
app.get('/health', (_req, res) => res.json({ ok: true, rooms: rooms.size }))

// In production, serve the built React client from this same server so the whole
// game runs as ONE free web service (Socket.io shares the host, same-origin).
// Socket.io traffic is handled at the HTTP-server level and never reaches Express,
// so the SPA fallback below only needs to guard the /health route.
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const clientDist = path.resolve(__dirname, '../client/dist')
if (fs.existsSync(path.join(clientDist, 'index.html'))) {
  app.use(express.static(clientDist))
  app.get(/^\/(?!health).*/, (_req, res) => res.sendFile(path.join(clientDist, 'index.html')))
  console.log(`⚽ Serving client build from ${clientDist}`)
}

const server = http.createServer(app)
const io = new Server(server, { cors: { origin: '*' } })

/** @type {Map<string, Room>} */
const rooms = new Map()

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no ambiguous chars
function makeRoomCode() {
  let code
  do {
    code = Array.from({ length: 4 }, () => CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)]).join('')
  } while (rooms.has(code))
  return code
}

// Reap empty rooms every minute so memory doesn't grow unbounded.
setInterval(() => {
  for (const [code, room] of rooms) {
    if (room.isEmpty()) {
      room.destroy()
      rooms.delete(code)
    }
  }
}, 60_000)

io.on('connection', (socket) => {
  // Track what room/player this socket belongs to for clean disconnects.
  socket.data.roomCode = null
  socket.data.playerId = null

  const reply = (cb, payload) => typeof cb === 'function' && cb(payload)

  socket.on('createRoom', ({ nickname, settings }, cb) => {
    const code = makeRoomCode()
    const room = new Room(code, io)
    rooms.set(code, room)
    if (settings) room.configure(sanitizeSettings(settings))
    const playerId = randomUUID()
    room.addPlayer(playerId, socket.id, nickname || 'Host')
    joinSocket(socket, room, playerId)
    reply(cb, { ok: true, code, playerId, state: room.publicState(), me: privateOf(room, playerId) })
    room.broadcast()
  })

  socket.on('joinRoom', ({ code, nickname }, cb) => {
    const room = rooms.get((code || '').toUpperCase())
    if (!room) return reply(cb, { ok: false, error: 'Room not found.' })
    if (room.status !== 'lobby') return reply(cb, { ok: false, error: 'Game already in progress.' })
    if (room.players.size >= 8) return reply(cb, { ok: false, error: 'Room is full (max 8).' })
    const playerId = randomUUID()
    room.addPlayer(playerId, socket.id, nickname || `Manager`)
    joinSocket(socket, room, playerId)
    reply(cb, { ok: true, code: room.code, playerId, state: room.publicState(), me: privateOf(room, playerId) })
    room.broadcast()
  })

  socket.on('rejoinRoom', ({ code, playerId }, cb) => {
    const room = rooms.get((code || '').toUpperCase())
    if (!room) return reply(cb, { ok: false, error: 'Room not found.' })
    const p = room.reconnect(playerId, socket.id)
    if (!p) return reply(cb, { ok: false, error: 'Seat not found — join as new.' })
    joinSocket(socket, room, playerId)
    reply(cb, { ok: true, code: room.code, playerId, state: room.publicState(), me: privateOf(room, playerId) })
    room.broadcast()
  })

  socket.on('configureRoom', ({ settings }, cb) => {
    const room = currentRoom(socket)
    if (!room) return reply(cb, { ok: false, error: 'No room.' })
    if (socket.data.playerId !== room.hostId) return reply(cb, { ok: false, error: 'Only the host can configure.' })
    room.configure(sanitizeSettings(settings))
    room.broadcast()
    reply(cb, { ok: true })
  })

  socket.on('startGame', (_p, cb) => {
    const room = currentRoom(socket)
    if (!room) return reply(cb, { ok: false, error: 'No room.' })
    const okStart = room.start(socket.data.playerId)
    if (!okStart) return reply(cb, { ok: false, error: 'Need 2+ players and valid settings to start.' })
    room.broadcast()
    reply(cb, { ok: true })
  })

  socket.on('nominate', ({ footballPlayerId }, cb) => {
    const room = currentRoom(socket)
    if (!room) return reply(cb, { ok: false, error: 'No room.' })
    reply(cb, room.nominate(socket.data.playerId, footballPlayerId))
  })

  socket.on('passNomination', (_p, cb) => {
    const room = currentRoom(socket)
    if (!room) return reply(cb, { ok: false, error: 'No room.' })
    const r = room.passNomination(socket.data.playerId)
    room.broadcast()
    reply(cb, r)
  })

  socket.on('placeBid', ({ amount }, cb) => {
    const room = currentRoom(socket)
    if (!room) return reply(cb, { ok: false, error: 'No room.' })
    reply(cb, room.placeBid(socket.data.playerId, amount))
  })

  socket.on('passBid', (_p, cb) => {
    const room = currentRoom(socket)
    if (!room) return reply(cb, { ok: false, error: 'No room.' })
    reply(cb, room.passBid(socket.data.playerId))
  })

  socket.on('usePowerCard', ({ cardId, target }, cb) => {
    const room = currentRoom(socket)
    if (!room) return reply(cb, { ok: false, error: 'No room.' })
    reply(cb, room.usePowerCard(socket.data.playerId, cardId, target || {}))
  })

  socket.on('acknowledgePowerRound', (_p, cb) => {
    const room = currentRoom(socket)
    if (!room) return reply(cb, { ok: false, error: 'No room.' })
    reply(cb, room.acknowledgePowerRound(socket.data.playerId))
  })

  socket.on('sellNow', (_p, cb) => {
    const room = currentRoom(socket)
    if (!room) return reply(cb, { ok: false, error: 'No room.' })
    const r = room.hostSell(socket.data.playerId)
    room.broadcast()
    reply(cb, r)
  })

  socket.on('skipNow', (_p, cb) => {
    const room = currentRoom(socket)
    if (!room) return reply(cb, { ok: false, error: 'No room.' })
    const r = room.hostSkip(socket.data.playerId)
    room.broadcast()
    reply(cb, r)
  })

  socket.on('endGame', (_p, cb) => {
    const room = currentRoom(socket)
    if (!room) return reply(cb, { ok: false, error: 'No room.' })
    const r = room.forceEnd(socket.data.playerId)
    room.broadcast()
    reply(cb, r)
  })

  socket.on('kickPlayer', ({ targetId }, cb) => {
    const room = currentRoom(socket)
    if (!room) return reply(cb, { ok: false, error: 'No room.' })
    reply(cb, room.hostKick(socket.data.playerId, targetId))
  })

  socket.on('startKickVote', ({ targetId }, cb) => {
    const room = currentRoom(socket)
    if (!room) return reply(cb, { ok: false, error: 'No room.' })
    reply(cb, room.startKickVote(socket.data.playerId, targetId))
  })

  socket.on('castKickVote', ({ agree }, cb) => {
    const room = currentRoom(socket)
    if (!room) return reply(cb, { ok: false, error: 'No room.' })
    reply(cb, room.castKickVote(socket.data.playerId, agree))
  })

  socket.on('disconnect', () => {
    const room = currentRoom(socket)
    if (!room) return
    room.disconnect(socket.id)
    room.broadcast()
  })
})

function joinSocket(socket, room, playerId) {
  socket.data.roomCode = room.code
  socket.data.playerId = playerId
  socket.join(room.code)
}
function currentRoom(socket) {
  return rooms.get(socket.data.roomCode)
}
function privateOf(room, playerId) {
  const p = room.players.get(playerId)
  return p ? room.privateFor(p) : null
}
function sanitizeSettings(s) {
  return {
    budget: Number(s.budget),
    squadSize: Number(s.squadSize),
    auctionSeconds: Number(s.auctionSeconds),
    timerMode: s.timerMode,
    nominationMode: s.nominationMode,
    biddingMode: s.biddingMode,
    positionReqs: s.positionReqs && {
      GK: Number(s.positionReqs.GK),
      DEF: Number(s.positionReqs.DEF),
      MID: Number(s.positionReqs.MID),
      FWD: Number(s.positionReqs.FWD),
    },
    poolLimits: s.poolLimits && {
      GK: Number(s.poolLimits.GK),
      DEF: Number(s.poolLimits.DEF),
      MID: Number(s.poolLimits.MID),
      FWD: Number(s.poolLimits.FWD),
    },
    powerCardInterval: Number(s.powerCardInterval),
  }
}

server.listen(PORT, () => {
  console.log(`⚽ Football Auction server listening on http://localhost:${PORT}`)
})
