import { RANK_VALUE } from '../_cards'
import { bestScore } from './evaluate'
import type { PokerAction, PokerState } from './engine'

/** Rough hand strength in [0, 1] for the given player. */
function handStrength(s: PokerState, p: string): number {
  const hole = s.holes[p]
  if (!hole || hole.length < 2) return 0
  if (s.community.length === 0) {
    // preflop heuristic
    const va = RANK_VALUE[hole[0].rank]
    const vb = RANK_VALUE[hole[1].rank]
    const hi = Math.max(va, vb)
    const lo = Math.min(va, vb)
    let str = ((hi - 2) / 12) * 0.5 + ((lo - 2) / 12) * 0.2
    if (va === vb) str += 0.35 // pocket pair
    if (hole[0].suit === hole[1].suit) str += 0.06
    if (Math.abs(va - vb) === 1) str += 0.04
    return Math.min(1, str)
  }
  const score = bestScore([...hole, ...s.community])
  const category = score[0] // 0..8
  const top = (score[1] ?? 0) / 14
  return Math.min(1, 0.26 + category * 0.09 + top * 0.05)
}

/** Decide an action for an AI player. Uses Math.random for variety. */
export function pokerAIDecision(s: PokerState, p: string): PokerAction {
  const committed = s.committed[p] ?? 0
  const chips = s.chips[p] ?? 0
  const toCall = s.currentBet - committed
  const maxTotal = committed + chips
  const strength = handStrength(s, p)
  const r = Math.random()

  const raiseTo = (fraction: number): number => {
    const target = Math.max(
      s.currentBet + s.minRaiseSize,
      s.currentBet + Math.round(Math.max(s.pot, s.currentBet) * fraction),
    )
    return Math.min(target, maxTotal)
  }

  // No bet to call: check or bet
  if (toCall <= 0) {
    if (strength > 0.62 && r < 0.7) {
      const amount = raiseTo(0.5)
      if (amount > s.currentBet) return { type: 'raise', amount }
    }
    return { type: 'check' }
  }

  // Facing a bet
  if (strength < 0.33 && toCall > chips * 0.06) return { type: 'fold' }
  if (strength > 0.8 && r < 0.5) {
    const amount = raiseTo(0.7)
    if (amount > s.currentBet && amount > committed) return { type: 'raise', amount }
  }
  // call (capped to stack -> all-in)
  return { type: 'call' }
}
