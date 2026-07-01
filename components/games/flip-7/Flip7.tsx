'use client'

import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useT } from '@/lib/i18n'
import type { Flip7Card, Flip7View } from '@shared/games/flip-7/engine'
import type { GameBoardProps } from '../registry'
import styles from './Flip7.module.css'

function CardChip({ c }: { c: Flip7Card }) {
  if (c.t === 'num') return <span className={styles.numCard}>{c.n}</span>
  if (c.t === 'add') return <span className={styles.modCard}>+{c.v}</span>
  if (c.t === 'x2') return <span className={styles.modCard}>×2</span>
  return null
}

function lastCardLabel(c: Flip7Card): string {
  if (c.t === 'num') return `${c.n}`
  if (c.t === 'add') return `+${c.v}`
  if (c.t === 'x2') return '×2'
  if (c.t === 'freeze') return '❄️ Freeze'
  if (c.t === 'flip3') return '🔄 Flip Three'
  return '🛡️ Second Chance'
}

export function Flip7Board({ view, onAction, onRestart, mode }: GameBoardProps) {
  const { t } = useT()
  const v = view as Flip7View | null
  if (!v) return <div className={styles.loading}>{t('common.loading')}</div>
  const nameOf = (id?: string) => v.seats.find((s) => s.id === id)?.name ?? ''

  return (
    <div className={styles.root}>
      <div className={styles.seats}>
        {v.seats.map((s) => (
          <div
            key={s.id}
            className={cn(
              styles.seat,
              s.isTurn && styles.seatTurn,
              s.busted && styles.seatBusted,
              !s.active && !s.busted && styles.seatStayed,
              s.id === v.you && styles.seatYou,
            )}
          >
            <div className={styles.seatHead}>
              <span className={styles.seatName}>
                {s.isAI ? '🤖 ' : ''}
                {s.name}
              </span>
              <span className={styles.seatScore}>{s.score}</span>
            </div>
            <div className={styles.seatCards}>
              {s.cards.length === 0 && !s.busted ? (
                <span className={styles.empty}>—</span>
              ) : (
                s.cards.map((c, i) => <CardChip key={i} c={c} />)
              )}
              {s.hasSecond && <span className={styles.second}>🛡️</span>}
            </div>
            <div className={styles.seatFoot}>
              {s.busted ? (
                <span className={styles.bustTag}>💥 {t('flip7.bust')}</span>
              ) : !s.active ? (
                <span className={styles.stayTag}>🏦 {s.roundScore}</span>
              ) : (
                <span className={styles.uniq}>
                  {s.uniqueNums}/7{s.roundScore > 0 ? ` · ${s.roundScore}` : ''}
                </span>
              )}
            </div>
          </div>
        ))}
      </div>

      {v.lastCard && (
        <div className={styles.lastCard}>
          {t('flip7.lastCard')} <strong>{lastCardLabel(v.lastCard)}</strong>
        </div>
      )}

      {v.result ? (
        <div className={styles.panel}>
          <p className={styles.big}>
            {mode === 'online'
              ? v.result.winnerId === v.you
                ? t('g.youWinTrophy')
                : t('g.winnerName', { name: nameOf(v.result.winnerId) })
              : t('g.winnerTrophy', { name: nameOf(v.result.winnerId) })}
          </p>
          {mode === 'local' && onRestart && (
            <Button onClick={onRestart} className="neon-glow-cyan">
              <RotateCcw size={16} /> {t('g.newGame')}
            </Button>
          )}
        </div>
      ) : v.phase === 'roundover' ? (
        <div className={styles.panel}>
          <p className={styles.big}>{t('flip7.roundOver')}</p>
          <Button onClick={() => onAction({ type: 'next' })} className="neon-glow-cyan">
            {t('flip7.nextRound')}
          </Button>
        </div>
      ) : v.target ? (
        <div className={styles.panel}>
          <p className={styles.msg}>
            {t(v.target.kind === 'freeze' ? 'flip7.chooseFreeze' : 'flip7.chooseFlip3')}
          </p>
          <div className={styles.targets}>
            {v.target.options.map((id) => (
              <Button key={id} variant="outline" onClick={() => onAction({ type: 'target', player: id })}>
                {nameOf(id)}
                {id === v.you ? ` (${t('flip7.self')})` : ''}
              </Button>
            ))}
          </div>
        </div>
      ) : v.yourTurn ? (
        <div className={styles.panel}>
          <div className={styles.actions}>
            <Button onClick={() => onAction({ type: 'hit' })} className="neon-glow-green">
              {t('flip7.hit')}
            </Button>
            <Button
              variant="outline"
              disabled={!v.canStay}
              onClick={() => onAction({ type: 'stay' })}
            >
              {t('flip7.stay')}
            </Button>
          </div>
          <p className={styles.hint}>{t('flip7.hint')}</p>
        </div>
      ) : (
        <p className={styles.wait}>{t(v.message.k, v.message.p)}</p>
      )}
    </div>
  )
}
