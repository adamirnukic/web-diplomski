import type { Server } from 'socket.io'
import { friendIds } from './friends'

let ioRef: Server | null = null
const userSockets = new Map<string, Set<string>>()

export function setIO(io: Server): void {
  ioRef = io
}

/** Register a socket for a user. Returns true if the user just came online. */
export function addSocket(userId: string, socketId: string): boolean {
  let set = userSockets.get(userId)
  const wasOffline = !set || set.size === 0
  if (!set) {
    set = new Set()
    userSockets.set(userId, set)
  }
  set.add(socketId)
  return wasOffline
}

/** Remove a socket. Returns true if the user is now fully offline. */
export function removeSocket(userId: string, socketId: string): boolean {
  const set = userSockets.get(userId)
  if (!set) return false
  set.delete(socketId)
  if (set.size === 0) {
    userSockets.delete(userId)
    return true
  }
  return false
}

export function isOnline(userId: string): boolean {
  return (userSockets.get(userId)?.size ?? 0) > 0
}

export function emitToUser(userId: string, event: string, payload: unknown): void {
  const set = userSockets.get(userId)
  if (!set || !ioRef) return
  for (const sid of set) ioRef.to(sid).emit(event, payload)
}

export function onlineFriendIds(userId: string): string[] {
  return friendIds(userId).filter(isOnline)
}
