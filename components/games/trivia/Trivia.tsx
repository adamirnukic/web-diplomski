'use client'

import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useT } from '@/lib/i18n'
import type { TriviaView } from '@shared/games/trivia-quiz/engine'
import type { GameBoardProps } from '../registry'
import styles from './Trivia.module.css'

export function TriviaQuizGame({ view, onAction, onRestart, mode, players }: GameBoardProps) {
  const { t } = useT()
  const v = view as TriviaView | null
  if (!v) return <div className={styles.loading}>{t('common.loading')}</div>

  const turnName = players?.find((p) => p.id === v.turn)?.username ?? 'Igrač'
  const scoreLine =
    players && players.length === 2
      ? `${players[0].username}: ${v.scores[players[0].id] ?? 0} · ${players[1].username}: ${v.scores[players[1].id] ?? 0}`
      : `${v.yourScore} : ${v.oppScore}`

  if (v.result) {
    const winnerName = players?.find((p) => p.id === v.result?.winnerId)?.username ?? ''
    return (
      <div className={styles.root}>
        <p className={styles.final}>
          {v.result.status === 'draw'
            ? t('g.draw')
            : mode === 'online'
              ? v.yourScore > v.oppScore
                ? t('g.youWin')
                : t('g.youLose')
              : t('g.winnerName', { name: winnerName })}
        </p>
        <p className={styles.scoreLine}>
          {t('tr.score')} {scoreLine}
        </p>
        {mode === 'local' && onRestart && (
          <Button onClick={onRestart} className="neon-glow-cyan">
            <RotateCcw size={16} /> {t('g.newGame')}
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <div className={styles.top}>
        <span>{t('tr.question', { n: v.questionNumber, total: v.total })}</span>
        <span className={styles.scores}>{scoreLine}</span>
      </div>
      <p className={styles.turnInfo}>
        {mode === 'online'
          ? v.yourTurn
            ? t('tr.youAnswer')
            : t('tr.nameAnswers', { name: turnName })
          : t('g.turnOf', { name: turnName })}
      </p>

      {v.question && (
        <>
          <h2 className={styles.question}>{v.question.q}</h2>
          <div className={styles.options}>
            {v.question.options.map((opt, i) => {
              const isCorrect = v.correctIndex === i
              const isChosen = v.chosen === i
              return (
                <button
                  key={i}
                  className={cn(
                    styles.option,
                    v.phase === 'revealed' && isCorrect && styles.correct,
                    v.phase === 'revealed' && isChosen && !isCorrect && styles.wrong,
                  )}
                  disabled={!v.yourTurn || v.phase === 'revealed'}
                  onClick={() => onAction({ type: 'answer', option: i })}
                >
                  {opt}
                </button>
              )
            })}
          </div>

          {v.phase === 'revealed' && v.yourTurn && (
            <Button onClick={() => onAction({ type: 'next' })} className="neon-glow-cyan">
              {t('tr.next')}
            </Button>
          )}
        </>
      )}
    </div>
  )
}
