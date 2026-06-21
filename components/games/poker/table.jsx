'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import styles from './table.module.css'
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades']
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A']

const suitSymbol = {
  hearts: '\u2665', diamonds: '\u2666', clubs: '\u2663', spades: '\u2660',
}

const VALUE_RANK = {
  '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9,
  '10': 10, 'J': 11, 'Q': 12, 'K': 13, 'A': 14,
}

function createDeck() {
  const deck = []
  for (const suit of SUITS) for (const value of VALUES) deck.push({ suit, value })
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

function evaluateHand(cards) {
  if (cards.length < 5) return { rank: 0, name: 'Incomplete' }
  const values = cards.map((c) => VALUE_RANK[c.value]).sort((a, b) => a - b)
  const suits = cards.map((c) => c.suit)
  const isFlush = new Set(suits).size === 1
  const isStraight = values[4] - values[0] === 4 && new Set(values).size === 5
  const counts = {}
  values.forEach((v) => (counts[v] = (counts[v] || 0) + 1))
  const groups = Object.values(counts).sort((a, b) => b - a)

  if (isFlush && isStraight && values[4] === 14) return { rank: 9, name: 'Royal Flush' }
  if (isFlush && isStraight) return { rank: 8, name: 'Straight Flush' }
  if (groups[0] === 4) return { rank: 7, name: 'Four of a Kind' }
  if (groups[0] === 3 && groups[1] === 2) return { rank: 6, name: 'Full House' }
  if (isFlush) return { rank: 5, name: 'Flush' }
  if (isStraight) return { rank: 4, name: 'Straight' }
  if (groups[0] === 3) return { rank: 3, name: 'Three of a Kind' }
  if (groups[0] === 2 && groups[1] === 2) return { rank: 2, name: 'Two Pair' }
  if (groups[0] === 2) return { rank: 1, name: 'One Pair' }
  return { rank: 0, name: 'High Card' }
}

function MiniCard({ card, hidden }) {
  if (hidden) {
    return (
      <div className={cn(styles.card, styles.cardHidden)}>
        <span className={styles.cardSuit}>?</span>
      </div>
    )
  }
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds'
  return (
    <div className={cn(
      styles.card,
      isRed ? styles.cardRed : styles.cardBlack,
    )}>
      <span className={styles.cardValue}>{card.value}</span>
      <span className={styles.cardSuit}>{suitSymbol[card.suit]}</span>
    </div>
  )
}

export default function PokerTable({ mode, onGameEnd }) {
  const [deck, setDeck] = useState([])
  const [p1Hand, setP1Hand] = useState([])
  const [p2Hand, setP2Hand] = useState([])
  const [community, setCommunity] = useState([])
  const [phase, setPhase] = useState('idle')
  const [pot, setPot] = useState(0)
  const [p1Chips, setP1Chips] = useState(100)
  const [p2Chips, setP2Chips] = useState(100)
  const [currentBet, setCurrentBet] = useState(0)
  const [result, setResult] = useState('')
  const [activePlayer, setActivePlayer] = useState(1)

  const deal = () => {
    const d = createDeck()
    setP1Hand([d.pop()!, d.pop()!])
    setP2Hand([d.pop()!, d.pop()!])
    setCommunity([])
    setDeck(d)
    setPhase('preflop')
    setPot(4) // blinds
    setP1Chips((c) => c - 2)
    setP2Chips((c) => c - 2)
    setCurrentBet(2)
    setActivePlayer(1)
    setResult('')
  }

  const advancePhase = useCallback(() => {
    const d = [...deck]
    if (phase === 'preflop') {
      setCommunity([d.pop()!, d.pop()!, d.pop()!])
      setDeck(d)
      setPhase('flop')
    } else if (phase === 'flop') {
      setCommunity((prev) => [...prev, d.pop()!])
      setDeck(d)
      setPhase('turn')
    } else if (phase === 'turn') {
      setCommunity((prev) => [...prev, d.pop()!])
      setDeck(d)
      setPhase('river')
    } else if (phase === 'river') {
      showdown()
    }
    setActivePlayer(1)
    setCurrentBet(0)
  }, [deck, phase]) // eslint-disable-line react-hooks/exhaustive-deps

  const showdown = () => {
    const p1Full = [...p1Hand, ...community]
    const p2Full = [...p2Hand, ...community]
    // Simple: evaluate best 5 from 7 (simplified - just use first 5 community + holes)
    const p1Best = evaluateHand([...p1Hand, ...community.slice(0, 3)])
    const p2Best = evaluateHand([...p2Hand, ...community.slice(0, 3)])

    if (p1Best.rank > p2Best.rank) {
      setResult(`Player 1 wins with ${p1Best.name}!`)
      setP1Chips((c) => c + pot)
    } else if (p2Best.rank > p1Best.rank) {
      setResult(`Player 2 wins with ${p2Best.name}!`)
      setP2Chips((c) => c + pot)
    } else {
      setResult(`Split pot! Both had ${p1Best.name}`)
      setP1Chips((c) => c + Math.floor(pot / 2))
      setP2Chips((c) => c + Math.ceil(pot / 2))
    }
    setPot(0)
    setPhase('showdown')
  }

  const bet = (amount) => {
    if (activePlayer === 1) {
      setP1Chips((c) => c - amount)
    } else {
      setP2Chips((c) => c - amount)
    }
    setPot((p) => p + amount)
    setCurrentBet(amount)
    setActivePlayer(activePlayer === 1 ? 2 : 1)
  }

  const call = () => {
    if (activePlayer === 1) {
      setP1Chips((c) => c - currentBet)
    } else {
      setP2Chips((c) => c - currentBet)
    }
    setPot((p) => p + currentBet)
    advancePhase()
  }

  const check = () => {
    if (currentBet > 0) return
    if (activePlayer === 1) {
      setActivePlayer(2)
    } else {
      advancePhase()
    }
  }

  const fold = () => {
    const winner = activePlayer === 1 ? 2 : 1
    setResult(`Player ${activePlayer} folds. Player ${winner} wins!`)
    if (winner === 1) setP1Chips((c) => c + pot)
    else setP2Chips((c) => c + pot)
    setPot(0)
    setPhase('showdown')
  }

  const reset = () => {
    setPhase('idle')
    setP1Hand([])
    setP2Hand([])
    setCommunity([])
    setPot(0)
    setResult('')
    setP1Chips(100)
    setP2Chips(100)
  }

  return (
    <div className={styles.root}>
      {/* Chips */}
      <div className={styles.chipsRow}>
        <div className={cn(
          styles.chipCard,
          activePlayer !== 1 && phase !== 'idle' && phase !== 'showdown' && styles.chipInactive,
        )}>
          <span className={styles.chipLabel}>Player 1</span>
          <span className={cn(styles.chipValue, 'text-neon-cyan')}>{p1Chips}</span>
        </div>
        <div className={styles.potInfo}>
          <span className={styles.potLabel}>Pot</span>
          <span className={styles.potValue}>{pot}</span>
        </div>
        <div className={cn(
          styles.chipCard,
          activePlayer !== 2 && phase !== 'idle' && phase !== 'showdown' && styles.chipInactive,
        )}>
          <span className={styles.chipLabel}>Player 2</span>
          <span className={cn(styles.chipValue, 'text-neon-magenta')}>{p2Chips}</span>
        </div>
      </div>

      {phase === 'idle' ? (
        <Button onClick={deal} size="lg" className="neon-glow-cyan">
          Deal Cards
        </Button>
      ) : (
        <>
          {/* Community Cards */}
          <div className={styles.section}>
            <span className={styles.sectionLabel}>{phase}</span>
            <div className={styles.cardRow}>
              {community.length > 0
                ? community.map((c, i) => <MiniCard key={i} card={c} />)
                : Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className={styles.placeholderCard} />
                  ))}
            </div>
          </div>

          {/* Player Hands */}
          <div className={styles.handsRow}>
            <div className={styles.handGroup}>
              <span className={cn(styles.handLabel, styles.handLabelCyan)}>P1 Hand</span>
              <div className={styles.cardRow}>
                {p1Hand.map((c, i) => (
                  <MiniCard key={i} card={c} hidden={activePlayer === 2 && phase !== 'showdown'} />
                ))}
              </div>
            </div>
            <div className={styles.handGroup}>
              <span className={cn(styles.handLabel, styles.handLabelMagenta)}>P2 Hand</span>
              <div className={styles.cardRow}>
                {p2Hand.map((c, i) => (
                  <MiniCard key={i} card={c} hidden={activePlayer === 1 && phase !== 'showdown'} />
                ))}
              </div>
            </div>
          </div>

          {/* Actions */}
          {phase !== 'showdown' && (
            <div className={styles.actionBox}>
              <p className={styles.actionLabel}>
                Player {activePlayer}&apos;s action
              </p>
              <div className={styles.actionRow}>
                {currentBet === 0 && (
                  <Button variant="outline" size="sm" onClick={check}>
                    Check
                  </Button>
                )}
                {currentBet > 0 && (
                  <Button variant="outline" size="sm" onClick={call}>
                    Call ({currentBet})
                  </Button>
                )}
                <Button size="sm" onClick={() => bet(5)} className="neon-glow-cyan">
                  Bet 5
                </Button>
                <Button variant="outline" size="sm" onClick={fold} className={styles.textDestructive}>
                  Fold
                </Button>
              </div>
            </div>
          )}

          {/* Result */}
          {phase === 'showdown' && (
            <div className={styles.resultBox}>
              <p className={styles.resultText}>{result}</p>
              <div className={styles.resetRow}>
                <Button onClick={deal}>Next Hand</Button>
                <Button onClick={reset} variant="outline" className={styles.resetButton}>
                  <RotateCcw size={16} /> Reset
                </Button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
