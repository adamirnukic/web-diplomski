'use client'

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import type { Socket } from 'socket.io-client'
import { createSocket } from './socket'
import { apiFriends, getToken, type FriendUser } from './api'
import { useAuth } from './auth'

export interface GameInvite {
  id: string
  fromId: string
  fromName: string
  gameId: string
  code: string
}

interface RealtimeValue {
  online: Set<string>
  friends: FriendUser[]
  incomingCount: number
  invites: GameInvite[]
  sendInvite: (toUserId: string, gameId: string, code: string) => void
  dismissInvite: (id: string) => void
  refreshSocial: () => void
}

const Ctx = createContext<RealtimeValue | null>(null)

/**
 * One app-wide authenticated socket for presence + game invites + the friend
 * badge. Separate from useRoom's per-game socket so it lives on every page.
 */
export function RealtimeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth()
  const socketRef = useRef<Socket | null>(null)
  const [online, setOnline] = useState<Set<string>>(new Set())
  const [friends, setFriends] = useState<FriendUser[]>([])
  const [incomingCount, setIncomingCount] = useState(0)
  const [invites, setInvites] = useState<GameInvite[]>([])

  const refreshSocial = useCallback(() => {
    apiFriends()
      .then((d) => {
        setFriends(d.friends)
        setIncomingCount(d.incoming.length)
      })
      .catch(() => {})
  }, [])

  const uid = user?.id
  useEffect(() => {
    if (!uid) {
      socketRef.current?.close()
      socketRef.current = null
      setOnline(new Set())
      setFriends([])
      setIncomingCount(0)
      setInvites([])
      return
    }
    refreshSocial()
    const token = getToken()
    if (!token) return
    const socket = createSocket(token)
    socketRef.current = socket

    socket.on('presence:state', ({ online: ids }: { online: string[] }) => setOnline(new Set(ids)))
    socket.on('presence:update', ({ userId, online: on }: { userId: string; online: boolean }) =>
      setOnline((prev) => {
        const next = new Set(prev)
        if (on) next.add(userId)
        else next.delete(userId)
        return next
      }),
    )
    socket.on('invite:received', (inv: Omit<GameInvite, 'id'>) =>
      setInvites((prev) => [...prev, { ...inv, id: `${Date.now()}-${Math.random()}` }]),
    )
    socket.on('friend:request:new', refreshSocial)
    socket.on('friend:accepted', refreshSocial)

    return () => {
      socket.close()
      socketRef.current = null
    }
  }, [uid, refreshSocial])

  const sendInvite = useCallback((toUserId: string, gameId: string, code: string) => {
    socketRef.current?.emit('invite:send', { toUserId, gameId, code }, () => {})
  }, [])

  const dismissInvite = useCallback(
    (id: string) => setInvites((prev) => prev.filter((i) => i.id !== id)),
    [],
  )

  return (
    <Ctx.Provider
      value={{ online, friends, incomingCount, invites, sendInvite, dismissInvite, refreshSocial }}
    >
      {children}
    </Ctx.Provider>
  )
}

export function useRealtime(): RealtimeValue {
  const c = useContext(Ctx)
  if (!c) throw new Error('useRealtime se mora koristiti unutar <RealtimeProvider>')
  return c
}
