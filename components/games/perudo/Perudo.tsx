'use client'

import { useEffect, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useT } from '@/lib/i18n'
import type { PerudoView } from '@shared/games/perudo/engine'
import type { GameBoardProps } from '../registry'
import styles from './Perudo.module.css'

const PIPS = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

function SeatRow({ v }: { v: PerudoView }) {
  const { t } = useT()
  return (
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
            {s.name}
          </span>
          {s.revealed ? (
            <span className={styles.seatDice}>
              {s.revealed.map((d, i) => (
                <span key={i}>{PIPS[d]}</span>
              ))}
            </span>
          ) : (
            <span className={styles.seatCount}>{s.alive ? `${s.diceCount} 🎲` : t('g.out')}</span>
          )}
        </div>
      ))}
    </div>
  )
}

export function PerudoTable({ view, onAction, onRestart, mode }: GameBoardProps) {
  const { t } = useT()
  const v = view as PerudoView | null
  const [count, setCount] = useState(1)
  const [face, setFace] = useState(2)

  // suggest a minimal legal raise whenever the current bid changes
  const bidKey = v?.bid ? `${v.bid.count}-${v.bid.face}` : 'none'
  useEffect(() => {
    if (!v) return
    if (v.bid) {
      if (v.bid.face < 6) {
        setCount(v.bid.count)
        setFace(v.bid.face + 1)
      } else {
        setCount(v.bid.count + 1)
        setFace(2)
      }
    } else {
      setCount(1)
      setFace(2)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bidKey])

  if (!v) return <div className={styles.loading}>{t('common.loading')}</div>

  if (v.phase === 'matchover' || v.result) {
    const winner = v.seats.find((s) => s.id === v.result?.winnerId)
    return (
      <div className={styles.root}>
        <SeatRow v={v} />
        <p className={styles.big}>
          {mode === 'online'
            ? v.result?.winnerId === v.you
              ? t('g.youWinTrophy')
              : t('g.winnerName', { name: winner?.name ?? '' })
            : t('g.winnerTrophy', { name: winner?.name ?? '' })}
        </p>
        {mode === 'local' && onRestart && (
          <Button onClick={onRestart} className="neon-glow-cyan">
            <RotateCcw size={16} /> {t('g.newGame')}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <SeatRow v={v} />

      {v.lastRound && (
        <div className={styles.reveal}>
          {t('perudo.reveal', {
            actual: v.lastRound.actual,
            face: PIPS[v.lastRound.bid.face],
            count: v.lastRound.bid.count,
            loser: v.lastRound.loserName,
          })}
        </div>
      )}

      <div className={styles.yourDice}>
        <span className={styles.yourLabel}>{t('perudo.yourDice')}</span>
        {v.yourDice.map((d, i) => (
          <span key={`${i}:${d}`} className={styles.die}>
            {PIPS[d]}
          </span>
        ))}
      </div>

      <div className={styles.bidNow}>
        {v.bid
          ? t('perudo.current', { bid: `${v.bid.count} × ${PIPS[v.bid.face]}`, by: v.bid.byName })
          : t('perudo.noBid')}
      </div>

      {v.yourTurn ? (
        <div className={styles.controls}>
          <div className={styles.bidForm}>
            <div className={styles.counter}>
              <button onClick={() => setCount((c) => Math.max(1, c - 1))}>−</button>
              <span>{count}</span>
              <button onClick={() => setCount((c) => Math.min(v.totalDice, c + 1))}>+</button>
            </div>
            <span className={styles.times}>×</span>
            <div className={styles.faces}>
              {[2, 3, 4, 5, 6].map((f) => (
                <button
                  key={f}
                  className={cn(styles.faceBtn, face === f && styles.faceActive)}
                  onClick={() => setFace(f)}
                >
                  {PIPS[f]}
                </button>
              ))}
            </div>
            <Button onClick={() => onAction({ type: 'bid', count, face })} className="neon-glow-cyan">
              {t('perudo.bid')}
            </Button>
          </div>
          {v.canChallenge && (
            <Button variant="outline" onClick={() => onAction({ type: 'challenge' })} className={styles.challenge}>
              {t('perudo.challenge')}
            </Button>
          )}
          <p className={styles.hint}>{t('perudo.hint')}</p>
        </div>
      ) : (
        <p className={styles.wait}>{t(v.message.k, v.message.p)}</p>
      )}
    </div>
  )
}
