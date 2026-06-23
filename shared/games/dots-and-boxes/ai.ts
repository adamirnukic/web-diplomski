import type { DBAction, DBState } from './engine'

interface Cand {
  kind: 'h' | 'v'
  index: number
  completes: number // boxes this edge finishes (0..2)
  creates3: number // boxes this edge brings to 3 sides (gives opponent a box)
}

/** sides already drawn around box (r,c) */
function boxSides(s: DBState, r: number, c: number): number {
  const C = s.cols
  let n = 0
  if (s.h[r * C + c]) n++
  if (s.h[(r + 1) * C + c]) n++
  if (s.v[r * (C + 1) + c]) n++
  if (s.v[r * (C + 1) + (c + 1)]) n++
  return n
}

function adjacentBoxes(s: DBState, kind: 'h' | 'v', index: number): [number, number][] {
  const C = s.cols
  const ROWS = s.rows
  const out: [number, number][] = []
  if (kind === 'h') {
    const r = Math.floor(index / C)
    const c = index % C
    if (r < ROWS) out.push([r, c])
    if (r >= 1) out.push([r - 1, c])
  } else {
    const r = Math.floor(index / (C + 1))
    const c = index % (C + 1)
    if (c < C) out.push([r, c])
    if (c >= 1) out.push([r, c - 1])
  }
  return out
}

function candidates(s: DBState): Cand[] {
  const out: Cand[] = []
  const scan = (kind: 'h' | 'v', edges: boolean[]) => {
    for (let i = 0; i < edges.length; i++) {
      if (edges[i]) continue
      let completes = 0
      let creates3 = 0
      for (const [r, c] of adjacentBoxes(s, kind, i)) {
        const sides = boxSides(s, r, c)
        if (sides === 3) completes++
        else if (sides === 2) creates3++
      }
      out.push({ kind, index: i, completes, creates3 })
    }
  }
  scan('h', s.h)
  scan('v', s.v)
  return out
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)]
}

/** Dots & Boxes bot: take a box if you can, else play a "safe" edge that
 *  doesn't hand the opponent a third side; if none, give away the least. */
export function dotsAndBoxesAI(s: DBState, _p: string): DBAction {
  const cands = candidates(s)
  const scoring = cands.filter((c) => c.completes > 0)
  if (scoring.length) {
    const best = Math.max(...scoring.map((c) => c.completes))
    const top = scoring.filter((c) => c.completes === best)
    const { kind, index } = pick(top)
    return { type: 'edge', kind, index }
  }
  const safe = cands.filter((c) => c.creates3 === 0)
  if (safe.length) {
    const { kind, index } = pick(safe)
    return { type: 'edge', kind, index }
  }
  // forced to give something away — minimise the damage
  const least = Math.min(...cands.map((c) => c.creates3))
  const { kind, index } = pick(cands.filter((c) => c.creates3 === least))
  return { type: 'edge', kind, index }
}
