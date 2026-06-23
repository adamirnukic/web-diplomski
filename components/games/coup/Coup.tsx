'use client'

import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { CoupActionType, CoupCard, CoupView } from '@shared/games/coup/engine'
import type { GameBoardProps } from '../registry'
import styles from './Coup.module.css'

const CARD_LABEL: Record<CoupCard, string> = {
  duke: 'Vojvoda',
  assassin: 'Ubica',
  captain: 'Kapetan',
  ambassador: 'Ambasador',
  contessa: 'Grofica',
}

const ACTION_LABEL: Record<CoupActionType, string> = {
  income: 'Prihod (+1)',
  foreign_aid: 'Strana pomoć (+2)',
  coup: 'Coup (7)',
  tax: 'Porez · Vojvoda (+3)',
  assassinate: 'Ubistvo · Ubica (3)',
  steal: 'Krađa · Kapetan',
  exchange: 'Zamjena · Ambasador',
}

const TARGET_ACTIONS: CoupActionType[] = ['coup', 'assassinate', 'steal']

export function CoupTable({ view, onAction, onRestart, mode }: GameBoardProps) {
  const v = view as CoupView | null
  const [choosing, setChoosing] = useState<CoupActionType | null>(null)
  const [keep, setKeep] = useState<number[]>([])
  if (!v) return <div className={styles.loading}>Učitavanje…</div>

  const me = v.seats.find((s) => s.id === v.you)
  const myCoins = me?.coins ?? 0
  const opponents = v.seats.filter((s) => s.id !== v.you && !s.out)

  const act = (a: CoupActionType, target?: string) => {
    setChoosing(null)
    onAction(target ? { type: a, target } : { type: a })
  }

  // ---- result ----
  if (v.result) {
    const winner = v.seats.find((s) => !s.out)
    return (
      <div className={styles.root}>
        <Seats v={v} />
        <div className={styles.panel}>
          <p className={styles.big}>
            {mode === 'online'
              ? v.result.winnerId === v.you
                ? 'Pobijedio si! 🏆'
                : `Pobjednik: ${winner?.name ?? ''}`
              : `Pobjednik: ${winner?.name ?? ''} 🏆`}
          </p>
          {mode === 'local' && onRestart && (
            <Button onClick={onRestart} className="neon-glow-cyan">
              <RotateCcw size={16} /> Nova igra
            </Button>
          )}
        </div>
        <Log v={v} />
      </div>
    )
  }

  let panel = null

  if (!v.yourTurn && v.phase === 'action') {
    const turnName = v.seats.find((s) => s.id === v.turn)?.name ?? ''
    panel = <p className={styles.muted}>Na potezu: {turnName}…</p>
  } else if (v.phase === 'action' && v.yourTurn) {
    panel = (
      <div className={styles.panel}>
        {choosing ? (
          <>
            <p className={styles.prompt}>{ACTION_LABEL[choosing]} → izaberi metu:</p>
            <div className={styles.actions}>
              {opponents.map((o) => (
                <Button key={o.id} variant="outline" onClick={() => act(choosing, o.id)}>
                  {o.name}
                </Button>
              ))}
              <Button variant="ghost" onClick={() => setChoosing(null)}>
                Otkaži
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className={styles.prompt}>Tvoj potez{v.mustCoup ? ' — moraš izvesti Coup!' : ''}</p>
            <div className={styles.actions}>
              {v.mustCoup ? (
                <Button onClick={() => setChoosing('coup')} className="neon-glow-cyan">
                  {ACTION_LABEL.coup}
                </Button>
              ) : (
                <>
                  <Button onClick={() => act('income')}>{ACTION_LABEL.income}</Button>
                  <Button onClick={() => act('foreign_aid')}>{ACTION_LABEL.foreign_aid}</Button>
                  <Button onClick={() => act('tax')}>{ACTION_LABEL.tax}</Button>
                  <Button onClick={() => act('exchange')}>{ACTION_LABEL.exchange}</Button>
                  <Button
                    onClick={() => setChoosing('steal')}
                    disabled={opponents.length === 0}
                  >
                    {ACTION_LABEL.steal}
                  </Button>
                  <Button
                    onClick={() => setChoosing('assassinate')}
                    disabled={myCoins < 3 || opponents.length === 0}
                  >
                    {ACTION_LABEL.assassinate}
                  </Button>
                  <Button
                    onClick={() => setChoosing('coup')}
                    disabled={myCoins < 7 || opponents.length === 0}
                    className="neon-glow-cyan"
                  >
                    {ACTION_LABEL.coup}
                  </Button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    )
  } else if (v.phase === 'lose' && v.yourTurn) {
    panel = (
      <div className={styles.panel}>
        <p className={styles.prompt}>Gubiš uticaj — izaberi kartu koju otkrivaš:</p>
        <div className={styles.actions}>
          {(v.youCan?.loseChoices ?? []).map((c, i) => (
            <Button key={i} variant="outline" onClick={() => onAction({ type: 'lose', card: c })}>
              {CARD_LABEL[c]}
            </Button>
          ))}
        </div>
      </div>
    )
  } else if (v.phase === 'exchange' && v.yourTurn && v.youCan?.exchange) {
    const ex = v.youCan.exchange
    const toggle = (i: number) =>
      setKeep((k) =>
        k.includes(i) ? k.filter((x) => x !== i) : k.length < ex.keep ? [...k, i] : k,
      )
    panel = (
      <div className={styles.panel}>
        <p className={styles.prompt}>Zamjena — zadrži {ex.keep}:</p>
        <div className={styles.hand}>
          {ex.options.map((c, i) => (
            <button
              key={i}
              className={cn(styles.chip, keep.includes(i) && styles.chipSel)}
              onClick={() => toggle(i)}
            >
              {CARD_LABEL[c]}
            </button>
          ))}
        </div>
        <Button
          className="neon-glow-cyan"
          disabled={keep.length !== ex.keep}
          onClick={() => {
            onAction({ type: 'keep', cards: keep.map((i) => ex.options[i]) })
            setKeep([])
          }}
        >
          Potvrdi
        </Button>
      </div>
    )
  } else if (
    (v.phase === 'response' || v.phase === 'blockResponse' || v.phase === 'targetBlock') &&
    v.yourTurn &&
    v.pending
  ) {
    const p = v.pending
    const desc =
      v.phase === 'blockResponse'
        ? `${p.blocker} blokira (${p.blockCard ? CARD_LABEL[p.blockCard] : ''})`
        : `${p.actor}: ${ACTION_LABEL[p.action]}${p.targetName ? ' → ' + p.targetName : ''}`
    panel = (
      <div className={styles.panel}>
        <p className={styles.prompt}>{desc}</p>
        <div className={styles.actions}>
          <Button variant="ghost" onClick={() => onAction({ type: 'pass' })}>
            Propusti
          </Button>
          {v.youCan?.canChallenge && (
            <Button variant="outline" onClick={() => onAction({ type: 'challenge' })}>
              Izazovi
            </Button>
          )}
          {(v.youCan?.blockCards ?? []).map((c) => (
            <Button key={c} onClick={() => onAction({ type: 'block', card: c })}>
              Blokiraj ({CARD_LABEL[c]})
            </Button>
          ))}
        </div>
      </div>
    )
  } else if (!v.yourTurn) {
    const who = v.seats.find((s) => s.id === v.current)?.name ?? ''
    const p = v.pending
    panel = (
      <p className={styles.muted}>
        {p ? `${p.actor}: ${ACTION_LABEL[p.action]}${p.targetName ? ' → ' + p.targetName : ''} · ` : ''}
        čeka se: {who}…
      </p>
    )
  }

  return (
    <div className={styles.root}>
      <Seats v={v} />
      {panel}
      <Log v={v} />
    </div>
  )
}

function Seats({ v }: { v: CoupView }) {
  return (
    <div className={styles.seats}>
      {v.seats.map((s) => (
        <div
          key={s.id}
          className={cn(
            styles.seat,
            s.id === v.current && styles.seatTurn,
            s.id === v.you && styles.seatYou,
            s.out && styles.seatOut,
          )}
        >
          <div className={styles.seatHead}>
            <span className={styles.name}>
              {s.isAI ? '🤖 ' : ''}
              {s.name}
              {s.id === v.you ? ' (ti)' : ''}
            </span>
            <span className={styles.coins}>🪙 {s.coins}</span>
          </div>
          <div className={styles.cards}>
            {s.id === v.you
              ? v.yourInfluence.map((c, i) => (
                  <span key={i} className={styles.card}>
                    {CARD_LABEL[c]}
                  </span>
                ))
              : Array.from({ length: s.influenceCount }).map((_, i) => (
                  <span key={i} className={styles.cardBack} />
                ))}
            {s.revealed.map((c, i) => (
              <span key={`r${i}`} className={cn(styles.card, styles.cardLost)}>
                {CARD_LABEL[c]}
              </span>
            ))}
          </div>
          {s.out && <span className={styles.tag}>ispao/la</span>}
        </div>
      ))}
    </div>
  )
}

function Log({ v }: { v: CoupView }) {
  return (
    <div className={styles.log}>
      {v.log.slice(-4).map((line, i) => (
        <span key={i}>· {line}</span>
      ))}
    </div>
  )
}
