'use client'

import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useT } from '@/lib/i18n'
import { trioConnections, type TrioView } from '@shared/games/trio/engine'
import type { GameBoardProps } from '../registry'
import styles from './Trio.module.css'

export function TrioBoard({ view, onAction, onRestart, mode }: GameBoardProps) {
  const { t } = useT()
  const v = view as TrioView | null
  if (!v) return <div className={styles.loading}>{t('common.loading')}</div>
  const nameOf = (id?: string) => v.seats.find((s) => s.id === id)?.name ?? ''
  const modeSelect = v.phase === 'mode'
  const myTrios = v.seats.find((s) => s.id === v.you)?.trios ?? []

  return (
    <div className={styles.root}>
      <div className={styles.seats}>
        {v.seats.map((s) => (
          <div key={s.id} className={cn(styles.seat, s.isTurn && styles.seatTurn, s.id === v.you && styles.seatYou)}>
            <span className={styles.seatName}>
              {s.isAI ? '🤖 ' : ''}
              {s.name}
            </span>
            <span className={styles.seatInfo}>
              🃏 {s.handCount} · {t('trio.trios')} {s.trios.length}/{v.triosToWin}
            </span>
            {s.trios.length > 0 && (
              <span className={styles.trioChips}>
                {s.trios.map((n, i) => (
                  <span key={i} className={cn(styles.trioChip, n === 7 && styles.trioSeven)}>
                    {n}
                  </span>
                ))}
              </span>
            )}
          </div>
        ))}
      </div>

      <div className={styles.middleWrap}>
        <span className={styles.middleLabel}>{t('trio.middle')}</span>
        <div className={styles.middle}>
          {v.middle.map((c, i) =>
            c.taken ? (
              <span key={i} className={cn(styles.cell, styles.cellTaken)} />
            ) : c.value != null ? (
              <span key={i} className={cn(styles.cell, styles.cellUp)}>{c.value}</span>
            ) : (
              <button
                key={i}
                type="button"
                className={cn(styles.cell, styles.cellDown)}
                disabled={!v.yourTurn || modeSelect}
                onClick={v.yourTurn && !modeSelect ? () => onAction({ type: 'revealMiddle', index: i }) : undefined}
              >
                ?
              </button>
            ),
          )}
        </div>
      </div>

      {v.revealed.length > 0 ? (
        <div className={styles.revealed}>
          {t('trio.revealed')}{' '}
          {v.revealed.map((n, i) => (
            <span key={i} className={styles.revChip}>
              {n}
            </span>
          ))}
        </div>
      ) : v.lastTurn ? (
        <div className={cn(styles.lastTurn, v.lastTurn.matched ? styles.lastGood : styles.lastBad)}>
          {v.lastTurn.matched
            ? t('trio.tookTrio', { name: nameOf(v.lastTurn.by), num: v.lastTurn.trio ?? 0 })
            : t('trio.noMatch', { name: nameOf(v.lastTurn.by), values: v.lastTurn.values.join(', ') })}
        </div>
      ) : null}

      {v.spicy && !modeSelect && !v.result && (
        <div className={styles.spicyBar}>
          <span className={styles.spicyTag}>🌶️ {t('trio.mode.spicy')}</span>
          <span className={styles.spicyRule}>{t('trio.spicyRule')}</span>
          {myTrios.map((n, i) => (
            <span key={i} className={styles.spicyNeed}>
              {t('trio.spicyNeed', { num: n, conns: trioConnections(n).join(' / ') })}
            </span>
          ))}
        </div>
      )}

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
      ) : modeSelect ? (
        v.yourTurn ? (
          <div className={styles.panel}>
            <p className={styles.msg}>{t('trio.mode.title')}</p>
            <div className={styles.modeChoices}>
              <button
                type="button"
                className={styles.modeCard}
                onClick={() => onAction({ type: 'setMode', spicy: false })}
              >
                <span className={styles.modeName}>{t('trio.mode.simple')}</span>
                <span className={styles.modeDesc}>{t('trio.mode.simpleDesc')}</span>
              </button>
              <button
                type="button"
                className={cn(styles.modeCard, styles.modeSpicy)}
                onClick={() => onAction({ type: 'setMode', spicy: true })}
              >
                <span className={styles.modeName}>🌶️ {t('trio.mode.spicy')}</span>
                <span className={styles.modeDesc}>{t('trio.mode.spicyDesc')}</span>
              </button>
            </div>
          </div>
        ) : (
          <p className={styles.wait}>{t(v.message.k, v.message.p)}</p>
        )
      ) : v.yourTurn ? (
        <div className={styles.panel}>
          <p className={styles.msg}>
            {v.targetNumber != null ? t('trio.matchNumber', { n: v.targetNumber }) : t('trio.revealPrompt')}
          </p>
          <div className={styles.revealControls}>
            {v.seats
              .filter((s) => s.handCount > 0)
              .map((s) => (
                <div key={s.id} className={styles.revRow}>
                  <span className={styles.revName}>{s.id === v.you ? t('trio.yourHandShort') : s.name}</span>
                  <Button size="sm" variant="outline" onClick={() => onAction({ type: 'revealHand', owner: s.id, end: 'low' })}>
                    ↓ {t('trio.low')}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onAction({ type: 'revealHand', owner: s.id, end: 'high' })}>
                    ↑ {t('trio.high')}
                  </Button>
                </div>
              ))}
          </div>
          <p className={styles.hint}>{t('trio.hint')}</p>
        </div>
      ) : (
        <p className={styles.wait}>{t(v.message.k, v.message.p)}</p>
      )}

      <div className={styles.yourHand}>
        <span className={styles.yourHandLabel}>{t('trio.yourHand')}</span>
        {v.yourHand.map((n, i) => (
          <span key={i} className={styles.handCard}>
            {n}
          </span>
        ))}
      </div>
    </div>
  )
}
