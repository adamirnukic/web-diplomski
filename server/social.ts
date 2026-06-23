import type { Server, Socket } from 'socket.io'
import { addSocket, emitToUser, isOnline, onlineFriendIds, removeSocket } from './presence'
import { areFriends, friendIds } from './friends'

type Ack = (response: unknown) => void

/** Presence + game-invite handlers, attached to every authenticated socket. */
export function registerSocialHandlers(_io: Server, socket: Socket) {
  const user = socket.data.user as { id: string; username: string } | undefined
  if (!user) return

  const wasOffline = addSocket(user.id, socket.id)
  // Send this socket the set of its friends currently online.
  socket.emit('presence:state', { online: onlineFriendIds(user.id) })
  // Announce to my friends that I'm online (only on my first connection).
  if (wasOffline) {
    for (const fid of friendIds(user.id)) {
      emitToUser(fid, 'presence:update', { userId: user.id, online: true })
    }
  }

  socket.on('presence:get', (ack?: Ack) => {
    ack?.({ online: onlineFriendIds(user.id) })
  })

  socket.on(
    'invite:send',
    (payload: { toUserId?: string; gameId?: string; code?: string } = {}, ack?: Ack) => {
      const { toUserId, gameId, code } = payload
      if (!toUserId || !gameId || !code) return ack?.({ error: 'Nepotpun poziv' })
      if (!areFriends(user.id, toUserId)) return ack?.({ error: 'Niste prijatelji' })
      if (!isOnline(toUserId)) return ack?.({ error: 'Igrač nije online' })
      emitToUser(toUserId, 'invite:received', {
        fromId: user.id,
        fromName: user.username,
        gameId,
        code,
      })
      ack?.({ ok: true })
    },
  )

  socket.on('disconnect', () => {
    const nowOffline = removeSocket(user.id, socket.id)
    if (nowOffline) {
      for (const fid of friendIds(user.id)) {
        emitToUser(fid, 'presence:update', { userId: user.id, online: false })
      }
    }
  })
}
