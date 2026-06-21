'use client'

import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { Choice, RpsView } from '@shared/games/rock-paper-scissors/engine'
import type { GameBoardProps } from '../registry'
import styles from './RockPaperScissors.module.css'

const OPTIONS: { choice: Choice; emoji: string; label: string }[] = [
  { choice: 'rock', emoji: '✊', label: 'Kamen' },
  { choice: 'paper', emoji: '✋', label: 'Papir' },
  { choice: 'scissors', emoji: '✌️', label: 'Makaze' },
]

const EMOJI: Record<Choice, string> = { rock: '✊', paper: '✋', scissors: '✌️' }

export function RockPaperScissorsGame({ view, onAction, onRestart, mode }: GameBoardProps) {
  const v = view as RpsView | null
  if (!v) return <div className={styles.loading}>Učitavanje…</div>

  return (
    <div className={styles.root}>
      <div className={styles.scores}>
        <span>Ti: {v.yourScore}</span>
        <span className={styles.round}>Runda {v.round}</span>
        <span>Protivnik: {v.oppScore}</span>
      </div>

      {v.last && (
        <div className={styles.last}>
          <span className={styles.lastEmoji}>{EMOJI[v.last.yours]}</span>
          <span
            className={cn(
              styles.outcome,
              v.last.outcome === 'win' && styles.win,
              v.last.outcome === 'lose' && styles.lose,
            )}
          >
            {v.last.outcome === 'win'
              ? 'Dobio si rundu'
              : v.last.outcome === 'lose'
                ? 'Izgubio si rundu'
                : 'Neriješeno'}
          </span>
          <span className={styles.lastEmoji}>{EMOJI[v.last.theirs]}</span>
        </div>
      )}

      {v.result ? (
        <>
          <p className={styles.final}>
            {v.result.winnerId ? (v.yourScore > v.oppScore ? 'Pobijedio si! 🎉' : 'Izgubio si.') : ''}
          </p>
          {mode === 'local' && onRestart && (
            <Button onClick={onRestart} className="neon-glow-cyan">
              <RotateCcw size={16} /> Igraj ponovo
            </Button>
          )}
        </>
      ) : v.waitingForOpponent ? (
        <p className={styles.waiting}>Čekaš protivnika…</p>
      ) : (
        <div className={styles.options}>
          {OPTIONS.map((o) => (
            <button
              key={o.choice}
              className={styles.option}
              onClick={() => onAction({ type: 'choose', choice: o.choice })}
            >
              <span className={styles.optionEmoji}>{o.emoji}</span>
              <span>{o.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
