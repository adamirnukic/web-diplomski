'use client'

import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { SkullView } from '@shared/games/skull/engine'
import type { GameBoardProps } from '../registry'
import styles from './Skull.module.css'

const ICON = { flower: '🌹', skull: '💀' } as const

export function SkullBoard({ view, onAction, onRestart, mode }: GameBoardProps) {
  const v = view as SkullView | null
  const [bidCount, setBidCount] = useState(1)
  if (!v) return <div className={styles.loading}>Učitavanje…</div>

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
          {v.lastReveal.type === 'skull' ? '— lobanja!' : ''}
        </p>
      )}
      <p className={styles.msg}>{v.message}</p>

      {/* Your hand */}
      {v.yourHand.flowers + (v.yourHand.skull ? 1 : 0) > 0 && (
        <div className={styles.hand}>
          <span className={styles.handLabel}>Tvoji diskovi:</span>
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
                ? 'Pobijedio si! 🏆'
                : `Pobjednik: ${v.seats.find((s) => s.id === v.result?.winnerId)?.name}`
              : `Pobjednik: ${v.seats.find((s) => s.id === v.result?.winnerId)?.name} 🏆`}
          </p>
          {mode === 'local' && onRestart && (
            <Button onClick={onRestart} className="neon-glow-cyan">
              <RotateCcw size={16} /> Nova igra
            </Button>
          )}
        </div>
      ) : !v.yourTurn ? (
        <p className={styles.wait}>{v.bidderName && v.bid > 0 ? `Licitacija: ${v.bid} (${v.bidderName})` : 'Čekaj svoj red…'}</p>
      ) : v.phase === 'placing' ? (
        <div className={styles.panel}>
          <div className={styles.actions}>
            {v.yourHand.flowers > 0 && (
              <Button onClick={() => onAction({ type: 'place', disc: 'flower' })}>Položi 🌹</Button>
            )}
            {v.yourHand.skull && (
              <Button variant="outline" onClick={() => onAction({ type: 'place', disc: 'skull' })}>
                Položi 💀
              </Button>
            )}
          </div>
          {v.canBid && (
            <BidControl
              label="Licitiraj"
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
          <p className={styles.msg}>Trenutna licitacija: {v.bid} ({v.bidderName})</p>
          <div className={styles.actions}>
            <BidControl
              label="Podigni"
              bid={bid}
              min={minBid}
              max={v.placedTotal}
              onChange={setBidCount}
              onSubmit={() => onAction({ type: 'bid', count: bid })}
            />
            <Button variant="outline" onClick={() => onAction({ type: 'pass' })}>
              Pasiraj
            </Button>
          </div>
        </div>
      ) : v.isChallenger ? (
        <div className={styles.panel}>
          <p className={styles.msg}>
            Okreni cvjetove ({v.flippedFlowers}/{v.bid}){v.ownFlipDone ? ' — sad biraj protivnike' : ' — prvo svoje'}
          </p>
          <div className={styles.actions}>
            {v.flipTargets.map((t) => (
              <Button key={t.id} onClick={() => onAction({ type: 'flip', target: t.id })}>
                {t.id === v.you ? 'Svoj disk' : t.name}
              </Button>
            ))}
          </div>
        </div>
      ) : (
        <p className={styles.wait}>{v.message}</p>
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
