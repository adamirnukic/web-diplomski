'use client'

import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { TttView } from '@shared/games/tic-tac-toe/engine'
import type { GameBoardProps } from '../registry'
import styles from './TicTacToe.module.css'

export function TicTacToeBoard({ view, onAction, onRestart, mode }: GameBoardProps) {
  const v = view as TttView | null
  if (!v) return <div className={styles.loading}>Učitavanje…</div>

  const { board, winningLine, result } = v
  const canPlay = v.yourTurn && !result

  let status: string
  if (result) {
    status = result.status === 'draw' ? 'Neriješeno!' : `Pobjeda igrača ${winnerMark(v)} 🎉`
  } else if (mode === 'online') {
    status = v.yourTurn ? 'Tvoj potez' : 'Protivnik je na potezu…'
  } else {
    status = `Na potezu: ${v.turnMark}`
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
            aria-label={`Polje ${i + 1}${cell ? ': ' + cell : ''}`}
          >
            {cell === 'X' && <span className="neon-text-cyan">X</span>}
            {cell === 'O' && <span className="neon-text-magenta">O</span>}
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

function winnerMark(v: TttView): string {
  if (!v.winningLine) return ''
  return v.board[v.winningLine[0]] ?? ''
}
