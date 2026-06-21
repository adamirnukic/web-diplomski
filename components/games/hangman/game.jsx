'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { RotateCcw } from 'lucide-react'
import styles from './game.module.css'

const WORDS = [
  'JAVASCRIPT', 'PYTHON', 'GALAXY', 'QUANTUM', 'PHOENIX',
  'OXYGEN', 'RHYTHM', 'WIZARD', 'PUZZLE', 'MATRIX',
  'ZENITH', 'COSMIC', 'ENIGMA', 'NEBULA', 'CIPHER',
  'DRAGON', 'KNIGHT', 'ARCTIC', 'TROPHY', 'VOYAGE',
  'CASTLE', 'PIRATE', 'ROCKET', 'SPHINX', 'AURORA',
]

const HANGMAN_PARTS = [
  'head', 'body', 'left-arm', 'right-arm', 'left-leg', 'right-leg',
]

const KEYBOARD = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('')

function HangmanFigure({ wrongCount }) {
  return (
    <svg viewBox="0 0 200 250" className={styles.figure}>
      {/* Gallows */}
      <line x1="20" y1="230" x2="180" y2="230" stroke="currentColor" strokeWidth="3" className={styles.strokeBorder} />
      <line x1="60" y1="230" x2="60" y2="20" stroke="currentColor" strokeWidth="3" className={styles.strokeBorder} />
      <line x1="60" y1="20" x2="140" y2="20" stroke="currentColor" strokeWidth="3" className={styles.strokeBorder} />
      <line x1="140" y1="20" x2="140" y2="50" stroke="currentColor" strokeWidth="3" className={styles.strokeBorder} />
      {/* Head */}
      {wrongCount >= 1 && (
        <circle cx="140" cy="70" r="20" fill="none" stroke="currentColor" strokeWidth="3" className={styles.strokeCyan} />
      )}
      {/* Body */}
      {wrongCount >= 2 && (
        <line x1="140" y1="90" x2="140" y2="150" stroke="currentColor" strokeWidth="3" className={styles.strokeCyan} />
      )}
      {/* Left arm */}
      {wrongCount >= 3 && (
        <line x1="140" y1="110" x2="110" y2="140" stroke="currentColor" strokeWidth="3" className={styles.strokeCyan} />
      )}
      {/* Right arm */}
      {wrongCount >= 4 && (
        <line x1="140" y1="110" x2="170" y2="140" stroke="currentColor" strokeWidth="3" className={styles.strokeCyan} />
      )}
      {/* Left leg */}
      {wrongCount >= 5 && (
        <line x1="140" y1="150" x2="110" y2="190" stroke="currentColor" strokeWidth="3" className={styles.strokeMagenta} />
      )}
      {/* Right leg */}
      {wrongCount >= 6 && (
        <line x1="140" y1="150" x2="170" y2="190" stroke="currentColor" strokeWidth="3" className={styles.strokeMagenta} />
      )}
    </svg>
  )
}

