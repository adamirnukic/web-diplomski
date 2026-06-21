'use client'

import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { COLS, ROWS, type C4View } from '@shared/games/connect-four/engine'
import type { GameBoardProps } from '../registry'
import styles from './ConnectFour.module.css'

export function ConnectFourBoard({ view, onAction, onRestart, mode }: GameBoardProps) {
  const v = view as C4View | null
  if (!v) return <div className={styles.loading}>Učitavanje…</div>

  const { board, winningLine, result } = v
  const canPlay = v.yourTurn && !result

  let status: string
  if (result) {
    status = result.status === 'draw' ? 'Neriješeno!' : 'Pobjeda! 🎉'
  } else if (mode === 'online') {
    status = v.yourTurn ? 'Tvoj potez' : 'Protivnik je na potezu…'
  } else {
    status = v.turnDisc === 'R' ? 'Na potezu: Crveni' : 'Na potezu: Žuti'
  }

  const colFull = (col: number) => board[col] !== null // top row of column filled

  return (
    <div className={styles.root}>
      <p className={cn(styles.status, result && styles.statusDone)}>{status}</p>

      <div className={styles.board}>
        {Array.from({ length: COLS }).map((_, col) => (
          <button
            key={col}
            className={styles.column}
            disabled={!canPlay || colFull(col)}
            onClick={() => onAction({ type: 'drop', col })}
            aria-label={`Kolona ${col + 1}`}
          >
            {Array.from({ length: ROWS }).map((_, row) => {
              const i = row * COLS + col
              const cell = board[i]
              return (
                <span
                  key={row}
                  className={cn(
                    styles.cell,
                    cell === 'R' && styles.red,
                    cell === 'Y' && styles.yellow,
                    winningLine?.includes(i) && styles.win,
                  )}
                />
              )
            })}
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
