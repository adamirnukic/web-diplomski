'use client'

import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  CATEGORIES,
  type Category,
  type YView,
} from '@shared/games/yahtzee/engine'
import type { GameBoardProps } from '../registry'
import styles from './Yahtzee.module.css'

const LABELS: Record<Category, string> = {
  ones: 'Jedinice',
  twos: 'Dvojke',
  threes: 'Trojke',
  fours: 'Četvorke',
  fives: 'Petice',
  sixes: 'Šestice',
  threeKind: 'Tri iste',
  fourKind: 'Četiri iste',
  fullHouse: 'Full House',
  smallStraight: 'Mala skala',
  largeStraight: 'Velika skala',
  yahtzee: 'Yahtzee',
  chance: 'Šansa',
}

const PIPS = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

export function YahtzeeGame({ view, onAction, onRestart, mode }: GameBoardProps) {
  const v = view as YView | null
  if (!v) return <div className={styles.loading}>Učitavanje…</div>

  const colLabel = (id: string, i: number) =>
    mode === 'online' ? (id === v.you ? 'Ti' : 'Protivnik') : `Igrač ${i + 1}`

  return (
    <div className={styles.root}>
      <p className={cn(styles.status, v.result && styles.statusDone)}>
        {v.result
          ? v.result.status === 'draw'
            ? 'Neriješeno!'
            : mode === 'online'
              ? v.result.winnerId === v.you
                ? 'Pobijedio si! 🎉'
                : 'Izgubio si.'
              : 'Kraj igre!'
          : v.yourTurn
            ? 'Tvoj potez'
            : 'Potez protivnika'}
      </p>

      <div className={styles.dice}>
        {v.dice.map((d, i) => (
          <button
            key={i}
            className={cn(styles.die, v.held[i] && styles.held, d === 0 && styles.empty)}
            disabled={!v.yourTurn || !v.rolled || !!v.result}
            onClick={() => onAction({ type: 'toggleHold', index: i })}
            aria-label={`Kockica ${d || ''}${v.held[i] ? ', zadržana' : ''}`}
          >
            {d > 0 ? PIPS[d] : '·'}
          </button>
        ))}
      </div>

      {v.yourTurn && !v.result && (
        <div className={styles.controls}>
          <Button
            onClick={() => onAction({ type: 'roll' })}
            disabled={v.rollsLeft <= 0}
            className="neon-glow-cyan"
          >
            Baci kockice ({v.rollsLeft})
          </Button>
          {v.rolled && <span className={styles.hint}>Klikni kockicu da je zadržiš, pa izaberi polje.</span>}
        </div>
      )}

      <table className={styles.card}>
        <thead>
          <tr>
            <th>Kategorija</th>
            {v.order.map((id, i) => (
              <th key={id} className={id === v.turn ? styles.activeCol : undefined}>
                {colLabel(id, i)}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {CATEGORIES.map((cat) => (
            <tr key={cat}>
              <td className={styles.catName}>{LABELS[cat]}</td>
              {v.order.map((id) => {
                const val = v.scores[id]?.[cat]
                const isMe = id === v.you
                const canScore =
                  v.yourTurn && id === v.you && v.rolled && typeof val !== 'number' && !v.result
                if (typeof val === 'number') {
                  return (
                    <td key={id} className={styles.scored}>
                      {val}
                    </td>
                  )
                }
                if (canScore) {
                  return (
                    <td key={id} className={styles.cell}>
                      <button
                        className={styles.pick}
                        onClick={() => onAction({ type: 'score', category: cat })}
                      >
                        {v.potential[cat] ?? 0}
                      </button>
                    </td>
                  )
                }
                return <td key={id} className={styles.cell}>{isMe ? '' : ''}</td>
              })}
            </tr>
          ))}
          <tr className={styles.totalRow}>
            <td>Ukupno</td>
            {v.order.map((id) => (
              <td key={id}>{v.totals[id]}</td>
            ))}
          </tr>
        </tbody>
      </table>

      {v.result && mode === 'local' && onRestart && (
        <Button onClick={onRestart} className="neon-glow-cyan">
          <RotateCcw size={16} /> Nova igra
        </Button>
      )}
    </div>
  )
}
