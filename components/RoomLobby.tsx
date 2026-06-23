'use client'

import { useState } from 'react'
import { Check, Copy, Crown, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'
import type { LobbyState } from '@/lib/useRoom'
import styles from './RoomLobby.module.css'

interface Props {
  lobby: LobbyState
  meId: string
  minPlayers: number
  onReady: (ready: boolean) => void
  onStart: () => void
  onLeave: () => void
}

export function RoomLobby({ lobby, meId, minPlayers, onReady, onStart, onLeave }: Props) {
  const { t } = useT()
  const [copied, setCopied] = useState(false)
  const me = lobby.players.find((p) => p.id === meId)
  const isHost = lobby.hostId === meId
  const connected = lobby.players.filter((p) => p.connected)
  const allReady = connected.length >= minPlayers && connected.every((p) => p.ready)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(lobby.code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      /* clipboard may be unavailable */
    }
  }

  return (
    <div className={styles.lobby}>
      <div className={styles.codeBox}>
        <span className={styles.codeLabel}>{t('room.code')}</span>
        <div className={styles.codeRow}>
          <span className={`${styles.code} neon-text-cyan`}>{lobby.code}</span>
          <Button variant="outline" size="icon-sm" onClick={copy} aria-label={t('room.copyCode')}>
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </Button>
        </div>
        <p className={styles.hint}>{t('room.share')}</p>
      </div>

      <div>
        <h3 className={styles.playersTitle}>
          {t('room.players')} ({connected.length}/{minPlayers})
        </h3>
        <ul className={styles.playerList}>
          {lobby.players.map((p) => (
            <li key={p.id} className={cn(styles.player, !p.connected && styles.offline)}>
              <span className={styles.playerName}>
                {p.isHost && <Crown size={14} className="text-neon-green" />}
                {p.username}
                {p.id === meId && ` ${t('room.you')}`}
              </span>
              <span className={cn(styles.status, p.ready ? styles.ready : styles.notReady)}>
                {p.ready ? t('room.ready') : t('room.waiting')}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <div className={styles.controls}>
        <Button
          variant={me?.ready ? 'secondary' : 'default'}
          onClick={() => onReady(!me?.ready)}
          className={!me?.ready ? 'neon-glow-cyan' : undefined}
        >
          {me?.ready ? t('room.unready') : t('room.imReady')}
        </Button>
        {isHost && (
          <Button
            onClick={onStart}
            disabled={!allReady}
            className={allReady ? 'neon-glow-green' : undefined}
          >
            {t('room.start')}
          </Button>
        )}
        <Button variant="ghost" onClick={onLeave}>
          <LogOut size={16} /> {t('room.leave')}
        </Button>
      </div>

      {isHost && !allReady && <p className={styles.waitNote}>{t('room.waitAll')}</p>}
    </div>
  )
}
