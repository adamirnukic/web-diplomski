'use client'

import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useT } from '@/lib/i18n'
import { bullheads, type SixNimmtView } from '@shared/games/six-nimmt/engine'
import type { GameBoardProps } from '../registry'
import styles from './SixNimmt.module.css'

const headsSum = (row: number[]) => row.reduce((a, c) => a + bullheads(c), 0)

function headColor(h: number): string {
  if (h >= 7) return 'var(--neon-magenta)'
  if (h >= 5) return '#ff6b6b'
  if (h >= 3) return '#ff9a3c'
  if (h >= 2) return '#e8c53a'
  return 'var(--muted-foreground)'
}

function Tile({ n, onClick }: { n: number; onClick?: () => void }) {
  const h = bullheads(n)
  const inner = (
    <>
      <span className={styles.tileNum}>{n}</span>
      <span className={styles.heads} style={{ color: headColor(h) }}>
        {h}🐮
      </span>
    </>
  )
  if (onClick) {
    return (
      <button type="button" className={cn(styles.tile, styles.tileBtn)} onClick={onClick}>
        {inner}
      </button>
    )
  }
  return <div className={styles.tile}>{inner}</div>
}

export function SixNimmtBoard({ view, onAction, onRestart, mode }: GameBoardProps) {
  const { t } = useT()
  const v = view as SixNimmtView | null
  if (!v) return <div className={styles.loading}>{t('common.loading')}</div>

  const leaderMin = Math.min(...v.seats.map((s) => s.penalty))
  const nameOf = (id?: string) => v.seats.find((s) => s.id === id)?.name ?? ''

  return (
    <div className={styles.root}>
      <div className={styles.scores}>
        {v.seats.map((s) => (
          <span key={s.id} className={cn(styles.score, s.penalty === leaderMin && styles.leader)}>
            {s.isAI ? '🤖 ' : ''}
            {s.name}: {s.penalty}🐮
            {s.roundPenalty > 0 && <span className={styles.roundPen}> (+{s.roundPenalty})</span>}
            {v.phase === 'select' && (s.chose ? ' ✅' : ' …')}
          </span>
        ))}
      </div>

      <div className={styles.rows}>
        {v.rows.map((row, i) => (
          <button
            key={i}
            type="button"
            className={cn(styles.row, v.chooseRow && styles.rowClickable)}
            disabled={!v.chooseRow}
            onClick={v.chooseRow ? () => onAction({ type: 'takeRow', row: i }) : undefined}
          >
            <span className={styles.rowCards}>
              {row.map((c, k) => (
                <Tile key={k} n={c} />
              ))}
            </span>
            {v.chooseRow && (
              <span className={styles.take}>{t('sixnimmt.take', { heads: headsSum(row) })}</span>
            )}
          </button>
        ))}
      </div>

      {v.result ? (
        <div className={styles.panel}>
          <p className={styles.big}>
            {!v.result.winnerId
              ? t('g.draw')
              : mode === 'online'
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
          <p className={styles.big}>{t('sixnimmt.roundOver')}</p>
          <div className={styles.roundSummary}>
            {v.seats.map((s) => (
              <span key={s.id}>
                {s.name}: +{s.roundPenalty}🐮
              </span>
            ))}
          </div>
          <Button onClick={() => onAction({ type: 'next' })} className="neon-glow-cyan">
            {t('sixnimmt.nextRound')}
          </Button>
        </div>
      ) : v.chooseRow ? (
        <div className={styles.panel}>
          <p className={styles.msg}>{t(v.message.k, v.message.p)}</p>
          <p className={styles.hint}>{t('sixnimmt.chooseHint')}</p>
        </div>
      ) : v.yourTurn ? (
        <div className={styles.panel}>
          <p className={styles.msg}>{t('sixnimmt.pickPrompt')}</p>
          <div className={styles.hand}>
            {v.yourHand.map((c) => (
              <Tile key={c} n={c} onClick={() => onAction({ type: 'play', card: c })} />
            ))}
          </div>
        </div>
      ) : (
        <p className={styles.wait}>
          {v.phase === 'select' ? t('sixnimmt.waiting') : t(v.message.k, v.message.p)}
        </p>
      )}
    </div>
  )
}
