'use client'

import { useState, useEffect, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import styles from './board.module.css'

const SYMBOLS = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H']
const NEON_COLORS = [
  styles.symbolCyan,
  styles.symbolMagenta,
  styles.symbolGreen,
  styles.symbolPurple,
  styles.symbolYellow,
  styles.symbolOrange,
  styles.symbolRose,
  styles.symbolSky,
]

function createDeck() {
  const pairs = SYMBOLS.map((sym, i) => [
    { id: i * 2, symbol: sym, colorClass: NEON_COLORS[i], flipped: false, matched: false },
    { id: i * 2 + 1, symbol: sym, colorClass: NEON_COLORS[i], flipped: false, matched: false },
  ]).flat()
  // Shuffle
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[pairs[i], pairs[j]] = [pairs[j], pairs[i]]
  }
  return pairs
}

export default function MemoryBoard({ mode, onGameEnd }) {
  const [cards, setCards] = useState(createDeck())
  const [flippedIds, setFlippedIds] = useState([])
  const [currentPlayer, setCurrentPlayer] = useState(1)
  const [scores, setScores] = useState({ 1: 0, 2: 0 })
  const [checking, setChecking] = useState(false)

  const allMatched = cards.every((c) => c.matched)

  const handleFlip = useCallback(
    (id) => {
      if (checking) return
      if (flippedIds.length >= 2) return
      const card = cards.find((c) => c.id === id)
      if (!card || card.flipped || card.matched) return

      const newCards = cards.map((c) =>
        c.id === id ? { ...c, flipped: true } : c,
      )
      setCards(newCards)
      const newFlipped = [...flippedIds, id]
      setFlippedIds(newFlipped)

      if (newFlipped.length === 2) {
        setChecking(true)
        const [firstId, secondId] = newFlipped
        const first = newCards.find((c) => c.id === firstId)
        const second = newCards.find((c) => c.id === secondId)

        if (!first || !second) {
          setChecking(false)
          return
        }

        if (first.symbol === second.symbol) {
          // Match found
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                c.id === firstId || c.id === secondId
                  ? { ...c, matched: true }
                  : c,
              ),
            )
            setScores((s) => ({ ...s, [currentPlayer]: s[currentPlayer] + 1 }))
            setFlippedIds([])
            setChecking(false)
          }, 600)
        } else {
          // No match
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                c.id === firstId || c.id === secondId
                  ? { ...c, flipped: false }
                  : c,
              ),
            )
            setFlippedIds([])
            setCurrentPlayer((p) => (p === 1 ? 2 : 1))
            setChecking(false)
          }, 1000)
        }
      }
    },
    [cards, flippedIds, checking, currentPlayer],
  )

  const reset = () => {
    setCards(createDeck())
    setFlippedIds([])
    setCurrentPlayer(1)
    setScores({ 1: 0, 2: 0 })
    setChecking(false)
  }

  return (
    <div className={styles.root}>
      {/* Scores */}
      <div className={styles.scoreRow}>
        <div className={cn(
          styles.scoreCard,
          currentPlayer !== 1 && styles.scoreInactive,
        )}>
          <span className={styles.scoreLabel}>Player 1</span>
          <span className={cn(styles.scoreValue, 'text-neon-cyan')}>{scores[1]}</span>
        </div>
        <div className={cn(
          styles.scoreCard,
          currentPlayer !== 2 && styles.scoreInactive,
        )}>
          <span className={styles.scoreLabel}>Player 2</span>
          <span className={cn(styles.scoreValue, 'text-neon-magenta')}>{scores[2]}</span>
        </div>
      </div>

      {/* Status */}
      <p className={cn(
        styles.status,
        allMatched ? styles.statusWin : styles.statusDefault,
      )}>
        {allMatched
          ? scores[1] > scores[2]
            ? 'Player 1 wins!'
            : scores[2] > scores[1]
              ? 'Player 2 wins!'
              : "It's a tie!"
          : `Player ${currentPlayer}'s turn`}
      </p>

      {/* Board */}
      <div className={styles.boardGrid}>
        {cards.map((card) => (
          <button
            key={card.id}
            onClick={() => handleFlip(card.id)}
            disabled={card.flipped || card.matched || checking}
            className={cn(
              styles.cardButton,
              card.matched
                ? styles.cardMatched
                : card.flipped
                  ? styles.cardFlipped
                  : styles.cardHidden,
            )}
            aria-label={card.flipped || card.matched ? `Card ${card.symbol}` : 'Hidden card'}
          >
            {(card.flipped || card.matched) && (
              <span className={cn(styles.symbol, card.colorClass)}>
                {card.symbol}
              </span>
            )}
          </button>
        ))}
      </div>

      {allMatched && (
        <Button onClick={reset} className={styles.resetButton}>
          <RotateCcw size={16} />
          Play Again
        </Button>
      )}
    </div>
  )
}
