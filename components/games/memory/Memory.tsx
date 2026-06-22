'use client'

import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { MemoryView } from '@shared/games/memory/engine'
import type { GameBoardProps } from '../registry'
import styles from './Memory.module.css'

export function MemoryBoard({ view, onAction, onRestart, mode, players }: GameBoardProps) {
  const v = view as MemoryView | null
  if (!v) return <div className={styles.loading}>Učitavanje…</div>

  const { cards, result } = v
  const canPlay = v.yourTurn && !result
  const turnName = players?.find((p) => p.id === v.turn)?.username ?? 'Igrač'
  const twoPlayers = players && players.length === 2

  let status: string
  if (result) {
    const winnerName = players?.find((p) => p.id === result.winnerId)?.username ?? ''
    status = result.status === 'draw' ? 'Neriješeno!' : `Pobjeda: ${winnerName} 🎉`
  } else if (mode === 'online') {
    status = v.yourTurn ? 'Tvoj potez' : `${turnName} je na potezu…`
  } else {
    status = `Na potezu: ${turnName}`
  }

  return (
    <div className={styles.root}>
      <div className={styles.scores}>
        {mode === 'local' && twoPlayers ? (
          <>
            <span className={styles.score}>
              {players![0].username}: {v.scores[players![0].id] ?? 0}
            </span>
            <span className={styles.score}>
              {players![1].username}: {v.scores[players![1].id] ?? 0}
            </span>
          </>
        ) : (
          <>
            <span className={styles.score}>Ti: {v.yourScore}</span>
            <span className={styles.score}>Protivnik: {v.oppScore}</span>
          </>
        )}
      </div>
      <p className={cn(styles.status, result && styles.statusDone)}>{status}</p>

      <div className={styles.board}>
        {cards.map((c, i) => (
          <button
            key={c.id}
            className={cn(
              styles.card,
              (c.faceUp || c.matched) && styles.up,
              c.matched && styles.matched,
            )}
            disabled={!canPlay || c.faceUp || c.matched}
            onClick={() => onAction({ type: 'flip', index: i })}
            aria-label={c.symbol ? `Karta ${c.symbol}` : 'Skrivena karta'}
          >
            <span className={styles.face}>{c.symbol ?? '?'}</span>
          </button>
        ))}
      </div>

      {result && mode === 'local' && onRestart && (
        <Button onClick={onRestart} className="neon-glow-cyan">
          <RotateCcw size={16} /> Igraj ponovo
        </Button>
      )}
    </div>
  )
}
