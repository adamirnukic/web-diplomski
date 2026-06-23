'use client'

import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useT } from '@/lib/i18n'
import { COLS, ROWS, type C4View } from '@shared/games/connect-four/engine'
import type { GameBoardProps } from '../registry'
import styles from './ConnectFour.module.css'

export function ConnectFourBoard({ view, onAction, onRestart, mode }: GameBoardProps) {
  const { t } = useT()
  const v = view as C4View | null
  if (!v) return <div className={styles.loading}>{t('common.loading')}</div>

  const { board, winningLine, result } = v
  const canPlay = v.yourTurn && !result

  let status: string
  if (result) {
    status = result.status === 'draw' ? t('g.draw') : t('g.win')
  } else if (mode === 'online') {
    status = v.yourTurn ? t('g.yourTurn') : t('g.oppTurn')
  } else {
    status = v.turnDisc === 'R' ? t('c4.red') : t('c4.yellow')
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
            aria-label={t('c4.column', { n: col + 1 })}
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
          <RotateCcw size={16} /> {t('g.playAgain')}
        </Button>
      )}
    </div>
  )
}
