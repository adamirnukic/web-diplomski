import { randomUUID } from 'node:crypto'
import { db } from './db'
import { areFriends } from './friends'

export interface DirectMessage {
  id: string
  fromId: string
  toId: string
  text: string
  read: boolean
  created_at: number
}

export interface ConversationSummary {
  friendId: string
  lastText: string
  lastAt: number
  fromMe: boolean
  unread: number
}

const MAX_LEN = 1000

interface Row {
  id: string
  from_user: string
  to_user: string
  text: string
  read: number
  created_at: number
}

const toMsg = (r: Row): DirectMessage => ({
  id: r.id,
  fromId: r.from_user,
  toId: r.to_user,
  text: r.text,
  read: !!r.read,
  created_at: r.created_at,
})

/** Persist a direct message. Only friends may message each other. */
export function sendMessage(fromId: string, toId: string, textRaw: string): DirectMessage {
  const text = String(textRaw ?? '').trim().slice(0, MAX_LEN)
  if (!text) throw new Error('Poruka je prazna')
  if (fromId === toId) throw new Error('Ne možeš poslati poruku sebi')
  if (!areFriends(fromId, toId)) throw new Error('Niste prijatelji')
  const msg: DirectMessage = {
    id: randomUUID(),
    fromId,
    toId,
    text,
    read: false,
    created_at: Date.now(),
  }
  db.prepare(
    'INSERT INTO messages (id, from_user, to_user, text, read, created_at) VALUES (?, ?, ?, ?, 0, ?)',
  ).run(msg.id, fromId, toId, text, msg.created_at)
  return msg
}

/** Full thread between two users, oldest first. */
export function getConversation(userId: string, friendId: string, limit = 200): DirectMessage[] {
  const rows = db
    .prepare(
      `SELECT * FROM messages
       WHERE (from_user = ? AND to_user = ?) OR (from_user = ? AND to_user = ?)
       ORDER BY created_at DESC LIMIT ?`,
    )
    .all(userId, friendId, friendId, userId, limit) as Row[]
  return rows.reverse().map(toMsg)
}

/** Mark every message the friend sent me as read. */
export function markConversationRead(userId: string, friendId: string): void {
  db.prepare('UPDATE messages SET read = 1 WHERE to_user = ? AND from_user = ? AND read = 0').run(
    userId,
    friendId,
  )
}

/** Total number of unread messages addressed to me. */
export function unreadCount(userId: string): number {
  const r = db.prepare('SELECT COUNT(*) AS c FROM messages WHERE to_user = ? AND read = 0').get(userId) as {
    c: number
  }
  return r.c
}

/** One summary row per friend I've exchanged messages with, newest first. */
export function listConversations(userId: string): ConversationSummary[] {
  const pairs = db
    .prepare(
      `SELECT CASE WHEN from_user = ? THEN to_user ELSE from_user END AS other, MAX(created_at) AS lastAt
       FROM messages WHERE from_user = ? OR to_user = ? GROUP BY other`,
    )
    .all(userId, userId, userId) as { other: string; lastAt: number }[]

  const unreadRows = db
    .prepare('SELECT from_user AS other, COUNT(*) AS c FROM messages WHERE to_user = ? AND read = 0 GROUP BY from_user')
    .all(userId) as { other: string; c: number }[]
  const unreadMap = new Map(unreadRows.map((r) => [r.other, r.c]))

  return pairs
    .map((p) => {
      const last = db
        .prepare(
          `SELECT text, from_user, created_at FROM messages
           WHERE (from_user = ? AND to_user = ?) OR (from_user = ? AND to_user = ?)
           ORDER BY created_at DESC LIMIT 1`,
        )
        .get(userId, p.other, p.other, userId) as { text: string; from_user: string; created_at: number }
      return {
        friendId: p.other,
        lastText: last.text,
        lastAt: last.created_at,
        fromMe: last.from_user === userId,
        unread: unreadMap.get(p.other) ?? 0,
      }
    })
    .sort((a, b) => b.lastAt - a.lastAt)
}
