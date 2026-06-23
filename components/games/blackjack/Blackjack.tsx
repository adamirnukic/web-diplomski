'use client'

import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useT } from '@/lib/i18n'
import type { BJView, Outcome } from '@shared/games/blackjack/engine'
import type { GameBoardProps } from '../registry'
import { PlayingCard } from '../card'
import styles from './Blackjack.module.css'

const OUTCOME_KEY: Record<Outcome, string> = { win: 'res.win', push: 'res.draw', lose: 'res.loss' }

export function BlackjackTable({ view, onAction, onRestart, mode }: GameBoardProps) {
  const { t } = useT()
  const v = view as BJView | null
  if (!v) return <div className={styles.loading}>{t('common.loading')}</div>

  const label = (id: string) => `${v.ai[id] ? '🤖 ' : ''}${v.names[id] ?? 'Igrač'}`

  return (
    <div className={styles.root}>
      <div className={styles.dealer}>
        <span className={styles.areaLabel}>
          {t('bj.dealer')} {v.dealer.value !== null && `(${v.dealer.value})`}
        </span>
        <div className={styles.cards}>
          {v.dealer.cards.map((c, i) => (
            <PlayingCard key={i} card={c} hidden={c === null} />
          ))}
        </div>
        {v.dealer.busted && <span className={styles.bust}>{t('bj.bust')}</span>}
      </div>

      <div className={styles.players}>
        {v.order.map((id) => {
          const h = v.hands[id]
          return (
            <div key={id} className={cn(styles.player, id === v.turn && styles.active)}>
              <span className={styles.areaLabel}>
                {label(id)} {id === v.you && mode === 'online' && `${t('room.you')} `}({h.value})
              </span>
              <div className={styles.cards}>
                {h.cards.map((c, j) => (
                  <PlayingCard key={j} card={c} small />
                ))}
              </div>
              {h.busted && <span className={styles.bust}>{t('bj.bust')}</span>}
              {h.outcome && (
                <span className={cn(styles.outcome, styles[h.outcome])}>{t(OUTCOME_KEY[h.outcome])}</span>
              )}
            </div>
          )
        })}
      </div>

      {v.phase === 'playing' && v.yourTurn && (
        <div className={styles.actions}>
          <Button onClick={() => onAction({ type: 'hit' })} className="neon-glow-cyan">
            {t('bj.hit')}
          </Button>
          <Button variant="outline" onClick={() => onAction({ type: 'stand' })}>
            {t('bj.stand')}
          </Button>
        </div>
      )}
      {v.phase === 'playing' && !v.yourTurn && (
        <p className={styles.wait}>{t('g.turnOf', { name: v.turn ? label(v.turn) : '…' })}</p>
      )}

      {v.result && mode === 'local' && onRestart && (
        <Button onClick={onRestart} className="neon-glow-cyan">
          <RotateCcw size={16} /> {t('g.newRound')}
        </Button>
      )}
    </div>
  )
}
