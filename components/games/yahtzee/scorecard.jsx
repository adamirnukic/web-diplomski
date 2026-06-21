'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import styles from './scorecard.module.css'

const CATEGORIES = [
  { key: 'ones', label: 'Ones', fn: (dice) => dice.filter((d) => d === 1).reduce((a, b) => a + b, 0) },
  { key: 'twos', label: 'Twos', fn: (dice) => dice.filter((d) => d === 2).reduce((a, b) => a + b, 0) },
  { key: 'threes', label: 'Threes', fn: (dice) => dice.filter((d) => d === 3).reduce((a, b) => a + b, 0) },
  { key: 'fours', label: 'Fours', fn: (dice) => dice.filter((d) => d === 4).reduce((a, b) => a + b, 0) },
  { key: 'fives', label: 'Fives', fn: (dice) => dice.filter((d) => d === 5).reduce((a, b) => a + b, 0) },
  { key: 'sixes', label: 'Sixes', fn: (dice) => dice.filter((d) => d === 6).reduce((a, b) => a + b, 0) },
  {
    key: 'three-of-kind', label: '3 of a Kind', fn: (dice) => {
      const counts = [0, 0, 0, 0, 0, 0, 0]
      dice.forEach((d) => counts[d]++)
      return counts.some((c) => c >= 3) ? dice.reduce((a, b) => a + b, 0) : 0
    },
  },
  {
    key: 'four-of-kind', label: '4 of a Kind', fn: (dice) => {
      const counts = [0, 0, 0, 0, 0, 0, 0]
      dice.forEach((d) => counts[d]++)
      return counts.some((c) => c >= 4) ? dice.reduce((a, b) => a + b, 0) : 0
    },
  },
  {
    key: 'full-house', label: 'Full House', fn: (dice) => {
      const counts = [0, 0, 0, 0, 0, 0, 0]
      dice.forEach((d) => counts[d]++)
      const vals = counts.filter((c) => c > 0)
      return (vals.includes(3) && vals.includes(2)) ? 25 : 0
    },
  },
  {
    key: 'sm-straight', label: 'Sm. Straight', fn: (dice) => {
      const unique = [...new Set(dice)].sort()
      const str = unique.join('')
      return str.includes('1234') || str.includes('2345') || str.includes('3456') ? 30 : 0
    },
  },
  {
    key: 'lg-straight', label: 'Lg. Straight', fn: (dice) => {
      const sorted = [...dice].sort()
      const str = sorted.join('')
      return str === '12345' || str === '23456' ? 40 : 0
    },
  },
  {
    key: 'yahtzee', label: 'Yahtzee', fn: (dice) => {
      return new Set(dice).size === 1 ? 50 : 0
    },
  },
  {
    key: 'chance', label: 'Chance', fn: (dice) => dice.reduce((a, b) => a + b, 0),
  },
]

const DIE_FACES = { 1: '\u2680', 2: '\u2681', 3: '\u2682', 4: '\u2683', 5: '\u2684', 6: '\u2685' }

function rollDice() {
  return Array.from({ length: 5 }, () => Math.floor(Math.random() * 6) + 1)
}

