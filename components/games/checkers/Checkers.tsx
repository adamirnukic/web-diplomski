'use client'

import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useT } from '@/lib/i18n'
import type { CheckersView, Piece } from '@shared/games/checkers/engine'
import type { GameBoardProps } from '../registry'
import styles from './Checkers.module.css'

export function CheckersBoard({ view, onAction, onRestart, mode, players }: GameBoardProps) {
  const { t } = useT()
  const v = view as CheckersView | null
  const [selected, setSelected] = useState<number | null>(null)
  if (!v) return <div className={styles.loading}>{t('common.loading')}</div>

  const { board, moves, result } = v
  const fromSquares = new Set(moves.map((m) => m.from))
  const targets = selected === null ? [] : moves.filter((m) => m.from === selected)
  const targetSet = new Set(targets.map((m) => m.to))

  const onSquare = (i: number) => {
    if (!v.yourTurn || result) return
    if (selected !== null && targetSet.has(i)) {
      onAction({ type: 'move', from: selected, to: i })
      setSelected(null)
      return
    }
    if (fromSquares.has(i)) setSelected(i)
    else setSelected(null)
  }

  const turnName = players?.find((p) => p.id === v.turn)?.username ?? 'Igrač'
  let status: string
  if (result) {
    if (result.status === 'draw') status = t('g.draw')
    else if (mode === 'local') {
      const w = players?.find((p) => p.id === result.winnerId)?.username ?? 'Igrač'
      status = t('g.winnerName', { name: w })
    } else status = t('g.gameOver')
  } else {
    status =
      mode === 'online'
        ? v.yourTurn
          ? t('g.yourTurn')
          : t('g.nameTurn', { name: turnName })
        : t('g.turnOf', { name: turnName })
  }

  const pieceClass = (p: Piece) =>
    cn(
      styles.piece,
      p === 'r' || p === 'R' ? styles.red : styles.black,
      (p === 'R' || p === 'B') && styles.king,
    )

  return (
    <div className={styles.root}>
      <p className={cn(styles.status, result && styles.statusDone)}>{status}</p>

      <div className={styles.board}>
        {board.map((p, i) => {
          const r = Math.floor(i / 8)
          const c = i % 8
          const dark = (r + c) % 2 === 1
          return (
            <div
              key={i}
              className={cn(
                styles.square,
                dark ? styles.dark : styles.light,
                selected === i && styles.selected,
                targetSet.has(i) && styles.target,
                fromSquares.has(i) && selected === null && v.yourTurn && styles.movable,
              )}
              onClick={() => dark && onSquare(i)}
            >
              {p && <span className={pieceClass(p)}>{p === 'R' || p === 'B' ? '♛' : ''}</span>}
              {targetSet.has(i) && <span className={styles.dot} />}
            </div>
          )
        })}
      </div>

      {result && mode === 'local' && onRestart && (
        <Button onClick={onRestart} className="neon-glow-cyan">
          <RotateCcw size={16} /> {t('g.newGame')}
        </Button>
      )}
    </div>
  )
}
