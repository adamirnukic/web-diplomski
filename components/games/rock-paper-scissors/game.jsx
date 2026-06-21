'use client'

import { useState } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import styles from './game.module.css'
const CHOICES = [
  { id: 'rock', label: 'Rock', emoji: '🪨' },
  { id: 'paper', label: 'Paper', emoji: '📄' },
  { id: 'scissors', label: 'Scissors', emoji: '✂️' },
]

function getResult(p1, p2) {
  if (p1 === p2) return 'draw'
  if (
    (p1 === 'rock' && p2 === 'scissors') ||
    (p1 === 'scissors' && p2 === 'paper') ||
    (p1 === 'paper' && p2 === 'rock')
  )
    return 'p1'
  return 'p2'
}

export default function RockPaperScissorsGame({ mode, onGameEnd }) {
  const [p1Choice, setP1Choice] = useState(null)
  const [p2Choice, setP2Choice] = useState(null)
  const [scores, setScores] = useState({ p1: 0, p2: 0 })
  const [round, setRound] = useState(1)
  const [phase, setPhase] = useState('p1')
  const [roundResult, setRoundResult] = useState('')

  const bestOf = 5
  const gameOver = scores.p1 >= 3 || scores.p2 >= 3

  const handleChoice = (choice) => {
    if (phase === 'p1') {
      setP1Choice(choice)
      setPhase('p2')
    } else if (phase === 'p2') {
      setP2Choice(choice)
      const result = getResult(p1Choice, choice)
      if (result === 'p1') {
        setScores((s) => ({ ...s, p1: s.p1 + 1 }))
        setRoundResult('Player 1 wins this round!')
      } else if (result === 'p2') {
        setScores((s) => ({ ...s, p2: s.p2 + 1 }))
        setRoundResult('Player 2 wins this round!')
      } else {
        setRoundResult("It's a tie!")
      }
      setPhase('reveal')
    }
  }

  const nextRound = () => {
    setP1Choice(null)
    setP2Choice(null)
    setRoundResult('')
    setRound((r) => r + 1)
    setPhase('p1')
  }

  const reset = () => {
    setP1Choice(null)
    setP2Choice(null)
    setScores({ p1: 0, p2: 0 })
    setRound(1)
    setPhase('p1')
    setRoundResult('')
  }

  const getChoiceDisplay = (choice) =>
    CHOICES.find((c) => c.id === choice)

  return (
    <div className={styles.root}>
      {/* Scores */}
      <div className={styles.scoreRow}>
        <div className={cn(
          styles.scoreCard,
          phase !== 'p1' && phase !== 'reveal' && styles.scoreInactive,
        )}>
          <span className={styles.scoreLabel}>Player 1</span>
          <span className={cn(styles.scoreValue, 'text-neon-cyan')}>{scores.p1}</span>
        </div>
        <div className={styles.midInfo}>
          <span className={styles.infoSmall}>Best of {bestOf}</span>
          <span className={styles.infoText}>Round {round}</span>
        </div>
        <div className={cn(
          styles.scoreCard,
          phase !== 'p2' && phase !== 'reveal' && styles.scoreInactive,
        )}>
          <span className={styles.scoreLabel}>Player 2</span>
          <span className={cn(styles.scoreValue, 'text-neon-magenta')}>{scores.p2}</span>
        </div>
      </div>

      {gameOver ? (
        <div className={styles.gameOverBox}>
          <p className={cn(styles.gameOverText, 'neon-text-cyan')}>
            Player {scores.p1 >= 3 ? '1' : '2'} wins the match!
          </p>
          <Button onClick={reset} className={styles.resetButton}>
            <RotateCcw size={16} />
            Play Again
          </Button>
        </div>
      ) : phase === 'reveal' ? (
        <div className={styles.revealBox}>
          {/* Reveal */}
          <div className={styles.revealRow}>
            <div className={styles.revealChoice}>
              <span className={styles.revealEmoji}>{getChoiceDisplay(p1Choice)?.emoji}</span>
              <span className={cn(styles.revealLabel, 'text-neon-cyan')}>{getChoiceDisplay(p1Choice)?.label}</span>
            </div>
            <span className={styles.vsText}>VS</span>
            <div className={styles.revealChoice}>
              <span className={styles.revealEmoji}>{getChoiceDisplay(p2Choice)?.emoji}</span>
              <span className={cn(styles.revealLabel, 'text-neon-magenta')}>{getChoiceDisplay(p2Choice)?.label}</span>
            </div>
          </div>
          <p className={styles.roundResult}>{roundResult}</p>
          <Button onClick={nextRound}>Next Round</Button>
        </div>
      ) : (
        <div className={styles.root}>
          <p className={styles.choicePrompt}>
            Player {phase === 'p1' ? '1' : '2'}, make your choice!
          </p>
          <p className={styles.choiceHint}>
            {phase === 'p2' && '(No peeking, Player 1!)'}
          </p>
          <div className={styles.choiceRow}>
            {CHOICES.map((choice) => (
              <button
                key={choice.id}
                onClick={() => handleChoice(choice.id)}
                className={cn(
                  styles.choiceButton,
                )}
              >
                <span className={styles.choiceEmoji}>{choice.emoji}</span>
                <span className={styles.choiceLabel}>{choice.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
