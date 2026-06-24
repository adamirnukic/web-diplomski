'use client'

import { useState, type ReactNode } from 'react'
import { RotateCcw, Shield, Heart, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { CARD_VALUE, type CardName, type LLView } from '@shared/games/love-letter/engine'
import { useT } from '@/lib/i18n'
import type { GameBoardProps } from '../registry'
import styles from './LoveLetter.module.css'

const NON_GUARD: CardName[] = [
  'spy', 'priest', 'baron', 'handmaid', 'prince', 'chancellor', 'king', 'countess', 'princess',
]

function Card({
  card,
  onClick,
  disabled,
  selected,
  small,
}: {
  card: CardName
  onClick?: () => void
  disabled?: boolean
  selected?: boolean
  small?: boolean
}) {
  const { t } = useT()
  const cls = cn(styles.card, small && styles.cardSmall, selected && styles.cardSel)
  const body = (
    <>
      <span className={styles.cardVal}>{CARD_VALUE[card]}</span>
      <span className={styles.cardName}>{t(`ll.card.${card}`)}</span>
    </>
  )
  if (onClick) {
    return (
      <button className={cls} onClick={onClick} disabled={disabled}>
        {body}
      </button>
    )
  }
  return <div className={cls}>{body}</div>
}

export function LoveLetterBoard({ view, onAction, onRestart, mode }: GameBoardProps) {
  const { t } = useT()
  const v = view as LLView | null
  const [sel, setSel] = useState<{ card: CardName; step: 'target' | 'guess'; target?: string } | null>(
    null,
  )
  if (!v) return <div className={styles.loading}>{t('common.loading')}</div>

  const nameOf = (id: string) => v.players.find((p) => p.id === id)?.name ?? 'Igrač'

  const playCard = (card: CardName) => {
    if (!v.yourTurn) return
    if (v.mustPlayCountess && card !== 'countess') return
    if (
      card === 'spy' ||
      card === 'handmaid' ||
      card === 'countess' ||
      card === 'princess' ||
      card === 'chancellor'
    ) {
      onAction({ type: 'play', card })
      return
    }
    if (card === 'prince') {
      setSel({ card, step: 'target' })
      return
    }
    // guard / priest / baron / king
    if (v.targetable.length === 0) {
      onAction({ type: 'play', card }) // no valid target -> no effect
      return
    }
    setSel({ card, step: 'target' })
  }

  const chooseTarget = (id: string) => {
    if (!sel) return
    if (sel.card === 'guard') {
      setSel({ ...sel, step: 'guess', target: id })
      return
    }
    onAction({ type: 'play', card: sel.card, target: id })
    setSel(null)
  }

  const chooseGuess = (guess: CardName) => {
    if (!sel?.target) return
    onAction({ type: 'play', card: 'guard', target: sel.target, guess })
    setSel(null)
  }

  // ----- Players -----
  const playersRow = (
    <div className={styles.players}>
      {v.players.map((p) => (
        <div
          key={p.id}
          className={cn(
            styles.player,
            p.isTurn && styles.playerTurn,
            p.out && styles.playerOut,
            p.id === v.you && styles.playerYou,
          )}
        >
          <div className={styles.playerHead}>
            {p.protected && <Shield size={13} className="text-neon-cyan" />}
            <span className={styles.playerName}>{p.name}</span>
          </div>
          <div className={styles.tokens}>
            {Array.from({ length: p.tokens }).map((_, i) => (
              <Heart key={i} size={12} className="text-neon-magenta" />
            ))}
            <span className={styles.tokenNum}>{p.tokens}/{v.tokensToWin}</span>
          </div>
          {p.revealedCard ? (
            <Card card={p.revealedCard} small />
          ) : (
            <span className={styles.handBack}>{p.out ? t('g.out') : `${p.handCount} 🂠`}</span>
          )}
          {p.discards.length > 0 && (
            <span className={styles.lastDiscard}>
              {t('ll.discarded', { card: t(`ll.card.${p.discards[p.discards.length - 1]}`) })}
            </span>
          )}
        </div>
      ))}
    </div>
  )

  // ----- Center / status -----
  let panel: ReactNode
  if (v.phase === 'matchover' || v.result) {
    panel = (
      <div className={styles.panel}>
        <p className={styles.big}>
          {mode === 'online'
            ? v.result?.winnerId === v.you
              ? t('g.youWinTrophy')
              : t('g.winnerName', { name: nameOf(v.result?.winnerId ?? '') })
            : t('ll.matchWinner', { name: nameOf(v.result?.winnerId ?? '') })}
        </p>
        {mode === 'local' && onRestart && (
          <Button onClick={onRestart} className="neon-glow-cyan">
            <RotateCcw size={16} /> {t('g.newGame')}
          </Button>
        )}
      </div>
    )
  } else if (v.phase === 'roundover' && v.round) {
    panel = (
      <div className={styles.panel}>
        <p className={styles.big}>{t('ll.roundEnd')}</p>
        <p className={styles.roundReason}>{t(v.round.reason.k, v.round.reason.p)}</p>
        <Button onClick={() => onAction({ type: 'next' })} className="neon-glow-cyan">
          {t('ll.nextRound')}
        </Button>
      </div>
    )
  } else if (v.peek) {
    panel = (
      <div className={styles.panel}>
        <p className={styles.peek}>
          <Eye size={16} /> {t('ll.peekHas', { name: v.peek.targetName })}{' '}
          <strong>{t(`ll.card.${v.peek.card}`)}</strong>
        </p>
        <Button onClick={() => onAction({ type: 'ack' })} className="neon-glow-cyan">
          {t('ll.continue')}
        </Button>
      </div>
    )
  } else if (v.choosingKeep) {
    panel = (
      <div className={styles.panel}>
        <p className={styles.prompt}>{t('ll.chancellorKeep')}</p>
        <div className={styles.hand}>
          {v.yourHand.map((c, i) => (
            <Card key={i} card={c} onClick={() => onAction({ type: 'keep', index: i })} />
          ))}
        </div>
      </div>
    )
  } else if (v.yourTurn) {
    if (sel?.step === 'target') {
      const targets =
        sel.card === 'prince'
          ? [...v.targetable, { id: v.you, name: t('ll.self') }]
          : v.targetable
      panel = (
        <div className={styles.panel}>
          <p className={styles.prompt}>{t('ll.chooseTarget', { card: t(`ll.card.${sel.card}`) })}</p>
          <div className={styles.choices}>
            {targets.map((tg) => (
              <Button key={tg.id} variant="outline" onClick={() => chooseTarget(tg.id)}>
                {tg.name}
              </Button>
            ))}
            <Button variant="ghost" onClick={() => setSel(null)}>
              {t('ll.cancel')}
            </Button>
          </div>
        </div>
      )
    } else if (sel?.step === 'guess') {
      panel = (
        <div className={styles.panel}>
          <p className={styles.prompt}>{t('ll.guessPrompt', { name: nameOf(sel.target as string) })}</p>
          <div className={styles.choices}>
            {NON_GUARD.map((c) => (
              <Button key={c} variant="outline" onClick={() => chooseGuess(c)}>
                {t(`ll.card.${c}`)} ({CARD_VALUE[c]})
              </Button>
            ))}
            <Button variant="ghost" onClick={() => setSel(null)}>
              {t('ll.cancel')}
            </Button>
          </div>
        </div>
      )
    } else {
      panel = (
        <div className={styles.panel}>
          <p className={styles.prompt}>{t('ll.yourTurnPlay')}</p>
          {v.mustPlayCountess && <p className={styles.hint}>{t('ll.mustCountess')}</p>}
          <div className={styles.hand}>
            {v.yourHand.map((c, i) => (
              <Card
                key={i}
                card={c}
                onClick={() => playCard(c)}
                disabled={v.mustPlayCountess && c !== 'countess'}
              />
            ))}
          </div>
        </div>
      )
    }
  } else {
    const turnP = v.players.find((p) => p.isTurn)
    panel = (
      <div className={styles.panel}>
        <p className={styles.prompt}>{t('g.turnOf', { name: turnP?.name ?? '…' })}</p>
        <div className={styles.hand}>
          {v.yourHand.map((c, i) => (
            <Card key={i} card={c} small />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      {playersRow}
      <div className={styles.center}>
        <span className={styles.deck}>{t('ll.deck', { n: v.deckCount })}</span>
        {v.log.length > 0 && (
          <p className={styles.log}>
            {t(v.log[v.log.length - 1].k, v.log[v.log.length - 1].p)}
          </p>
        )}
      </div>
      {panel}
    </div>
  )
}
