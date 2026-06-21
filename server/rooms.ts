import type { Server, Socket } from 'socket.io'
import { randomBytes } from 'node:crypto'
import { getEngine } from '../shared/games/registry'
import type { EnginePlayer, GameEngine } from '../shared/types'
import { recordMatchResult } from './stats'

interface RoomPlayer {
  id: string
  username: string
  socketId: string
  ready: boolean
  connected: boolean
}

interface Room {
  code: string
  gameId: string
  hostId: string
  players: Map<string, RoomPlayer>
  status: 'lobby' | 'playing' | 'finished'
  engine: GameEngine | null
  state: unknown
}

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
const rooms = new Map<string, Room>()

function generateCode(): string {
  let code = ''
  do {
    code = ''
    const bytes = randomBytes(6)
    for (let i = 0; i < 6; i++) code += CODE_CHARS[bytes[i] % CODE_CHARS.length]
  } while (rooms.has(code))
  return code
}

function lobbyView(room: Room) {
  return {
    code: room.code,
    gameId: room.gameId,
    hostId: room.hostId,
    status: room.status,
    players: [...room.players.values()].map((p) => ({
      id: p.id,
      username: p.username,
      ready: p.ready,
      connected: p.connected,
      isHost: p.id === room.hostId,
    })),
  }
}

function broadcastLobby(io: Server, room: Room) {
  io.to(room.code).emit('room:update', lobbyView(room))
}

/** Send each player only their own view so secret state stays hidden. */
function broadcastGameState(io: Server, room: Room) {
  if (!room.engine) return
  for (const p of room.players.values()) {
    if (!p.connected) continue
    io.to(p.socketId).emit('game:state', room.engine.getView(room.state, p.id))
  }
}

type Ack = (response: { error?: string; [k: string]: unknown }) => void

export function registerRoomHandlers(io: Server, socket: Socket) {
  const user = socket.data.user as { id: string; username: string } | undefined

  const getRoom = (): Room | undefined => {
    const code = socket.data.roomCode as string | undefined
    return code ? rooms.get(code) : undefined
  }

  socket.on('room:create', (payload: { gameId?: string } = {}, ack?: Ack) => {
    if (!user) return ack?.({ error: 'Niste prijavljeni' })
    const gameId = String(payload.gameId ?? '')
    if (!getEngine(gameId)) return ack?.({ error: 'Ova igra još nema online podršku' })

    const code = generateCode()
    const room: Room = {
      code,
      gameId,
      hostId: user.id,
      players: new Map(),
      status: 'lobby',
      engine: null,
      state: null,
    }
    room.players.set(user.id, {
      id: user.id,
      username: user.username,
      socketId: socket.id,
      ready: true,
      connected: true,
    })
    rooms.set(code, room)
    socket.join(code)
    socket.data.roomCode = code

    ack?.({ code, gameId })
    broadcastLobby(io, room)
  })

  socket.on('room:join', (payload: { code?: string } = {}, ack?: Ack) => {
    if (!user) return ack?.({ error: 'Niste prijavljeni' })
    const code = String(payload.code ?? '').toUpperCase().trim()
    const room = rooms.get(code)
    if (!room) return ack?.({ error: 'Soba sa tim kodom ne postoji' })

    const engine = getEngine(room.gameId)
    const alreadyIn = room.players.has(user.id)
    if (!alreadyIn) {
      if (room.status !== 'lobby') return ack?.({ error: 'Igra je već počela' })
      if (engine && room.players.size >= engine.maxPlayers) {
        return ack?.({ error: 'Soba je puna' })
      }
    }

    const existing = room.players.get(user.id)
    if (existing) {
      existing.socketId = socket.id
      existing.connected = true
    } else {
      room.players.set(user.id, {
        id: user.id,
        username: user.username,
        socketId: socket.id,
        ready: false,
        connected: true,
      })
    }
    socket.join(code)
    socket.data.roomCode = code

    ack?.({ code, gameId: room.gameId })
    broadcastLobby(io, room)
    if (room.status === 'playing') broadcastGameState(io, room)
  })

  socket.on('room:ready', (payload: { ready?: boolean } = {}, ack?: Ack) => {
    const room = getRoom()
    if (!room || !user) return ack?.({ error: 'Niste u sobi' })
    const p = room.players.get(user.id)
    if (!p) return ack?.({ error: 'Niste u sobi' })
    p.ready = Boolean(payload.ready)
    broadcastLobby(io, room)
    ack?.({ ok: true })
  })

  socket.on('room:start', (_payload: unknown, ack?: Ack) => {
    const room = getRoom()
    if (!room || !user) return ack?.({ error: 'Niste u sobi' })
    if (room.hostId !== user.id) return ack?.({ error: 'Samo host može pokrenuti igru' })

    const engine = getEngine(room.gameId)
    if (!engine) return ack?.({ error: 'Nepoznata igra' })

    const connectedPlayers = [...room.players.values()].filter((p) => p.connected)
    if (connectedPlayers.length < engine.minPlayers) {
      return ack?.({ error: 'Nema dovoljno igrača' })
    }
    if (connectedPlayers.some((p) => !p.ready)) {
      return ack?.({ error: 'Svi igrači moraju biti spremni' })
    }

    const enginePlayers: EnginePlayer[] = connectedPlayers.map((p) => ({
      id: p.id,
      username: p.username,
    }))
    try {
      room.engine = engine
      room.state = engine.createInitialState(enginePlayers)
      room.status = 'playing'
    } catch (e) {
      room.engine = null
      return ack?.({ error: (e as Error).message })
    }

    ack?.({ ok: true })
    broadcastLobby(io, room)
    broadcastGameState(io, room)
  })

  socket.on('game:action', (payload: { action?: unknown } = {}, ack?: Ack) => {
    const room = getRoom()
    if (!room || !user) return ack?.({ error: 'Niste u sobi' })
    if (room.status !== 'playing' || !room.engine) {
      return ack?.({ error: 'Igra nije u toku' })
    }
    try {
      room.state = room.engine.applyAction(room.state, user.id, payload.action)
    } catch (e) {
      return ack?.({ error: (e as Error).message })
    }

    ack?.({ ok: true })
    broadcastGameState(io, room)

    const result = room.engine.getResult(room.state)
    if (result) {
      room.status = 'finished'
      try {
        recordMatchResult(room, result)
      } catch (e) {
        console.error('[rooms] greška pri upisu rezultata:', e)
      }
      io.to(room.code).emit('game:over', result)
      broadcastLobby(io, room)
    }
  })

  socket.on('room:leave', () => leaveRoom(io, socket, false))
  socket.on('disconnect', () => leaveRoom(io, socket, true))
}

function leaveRoom(io: Server, socket: Socket, disconnected: boolean) {
  const code = socket.data.roomCode as string | undefined
  const user = socket.data.user as { id: string } | undefined
  if (!code || !user) return
  const room = rooms.get(code)
  if (!room) return

  const p = room.players.get(user.id)
  if (p) {
    if (disconnected) {
      // keep the slot so the player can reconnect with the same code
      p.connected = false
    } else {
      room.players.delete(user.id)
    }
  }
  socket.leave(code)
  socket.data.roomCode = undefined

  const anyConnected = [...room.players.values()].some((pp) => pp.connected)
  if (room.players.size === 0 || !anyConnected) {
    rooms.delete(code)
    return
  }

  // hand over host if the host is gone
  const host = room.players.get(room.hostId)
  if (!host || !host.connected) {
    const next = [...room.players.values()].find((pp) => pp.connected)
    if (next) room.hostId = next.id
  }
  broadcastLobby(io, room)
}
