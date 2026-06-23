'use client'

import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useT } from '@/lib/i18n'
import type { TttView } from '@shared/games/tic-tac-toe/engine'
import type { GameBoardProps } from '../registry'
import styles from './TicTacToe.module.css'

export function TicTacToeBoard({ view, onAction, onRestart, mode }: GameBoardProps) {
  const { t } = useT()
  const v = view as TttView | null
  if (!v) return <div className={styles.loading}>{t('common.loading')}</div>

  const { board, winningLine, result } = v
  const canPlay = v.yourTurn && !result

  let status: string
  if (result) {
    status = result.status === 'draw' ? t('g.draw') : t('ttt.winMark', { mark: winnerMark(v) })
  } else if (mode === 'online') {
    status = v.yourTurn ? t('g.yourTurn') : t('g.oppTurn')
  } else {
    status = t('g.turnOf', { name: v.turnMark })
  }

  return (
    <div className={styles.root}>
      <p className={cn(styles.status, result && styles.statusDone)}>{status}</p>

      <div className={styles.board}>
        {board.map((cell, i) => (
          <button
            key={i}
            className={cn(styles.cell, winningLine?.includes(i) && styles.cellWin)}
            disabled={!!cell || !canPlay}
            onClick={() => onAction({ type: 'place', index: i })}
            aria-label={`${t('ttt.cell', { n: i + 1 })}${cell ? ': ' + cell : ''}`}
          >
            {cell === 'X' && <span className="neon-text-cyan">X</span>}
            {cell === 'O' && <span className="neon-text-magenta">O</span>}
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

function winnerMark(v: TttView): string {
  if (!v.winningLine) return ''
  return v.board[v.winningLine[0]] ?? ''
}
