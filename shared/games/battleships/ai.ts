import type { BSAction, BSState } from './engine'
import type { Difficulty } from '../../types'

/**
 * Battleships bot.
 *  - placement: drop a valid random fleet, then declare ready.
 *  - battle: hunt/target using ONLY information the bot legitimately has
 *    (the results of its own shots) — it never peeks at un-fired ship cells.
 */
export function battleshipsAI(s: BSState, p: string, difficulty: Difficulty = 'normal'): BSAction {
  if (s.phase === 'placement') {
    const board = s.boards[p]
    if (board.placed.length < s.fleet.length) return { type: 'randomize' }
    return { type: 'ready' }
  }

  const size = s.size
  const opp = s.order.find((id) => id !== p) as string
  const board = s.boards[opp]
  const shipCells = new Set<number>(board.placed.flat())
  const fired = (i: number) => board.hit[i]
  const inB = (r: number, c: number) => r >= 0 && r < size && c >= 0 && c < size

  // easy: blind random fire — no hunt/target, no parity
  if (difficulty === 'easy') {
    const open: number[] = []
    for (let i = 0; i < size * size; i++) if (!fired(i)) open.push(i)
    return { type: 'fire', index: open[Math.floor(Math.random() * open.length)] }
  }

  // ships we've already fully sunk (their cells stop being useful targets)
  const sunk = new Set<number>()
  for (const ship of board.placed) {
    if (ship.every((c) => board.hit[c])) for (const c of ship) sunk.add(c)
  }
  // hits that belong to a ship still afloat
  const activeHits: number[] = []
  for (let i = 0; i < size * size; i++) {
    if (fired(i) && shipCells.has(i) && !sunk.has(i)) activeHits.push(i)
  }

  const DIRS = [
    [-1, 0], [1, 0], [0, -1], [0, 1],
  ]
  const score = new Map<number, number>()
  for (const h of activeHits) {
    const r = Math.floor(h / size)
    const c = h % size
    for (const [dr, dc] of DIRS) {
      const nr = r + dr
      const nc = c + dc
      if (!inB(nr, nc)) continue
      const n = nr * size + nc
      if (fired(n)) continue
      // extend a known line: bonus if the opposite neighbour is also an active hit
      const opp2 = (r - dr) * size + (c - dc)
      const lineBonus = inB(r - dr, c - dc) && activeHits.includes(opp2) ? 10 : 0
      score.set(n, (score.get(n) ?? 0) + 1 + lineBonus)
    }
  }

  if (score.size > 0) return { type: 'fire', index: bestKey(score) }

  // hunt: random un-fired cell, preferring a checkerboard parity
  const open: number[] = []
  const openParity: number[] = []
  for (let i = 0; i < size * size; i++) {
    if (fired(i)) continue
    open.push(i)
    const r = Math.floor(i / size)
    const c = i % size
    if ((r + c) % 2 === 0) openParity.push(i)
  }
  const pool = openParity.length ? openParity : open
  return { type: 'fire', index: pool[Math.floor(Math.random() * pool.length)] }
}

function bestKey(m: Map<number, number>): number {
  let best = -1
  let bestVal = -Infinity
  const ties: number[] = []
  for (const [k, v] of m) {
    if (v > bestVal) {
      bestVal = v
      ties.length = 0
      ties.push(k)
      best = k
    } else if (v === bestVal) ties.push(k)
  }
  return ties.length ? ties[Math.floor(Math.random() * ties.length)] : best
}
