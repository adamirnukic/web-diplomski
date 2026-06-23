import { CARD_VALUE, type CardName, type LLAction, type LLState } from './engine'
import type { Difficulty } from '../../types'

const DECK_COUNTS: Record<CardName, number> = {
  spy: 2, guard: 6, priest: 2, baron: 2, handmaid: 2,
  prince: 2, chancellor: 2, king: 1, countess: 1, princess: 1,
}

/** Most likely card an opponent holds (for a Guard guess) — never 'guard'. */
function bestGuess(s: LLState, p: string): CardName {
  const remaining: Record<string, number> = { ...DECK_COUNTS }
  for (const id of s.order) for (const c of s.discards[id]) remaining[c]--
  for (const c of s.hands[p]) remaining[c]--

  let best: CardName = 'baron'
  let bestN = -1
  for (const name of Object.keys(remaining) as CardName[]) {
    if (name === 'guard') continue
    const n = remaining[name]
    if (n > bestN || (n === bestN && CARD_VALUE[name] > CARD_VALUE[best])) {
      bestN = n
      best = name
    }
  }
  return best
}

function randomTarget(targetable: string[]): string | undefined {
  return targetable.length ? targetable[Math.floor(Math.random() * targetable.length)] : undefined
}

function buildPlay(s: LLState, p: string, card: CardName, targetable: string[]): LLAction {
  const needsTarget =
    card === 'guard' || card === 'priest' || card === 'baron' || card === 'king' || card === 'prince'
  if (!needsTarget) return { type: 'play', card }
  const target = randomTarget(targetable)
  if (card === 'guard') {
    return { type: 'play', card, target, guess: target ? bestGuess(s, p) : undefined }
  }
  return { type: 'play', card, target }
}

/** Love Letter bot — handles every phase the engine can hand it. */
export function loveLetterAI(s: LLState, p: string, difficulty: Difficulty = 'normal'): LLAction {
  if (s.phase === 'peeking') return { type: 'ack' }

  if (s.phase === 'chancellor') {
    const hand = s.hands[p]
    let bi = 0
    for (let i = 1; i < hand.length; i++) if (CARD_VALUE[hand[i]] > CARD_VALUE[hand[bi]]) bi = i
    return { type: 'keep', index: bi }
  }

  // phase 'turn'
  const hand = s.hands[p]
  const targetable = s.order.filter(
    (id) => id !== p && !s.out[id] && !s.protected[id] && s.hands[id].length > 0,
  )

  const mustCountess = hand.includes('countess') && (hand.includes('king') || hand.includes('prince'))
  if (mustCountess) return { type: 'play', card: 'countess' }

  const playable = hand.filter((c) => c !== 'princess')
  const cards = playable.length ? playable : [...hand]

  if (difficulty === 'easy') {
    const card = cards[Math.floor(Math.random() * cards.length)]
    return buildPlay(s, p, card, targetable)
  }

  // default: lead with the lower-value card and keep the stronger one
  let card = [...cards].sort((a, b) => CARD_VALUE[a] - CARD_VALUE[b])[0]
  if (cards.includes('guard') && targetable.length) {
    card = 'guard' // a correct guess knocks someone out
  } else if (hand.includes('princess') && cards.includes('handmaid')) {
    card = 'handmaid' // stuck with the Princess — shield ourselves
  }

  return buildPlay(s, p, card, targetable)
}