export default function YahtzeeScorecard({ mode, onGameEnd }) {
  const [dice, setDice] = useState(rollDice())
  const [held, setHeld] = useState([false, false, false, false, false])
  const [rollsLeft, setRollsLeft] = useState(2)
  const [currentPlayer, setCurrentPlayer] = useState(1)
  const [scores, setScores] = useState({
    1: Object.fromEntries(CATEGORIES.map((c) => [c.key, null])),
    2: Object.fromEntries(CATEGORIES.map((c) => [c.key, null])),
  })

  const totalScore = (player) =>
    Object.values(scores[player]).reduce((sum, v) => sum + (v ?? 0), 0)

  const turnsLeft = Object.values(scores[1]).filter((v) => v === null).length +
    Object.values(scores[2]).filter((v) => v === null).length

  const gameOver = turnsLeft === 0

  const roll = () => {
    if (rollsLeft <= 0) return
    setDice((prev) => prev.map((d, i) => (held[i] ? d : Math.floor(Math.random() * 6) + 1)))
    setRollsLeft((r) => r - 1)
  }

  const toggleHold = (i) => {
    setHeld((prev) => prev.map((h, idx) => (idx === i ? !h : h)))
  }

  const scoreCategory = (key) => {
    if (scores[currentPlayer][key] !== null) return
    const cat = CATEGORIES.find((c) => c.key === key)!
    const value = cat.fn(dice)
    setScores((prev) => ({
      ...prev,
      [currentPlayer]: { ...prev[currentPlayer], [key]: value },
    }))
    // Next turn
    const nextPlayer = currentPlayer === 1 ? 2 : 1
    setCurrentPlayer(nextPlayer)
    setDice(rollDice())
    setHeld([false, false, false, false, false])
    setRollsLeft(2)
  }

  const reset = () => {
    setDice(rollDice())
    setHeld([false, false, false, false, false])
    setRollsLeft(2)
    setCurrentPlayer(1)
    setScores({
      1: Object.fromEntries(CATEGORIES.map((c) => [c.key, null])),
      2: Object.fromEntries(CATEGORIES.map((c) => [c.key, null])),
    })
  }

  return (
    <div className={styles.root}>
      {/* Scores header */}
      <div className={styles.scoreRow}>
        <div className={cn(styles.scoreCard, currentPlayer !== 1 && !gameOver && styles.scoreInactive)}>
          <span className={styles.scoreLabel}>Player 1</span>
          <span className={cn(styles.scoreValue, 'text-neon-cyan')}>{totalScore(1)}</span>
        </div>
        <div className={cn(styles.scoreCard, currentPlayer !== 2 && !gameOver && styles.scoreInactive)}>
          <span className={styles.scoreLabel}>Player 2</span>
          <span className={cn(styles.scoreValue, 'text-neon-magenta')}>{totalScore(2)}</span>
        </div>
      </div>

      {gameOver ? (
        <div className={styles.gameOverBox}>
          <p className={styles.gameOverText}>
            {totalScore(1) > totalScore(2) ? 'Player 1 wins!' : totalScore(2) > totalScore(1) ? 'Player 2 wins!' : "It's a tie!"}
          </p>
          <Button onClick={reset} className={styles.resetButton}><RotateCcw size={16} /> Play Again</Button>
        </div>
      ) : (
        <>
          <p className={styles.turnText}>
            Player {currentPlayer}&apos;s turn - {rollsLeft} rolls left
          </p>

          {/* Dice */}
          <div className={styles.diceRow}>
            {dice.map((d, i) => (
              <button
                key={i}
                onClick={() => toggleHold(i)}
                className={cn(
                  styles.dieButton,
                  held[i]
                    ? styles.dieHeld
                    : styles.dieFree,
                  held[i] && 'neon-glow-cyan',
                )}
              >
                {DIE_FACES[d]}
              </button>
            ))}
          </div>

          <Button onClick={roll} disabled={rollsLeft <= 0} className="neon-glow-cyan">
            Roll ({rollsLeft} left)
          </Button>

          {/* Scorecard */}
          <div className={styles.scorecard}>
            <div className={styles.scoreGrid}>
              <div className={cn(styles.scoreCell, styles.scoreHeader)}>Category</div>
              <div className={cn(styles.scoreCell, styles.scoreHeader, styles.scoreHeaderCyan)}>P1</div>
              <div className={cn(styles.scoreCell, styles.scoreHeader, styles.scoreHeaderMagenta)}>P2</div>
              {CATEGORIES.map((cat) => {
                const potential = cat.fn(dice)
                const canScore = scores[currentPlayer][cat.key] === null
                return (
                  <div key={cat.key} className="contents">
                    <div className={cn(styles.scoreCell, 'text-foreground')}>{cat.label}</div>
                    <div className={cn(
                      styles.scoreCell,
                      styles.scoreValueCell,
                      scores[1][cat.key] !== null ? 'text-foreground' : styles.scoreValueMuted,
                    )}>
                      {scores[1][cat.key] !== null ? scores[1][cat.key] : currentPlayer === 1 && canScore ? '' : '-'}
                    </div>
                    <div className={cn(
                      styles.scoreCell,
                      styles.scoreValueCell,
                      scores[2][cat.key] !== null ? 'text-foreground' : styles.scoreValueMuted,
                    )}>
                      {scores[2][cat.key] !== null ? scores[2][cat.key] : currentPlayer === 2 && canScore ? '' : '-'}
                    </div>
                    {canScore && (
                      <div className={styles.scoreActionRow}>
                        <button
                          onClick={() => scoreCategory(cat.key)}
                          className={styles.scoreAction}
                        >
                          Score {potential} points
                        </button>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
