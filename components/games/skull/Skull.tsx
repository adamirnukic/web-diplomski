'use client'

import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useT } from '@/lib/i18n'
import type { SkullView } from '@shared/games/skull/engine'
import type { GameBoardProps } from '../registry'
import styles from './Skull.module.css'

const ICON = { flower: '🌹', skull: '💀' } as const

export function SkullBoard({ view, onAction, onRestart, mode }: GameBoardProps) {
  const { t } = useT()
  const v = view as SkullView | null
  const [bidCount, setBidCount] = useState(1)
  if (!v) return <div className={styles.loading}>{t('common.loading')}</div>


  const minBid = v.phase === 'bidding' ? v.bid + 1 : 1
  const bid = Math.max(minBid, Math.min(bidCount, v.placedTotal))

  return (
    <div className={styles.root}>
      <div className={styles.seats}>
        {v.seats.map((s) => (
          <div
            key={s.id}
            className={cn(
              styles.seat,
              s.isTurn && styles.seatTurn,
              !s.alive && styles.seatOut,
              s.id === v.you && styles.seatYou,
            )}
          >
            <span className={styles.seatName}>
              {s.isAI ? '🤖 ' : ''}
              {s.name} {s.isBidder ? '📣' : ''} {s.passed ? '✖' : ''}
            </span>
            <span className={styles.pts}>{'🏆'.repeat(s.points) || '—'}</span>
            <div className={styles.discRow}>
              {s.revealed.map((d, i) => (
                <span key={`r${i}`} className={styles.disc}>
                  {ICON[d]}
                </span>
              ))}
              {Array.from({ length: s.placed - s.revealed.length }).map((_, i) => (
                <span key={`b${i}`} className={cn(styles.disc, styles.back)} />
              ))}
            </div>
            <span className={styles.owned}>{s.discs} 🪙</span>
          </div>
        ))}
      </div>

      {v.lastReveal && (
        <p className={styles.reveal}>
          {v.lastReveal.ownerName}: {ICON[v.lastReveal.type]}{' '}
          {v.lastReveal.type === 'skull' ? t('skull.skullRevealed') : ''}
        </p>
      )}
      <p className={styles.msg}>{t(v.message.k, v.message.p)}</p>

      {/* Your hand */}
      {v.yourHand.flowers + (v.yourHand.skull ? 1 : 0) > 0 && (
        <div className={styles.hand}>
          <span className={styles.handLabel}>{t('skull.yourDiscs')}</span>
          {Array.from({ length: v.yourHand.flowers }).map((_, i) => (
            <span key={i} className={styles.disc}>
              🌹
            </span>
          ))}
          {v.yourHand.skull && <span className={styles.disc}>💀</span>}
        </div>
      )}

      {/* Controls */}
      {v.result ? (
        <div className={styles.panel}>
          <p className={styles.big}>
            {mode === 'online'
              ? v.result.winnerId === v.you
                ? t('g.youWinTrophy')
                : t('g.winnerName', { name: v.seats.find((s) => s.id === v.result?.winnerId)?.name ?? '' })
              : t('g.winnerTrophy', { name: v.seats.find((s) => s.id === v.result?.winnerId)?.name ?? '' })}
          </p>
          {mode === 'local' && onRestart && (
            <Button onClick={onRestart} className="neon-glow-cyan">
              <RotateCcw size={16} /> {t('g.newGame')}
            </Button>
          )}
        </div>
      ) : !v.yourTurn ? (
        <p className={styles.wait}>
          {v.bidderName && v.bid > 0
            ? t('skull.bidLine', { bid: v.bid, by: v.bidderName })
            : t('skull.waitTurn')}
        </p>
      ) : v.phase === 'placing' ? (
        <div className={styles.panel}>
          <div className={styles.actions}>
            {v.yourHand.flowers > 0 && (
              <Button onClick={() => onAction({ type: 'place', disc: 'flower' })}>
                {t('skull.placeFlower')}
              </Button>
            )}
            {v.yourHand.skull && (
              <Button variant="outline" onClick={() => onAction({ type: 'place', disc: 'skull' })}>
                {t('skull.placeSkull')}
              </Button>
            )}
          </div>
          {v.canBid && (
            <BidControl
              label={t('skull.bid')}
              bid={bid}
              min={1}
              max={v.placedTotal}
              onChange={setBidCount}
              onSubmit={() => onAction({ type: 'bid', count: bid })}
            />
          )}
        </div>
      ) : v.phase === 'bidding' ? (
        <div className={styles.panel}>
          <p className={styles.msg}>{t('skull.currentBid', { bid: v.bid, by: v.bidderName ?? '' })}</p>
          <div className={styles.actions}>
            <BidControl
              label={t('skull.raise')}
              bid={bid}
              min={minBid}
              max={v.placedTotal}
              onChange={setBidCount}
              onSubmit={() => onAction({ type: 'bid', count: bid })}
            />
            <Button variant="outline" onClick={() => onAction({ type: 'pass' })}>
              {t('skull.pass')}
            </Button>
          </div>
        </div>
      ) : v.isChallenger ? (
        <div className={styles.panel}>
          <p className={styles.msg}>
            {t('skull.flip', { n: v.flippedFlowers, bid: v.bid })}
            {v.ownFlipDone ? t('skull.flipOthers') : t('skull.flipOwn')}
          </p>
          <div className={styles.actions}>
            {v.flipTargets.map((ft) => (
              <Button key={ft.id} onClick={() => onAction({ type: 'flip', target: ft.id })}>
                {ft.id === v.you ? t('skull.ownDisc') : ft.name}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <p className={styles.wait}>{t(v.message.k, v.message.p)}</p>
      )}
    </div>
  )
}

function BidControl({
  label,
  bid,
  min,
  max,
  onChange,
  onSubmit,
}: {
  label: string
  bid: number
  min: number
  max: number
  onChange: (n: number) => void
  onSubmit: () => void
}) {
  return (
    <div className={styles.bidControl}>
      <div className={styles.counter}>
        <button onClick={() => onChange(Math.max(min, bid - 1))}>−</button>
        <span>{bid}</span>
        <button onClick={() => onChange(Math.min(max, bid + 1))}>+</button>
      </div>
      <Button className="neon-glow-cyan" disabled={max < min} onClick={onSubmit}>
        {label} {bid}
      </Button>
    </div>
  )
}
