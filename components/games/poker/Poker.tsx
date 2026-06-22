'use client'

import { useState } from 'react'
import { RotateCcw, Bot, CircleDot } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { PokerSeat, PokerView } from '@shared/games/poker/engine'
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
  const [raiseAmt, setRaiseAmt] = useState(0)
  if (!v) return <div className={styles.loading}>Učitavanje…</div>

  const nameOf = (id: string) => v.seats.find((s) => s.id === id)?.name ?? 'Igrač'
  const turnSeat = v.seats.find((s) => s.isTurn)
  const canRaise = v.maxRaise > v.currentBet
  const amt = Math.max(v.minRaise, Math.min(raiseAmt || v.minRaise, v.maxRaise))

  const quick = (target: number) => setRaiseAmt(Math.max(v.minRaise, Math.min(target, v.maxRaise)))

  return (
    <div className={styles.root}>
      {/* Seats */}
      <div className={styles.seats}>
        {v.seats.map((s) => (
          <Seat key={s.id} seat={s} isYou={s.id === v.you} />
        ))}
      </div>

      {/* Community + pot */}
      <div className={styles.middle}>
        <span className={styles.street}>{STREET_LABEL[v.street]}</span>
        <div className={styles.community}>
          {v.community.length === 0
            ? Array.from({ length: 5 }).map((_, i) => <div key={i} className={styles.placeholder} />)
            : v.community.map((c, i) => <PlayingCard key={i} card={c} />)}
        </div>
        <span className={styles.pot}>Pot: {v.pot} 🪙</span>
        {v.yourHandName && <span className={styles.handName}>Tvoja ruka: {v.yourHandName}</span>}
      </div>

      {/* Controls */}
      {v.phase === 'matchover' || v.result ? (
        <div className={styles.panel}>
          <p className={styles.bigText}>
            {v.result ? `Pobjednik meča: ${nameOf(v.result.winnerId ?? '')} 🏆` : 'Kraj meča'}
          </p>
          {mode === 'local' && onRestart && (
            <Button onClick={onRestart} className="neon-glow-cyan">
              <RotateCcw size={16} /> Nova igra
            </Button>
          )}
        </div>
      ) : v.phase === 'handover' ? (
        <div className={styles.panel}>
          <p className={styles.handInfo}>
            {v.hand
              ? v.hand.winners.length > 1
                ? `Podijeljen pot (${v.hand.reason})`
                : `${nameOf(v.hand.winners[0])} dobija pot — ${v.hand.reason}`
              : 'Kraj ruke'}
          </p>
          <Button onClick={() => onAction({ type: 'next' })} className="neon-glow-cyan">
            Sljedeća ruka
          </Button>
        </div>
      ) : v.canAct ? (
        <div className={styles.panel}>
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
          </div>

          {canRaise && (
            <div className={styles.raiseBox}>
              <div className={styles.raiseRow}>
                <Input
                  type="number"
                  min={v.minRaise}
                  max={v.maxRaise}
                  value={amt}
                  onChange={(e) => setRaiseAmt(Number(e.target.value))}
                  className={styles.raiseInput}
                />
                <Button
                  onClick={() => onAction({ type: 'raise', amount: amt })}
                  className="neon-glow-green"
                >
                  {amt >= v.maxRaise ? 'All-in' : `Podigni na ${amt}`}
                </Button>
              </div>
              <div className={styles.quick}>
                <button className={styles.chip} onClick={() => quick(v.minRaise)}>Min</button>
                <button className={styles.chip} onClick={() => quick(v.currentBet + Math.round(v.pot / 2))}>½ pota</button>
                <button className={styles.chip} onClick={() => quick(v.currentBet + v.pot)}>Pot</button>
                <button className={styles.chip} onClick={() => quick(v.maxRaise)}>All-in</button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <p className={styles.wait}>
          {turnSeat ? `Na potezu: ${turnSeat.name}${turnSeat.isAI ? ' 🤖' : ''}…` : 'Čekanje…'}
        </p>
      )}
    </div>
  )
}

function Seat({ seat, isYou }: { seat: PokerSeat; isYou: boolean }) {
  return (
    <div
      className={cn(
        styles.seat,
        seat.isTurn && styles.seatActive,
        seat.folded && styles.seatFolded,
        isYou && styles.seatYou,
      )}
    >
      <div className={styles.seatHead}>
        {seat.isButton && <span className={styles.dealer}>D</span>}
        {seat.isAI && <Bot size={14} />}
        <span className={styles.seatName}>{seat.name}</span>
      </div>
      <div className={styles.seatCards}>
        {seat.hole.length === 0 ? (
          <span className={styles.seatOut}>—</span>
        ) : (
          seat.hole.map((c, i) => <PlayingCard key={i} card={c} hidden={c === null} small />)
        )}
      </div>
      <div className={styles.seatFoot}>
        <span className={styles.seatChips}>
          <CircleDot size={12} /> {seat.chips}
        </span>
        {seat.committed > 0 && <span className={styles.seatBet}>ulog {seat.committed}</span>}
        {seat.allIn && <span className={styles.allIn}>ALL-IN</span>}
        {seat.folded && !seat.out && <span className={styles.foldTag}>fold</span>}
      </div>
    </div>
  )
}
