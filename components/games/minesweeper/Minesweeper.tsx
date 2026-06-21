'use client'

import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { MineView } from '@shared/games/minesweeper/engine'
import type { GameBoardProps } from '../registry'
import styles from './Minesweeper.module.css'

const NUM_COLOR = [
  '',
  'var(--neon-cyan)',
  'var(--neon-green)',
  'var(--neon-magenta)',
  'var(--neon-purple)',
  '#e8a13a',
  '#e8a13a',
  '#e8a13a',
  '#e8a13a',
]

export function MinesweeperBoard({ view, onAction, onRestart, mode }: GameBoardProps) {
  const v = view as MineView | null
  if (!v) return <div className={styles.loading}>Učitavanje…</div>

  let status: string
  if (v.result) {
    status = v.result.status === 'draw' ? 'Neriješeno!' : 'Kraj igre!'
  } else if (mode === 'online') {
    status = v.yourTurn ? 'Tvoj potez' : 'Protivnik je na potezu…'
  } else {
    status = v.yourTurn ? 'Tvoj potez' : 'Potez protivnika'
  }

  return (
    <div className={styles.root}>
      <div className={styles.scores}>
        <span>Ti: {v.yourCount}</span>
        <span>Protivnik: {v.oppCount}</span>
      </div>
      <p className={cn(styles.status, v.result && styles.statusDone)}>{status}</p>

      <div
        className={styles.board}
        style={{ gridTemplateColumns: `repeat(${v.width}, 1fr)` }}
      >
        {v.cells.map((cell, i) => (
          <button
            key={i}
            className={cn(
              styles.cell,
              cell.revealed && styles.revealed,
              cell.mine && styles.mine,
            )}
            disabled={!v.yourTurn || cell.revealed || !!v.result}
            onClick={() => onAction({ type: 'reveal', index: i })}
            style={
              cell.revealed && !cell.mine && cell.adjacent > 0
                ? { color: NUM_COLOR[cell.adjacent] }
                : undefined
            }
            aria-label={`Polje ${i + 1}`}
          >
            {cell.mine ? '💣' : cell.revealed && cell.adjacent > 0 ? cell.adjacent : ''}
          </button>
        ))}
      </div>

      {v.result && mode === 'local' && onRestart && (
        <Button onClick={onRestart} className="neon-glow-cyan">
          <RotateCcw size={16} /> Nova igra
        </Button>
      )}
    </div>
  )
}
