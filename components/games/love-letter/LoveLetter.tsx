'use client'

import { useState, type ReactNode } from 'react'
import { RotateCcw, Shield, Heart, Eye } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { CARD_VALUE, type CardName, type LLView } from '@shared/games/love-letter/engine'
import type { GameBoardProps } from '../registry'
import styles from './LoveLetter.module.css'

const LABEL: Record<CardName, string> = {
  spy: 'Špijun',
  guard: 'Stražar',
  priest: 'Sveštenik',
  baron: 'Baron',
  handmaid: 'Sluškinja',
  prince: 'Princ',
  chancellor: 'Kancelar',
  king: 'Kralj',
  countess: 'Grofica',
  princess: 'Princeza',
}

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
  const cls = cn(styles.card, small && styles.cardSmall, selected && styles.cardSel)
  const body = (
    <>
      <span className={styles.cardVal}>{CARD_VALUE[card]}</span>
      <span className={styles.cardName}>{LABEL[card]}</span>
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
  const v = view as LLView | null
  const [sel, setSel] = useState<{ card: CardName; step: 'target' | 'guess'; target?: string } | null>(
    null,
  )
  if (!v) return <div className={styles.loading}>Učitavanje…</div>

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
            <span className={styles.handBack}>{p.out ? 'ispao/la' : `${p.handCount} 🂠`}</span>
          )}
          {p.discards.length > 0 && (
            <span className={styles.lastDiscard}>
              bacio: {LABEL[p.discards[p.discards.length - 1]]}
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
              ? 'Pobijedio si! 🏆'
              : `Pobjednik: ${nameOf(v.result?.winnerId ?? '')}`
            : `Pobjednik meča: ${nameOf(v.result?.winnerId ?? '')} 🏆`}
        </p>
        {mode === 'local' && onRestart && (
          <Button onClick={onRestart} className="neon-glow-cyan">
            <RotateCcw size={16} /> Nova igra
          </Button>
        )}
      </div>
    )
  } else if (v.phase === 'roundover' && v.round) {
    panel = (
      <div className={styles.panel}>
        <p className={styles.big}>Kraj runde</p>
        <p className={styles.roundReason}>{v.round.reason}</p>
        <Button onClick={() => onAction({ type: 'next' })} className="neon-glow-cyan">
          Sljedeća runda
        </Button>
      </div>
    )
  } else if (v.peek) {
    panel = (
      <div className={styles.panel}>
        <p className={styles.peek}>
          <Eye size={16} /> {v.peek.targetName} ima: <strong>{LABEL[v.peek.card]}</strong>
        </p>
        <Button onClick={() => onAction({ type: 'ack' })} className="neon-glow-cyan">
          Nastavi
        </Button>
      </div>
    )
  } else if (v.choosingKeep) {
    panel = (
      <div className={styles.panel}>
        <p className={styles.prompt}>Kancelar — zadrži jednu kartu (ostale idu na dno špila):</p>
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
          ? [...v.targetable, { id: v.you, name: 'Sebe' }]
          : v.targetable
      panel = (
        <div className={styles.panel}>
          <p className={styles.prompt}>{LABEL[sel.card]} → izaberi metu:</p>
          <div className={styles.choices}>
            {targets.map((t) => (
              <Button key={t.id} variant="outline" onClick={() => chooseTarget(t.id)}>
                {t.name}
              </Button>
            ))}
            <Button variant="ghost" onClick={() => setSel(null)}>
              Otkaži
            </Button>
          </div>
        </div>
      )
    } else if (sel?.step === 'guess') {
      panel = (
        <div className={styles.panel}>
          <p className={styles.prompt}>Pogodi kartu igrača {nameOf(sel.target as string)}:</p>
          <div className={styles.choices}>
            {NON_GUARD.map((c) => (
              <Button key={c} variant="outline" onClick={() => chooseGuess(c)}>
                {LABEL[c]} ({CARD_VALUE[c]})
              </Button>
            ))}
            <Button variant="ghost" onClick={() => setSel(null)}>
              Otkaži
            </Button>
          </div>
        </div>
      )
    } else {
      panel = (
        <div className={styles.panel}>
          <p className={styles.prompt}>Tvoj potez — odigraj kartu:</p>
          {v.mustPlayCountess && (
            <p className={styles.hint}>Moraš odigrati Groficu (uz Kralja/Princa).</p>
          )}
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
        <p className={styles.prompt}>Na potezu: {turnP?.name ?? '…'}</p>
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
        <span className={styles.deck}>Špil: {v.deckCount}</span>
        {v.log.length > 0 && <p className={styles.log}>{v.log[v.log.length - 1]}</p>}
      </div>
      {panel}
    </div>
  )
}
