'use client'

import { useEffect, useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { PerudoView } from '@shared/games/perudo/engine'
import type { GameBoardProps } from '../registry'
import styles from './Perudo.module.css'

const PIPS = ['', '⚀', '⚁', '⚂', '⚃', '⚄', '⚅']

function SeatRow({ v }: { v: PerudoView }) {
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
            <span className={styles.seatCount}>{s.alive ? `${s.diceCount} 🎲` : 'ispao'}</span>
          )}
        </div>
      ))}
    </div>
  )
}

export function PerudoTable({ view, onAction, onRestart, mode }: GameBoardProps) {
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

  if (!v) return <div className={styles.loading}>Učitavanje…</div>

  if (v.phase === 'matchover' || v.result) {
    const winner = v.seats.find((s) => s.id === v.result?.winnerId)
    return (
      <div className={styles.root}>
        <SeatRow v={v} />
        <p className={styles.big}>
          {mode === 'online'
            ? v.result?.winnerId === v.you
              ? 'Pobijedio si! 🏆'
              : `Pobjednik: ${winner?.name}`
            : `Pobjednik: ${winner?.name} 🏆`}
        </p>
        {mode === 'local' && onRestart && (
          <Button onClick={onRestart} className="neon-glow-cyan">
            <RotateCcw size={16} /> Nova igra
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
          Bilo je <strong>{v.lastRound.actual}</strong> × {PIPS[v.lastRound.bid.face]} (licitirano{' '}
          {v.lastRound.bid.count}). {v.lastRound.loserName} gubi kockicu.
        </div>
      )}

      <div className={styles.yourDice}>
        <span className={styles.yourLabel}>Tvoje kockice:</span>
        {v.yourDice.map((d, i) => (
          <span key={i} className={styles.die}>
            {PIPS[d]}
          </span>
        ))}
      </div>

      <div className={styles.bidNow}>
        {v.bid ? (
          <>
            Trenutno: <strong>{v.bid.count} × {PIPS[v.bid.face]}</strong> — {v.bid.byName}
          </>
        ) : (
          'Nema licitacije — ti otvaraš'
        )}
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
              Licitiraj
            </Button>
          </div>
          {v.canChallenge && (
            <Button variant="outline" onClick={() => onAction({ type: 'challenge' })} className={styles.challenge}>
              Laž! (izazov)
            </Button>
          )}
          <p className={styles.hint}>Jedinice (⚀) su džoker — broje se za svako lice.</p>
        </div>
      ) : (
        <p className={styles.wait}>{v.message}</p>
      )}
    </div>
  )
}
