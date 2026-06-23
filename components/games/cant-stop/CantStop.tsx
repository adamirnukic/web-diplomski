'use client'

import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useT } from '@/lib/i18n'
import type { CantStopView } from '@shared/games/cant-stop/engine'
import type { GameBoardProps } from '../registry'
import styles from './CantStop.module.css'

const PIPS = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅']
const COLORS = ['var(--neon-cyan)', 'var(--neon-magenta)', 'var(--neon-green)', 'var(--neon-purple)']

export function CantStopBoard({ view, onAction, onRestart, mode }: GameBoardProps) {
  const { t } = useT()
  const v = view as CantStopView | null
  if (!v) return <div className={styles.loading}>{t('common.loading')}</div>
  const colorOf = (id: string) => COLORS[v.order.indexOf(id)] ?? 'var(--foreground)'

  return (
    <div className={styles.root}>
      <div className={styles.scores}>
        {v.order.map((id) => (
          <span key={id} style={{ color: colorOf(id) }}>
            {v.names[id]}: {v.claimedCount[id]}/3
          </span>
        ))}
      </div>

      <div className={styles.board}>
        {v.columns.map((col) => (
          <div key={col.col} className={cn(styles.col, col.claimedBy && styles.claimed)}>
            <span
              className={styles.colHead}
              style={col.claimedBy ? { color: colorOf(col.claimedBy) } : undefined}
            >
              {col.col}
            </span>
            <div className={styles.track}>
              {Array.from({ length: col.top }).map((_, k) => {
                const h = k + 1
                const here = col.marks.filter((m) => m.height === h)
                return (
                  <div key={h} className={styles.cell}>
                    {col.temp === h && <span className={styles.temp} />}
                    {here.map((m) => (
                      <span key={m.id} className={styles.mark} style={{ background: colorOf(m.id) }} />
                    ))}
                  </div>
                )
              })}
            </div>
          </div>
        ))}
      </div>

      {v.dice.length > 0 && (
        <div className={styles.dice}>
          {v.dice.map((d, i) => (
            <span key={`${i}:${d}`} className={styles.die}>
              {PIPS[d]}
            </span>
          ))}
        </div>
      )}

      {v.result ? (
        <div className={styles.panel}>
          <p className={styles.big}>
            {mode === 'online'
              ? v.result.winnerId === v.you
                ? t('g.youWinTrophy')
                : t('g.winnerName', { name: v.names[v.result.winnerId ?? ''] ?? '' })
              : t('g.winnerTrophy', { name: v.names[v.result.winnerId ?? ''] ?? '' })}
          </p>
          {mode === 'local' && onRestart && (
            <Button onClick={onRestart} className="neon-glow-cyan">
              <RotateCcw size={16} /> {t('g.newGame')}
            </Button>
          )}
        </div>
      ) : !v.yourTurn ? (
        <p className={styles.wait}>{v.message}</p>
      ) : v.phase === 'rolling' ? (
        <div className={styles.panel}>
          <p className={styles.msg}>{v.message}</p>
          <Button onClick={() => onAction({ type: 'roll' })} className="neon-glow-cyan">
            {t('cs.roll')}
          </Button>
        </div>
      ) : v.phase === 'choosing' ? (
        <div className={styles.panel}>
          <p className={styles.msg}>{t('cs.choosePair')}</p>
          <div className={styles.pairings}>
            {v.pairings.map((pr, i) => (
              <Button
                key={i}
                variant="outline"
                disabled={pr.advance.length === 0}
                onClick={() => onAction({ type: 'choose', pairing: i })}
              >
                {pr.sums[0]} & {pr.sums[1]}
                {pr.advance.length > 0 ? ` → ${pr.advance.join(', ')}` : ' (×)'}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <div className={styles.panel}>
          <p className={styles.msg}>{t('cs.decide')}</p>
          <div className={styles.decide}>
            <Button onClick={() => onAction({ type: 'roll' })} className="neon-glow-magenta">
              {t('cs.rollAgain')}
            </Button>
            <Button onClick={() => onAction({ type: 'stop' })} className="neon-glow-cyan">
              {t('cs.stop')}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
