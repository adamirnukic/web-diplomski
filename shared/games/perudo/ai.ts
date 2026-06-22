import type { PerudoAction, PerudoState } from './engine'

const totalDice = (s: PerudoState) =>
  s.order.reduce((a, id) => a + (s.alive[id] ? s.dice[id].length : 0), 0)

function myMatches(s: PerudoState, p: string, face: number): number {
  return (s.dice[p] ?? []).filter((d) => d === face || d === 1).length
}

/** Liar's-dice bot: estimate expected matches and bid/challenge accordingly. */
export function perudoAI(s: PerudoState, p: string): PerudoAction {
  const total = totalDice(s)
  const myCount = s.dice[p]?.length ?? 0
  const others = total - myCount
  // each unknown die matches a given face with prob 1/3 (the face or a wild 1)
  const expectedOthers = others / 3

  if (s.bid) {
    const mine = myMatches(s, p, s.bid.face)
    const expected = mine + expectedOthers
    // probability the bid holds is low if expected well below the claim
    const gap = s.bid.count - expected
    const challenge = gap > 1.0 + Math.random()
    if (challenge) return { type: 'challenge' }
    // otherwise raise: minimal legal raise, biased by our own dice
    let count = s.bid.count
    let face = s.bid.face
    if (face < 6) face += 1
    else {
      face = 2
      count += 1
    }
    // sometimes bump count instead, based on confidence
    if (Math.random() < 0.4 && count < total) {
      count += 1
      face = bestFace(s, p)
    }
    if (count > total) return { type: 'challenge' }
    return { type: 'bid', count, face }
  }

  // opening bid
  const face = bestFace(s, p)
  const mine = myMatches(s, p, face)
  const count = Math.max(1, Math.round(mine + expectedOthers * 0.7))
  return { type: 'bid', count: Math.min(count, total), face }
}

function bestFace(s: PerudoState, p: string): number {
  const counts = [0, 0, 0, 0, 0, 0, 0]
  for (const d of s.dice[p] ?? []) counts[d]++
  let best = 2
  let bestN = -1
  for (let f = 2; f <= 6; f++) {
    const n = counts[f] + counts[1] // include wild aces
    if (n > bestN) {
      bestN = n
      best = f
    }
  }
  return best
}
