'use client'

import { useState } from 'react'
import { Check, Copy, Crown, LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
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
        <span className={styles.codeLabel}>Kod sobe</span>
        <div className={styles.codeRow}>
          <span className={`${styles.code} neon-text-cyan`}>{lobby.code}</span>
          <Button variant="outline" size="icon-sm" onClick={copy} aria-label="Kopiraj kod">
            {copied ? <Check size={16} /> : <Copy size={16} />}
          </Button>
        </div>
        <p className={styles.hint}>Podijeli ovaj kod da se prijatelj pridruži.</p>
      </div>

      <div>
        <h3 className={styles.playersTitle}>
          Igrači ({connected.length}/{minPlayers})
        </h3>
        <ul className={styles.playerList}>
          {lobby.players.map((p) => (
            <li key={p.id} className={cn(styles.player, !p.connected && styles.offline)}>
              <span className={styles.playerName}>
                {p.isHost && <Crown size={14} className="text-neon-green" />}
                {p.username}
                {p.id === meId && ' (ti)'}
              </span>
              <span className={cn(styles.status, p.ready ? styles.ready : styles.notReady)}>
                {p.ready ? 'Spreman' : 'Čeka'}
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
          {me?.ready ? 'Poništi spremnost' : 'Spreman sam'}
        </Button>
        {isHost && (
          <Button
            onClick={onStart}
            disabled={!allReady}
            className={allReady ? 'neon-glow-green' : undefined}
          >
            Pokreni igru
          </Button>
        )}
        <Button variant="ghost" onClick={onLeave}>
          <LogOut size={16} /> Napusti
        </Button>
      </div>

      {isHost && !allReady && (
        <p className={styles.waitNote}>Čeka se da svi igrači budu spremni…</p>
      )}
    </div>
  )
}
