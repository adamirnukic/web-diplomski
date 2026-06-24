'use client'

import { useState } from 'react'
import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useT } from '@/lib/i18n'
import type { CoupActionType, CoupCard, CoupView } from '@shared/games/coup/engine'
import type { GameBoardProps } from '../registry'
import styles from './Coup.module.css'

export function CoupTable({ view, onAction, onRestart, mode }: GameBoardProps) {
  const { t } = useT()
  const v = view as CoupView | null
  const [choosing, setChoosing] = useState<CoupActionType | null>(null)
  const [keep, setKeep] = useState<number[]>([])
  if (!v) return <div className={styles.loading}>{t('common.loading')}</div>

  const cardLabel = (c: CoupCard) => t(`coup.card.${c}`)
  const actLabel = (a: CoupActionType) => t(`coup.act.${a}`)

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
        <Log v={v} />
      </div>
    )
  }

  let panel = null

  if (!v.yourTurn && v.phase === 'action') {
    const turnName = v.seats.find((s) => s.id === v.turn)?.name ?? ''
    panel = <p className={styles.muted}>{t('g.turnOf', { name: turnName })}…</p>
  } else if (v.phase === 'action' && v.yourTurn) {
    panel = (
      <div className={styles.panel}>
        {choosing ? (
          <>
            <p className={styles.prompt}>{t('coup.chooseTarget', { action: actLabel(choosing) })}</p>
            <div className={styles.actions}>
              {opponents.map((o) => (
                <Button key={o.id} variant="outline" onClick={() => act(choosing, o.id)}>
                  {o.name}
                </Button>
              ))}
              <Button variant="ghost" onClick={() => setChoosing(null)}>
                {t('common.cancel')}
              </Button>
            </div>
          </>
        ) : (
          <>
            <p className={styles.prompt}>
              {t('coup.yourTurn')}
              {v.mustCoup ? t('coup.mustCoup') : ''}
            </p>
            <div className={styles.actions}>
              {v.mustCoup ? (
                <Button onClick={() => setChoosing('coup')} className="neon-glow-cyan">
                  {actLabel('coup')}
                </Button>
              ) : (
                <>
                  <Button onClick={() => act('income')}>{actLabel('income')}</Button>
                  <Button onClick={() => act('foreign_aid')}>{actLabel('foreign_aid')}</Button>
                  <Button onClick={() => act('tax')}>{actLabel('tax')}</Button>
                  <Button onClick={() => act('exchange')}>{actLabel('exchange')}</Button>
                  <Button onClick={() => setChoosing('steal')} disabled={opponents.length === 0}>
                    {actLabel('steal')}
                  </Button>
                  <Button
                    onClick={() => setChoosing('assassinate')}
                    disabled={myCoins < 3 || opponents.length === 0}
                  >
                    {actLabel('assassinate')}
                  </Button>
                  <Button
                    onClick={() => setChoosing('coup')}
                    disabled={myCoins < 7 || opponents.length === 0}
                    className="neon-glow-cyan"
                  >
                    {actLabel('coup')}
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
        <p className={styles.prompt}>{t('coup.lose')}</p>
        <div className={styles.actions}>
          {(v.youCan?.loseChoices ?? []).map((c, i) => (
            <Button key={i} variant="outline" onClick={() => onAction({ type: 'lose', card: c })}>
              {cardLabel(c)}
            </Button>
          ))}
        </div>
      </div>
    )
  } else if (v.phase === 'exchange' && v.yourTurn && v.youCan?.exchange) {
    const ex = v.youCan.exchange
    const toggle = (i: number) =>
      setKeep((k) => (k.includes(i) ? k.filter((x) => x !== i) : k.length < ex.keep ? [...k, i] : k))
    panel = (
      <div className={styles.panel}>
        <p className={styles.prompt}>{t('coup.exchangeKeep', { n: ex.keep })}</p>
        <div className={styles.hand}>
          {ex.options.map((c, i) => (
            <button
              key={i}
              className={cn(styles.chip, keep.includes(i) && styles.chipSel)}
              onClick={() => toggle(i)}
            >
              {cardLabel(c)}
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
          {t('common.confirm')}
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
        ? t('coup.blocks', { blocker: p.blocker ?? '', card: p.blockCard ? cardLabel(p.blockCard) : '' })
        : `${p.actor}: ${actLabel(p.action)}${p.targetName ? ' → ' + p.targetName : ''}`
    panel = (
      <div className={styles.panel}>
        <p className={styles.prompt}>{desc}</p>
        <div className={styles.actions}>
          <Button variant="ghost" onClick={() => onAction({ type: 'pass' })}>
            {t('coup.pass')}
          </Button>
          {v.youCan?.canChallenge && (
            <Button variant="outline" onClick={() => onAction({ type: 'challenge' })}>
              {t('coup.challenge')}
            </Button>
          )}
          {(v.youCan?.blockCards ?? []).map((c) => (
            <Button key={c} onClick={() => onAction({ type: 'block', card: c })}>
              {t('coup.block', { card: cardLabel(c) })}
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
        {p ? `${p.actor}: ${actLabel(p.action)}${p.targetName ? ' → ' + p.targetName : ''} · ` : ''}
        {t('coup.waiting', { who })}
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
  const { t } = useT()
  const cardLabel = (c: CoupCard) => t(`coup.card.${c}`)
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
              {s.id === v.you ? ` ${t('room.you')}` : ''}
            </span>
            <span className={styles.coins}>🪙 {s.coins}</span>
          </div>
          <div className={styles.cards}>
            {s.id === v.you
              ? v.yourInfluence.map((c, i) => (
                  <span key={i} className={styles.card}>
                    {cardLabel(c)}
                  </span>
                ))
              : Array.from({ length: s.influenceCount }).map((_, i) => (
                  <span key={i} className={styles.cardBack} />
                ))}
            {s.revealed.map((c, i) => (
              <span key={`r${i}`} className={cn(styles.card, styles.cardLost)}>
                {cardLabel(c)}
              </span>
            ))}
          </div>
          {s.out && <span className={styles.tag}>{t('g.out')}</span>}
        </div>
      ))}
    </div>
  )
}

function Log({ v }: { v: CoupView }) {
  const { t } = useT()
  return (
    <div className={styles.log}>
      {v.log.slice(-4).map((line, i) => {
        // card ids inside a line get localized before interpolation
        const p =
          line.p && typeof line.p.card === 'string'
            ? { ...line.p, card: t(`coup.card.${line.p.card}`) }
            : line.p
        return <span key={i}>· {t(line.k, p)}</span>
      })}
    </div>
  )
}
