import type { GameEngine, GameResult, PlayerId } from '../../types'

export const COLS = 7
export const ROWS = 6

export type Disc = 'R' | 'Y'
export type Cell = Disc | null

export interface C4State {
  board: Cell[] // length ROWS*COLS, index = row*COLS + col, row 0 = top
  discs: Record<PlayerId, Disc>
  order: [PlayerId, PlayerId]
  turn: PlayerId
  winningLine: number[] | null
}

export type C4Action = { type: 'drop'; col: number }

export interface C4View {
  board: Cell[]
  yourDisc: Disc
  turnDisc: Disc
  turn: PlayerId
  yourTurn: boolean
  winningLine: number[] | null
  result: GameResult | null
}

const idx = (row: number, col: number) => row * COLS + col

function lowestEmptyRow(board: Cell[], col: number): number {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (board[idx(row, col)] === null) return row
  }
  return -1
}

const DIRS: ReadonlyArray<readonly [number, number]> = [
  [0, 1], // horizontal
  [1, 0], // vertical
  [1, 1], // diagonal down-right
  [1, -1], // diagonal down-left
]

function findWinningLine(board: Cell[], row: number, col: number): number[] | null {
  const disc = board[idx(row, col)]
  if (!disc) return null
  for (const [dr, dc] of DIRS) {
    const line = [idx(row, col)]
    for (let s = 1; s < 4; s++) {
      const r = row + dr * s
      const c = col + dc * s
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[idx(r, c)] !== disc) break
      line.push(idx(r, c))
    }
    for (let s = 1; s < 4; s++) {
      const r = row - dr * s
      const c = col - dc * s
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS || board[idx(r, c)] !== disc) break
      line.unshift(idx(r, c))
    }
    if (line.length >= 4) return line.slice(0, 4)
  }
  return null
}

function getResult(state: C4State): GameResult | null {
  if (state.winningLine) {
    const disc = state.board[state.winningLine[0]] as Disc
    const winnerId = state.order.find((id) => state.discs[id] === disc) as PlayerId
    return { status: 'win', winnerId, scores: { [winnerId]: 1 } }
  }
  if (state.board.every((c) => c !== null)) return { status: 'draw' }
  return null
}

export const connectFourEngine: GameEngine<C4State, C4Action, C4View> = {
  id: 'connect-four',
  minPlayers: 2,
  maxPlayers: 2,

  createInitialState(players) {
    if (players.length !== 2) throw new Error('Connect Four zahtijeva 2 igrača')
    const [p1, p2] = players
    return {
      board: Array(ROWS * COLS).fill(null),
      discs: { [p1.id]: 'R', [p2.id]: 'Y' },
      order: [p1.id, p2.id],
      turn: p1.id,
      winningLine: null,
    }
  },

  applyAction(state, playerId, action) {
    if (getResult(state)) throw new Error('Igra je završena')
    if (state.turn !== playerId) throw new Error('Nije tvoj potez')
    if (action.type !== 'drop') throw new Error('Nepoznata akcija')
    const { col } = action
    if (!Number.isInteger(col) || col < 0 || col >= COLS) throw new Error('Nevažeća kolona')
    const row = lowestEmptyRow(state.board, col)
    if (row < 0) throw new Error('Kolona je puna')

    const board = state.board.slice()
    board[idx(row, col)] = state.discs[playerId]
    const winningLine = findWinningLine(board, row, col)
    const nextTurn = state.order.find((id) => id !== playerId) as PlayerId

    return {
      ...state,
      board,
      winningLine,
      turn: winningLine ? state.turn : nextTurn,
    }
  },

  getView(state, playerId) {
    return {
      board: state.board,
      yourDisc: state.discs[playerId],
      turnDisc: state.discs[state.turn],
      turn: state.turn,
      yourTurn: state.turn === playerId && !getResult(state),
      winningLine: state.winningLine,
      result: getResult(state),
    }
  },

  getCurrentPlayer(state) {
    return getResult(state) ? null : state.turn
  },

  getResult,
}
