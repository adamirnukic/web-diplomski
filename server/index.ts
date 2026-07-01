import './env'
import express, { type Request, type Response } from 'express'
import cors from 'cors'
import { createServer } from 'node:http'
import { Server } from 'socket.io'
import './db'
import {
  type AuthUser,
  changePassword,
  deleteAccount,
  loginUser,
  publicProfile,
  publicUser,
  registerUser,
  requestPasswordReset,
  resetPassword,
  signToken,
  updateProfile,
  verifyToken,
} from './auth'
import { sendPasswordResetEmail } from './mailer'
import {
  friendIds,
  listFriends,
  listIncoming,
  listOutgoing,
  removeFriend,
  respondFriendRequest,
  sendFriendRequest,
} from './friends'
import { getLeaderboard, getMatchHistory, getStatsForUser } from './stats'
import { listForUser as listAchievements } from './achievements'
import { addNotification, listNotifications, markAllRead } from './notifications'
import { registerRoomHandlers } from './rooms'
import { registerSocialHandlers } from './social'
import { emitToUser, setIO } from './presence'

const PORT = Number(process.env.API_PORT ?? 3001)
const WEB_ORIGIN = process.env.WEB_ORIGIN ?? 'http://localhost:3000'

const app = express()
app.use(cors({ origin: WEB_ORIGIN, credentials: true }))
app.use(express.json({ limit: '1mb' })) // base64 avatars need a larger body limit

function userFromRequest(req: Request): AuthUser | null {
  const header = req.headers.authorization
  if (!header?.startsWith('Bearer ')) return null
  return verifyToken(header.slice(7))
}

/** Resolve the caller or send a 401. Returns null when unauthenticated. */
function requireAuth(req: Request, res: Response): AuthUser | null {
  const u = userFromRequest(req)
  if (!u) {
    res.status(401).json({ error: 'Niste prijavljeni' })
    return null
  }
  return u
}

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ ok: true })
})

app.post('/api/auth/register', (req: Request, res: Response) => {
  try {
    const { email, username, password } = req.body ?? {}
    const user = registerUser(email, username, password)
    res.json({ user: publicUser(user.id) ?? user, token: signToken(user) })
  } catch (e) {
    res.status(400).json({ error: (e as Error).message })
  }
})

app.post('/api/auth/login', (req: Request, res: Response) => {
  try {
    const { identifier, password } = req.body ?? {}
    const user = loginUser(identifier, password)
    res.json({ user: publicUser(user.id) ?? user, token: signToken(user) })
  } catch (e) {
    res.status(400).json({ error: (e as Error).message })
  }
})

app.get('/api/auth/me', (req: Request, res: Response) => {
  const u = userFromRequest(req)
  if (!u) return res.status(401).json({ error: 'Niste prijavljeni' })
  res.json({ user: publicUser(u.id) ?? u })
})

app.post('/api/auth/change-password', (req: Request, res: Response) => {
  const u = requireAuth(req, res)
  if (!u) return
  try {
    const { currentPassword, newPassword } = req.body ?? {}
    changePassword(u.id, currentPassword, newPassword)
    res.json({ ok: true })
  } catch (e) {
    res.status(400).json({ error: (e as Error).message })
  }
})

app.delete('/api/account', (req: Request, res: Response) => {
  const u = requireAuth(req, res)
  if (!u) return
  try {
    deleteAccount(u.id, req.body?.password)
    res.json({ ok: true })
  } catch (e) {
    res.status(400).json({ error: (e as Error).message })
  }
})

app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
  try {
    const { email } = req.body ?? {}
    const reset = requestPasswordReset(email)
    if (!reset) return res.json({ ok: true }) // stay vague about unknown emails

    const link = `${WEB_ORIGIN}/reset-password?token=${reset.token}`
    let sent = false
    try {
      sent = await sendPasswordResetEmail(reset.user.email, link)
    } catch (e) {
      console.error('[mail] slanje nije uspjelo:', (e as Error).message)
    }
    // No mail server configured / send failed -> surface the link so it still works.
    res.json({ ok: true, ...(sent ? {} : { link }) })
  } catch (e) {
    res.status(400).json({ error: (e as Error).message })
  }
})

app.post('/api/auth/reset-password', (req: Request, res: Response) => {
  try {
    const { token, password } = req.body ?? {}
    const user = resetPassword(token, password)
    res.json({ user: publicUser(user.id) ?? user, token: signToken(user) })
  } catch (e) {
    res.status(400).json({ error: (e as Error).message })
  }
})

