'use client'

import { RotateCcw } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import type { TriviaView } from '@shared/games/trivia-quiz/engine'
import type { GameBoardProps } from '../registry'
import styles from './Trivia.module.css'

export function TriviaQuizGame({ view, onAction, onRestart, mode }: GameBoardProps) {
  const v = view as TriviaView | null
  if (!v) return <div className={styles.loading}>Učitavanje…</div>

  if (v.result) {
    const won = mode === 'online' ? v.yourScore > v.oppScore : null
    return (
      <div className={styles.root}>
        <p className={styles.final}>
          {v.result.status === 'draw'
            ? 'Neriješeno!'
            : mode === 'online'
              ? won
                ? 'Pobijedio si! 🎉'
                : 'Izgubio si.'
              : 'Kraj kviza!'}
        </p>
        <p className={styles.scoreLine}>
          Rezultat: {v.yourScore} : {v.oppScore}
        </p>
        {mode === 'local' && onRestart && (
          <Button onClick={onRestart} className="neon-glow-cyan">
            <RotateCcw size={16} /> Nova igra
          </Button>
        )}
      </div>
    )
  }

  return (
    <div className={styles.root}>
      <div className={styles.top}>
        <span>
          Pitanje {v.questionNumber}/{v.total}
        </span>
        <span className={styles.scores}>
          Ti {v.yourScore} : {v.oppScore} Protivnik
        </span>
      </div>

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
              Dalje
            </Button>
          )}
          {!v.yourTurn && <p className={styles.wait}>Protivnik odgovara…</p>}
        </>
      )}
    </div>
  )
}
