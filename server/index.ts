import './env'
import express, { type Request, type Response } from 'express'
import cors from 'cors'
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import './db'
import {
  type AuthUser,
  getUserById,
  loginUser,
  registerUser,
  signToken,
  verifyToken,
} from './auth'
import { getLeaderboard, getStatsForUser } from './stats'
import { registerRoomHandlers } from './rooms'

const PORT = Number(process.env.API_PORT ?? 3001)
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? 'http://localhost:3000'

const app = express()
app.use(cors({ origin: WEB_ORIGIN, credentials: true }))
app.use(express.json())

function userFromRequest(req: Request): AuthUser | null {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return null
  return verifyToken(header.slice(7))
}

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true })
})

app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body ?? {}
    const user = registerUser(email, username, password)
    res.json({ user, token: signToken(user) })
  } catch (e) {
    res.status(400).json({ error: (e as Error).message })
  }
})

app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body ?? {}
    const user = loginUser(identifier, password)
    res.json({ user, token: signToken(user) })
  } catch (e) {
    res.status(400).json({ error: (e as Error).message })
  }
})

app.get('/api/auth/me', (req: Request, res: Response) => {
  const u = userFromRequest(req)
  if (!u) return res.status(401).json({ error: 'Niste prijavljeni' })
  res.json({ user: getUserById(u.id) ?? u })
})

app.get('/api/stats/:userId', (req: Request, res: Response) => {
  res.json({ stats: getStatsForUser(req.params.userId) })
})

app.get('/api/leaderboard', (_req: Request, res: Response) => {
  res.json({ leaderboard: getLeaderboard() })
})

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: WEB_ORIGIN, credentials: true },
})

// Attach the authenticated user (if any) to each socket.
io.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined
  const user = token ? verifyToken(token) : null
  if (user) socket.data.user = user
  next()
})

io.on('connection', (socket) => {
  registerRoomHandlers(io, socket)
})

httpServer.listen(PORT, () => {
  console.log(`[server] API + Socket.IO sluša na http://localhost:${PORT}`)
})
