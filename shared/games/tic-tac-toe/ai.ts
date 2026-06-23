import type { Cell, Mark, TttAction, TttState } from './engine'
import type { Difficulty } from '../../types'

const LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
]

function winner(b: Cell[]): Mark | 'draw' | null {
  for (const [a, c, d] of LINES) {
    if (b[a] && b[a] === b[c] && b[a] === b[d]) return b[a] as Mark
  }
  return b.every((x) => x) ? 'draw' : null
}

function minimax(b: Cell[], turn: Mark, me: Mark, opp: Mark, depth: number): number {
  const w = winner(b)
  if (w === me) return 10 - depth
  if (w === opp) return depth - 10
  if (w === 'draw') return 0
  let best = turn === me ? -Infinity : Infinity
  for (let i = 0; i < 9; i++) {
    if (b[i]) continue
    b[i] = turn
    const v = minimax(b, turn === me ? opp : me, me, opp, depth + 1)
    b[i] = null
    best = turn === me ? Math.max(best, v) : Math.min(best, v)
  }
  return best
}

/** Optimal (unbeatable) tic-tac-toe via full minimax — the board is tiny.
 *  easy: random; normal: optimal with the occasional slip; hard: optimal. */
export function ticTacToeAI(s: TttState, p: string, difficulty: Difficulty = 'normal'): TttAction {
  const me = s.marks[p]
  const opp: Mark = me === 'X' ? 'O' : 'X'
  const b = s.board.slice()
  const empties = b.map((c, i) => (c ? -1 : i)).filter((i) => i >= 0)
  const randomMove = (): TttAction => ({ type: 'place', index: empties[Math.floor(Math.random() * empties.length)] })
  if (difficulty === 'easy') return randomMove()
  if (difficulty === 'normal' && Math.random() < 0.25) return randomMove()

  let bestScore = -Infinity
  let bestIdx = b.findIndex((x) => !x)
  for (let i = 0; i < 9; i++) {
    if (b[i]) continue
    b[i] = me
    const score = minimax(b, opp, me, opp, 1)
    b[i] = null
    if (score > bestScore) {
      bestScore = score
      bestIdx = i
    }
  }
  return { type: 'place', index: bestIdx }
}
