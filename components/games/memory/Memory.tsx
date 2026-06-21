'use client'

import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { MemoryView } from '@shared/games/memory/engine'
import type { GameBoardProps } from '../registry'
import styles from './Memory.module.css'

export function MemoryBoard({ view, onAction, onRestart, mode }: GameBoardProps) {
  const v = view as MemoryView | null
  if (!v) return <div className={styles.loading}>Učitavanje…</div>

  const { cards, result } = v
  const canPlay = v.yourTurn && !result

  let status: string
  if (result) {
    status = result.status === 'draw' ? 'Neriješeno!' : 'Pobjeda! 🎉'
  } else if (mode === 'online') {
    status = v.yourTurn ? 'Tvoj potez' : 'Protivnik je na potezu…'
  } else {
    status = v.yourTurn ? 'Tvoj potez' : 'Potez protivnika'
  }

  return (
    <div className={styles.root}>
      <div className={styles.scores}>
        <span className={styles.score}>Ti: {v.yourScore}</span>
        <span className={styles.score}>Protivnik: {v.oppScore}</span>
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
