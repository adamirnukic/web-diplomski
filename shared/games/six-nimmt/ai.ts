import type { Difficulty } from '../../types'
import { bullheads, type SixNimmtAction, type SixNimmtState } from './engine'

const headsSum = (row: number[]) => row.reduce((a, c) => a + bullheads(c), 0)

function pickRow(rows: number[][], card: number): number {
  let best = -1
  let bestDiff = Infinity
  for (let i = 0; i < rows.length; i++) {
    const last = rows[i][rows[i].length - 1]
    if (last < card && card - last < bestDiff) {
      bestDiff = card - last
      best = i
    }
  }
  return best
}

/** Bot for 6 Nimmt: play the safest card; when forced, take the cheapest row. */
export function sixNimmtAI(
  state: SixNimmtState,
  playerId: string,
  difficulty: Difficulty = 'normal',
): SixNimmtAction | null {
  // forced to take a row (too-low card) -> take the one with fewest bullheads
  if (state.phase === 'chooseRow' && state.pending === playerId) {
    let best = 0
    let bestHeads = Infinity
    state.rows.forEach((row, i) => {
      const h = headsSum(row)
      if (h < bestHeads) {
        bestHeads = h
        best = i
      }
    })
    return { type: 'takeRow', row: best }
  }

  if (state.phase !== 'select') return null
  const hand = state.hands[playerId] ?? []
  if (hand.length === 0) return null

  if (difficulty === 'easy') {
    return { type: 'play', card: hand[Math.floor(Math.random() * hand.length)] }
  }

  // greedy: minimise the bullheads this card would cost against the current rows
  const cheapestRow = Math.min(...state.rows.map(headsSum))
  let bestCard = hand[0]
  let bestScore = Infinity
  for (const card of hand) {
    const idx = pickRow(state.rows, card)
    let cost: number
    let tie: number
    if (idx === -1) {
      cost = cheapestRow // too low -> take the cheapest row
      tie = 1000 - card
    } else if (state.rows[idx].length >= 5) {
      cost = headsSum(state.rows[idx]) // would be the 6th card
      tie = 0
    } else {
      cost = 0
      // on hard, avoid extending a row to length 5 (sets up a future scoop)
      if (difficulty === 'hard' && state.rows[idx].length === 4) cost = 0.4
      tie = card - state.rows[idx][state.rows[idx].length - 1]
    }
    const score = cost * 1000 + tie
    if (score < bestScore) {
      bestScore = score
      bestCard = card
    }
  }
  return { type: 'play', card: bestCard }
}
