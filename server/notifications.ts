import { randomUUID } from 'node:crypto'
import { db } from './db'
import { emitToUser } from './presence'

export type NotificationType = 'friend_request' | 'friend_accepted' | 'game_invite'

export interface NotificationRow {
  id: string
  type: NotificationType
  data: Record<string, unknown>
  read: boolean
  created_at: number
}

const KEEP_PER_USER = 50

/** Persist a notification for a user and push it live if they're connected. */
export function addNotification(
  userId: string,
  type: NotificationType,
  data: Record<string, unknown>,
): NotificationRow {
  const id = randomUUID()
  const created_at = Date.now()
  db.prepare(
    'INSERT INTO notifications (id, user_id, type, data, read, created_at) VALUES (?, ?, ?, ?, 0, ?)',
  ).run(id, userId, type, JSON.stringify(data), created_at)

  // Trim to the most recent N so the table stays small.
  db.prepare(
    `DELETE FROM notifications WHERE user_id = ? AND id NOT IN (
       SELECT id FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?)`,
  ).run(userId, userId, KEEP_PER_USER)

  const row: NotificationRow = { id, type, data, read: false, created_at }
  emitToUser(userId, 'notification:new', row)
  return row
}

export function listNotifications(userId: string, limit = 30): NotificationRow[] {
  const rows = db
    .prepare(
      'SELECT id, type, data, read, created_at FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT ?',
    )
    .all(userId, limit) as {
    id: string
    type: NotificationType
    data: string
    read: number
    created_at: number
  }[]
  return rows.map((r) => ({
    id: r.id,
    type: r.type,
    data: JSON.parse(r.data) as Record<string, unknown>,
    read: !!r.read,
    created_at: r.created_at,
  }))
}

export function markAllRead(userId: string): void {
  db.prepare('UPDATE notifications SET read = 1 WHERE user_id = ? AND read = 0').run(userId)
}
