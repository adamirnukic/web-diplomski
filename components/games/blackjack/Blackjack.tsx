'use client'

import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { BJView, Outcome } from '@shared/games/blackjack/engine'
import type { GameBoardProps } from '../registry'
import { PlayingCard } from '../card'
import styles from './Blackjack.module.css'

const OUTCOME_LABEL: Record<Outcome, string> = {
  win: 'Pobjeda',
  push: 'Neriješeno',
  lose: 'Poraz',
}

export function BlackjackTable({ view, onAction, onRestart, mode }: GameBoardProps) {
  const v = view as BJView | null
  if (!v) return <div className={styles.loading}>Učitavanje…</div>

  const label = (id: string) => `${v.ai[id] ? '🤖 ' : ''}${v.names[id] ?? 'Igrač'}`

  return (
    <div className={styles.root}>
      <div className={styles.dealer}>
        <span className={styles.areaLabel}>
          Djelitelj {v.dealer.value !== null && `(${v.dealer.value})`}
        </span>
        <div className={styles.cards}>
          {v.dealer.cards.map((c, i) => (
            <PlayingCard key={i} card={c} hidden={c === null} />
          ))}
        </div>
        {v.dealer.busted && <span className={styles.bust}>Pregorio!</span>}
      </div>

      <div className={styles.players}>
        {v.order.map((id) => {
          const h = v.hands[id]
          return (
            <div
              key={id}
              className={cn(styles.player, id === v.turn && styles.active)}
            >
              <span className={styles.areaLabel}>
                {label(id)} {id === v.you && mode === 'online' && '(ti) '}({h.value})
              </span>
              <div className={styles.cards}>
                {h.cards.map((c, j) => (
                  <PlayingCard key={j} card={c} small />
                ))}
              </div>
              {h.busted && <span className={styles.bust}>Pregorio!</span>}
              {h.outcome && (
                <span className={cn(styles.outcome, styles[h.outcome])}>
                  {OUTCOME_LABEL[h.outcome]}
                </span>
              )}
            </div>
          )
        })}
      </div>

      {v.phase === 'playing' && v.yourTurn && (
        <div className={styles.actions}>
          <Button onClick={() => onAction({ type: 'hit' })} className="neon-glow-cyan">
            Vuci
          </Button>
          <Button variant="outline" onClick={() => onAction({ type: 'stand' })}>
            Stani
          </Button>
        </div>
      )}
      {v.phase === 'playing' && !v.yourTurn && (
        <p className={styles.wait}>Na potezu: {v.turn ? label(v.turn) : '…'}</p>
      )}

      {v.result && mode === 'local' && onRestart && (
        <Button onClick={onRestart} className="neon-glow-cyan">
          <RotateCcw size={16} /> Nova runda
        </Button>
      )}
    </div>
  )
}
