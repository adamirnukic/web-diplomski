import { randomUUID } from 'node:crypto'
import { db } from './db'

export interface FriendUser {
  id: string
  username: string
  avatar: string | null
}

export interface FriendRequest {
  id: string // friendship row id
  user: FriendUser // the other party
  created_at: number
}

interface ReqRow {
  id: string
  created_at: number
  uid: string
  username: string
  avatar: string | null
}

export function listFriends(userId: string): FriendUser[] {
  return db
    .prepare(
      `SELECT u.id, u.username, u.avatar
       FROM friendships f
       JOIN users u ON u.id = CASE WHEN f.requester = ? THEN f.recipient ELSE f.requester END
       WHERE (f.requester = ? OR f.recipient = ?) AND f.status = 'accepted'
       ORDER BY u.username COLLATE NOCASE`,
    )
    .all(userId, userId, userId) as FriendUser[]
}

export function friendIds(userId: string): string[] {
  return listFriends(userId).map((f) => f.id)
}

export function listIncoming(userId: string): FriendRequest[] {
  const rows = db
    .prepare(
      `SELECT f.id, f.created_at, u.id AS uid, u.username, u.avatar
       FROM friendships f JOIN users u ON u.id = f.requester
       WHERE f.recipient = ? AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
    )
    .all(userId) as ReqRow[]
  return rows.map((r) => ({
    id: r.id,
    created_at: r.created_at,
    user: { id: r.uid, username: r.username, avatar: r.avatar },
  }))
}

export function listOutgoing(userId: string): FriendRequest[] {
  const rows = db
    .prepare(
      `SELECT f.id, f.created_at, u.id AS uid, u.username, u.avatar
       FROM friendships f JOIN users u ON u.id = f.recipient
       WHERE f.requester = ? AND f.status = 'pending'
       ORDER BY f.created_at DESC`,
    )
    .all(userId) as ReqRow[]
  return rows.map((r) => ({
    id: r.id,
    created_at: r.created_at,
    user: { id: r.uid, username: r.username, avatar: r.avatar },
  }))
}

/** Add a friend by their friend code OR username. Auto-accepts a reverse request. */
export function sendFriendRequest(userId: string, codeOrUsername: string): { status: 'sent' | 'accepted' } {
  const q = String(codeOrUsername ?? '').trim()
  if (!q) throw new Error('Unesi friend kod ili korisničko ime')
  const target = db
    .prepare('SELECT id FROM users WHERE friend_code = ? OR lower(username) = lower(?)')
    .get(q.toUpperCase(), q) as { id: string } | undefined
  if (!target) throw new Error('Korisnik nije pronađen')
  if (target.id === userId) throw new Error('Ne možeš dodati sebe')

  const existing = db
    .prepare(
      `SELECT id, status, requester FROM friendships
       WHERE (requester = ? AND recipient = ?) OR (requester = ? AND recipient = ?)`,
    )
    .get(userId, target.id, target.id, userId) as
    | { id: string; status: string; requester: string }
    | undefined

  if (existing) {
    if (existing.status === 'accepted') throw new Error('Već ste prijatelji')
    if (existing.requester === userId) throw new Error('Zahtjev je već poslan')
    // The other person already sent YOU a request — accept it.
    db.prepare("UPDATE friendships SET status = 'accepted' WHERE id = ?").run(existing.id)
    return { status: 'accepted' }
  }

  db.prepare(
    'INSERT INTO friendships (id, requester, recipient, status, created_at) VALUES (?, ?, ?, ?, ?)',
  ).run(randomUUID(), userId, target.id, 'pending', Date.now())
  return { status: 'sent' }
}

export function respondFriendRequest(userId: string, requestId: string, accept: boolean): void {
  const row = db
    .prepare('SELECT id, recipient, status FROM friendships WHERE id = ?')
    .get(String(requestId ?? '')) as { id: string; recipient: string; status: string } | undefined
  if (!row || row.recipient !== userId || row.status !== 'pending') {
    throw new Error('Zahtjev ne postoji')
  }
  if (accept) db.prepare("UPDATE friendships SET status = 'accepted' WHERE id = ?").run(requestId)
  else db.prepare('DELETE FROM friendships WHERE id = ?').run(requestId)
}

export function removeFriend(userId: string, friendId: string): void {
  db.prepare(
    `DELETE FROM friendships
     WHERE (requester = ? AND recipient = ?) OR (requester = ? AND recipient = ?)`,
  ).run(userId, friendId, friendId, userId)
}
