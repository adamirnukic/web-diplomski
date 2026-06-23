import type { CoupAction, CoupCard, CoupState } from './engine'
import type { Difficulty, PlayerId } from '../../types'

const ACTION_CARD: Record<string, CoupCard | undefined> = {
  tax: 'duke',
  assassinate: 'assassin',
  steal: 'captain',
  exchange: 'ambassador',
}

function blockCardsFor(a: string): CoupCard[] {
  if (a === 'foreign_aid') return ['duke']
  if (a === 'assassinate') return ['contessa']
  if (a === 'steal') return ['captain', 'ambassador']
  return []
}

// how much we'd rather keep a given card (used for losing / exchanging)
const KEEP: Record<CoupCard, number> = {
  duke: 5,
  contessa: 4,
  captain: 3,
  assassin: 3,
  ambassador: 2,
}

const active = (s: CoupState): PlayerId[] => s.order.filter((id) => s.influence[id].length > 0)

/** How many copies of `card` this bot can already see (its own hand + all revealed). */
function visibleCount(s: CoupState, me: PlayerId, card: CoupCard): number {
  let n = s.influence[me].filter((c) => c === card).length
  for (const id of s.order) n += s.revealed[id].filter((c) => c === card).length
  return n
}

const rnd = () => Math.random()

/** Coup bot — mostly honest play, sure-thing challenges, defensive blocks.
 *  Difficulty scales how readily it challenges/bluffs. */
export function coupAI(s: CoupState, me: PlayerId, difficulty: Difficulty = 'normal'): CoupAction {
  const hand = s.influence[me]
  const has = (c: CoupCard) => hand.includes(c)
  const p = s.pending
  const passive = difficulty === 'easy'
  const aggressive = difficulty === 'hard'
  const chP = passive ? 0.15 : aggressive ? 0.85 : 0.5
  const desperateP = passive ? 0.2 : aggressive ? 0.6 : 0.45

  switch (s.phase) {
    case 'action': {
      const opp = active(s).filter((id) => id !== me)
      if (opp.length === 0) return { type: 'income' }
      const threat = [...opp].sort(
        (a, b) =>
          s.influence[b].length - s.influence[a].length || s.coins[b] - s.coins[a],
      )[0]
      const richest = [...opp]
        .filter((id) => s.coins[id] > 0)
        .sort((a, b) => s.coins[b] - s.coins[a])[0]

      if (s.coins[me] >= 10) return { type: 'coup', target: threat }
      if (s.coins[me] >= 7) return { type: 'coup', target: threat }
      if (has('assassin') && s.coins[me] >= 3) return { type: 'assassinate', target: threat }
      if (has('duke')) return { type: 'tax' }
      if (has('captain') && richest) return { type: 'steal', target: richest }
      if (has('ambassador') && rnd() < 0.3) return { type: 'exchange' }
      if (!passive && s.coins[me] < 3 && rnd() < (aggressive ? 0.35 : 0.25)) return { type: 'tax' }
      return rnd() < 0.6 ? { type: 'foreign_aid' } : { type: 'income' }
    }

    case 'response': {
      if (!p) return { type: 'pass' }
      const claim = ACTION_CARD[p.action]
      const amTarget = p.target === me
      if (claim && visibleCount(s, me, claim) >= 3) return { type: 'challenge' }

      const blocks = p.action === 'foreign_aid' || amTarget ? blockCardsFor(p.action) : []
      const haveBlock = blocks.find((c) => has(c))
      if (haveBlock) {
        if (amTarget) return { type: 'block', card: haveBlock }
        if (p.action === 'foreign_aid' && rnd() < 0.4) return { type: 'block', card: haveBlock }
      }
      if (claim && visibleCount(s, me, claim) === 2 && rnd() < chP) return { type: 'challenge' }
      // desperate bluff to avoid being assassinated out
      if (amTarget && p.action === 'assassinate' && hand.length === 1 && rnd() < desperateP) {
        return { type: 'block', card: 'contessa' }
      }
      return { type: 'pass' }
    }

    case 'blockResponse': {
      if (!p || !p.blockCard) return { type: 'pass' }
      if (visibleCount(s, me, p.blockCard) >= 3) return { type: 'challenge' }
      if (p.actor === me) {
        if (visibleCount(s, me, p.blockCard) === 2 && rnd() < chP) return { type: 'challenge' }
        if (rnd() < (aggressive ? 0.4 : passive ? 0.05 : 0.15)) return { type: 'challenge' }
      }
      return { type: 'pass' }
    }

    case 'targetBlock': {
      if (!p) return { type: 'pass' }
      const haveBlock = blockCardsFor(p.action).find((c) => has(c))
      if (haveBlock) return { type: 'block', card: haveBlock }
      if (p.action === 'assassinate' && hand.length === 1 && rnd() < desperateP) {
        return { type: 'block', card: 'contessa' }
      }
      return { type: 'pass' }
    }

    case 'lose': {
      const sorted = [...hand].sort((a, b) => KEEP[a] - KEEP[b])
      return { type: 'lose', card: sorted[0] ?? hand[0] }
    }

    case 'exchange': {
      const ex = s.exchange
      if (!ex) return { type: 'keep', cards: hand.slice() }
      const sorted = [...ex.options].sort((a, b) => KEEP[b] - KEEP[a])
      return { type: 'keep', cards: sorted.slice(0, ex.keep) }
    }

    default:
      return { type: 'pass' }
  }
}
