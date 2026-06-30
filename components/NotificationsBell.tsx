'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Bell } from 'lucide-react'
import { useRealtime } from '@/lib/realtime'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { getGameMeta } from '@/lib/games-catalog'
import type { NotificationRow } from '@/lib/api'
import styles from './NotificationsBell.module.css'

const ICON: Record<NotificationRow['type'], string> = {
  friend_request: '👋',
  friend_accepted: '✅',
  game_invite: '🎮',
}

export function NotificationsBell() {
  const { notifications, unreadCount, markNotificationsRead } = useRealtime()
  const { t } = useT()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  // close when clicking outside the bell
  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [open])

  const toggle = () => {
    const next = !open
    setOpen(next)
    if (next && unreadCount > 0) markNotificationsRead()
  }

  const label = (n: NotificationRow) => {
    const name = String(n.data.fromName ?? n.data.byName ?? '?')
    if (n.type === 'friend_request') return t('notif.friendRequest', { name })
    if (n.type === 'friend_accepted') return t('notif.friendAccepted', { name })
    const id = n.data.gameId
    const game = id && getGameMeta(id) ? t(`game.${id}.name`) : (id ?? '')
    return t('notif.gameInvite', { name, game })
  }

  const go = (n: NotificationRow) => {
    setOpen(false)
    if (n.type === 'game_invite' && n.data.gameId && n.data.code) {
      router.push(`/games/${n.data.gameId}/online?code=${n.data.code}`)
    } else {
      router.push('/friends')
    }
  }

  return (
    <div className={styles.wrap} ref={ref}>
      <button type="button" className={styles.bell} onClick={toggle} aria-label={t('notif.title')}>
        <Bell size={16} />
        {unreadCount > 0 && <span className={styles.badge}>{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>
      {open && (
        <div className={styles.panel}>
          <div className={styles.head}>{t('notif.title')}</div>
          {notifications.length === 0 ? (
            <p className={styles.empty}>{t('notif.empty')}</p>
          ) : (
            <ul className={styles.list}>
              {notifications.map((n) => (
                <li key={n.id}>
                  <button
                    type="button"
                    className={cn(styles.item, !n.read && styles.unread)}
                    onClick={() => go(n)}
                  >
                    <span className={styles.icon}>{ICON[n.type]}</span>
                    <span className={styles.itemText}>{label(n)}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
