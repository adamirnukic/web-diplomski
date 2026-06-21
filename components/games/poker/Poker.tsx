'use client'

import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { PokerView } from '@shared/games/poker/engine'
import type { GameBoardProps } from '../registry'
import { PlayingCard } from '../card'
import styles from './Poker.module.css'

const STREET_LABEL: Record<string, string> = {
  preflop: 'Pre-flop',
  flop: 'Flop',
  turn: 'Turn',
  river: 'River',
}

export function PokerTable({ view, onAction, onRestart, mode }: GameBoardProps) {
  const v = view as PokerView | null
  if (!v) return <div className={styles.loading}>Učitavanje…</div>

  return (
    <div className={styles.root}>
      {/* Opponent */}
      <div className={styles.seat}>
        <span className={styles.seatLabel}>Protivnik · {v.oppChips} 🪙</span>
        <div className={styles.cards}>
          {v.oppHole.map((c, i) => (
            <PlayingCard key={i} card={c} hidden={c === null} small />
          ))}
        </div>
      </div>

      {/* Board */}
      <div className={styles.middle}>
        <span className={styles.street}>{STREET_LABEL[v.street]}</span>
        <div className={styles.community}>
          {v.community.length === 0
            ? Array.from({ length: 5 }).map((_, i) => <div key={i} className={styles.placeholder} />)
            : v.community.map((c, i) => <PlayingCard key={i} card={c} />)}
        </div>
        <span className={styles.pot}>Pot: {v.pot} 🪙</span>
      </div>

      {/* You */}
      <div className={styles.seat}>
        <div className={styles.cards}>
          {v.yourHole.map((c, i) => (
            <PlayingCard key={i} card={c} />
          ))}
        </div>
        <span className={styles.seatLabel}>
          Ti · {v.yourChips} 🪙 {v.yourHandName && `· ${v.yourHandName}`}
        </span>
      </div>

      {/* Status / actions */}
      {v.phase === 'matchover' || v.result ? (
        <div className={styles.result}>
          <p className={styles.resultText}>
            {mode === 'online'
              ? v.result?.winnerId === v.you
                ? 'Pobijedio si meč! 🎉'
                : 'Izgubio si meč.'
              : 'Kraj meča!'}
          </p>
          {mode === 'local' && onRestart && (
            <Button onClick={onRestart} className="neon-glow-cyan">
              <RotateCcw size={16} /> Novi meč
            </Button>
          )}
        </div>
      ) : v.phase === 'handover' ? (
        <div className={styles.result}>
          <p className={styles.handInfo}>
            {v.hand?.winnerId === null
              ? 'Podijeljen pot'
              : v.hand?.winnerId === v.you
                ? `Dobio si pot — ${v.hand?.reason}`
                : `Protivnik dobija — ${v.hand?.reason}`}
          </p>
          <Button onClick={() => onAction({ type: 'next' })} className="neon-glow-cyan">
            Sljedeća ruka
          </Button>
        </div>
      ) : v.yourTurn ? (
        <div className={styles.actions}>
          <Button variant="outline" onClick={() => onAction({ type: 'fold' })}>
            Odustani
          </Button>
          {v.canCheck ? (
            <Button onClick={() => onAction({ type: 'check' })}>Čekiraj</Button>
          ) : (
            <Button onClick={() => onAction({ type: 'call' })} className="neon-glow-cyan">
              Prati ({v.toCall})
            </Button>
          )}
          {v.canRaise && (
            <Button onClick={() => onAction({ type: 'raise' })} className="neon-glow-green">
              Podigni
            </Button>
          )}
        </div>
      ) : (
        <p className={styles.wait}>Protivnik je na potezu…</p>
      )}
    </div>
  )
}
