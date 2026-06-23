'use client'

import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useT } from '@/lib/i18n'
import type { Choice, RpsView } from '@shared/games/rock-paper-scissors/engine'
import type { GameBoardProps } from '../registry'
import styles from './RockPaperScissors.module.css'

const OPTIONS: { choice: Choice; emoji: string }[] = [
  { choice: 'rock', emoji: '✊' },
  { choice: 'paper', emoji: '✋' },
  { choice: 'scissors', emoji: '✌️' },
]

const EMOJI: Record<Choice, string> = { rock: '✊', paper: '✋', scissors: '✌️' }

export function RockPaperScissorsGame({ view, onAction, onRestart, mode }: GameBoardProps) {
  const { t } = useT()
  const v = view as RpsView | null
  if (!v) return <div className={styles.loading}>{t('common.loading')}</div>

  return (
    <div className={styles.root}>
      <div className={styles.scores}>
        <span>
          {t('rps.you')}: {v.yourScore}
        </span>
        <span className={styles.round}>{t('rps.round', { n: v.round })}</span>
        <span>
          {t('rps.opp')}: {v.oppScore}
        </span>
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
              ? t('rps.wonRound')
              : v.last.outcome === 'lose'
                ? t('rps.lostRound')
                : t('res.draw')}
          </span>
          <span className={styles.lastEmoji}>{EMOJI[v.last.theirs]}</span>
        </div>
      )}

      {v.result ? (
        <>
          <p className={styles.final}>
            {v.result.winnerId ? (v.yourScore > v.oppScore ? t('g.youWin') : t('g.youLose')) : ''}
          </p>
          {mode === 'local' && onRestart && (
            <Button onClick={onRestart} className="neon-glow-cyan">
              <RotateCcw size={16} /> {t('g.playAgain')}
            </Button>
          )}
        </>
      ) : v.waitingForOpponent ? (
        <p className={styles.waiting}>{t('rps.waiting')}</p>
      ) : (
        <div className={styles.options}>
          {OPTIONS.map((o) => (
            <button
              key={o.choice}
              className={styles.option}
              onClick={() => onAction({ type: 'choose', choice: o.choice })}
            >
              <span className={styles.optionEmoji}>{o.emoji}</span>
              <span>{t(`rps.${o.choice}`)}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
