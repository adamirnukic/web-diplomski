'use client'

import type { ReactNode } from 'react'
import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useT } from '@/lib/i18n'
import type { DBView } from '@shared/games/dots-and-boxes/engine'
import type { GameBoardProps } from '../registry'
import styles from './DotsAndBoxes.module.css'

export function DotsAndBoxesBoard({ view, onAction, onRestart, mode, players }: GameBoardProps) {
  const { t } = useT()
  const v = view as DBView | null
  if (!v) return <div className={styles.loading}>{t('common.loading')}</div>
  const { rows, cols } = v
  const nameOf = (id: string) => players?.find((p) => p.id === id)?.username ?? 'Igrač'

  let status: string
  if (v.result) {
    status =
      v.result.status === 'draw'
        ? t('g.draw')
        : mode === 'online'
          ? v.result.winnerId === v.you
            ? t('g.youWin')
            : t('g.youLose')
          : t('g.winnerName', { name: nameOf(v.result.winnerId ?? '') })
  } else {
    status =
      mode === 'online'
        ? v.yourTurn
          ? t('g.yourTurn')
          : t('g.nameTurn', { name: nameOf(v.turn) })
        : t('g.turnOf', { name: nameOf(v.turn) })
  }

  const cells: ReactNode[] = []
  for (let gr = 0; gr <= 2 * rows; gr++) {
    for (let gc = 0; gc <= 2 * cols; gc++) {
      const evenR = gr % 2 === 0
      const evenC = gc % 2 === 0
      const key = `${gr}-${gc}`
      if (evenR && evenC) {
        cells.push(<span key={key} className={styles.dot} />)
      } else if (evenR && !evenC) {
        const idx = (gr / 2) * cols + (gc - 1) / 2
        const drawn = v.h[idx]
        cells.push(
          <button
            key={key}
            className={cn(styles.hEdge, drawn && styles.drawn)}
            disabled={drawn || !v.yourTurn}
            onClick={() => onAction({ type: 'edge', kind: 'h', index: idx })}
            aria-label={t('dnb.hEdge')}
          />,
        )
      } else if (!evenR && evenC) {
        const idx = ((gr - 1) / 2) * (cols + 1) + gc / 2
        const drawn = v.v[idx]
        cells.push(
          <button
            key={key}
            className={cn(styles.vEdge, drawn && styles.drawn)}
            disabled={drawn || !v.yourTurn}
            onClick={() => onAction({ type: 'edge', kind: 'v', index: idx })}
            aria-label={t('dnb.vEdge')}
          />,
        )
      } else {
        const owner = v.owner[((gr - 1) / 2) * cols + (gc - 1) / 2]
        cells.push(
          <span
            key={key}
            className={cn(styles.box, owner && (owner === v.you ? styles.boxYou : styles.boxOpp))}
          />,
        )
      }
    }
  }

  return (
    <div className={styles.root}>
      <div className={styles.scores}>
        <span>
          {nameOf(v.order[0])}: {v.scores[v.order[0]]}
        </span>
        <span>
          {nameOf(v.order[1])}: {v.scores[v.order[1]]}
        </span>
      </div>
      <p className={cn(styles.status, v.result && styles.statusDone)}>{status}</p>
      <div
        className={styles.grid}
        style={{
          gridTemplateColumns: `16px repeat(${cols}, 40px 16px)`,
          gridTemplateRows: `16px repeat(${rows}, 40px 16px)`,
        }}
      >
        {cells}
      </div>
      {v.result && mode === 'local' && onRestart && (
        <Button onClick={onRestart} className="neon-glow-cyan">
          <RotateCcw size={16} /> {t('g.newGame')}
        </Button>
      )}
    </div>
  )
}
