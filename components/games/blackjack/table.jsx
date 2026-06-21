'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import styles from './table.module.css'
const SUITS = ['hearts', 'diamonds', 'clubs', 'spades']
const VALUES = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']

function createDeck() {
  const deck = []
  for (const suit of SUITS) for (const value of VALUES) deck.push({ suit, value })
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

function cardScore(card) {
  if (card.value === 'A') return 11
  if (['K', 'Q', 'J'].includes(card.value)) return 10
  return parseInt(card.value)
}

function handValue(hand) {
  let total = hand.reduce((s, c) => s + cardScore(c), 0)
  let aces = hand.filter((c) => c.value === 'A').length
  while (total > 21 && aces > 0) { total -= 10; aces-- }
  return total
}

const suitSymbol = {
  hearts: '\u2665', diamonds: '\u2666', clubs: '\u2663', spades: '\u2660',
}

function CardDisplay({ card, hidden }) {
  const isRed = card.suit === 'hearts' || card.suit === 'diamonds'
  if (hidden) {
    return (
      <div className={cn(styles.card, styles.cardHidden)}>
        <span className={styles.cardSuit}>?</span>
      </div>
    )
  }
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

export default function BlackjackTable({ mode, onGameEnd }) {
  const [deck, setDeck] = useState(createDeck())
  const [playerHand, setPlayerHand] = useState([])
  const [dealerHand, setDealerHand] = useState([])
  const [phase, setPhase] = useState('betting')
  const [result, setResult] = useState('')
  const [scores, setScores] = useState({ player: 0, dealer: 0 })

  const deal = () => {
    const newDeck = createDeck()
    const pHand = [newDeck.pop()!, newDeck.pop()!]
    const dHand = [newDeck.pop()!, newDeck.pop()!]
    setDeck(newDeck)
    setPlayerHand(pHand)
    setDealerHand(dHand)
    setPhase('playing')
    setResult('')

    if (handValue(pHand) === 21) {
      setPhase('over')
      setResult('Blackjack! You win!')
      setScores((s) => ({ ...s, player: s.player + 1 }))
    }
  }

  const hit = () => {
    const newDeck = [...deck]
    const card = newDeck.pop()!
    const newHand = [...playerHand, card]
    setDeck(newDeck)
    setPlayerHand(newHand)

    if (handValue(newHand) > 21) {
      setPhase('over')
      setResult('Bust! Dealer wins.')
      setScores((s) => ({ ...s, dealer: s.dealer + 1 }))
    }
  }

  const stand = useCallback(() => {
    let dHand = [...dealerHand]
    let d = [...deck]
    while (handValue(dHand) < 17) {
      dHand.push(d.pop()!)
    }
    setDealerHand(dHand)
    setDeck(d)

    const pVal = handValue(playerHand)
    const dVal = handValue(dHand)

    if (dVal > 21) {
      setResult('Dealer busts! You win!')
      setScores((s) => ({ ...s, player: s.player + 1 }))
    } else if (pVal > dVal) {
      setResult('You win!')
      setScores((s) => ({ ...s, player: s.player + 1 }))
    } else if (dVal > pVal) {
      setResult('Dealer wins!')
      setScores((s) => ({ ...s, dealer: s.dealer + 1 }))
    } else {
      setResult('Push! It\'s a tie.')
    }
    setPhase('over')
  }, [dealerHand, deck, playerHand])

  const reset = () => {
    setPhase('betting')
    setPlayerHand([])
    setDealerHand([])
    setResult('')
  }

  return (
    <div className={styles.root}>
      {/* Scores */}
      <div className={styles.scoreRow}>
        <div className={styles.scoreCard}>
          <span className={styles.scoreLabel}>You</span>
          <span className={cn(styles.scoreValue, 'text-neon-cyan')}>{scores.player}</span>
        </div>
        <div className={styles.scoreCard}>
          <span className={styles.scoreLabel}>Dealer</span>
          <span className={cn(styles.scoreValue, 'text-neon-magenta')}>{scores.dealer}</span>
        </div>
      </div>

      {phase === 'betting' ? (
        <Button onClick={deal} size="lg" className="neon-glow-cyan">
          Deal Cards
        </Button>
      ) : (
        <>
          {/* Dealer */}
          <div className={styles.section}>
            <span className={styles.sectionLabel}>
              Dealer {phase === 'over' ? `(${handValue(dealerHand)})` : ''}
            </span>
            <div className={styles.cardRow}>
              {dealerHand.map((card, i) => (
                <CardDisplay
                  key={`d-${i}`}
                  card={card}
                  hidden={i === 1 && phase === 'playing'}
                />
              ))}
            </div>
          </div>

          <div className={styles.divider} />

          {/* Player */}
          <div className={styles.section}>
            <span className={styles.sectionLabel}>
              You ({handValue(playerHand)})
            </span>
            <div className={styles.cardRow}>
              {playerHand.map((card, i) => (
                <CardDisplay key={`p-${i}`} card={card} />
              ))}
            </div>
          </div>

          {/* Actions */}
          {phase === 'playing' && (
            <div className={styles.actionsRow}>
              <Button onClick={hit} variant="outline">
                Hit
              </Button>
              <Button onClick={stand} className="neon-glow-cyan">
                Stand
              </Button>
            </div>
          )}

          {/* Result */}
          {phase === 'over' && (
            <div className={styles.resultWrap}>
              <p className={cn(
                styles.resultText,
                result.includes('win') || result.includes('Blackjack')
                  ? styles.resultWin
                  : result.includes('Dealer')
                    ? styles.resultLose
                    : styles.resultTie,
              )}>
                {result}
              </p>
              <Button onClick={reset} className={styles.resetButton}>
                <RotateCcw size={16} />
                Next Hand
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
