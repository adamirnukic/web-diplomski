import { COLS, ROWS, type C4Action, type C4State, type Cell, type Disc } from './engine'

const idx = (r: number, c: number) => r * COLS + c

function dropInto(board: Cell[], col: number, disc: Disc): Cell[] | null {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[idx(r, col)] === null) {
      const b = board.slice()
      b[idx(r, col)] = disc
      return b
    }
  }
  return null
}

const WINDOWS: number[][] = (() => {
  const out: number[][] = []
  const dirs = [[0, 1], [1, 0], [1, 1], [1, -1]]
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      for (const [dr, dc] of dirs) {
        const cells: number[] = []
        for (let k = 0; k < 4; k++) {
          const rr = r + dr * k
          const cc = c + dc * k
          if (rr < 0 || rr >= ROWS || cc < 0 || cc >= COLS) break
          cells.push(idx(rr, cc))
        }
        if (cells.length === 4) out.push(cells)
      }
    }
  }
  return out
})()

function hasFour(board: Cell[], disc: Disc): boolean {
  return WINDOWS.some((w) => w.every((i) => board[i] === disc))
}

function heuristic(board: Cell[], me: Disc, opp: Disc): number {
  let score = 0
  for (const w of WINDOWS) {
    let mine = 0
    let theirs = 0
    for (const i of w) {
      if (board[i] === me) mine++
      else if (board[i] === opp) theirs++
    }
    if (mine && theirs) continue
    if (mine) score += mine === 3 ? 50 : mine === 2 ? 10 : 1
    else if (theirs) score -= theirs === 3 ? 50 : theirs === 2 ? 10 : 1
  }
  // central control is valuable
  for (let r = 0; r < ROWS; r++) {
    if (board[idx(r, 3)] === me) score += 3
    else if (board[idx(r, 3)] === opp) score -= 3
  }
  return score
}

const ORDER = [3, 2, 4, 1, 5, 0, 6] // search centre-first for better pruning

function negamax(board: Cell[], depth: number, alpha: number, beta: number, turn: Disc, me: Disc, opp: Disc): number {
  if (hasFour(board, me)) return 100000 + depth
  if (hasFour(board, opp)) return -100000 - depth
  const moves = ORDER.filter((c) => board[idx(0, c)] === null)
  if (depth === 0 || moves.length === 0) return heuristic(board, me, opp)

  if (turn === me) {
    let best = -Infinity
    for (const c of moves) {
      const b = dropInto(board, c, me)!
      best = Math.max(best, negamax(b, depth - 1, alpha, beta, opp, me, opp))
      alpha = Math.max(alpha, best)
      if (alpha >= beta) break
    }
    return best
  }
  let best = Infinity
  for (const c of moves) {
    const b = dropInto(board, c, opp)!
    best = Math.min(best, negamax(b, depth - 1, alpha, beta, me, me, opp))
    beta = Math.min(beta, best)
    if (alpha >= beta) break
  }
  return best
}

/** Connect Four bot: take a win, block a loss, otherwise alpha-beta search. */
export function connectFourAI(s: C4State, p: string): C4Action {
  const me = s.discs[p]
  const opp: Disc = me === 'R' ? 'Y' : 'R'
  const board = s.board
  const playable = ORDER.filter((c) => board[idx(0, c)] === null)

  for (const c of playable) {
    if (hasFour(dropInto(board, c, me)!, me)) return { type: 'drop', col: c }
  }
  for (const c of playable) {
    if (hasFour(dropInto(board, c, opp)!, opp)) return { type: 'drop', col: c }
  }

  let bestCol = playable[0]
  let bestScore = -Infinity
  for (const c of playable) {
    const b = dropInto(board, c, me)!
    const score = negamax(b, 4, -Infinity, Infinity, opp, me, opp)
    if (score > bestScore) {
      bestScore = score
      bestCol = c
    }
  }
  return { type: 'drop', col: bestCol }
}