app.patch('/api/profile', (req: Request, res: Response) => {
  const u = requireAuth(req, res)
  if (!u) return
  try {
    const { username, avatar, bio, favorite_game } = req.body ?? {}
    const profile = updateProfile(u.id, { username, avatar, bio, favorite_game })
    // Re-issue the token so a new username flows through to Socket.IO auth too.
    const token = signToken({ id: profile.id, email: profile.email, username: profile.username })
    res.json({ user: profile, token })
  } catch (e) {
    res.status(400).json({ error: (e as Error).message })
  }
})

app.get('/api/stats/:userId', (req: Request, res: Response) => {
  res.json({ stats: getStatsForUser(req.params.userId) })
})

/** Public profile of any user: basic info + per-game stats + achievements. */
app.get('/api/users/:id', (req: Request, res: Response) => {
  const user = publicProfile(req.params.id)
  if (!user) return res.status(404).json({ error: 'Korisnik nije pronađen' })
  res.json({
    user,
    stats: getStatsForUser(req.params.id),
    achievements: listAchievements(req.params.id),
  })
})

app.get('/api/history', (req: Request, res: Response) => {
  const u = requireAuth(req, res)
  if (!u) return
  res.json({ matches: getMatchHistory(u.id) })
})

app.get('/api/achievements', (req: Request, res: Response) => {
  const u = requireAuth(req, res)
  if (!u) return
  res.json({ achievements: listAchievements(u.id) })
})

app.get('/api/notifications', (req: Request, res: Response) => {
  const u = requireAuth(req, res)
  if (!u) return
  res.json({ notifications: listNotifications(u.id) })
})

app.post('/api/notifications/read', (req: Request, res: Response) => {
  const u = requireAuth(req, res)
  if (!u) return
  markAllRead(u.id)
  res.json({ ok: true })
})

app.get('/api/leaderboard', (req: Request, res: Response) => {
  const gameId = typeof req.query.game === 'string' ? req.query.game : undefined
  if (req.query.scope === 'friends') {
    const u = requireAuth(req, res)
    if (!u) return
    return res.json({ leaderboard: getLeaderboard([u.id, ...friendIds(u.id)], gameId) })
  }
  res.json({ leaderboard: getLeaderboard(undefined, gameId) })
})

app.get('/api/friends', (req: Request, res: Response) => {
  const u = requireAuth(req, res)
  if (!u) return
  res.json({
    friendCode: publicUser(u.id)?.friend_code ?? '',
    friends: listFriends(u.id),
    incoming: listIncoming(u.id),
    outgoing: listOutgoing(u.id),
  })
})

app.post('/api/friends/request', (req: Request, res: Response) => {
  const u = requireAuth(req, res)
  if (!u) return
  try {
    const result = sendFriendRequest(u.id, req.body?.query)
    if (result.status === 'sent') {
      emitToUser(result.targetId, 'friend:request:new', { fromName: u.username })
      addNotification(result.targetId, 'friend_request', { fromName: u.username })
    } else {
      emitToUser(result.targetId, 'friend:accepted', { byName: u.username })
      addNotification(result.targetId, 'friend_accepted', { byName: u.username })
    }
    res.json({ ok: true, status: result.status })
  } catch (e) {
    res.status(400).json({ error: (e as Error).message })
  }
})

app.post('/api/friends/respond', (req: Request, res: Response) => {
  const u = requireAuth(req, res)
  if (!u) return
  try {
    const r = respondFriendRequest(u.id, req.body?.requestId, Boolean(req.body?.accept))
    if (r.accepted) {
      emitToUser(r.requesterId, 'friend:accepted', { byName: u.username })
      addNotification(r.requesterId, 'friend_accepted', { byName: u.username })
    }
    res.json({ ok: true })
  } catch (e) {
    res.status(400).json({ error: (e as Error).message })
  }
})

app.delete('/api/friends/:friendId', (req: Request, res: Response) => {
  const u = requireAuth(req, res)
  if (!u) return
  removeFriend(u.id, req.params.friendId)
  res.json({ ok: true })
})

const httpServer = createServer(app)
const io = new Server(httpServer, {
  cors: { origin: WEB_ORIGIN, credentials: true },
})
setIO(io)

// Attach the authenticated user (if any) to each socket.
io.use((socket, next) => {
  const token = socket.handshake.auth?.token as string | undefined
  const user = token ? verifyToken(token) : null
  if (user) socket.data.user = user
  next()
})

io.on('connection', (socket) => {
  registerSocialHandlers(io, socket)
  registerRoomHandlers(io, socket)
})

httpServer.listen(PORT, () => {
  console.log(`[server] API + Socket.IO sluša na http://localhost:${PORT}`)
})
