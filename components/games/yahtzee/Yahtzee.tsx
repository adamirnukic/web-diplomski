'use client'

import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { CATEGORIES, type YView } from '@shared/games/yahtzee/engine'
import { useT } from '@/lib/i18n'
import type { GameBoardProps } from '../registry'
import styles from './Yahtzee.module.css'

const PIPS = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

export function YahtzeeGame({ view, onAction, onRestart, mode }: GameBoardProps) {
  const { t } = useT()
  const v = view as YView | null
  if (!v) return <div className={styles.loading}>{t('common.loading')}</div>

  const colLabel = (id: string, i: number) =>
    mode === 'online' ? (id === v.you ? t('rps.you') : t('rps.opp')) : t('g.playerN', { n: i + 1 })

  return (
    <div className={styles.root}>
      <p className={cn(styles.status, v.result && styles.statusDone)}>
        {v.result
          ? v.result.status === 'draw'
            ? t('g.draw')
            : mode === 'online'
              ? v.result.winnerId === v.you
                ? t('g.youWin')
                : t('g.youLose')
              : t('g.gameOver')
          : mode === 'online'
            ? v.yourTurn
              ? t('g.yourTurn')
              : t('g.nameTurn', { name: colLabel(v.turn, v.order.indexOf(v.turn)) })
            : t('g.turnOf', { name: colLabel(v.turn, v.order.indexOf(v.turn)) })}
      </p>

      <div className={styles.dice}>
        {v.dice.map((d, i) => (
          <button
            key={`${i}:${d}`}
            className={cn(styles.die, v.held[i] && styles.held, d === 0 && styles.empty)}
            disabled={!v.yourTurn || !v.rolled || !!v.result}
            onClick={() => onAction({ type: 'toggleHold', index: i })}
            aria-label={`${t('y.die', { d: d || '' })}${v.held[i] ? t('y.held') : ''}`}
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
            {t('y.roll', { n: v.rollsLeft })}
          </Button>
          {v.rolled && <span className={styles.hint}>{t('y.hint')}</span>}
        </div>
      )}

      <table className={styles.card}>
        <thead>
          <tr>
            <th>{t('y.category')}</th>
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
              <td className={styles.catName}>{t(`y.${cat}`)}</td>
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
            <td>{t('y.total')}</td>
            {v.order.map((id) => (
              <td key={id}>{v.totals[id]}</td>
            ))}
          </tr>
        </tbody>
      </table>

      {v.result && mode === 'local' && onRestart && (
        <Button onClick={onRestart} className="neon-glow-cyan">
          <RotateCcw size={16} /> {t('g.newGame')}
        </Button>
      )}
    </div>
  )
}
