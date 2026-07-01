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
import {
  apiConversations,
  apiFriends,
  apiMarkNotificationsRead,
  apiNotifications,
  getToken,
  type DirectMessage,
  type FriendUser,
  type NotificationRow,
} from './api'
import { useAuth } from './auth'

export interface GameInvite {
  id: string
  fromId: string
  fromName: string
  gameId: string
  code: string
}

export interface AchievementPop {
  key: string
  id: string
  icon: string
}

interface RealtimeValue {
  online: Set<string>
  friends: FriendUser[]
  incomingCount: number
  /** bumped on every friend request / accept so pages can live-refresh their lists */
  socialVersion: number
  /** total unread direct messages (for the navbar badge) */
  dmUnread: number
  /** the most recent incoming direct message, for live-appending to an open thread */
  lastDm: DirectMessage | null
  refreshDm: () => void
  invites: GameInvite[]
  achievements: AchievementPop[]
  notifications: NotificationRow[]
  unreadCount: number
  markNotificationsRead: () => void
  sendInvite: (toUserId: string, gameId: string, code: string) => void
  dismissInvite: (id: string) => void
  dismissAchievement: (key: string) => void
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
  const [socialVersion, setSocialVersion] = useState(0)
  const [dmUnread, setDmUnread] = useState(0)
  const [lastDm, setLastDm] = useState<DirectMessage | null>(null)
  const [invites, setInvites] = useState<GameInvite[]>([])
  const [achievements, setAchievements] = useState<AchievementPop[]>([])
  const [notifications, setNotifications] = useState<NotificationRow[]>([])

  const refreshSocial = useCallback(() => {
    apiFriends()
      .then((d) => {
        setFriends(d.friends)
        setIncomingCount(d.incoming.length)
      })
      .catch(() => {})
  }, [])

  const refreshNotifications = useCallback(() => {
    apiNotifications()
      .then((d) => setNotifications(d.notifications))
      .catch(() => {})
  }, [])

  const refreshDm = useCallback(() => {
    apiConversations()
      .then((d) => setDmUnread(d.unread))
      .catch(() => {})
  }, [])

  const markNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => (n.read ? n : { ...n, read: true })))
    apiMarkNotificationsRead().catch(() => {})
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
      setAchievements([])
      setNotifications([])
      setDmUnread(0)
      setLastDm(null)
      return
    }
    refreshSocial()
    refreshNotifications()
    refreshDm()
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
    const onSocialEvent = () => {
      refreshSocial()
      setSocialVersion((v) => v + 1) // signal pages (e.g. Friends) to re-fetch
    }
    socket.on('friend:request:new', onSocialEvent)
    socket.on('friend:accepted', onSocialEvent)
    socket.on('achievement:earned', ({ id, icon }: { id: string; icon: string }) =>
      setAchievements((prev) => [...prev, { key: `${Date.now()}-${Math.random()}`, id, icon }]),
    )
    socket.on('notification:new', (n: NotificationRow) =>
      setNotifications((prev) => [n, ...prev].slice(0, 30)),
    )
    socket.on('dm:new', (msg: DirectMessage) => {
      setLastDm(msg)
      setDmUnread((n) => n + 1)
    })

    return () => {
      socket.close()
      socketRef.current = null
    }
  }, [uid, refreshSocial, refreshNotifications, refreshDm])

  const sendInvite = useCallback((toUserId: string, gameId: string, code: string) => {
    socketRef.current?.emit('invite:send', { toUserId, gameId, code }, () => {})
  }, [])

  const dismissInvite = useCallback(
    (id: string) => setInvites((prev) => prev.filter((i) => i.id !== id)),
    [],
  )

  const dismissAchievement = useCallback(
    (key: string) => setAchievements((prev) => prev.filter((a) => a.key !== key)),
    [],
  )

  const unreadCount = notifications.reduce((n, x) => n + (x.read ? 0 : 1), 0)

  return (
    <Ctx.Provider
      value={{
        online,
        friends,
        incomingCount,
        socialVersion,
        dmUnread,
        lastDm,
        refreshDm,
        invites,
        achievements,
        notifications,
        unreadCount,
        markNotificationsRead,
        sendInvite,
        dismissInvite,
        dismissAchievement,
        refreshSocial,
      }}
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