export default function HangmanGame({ mode, onGameEnd }) {
  const [phase, setPhase] = useState('setup')
  const [word, setWord] = useState('')
  const [customWord, setCustomWord] = useState('')
  const [guessed, setGuessed] = useState(new Set())
  const [scores, setScores] = useState({ setter: 0, guesser: 0 })

  const wrongGuesses = [...guessed].filter((l) => !word.includes(l))
  const wrongCount = wrongGuesses.length
  const isLost = wrongCount >= 6
  const isWon = word && [...word].every((l) => guessed.has(l))
  const gameOver = isLost || isWon

  const startWithRandom = () => {
    setWord(WORDS[Math.floor(Math.random() * WORDS.length)])
    setGuessed(new Set())
    setPhase('playing')
  }

  const startWithCustom = () => {
    if (customWord.length >= 3) {
      setWord(customWord.toUpperCase().replace(/[^A-Z]/g, ''))
      setCustomWord('')
      setGuessed(new Set())
      setPhase('playing')
    }
  }

  const guess = useCallback(
    (letter) => {
      if (gameOver || guessed.has(letter)) return
      setGuessed((prev) => new Set([...prev, letter]))
    },
    [gameOver, guessed],
  )

  const handleGameEnd = () => {
    if (isWon) setScores((s) => ({ ...s, guesser: s.guesser + 1 }))
    if (isLost) setScores((s) => ({ ...s, setter: s.setter + 1 }))
  }

  if (gameOver && !guessed.has('_scored')) {
    handleGameEnd()
    setGuessed((prev) => new Set([...prev, '_scored']))
  }

  const reset = () => {
    setPhase('setup')
    setWord('')
    setGuessed(new Set())
  }

  if (phase === 'setup') {
    return (
      <div className={styles.root}>
        <div className={styles.scoreRow}>
          <div className={styles.scoreCard}>
            <span className={styles.scoreLabel}>Word Setter</span>
            <span className={cn(styles.scoreValue, 'text-neon-magenta')}>{scores.setter}</span>
          </div>
          <div className={styles.scoreCard}>
            <span className={styles.scoreLabel}>Guesser</span>
            <span className={cn(styles.scoreValue, 'text-neon-cyan')}>{scores.guesser}</span>
          </div>
        </div>

        <h2 className={styles.heading}>Choose a word</h2>
        <Button onClick={startWithRandom} className="neon-glow-cyan">
          Random Word
        </Button>
        <div className={styles.dividerRow}>
          <div className={styles.dividerLine} />
          or
          <div className={styles.dividerLine} />
        </div>
        <div className={styles.inputRow}>
          <Input
            placeholder="Enter custom word..."
            value={customWord}
            onChange={(e) => setCustomWord(e.target.value)}
            type="password"
            maxLength={20}
          />
          <Button onClick={startWithCustom} variant="outline" disabled={customWord.length < 3}>
            Set
          </Button>
        </div>
        <p className={styles.helperText}>
          Custom word is hidden. Hand the device to the guesser!
        </p>
      </div>
    )
  }

  return (
    <div className={styles.root}>
      {/* Scores */}
      <div className={styles.scoreRow}>
        <div className={styles.scoreCard}>
          <span className={styles.scoreLabel}>Setter</span>
          <span className={cn(styles.scoreValue, 'text-neon-magenta')}>{scores.setter}</span>
        </div>
        <div className={styles.scoreCard}>
          <span className={styles.scoreLabel}>Guesser</span>
          <span className={cn(styles.scoreValue, 'text-neon-cyan')}>{scores.guesser}</span>
        </div>
      </div>

      {/* Hangman */}
      <HangmanFigure wrongCount={wrongCount} />

      {/* Word */}
      <div className={styles.wordRow}>
        {[...word].map((letter, i) => (
          <div
            key={i}
            className={cn(
              styles.letterCell,
              guessed.has(letter)
                ? styles.letterRevealed
                : isLost
                  ? styles.letterLost
                  : styles.letterHidden,
            )}
          >
            {guessed.has(letter) || isLost ? letter : '_'}
          </div>
        ))}
      </div>

      {/* Status */}
      {gameOver && (
        <p className={cn(
          styles.statusText,
          isWon ? styles.statusWin : styles.statusLose,
        )}>
          {isWon ? 'Guesser wins!' : `Game over! The word was: ${word}`}
        </p>
      )}

      {/* Keyboard */}
      <div className={styles.keyboard}>
        {KEYBOARD.map((letter) => {
          const isGuessed = guessed.has(letter)
          const isCorrect = isGuessed && word.includes(letter)
          const isWrong = isGuessed && !word.includes(letter)
          return (
            <button
              key={letter}
              onClick={() => guess(letter)}
              disabled={isGuessed || gameOver}
              className={cn(
                styles.keyButton,
                isCorrect
                  ? styles.keyCorrect
                  : isWrong
                    ? styles.keyWrong
                    : null,
                (isGuessed || gameOver) && styles.keyDisabled,
              )}
            >
              {letter}
            </button>
          )
        })}
      </div>

      <p className={styles.remainingText}>
        {6 - wrongCount} guesses remaining
      </p>

      {gameOver && (
        <Button onClick={reset} className={styles.resetButton}>
          <RotateCcw size={16} />
          Play Again
        </Button>
      )}
    </div>
  )
}
