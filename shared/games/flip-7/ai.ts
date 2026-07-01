import type { Difficulty } from '../../types'
import type { Flip7Action, Flip7Card, Flip7State } from './engine'

const nums = (cards: Flip7Card[]) => cards.filter((c) => c.t === 'num') as { t: 'num'; n: number }[]
const uniqueNums = (cards: Flip7Card[]) => new Set(nums(cards).map((c) => c.n)).size

function roundScore(cards: Flip7Card[]): number {
  let s = cards.reduce((a, c) => a + (c.t === 'num' ? c.n : 0), 0)
  if (cards.some((c) => c.t === 'x2')) s *= 2
  for (const c of cards) if (c.t === 'add') s += c.v
  return s
}

/** Bot for Flip 7: press your luck by round score + bust risk; hit-target the leader. */
export function flip7AI(
  state: Flip7State,
  playerId: string,
  difficulty: Difficulty = 'normal',
): Flip7Action | null {
  if (state.phase === 'target' && state.pending?.by === playerId) {
    const active = state.order.filter((id) => state.active[id])
    const opps = active.filter((id) => id !== playerId)
    const pool = opps.length ? opps : active
    if (state.pending.kind === 'freeze') {
      // deny the current leader their banked points
      let best = pool[0]
      for (const id of pool) if (roundScore(state.cards[id]) > roundScore(state.cards[best])) best = id
      return { type: 'target', player: best }
    }
    // flip3: force the player holding most numbers to keep risking a bust
    let best = pool[0]
    for (const id of pool) if (nums(state.cards[id]).length > nums(state.cards[best]).length) best = id
    return { type: 'target', player: best }
  }

  if (state.phase === 'play' && state.turn === playerId) {
    const cards = state.cards[playerId] ?? []
    if (cards.length === 0) return { type: 'hit' } // must draw at least once

    const uq = uniqueNums(cards)
    const rs = roundScore(cards)
    const heldNonzero = new Set(nums(cards).filter((c) => c.n > 0).map((c) => c.n)).size
    const bustRisk = heldNonzero / 15

    if (difficulty === 'easy') {
      return rs < 12 || Math.random() < 0.5 ? { type: 'hit' } : { type: 'stay' }
    }
    if (uq >= 6) return { type: 'hit' } // one card away from a Flip 7 (+15)
    const greed = difficulty === 'hard' ? 26 : 20
    if (rs >= greed) return { type: 'stay' }
    if (bustRisk > 0.45 && rs >= 12) return { type: 'stay' }
    return { type: 'hit' }
  }

  return null
}
