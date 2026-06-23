import { checkersEngine, type CheckersAction, type CheckersState, type Color, type Piece } from './engine'

const colorOf = (p: Piece): Color => (p === 'r' || p === 'R' ? 'r' : 'b')
const isKing = (p: Piece): boolean => p === 'R' || p === 'B'

function colorForPlayer(s: CheckersState, id: string): Color {
  return id === s.order[0] ? 'r' : 'b'
}

/** Material + advancement, from `me`'s perspective. */
function evaluate(s: CheckersState, me: Color): number {
  let score = 0
  for (let i = 0; i < 64; i++) {
    const p = s.board[i]
    if (!p) continue
    const row = Math.floor(i / 8)
    const val = isKing(p) ? 5 : 3 + (colorOf(p) === 'r' ? (7 - row) : row) * 0.1
    score += colorOf(p) === me ? val : -val
  }
  return score
}

function movesFor(s: CheckersState): CheckersAction[] {
  return checkersEngine.getView(s, s.turn).moves.map((m) => ({ type: 'move', from: m.from, to: m.to }))
}

function negamax(s: CheckersState, depth: number, alpha: number, beta: number, me: Color): number {
  const result = checkersEngine.getResult(s)
  if (result) return result.winnerId && colorForPlayer(s, result.winnerId) === me ? 1000 + depth : -1000 - depth
  if (depth === 0) return evaluate(s, me)

  const moves = movesFor(s)
  const maximizing = colorForPlayer(s, s.turn) === me
  let best = maximizing ? -Infinity : Infinity
  for (const move of moves) {
    const next = checkersEngine.applyAction(s, s.turn, move)
    const v = negamax(next, depth - 1, alpha, beta, me)
    if (maximizing) {
      best = Math.max(best, v)
      alpha = Math.max(alpha, best)
    } else {
      best = Math.min(best, v)
      beta = Math.min(beta, best)
    }
    if (alpha >= beta) break
  }
  return best
}

/** Checkers bot: alpha-beta search on material + advancement. */
export function checkersAI(s: CheckersState, p: string): CheckersAction {
  const me = colorForPlayer(s, p)
  const moves = movesFor(s)
  let best = moves[0]
  let bestScore = -Infinity
  for (const move of moves) {
    const next = checkersEngine.applyAction(s, s.turn, move)
    const score = negamax(next, 5, -Infinity, Infinity, me)
    if (score > bestScore) {
      bestScore = score
      best = move
    }
  }
  return best
}
