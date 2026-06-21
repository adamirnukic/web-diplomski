import type { GameEngine, GameResult, PlayerId } from '../../types'

export type Mark = 'X' | 'O'
export type Cell = Mark | null

export interface TttState {
  board: Cell[] // length 9, row-major
  /** playerId -> mark */
  marks: Record<PlayerId, Mark>
  /** turn order: [X player, O player] */
  order: [PlayerId, PlayerId]
  /** whose turn it is */
  turn: PlayerId
  winningLine: number[] | null
}

export type TttAction = { type: 'place'; index: number }

export interface TttView {
  board: Cell[]
  yourMark: Mark
  /** mark of whoever is currently on the move (handy for the UI) */
  turnMark: Mark
  turn: PlayerId
  yourTurn: boolean
  winningLine: number[] | null
  result: GameResult | null
}

const LINES: ReadonlyArray<readonly [number, number, number]> = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8], // rows
  [0, 3, 6], [1, 4, 7], [2, 5, 8], // cols
  [0, 4, 8], [2, 4, 6],            // diagonals
]

function findWin(board: Cell[]): { mark: Mark; line: number[] } | null {
  for (const [a, b, c] of LINES) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { mark: board[a] as Mark, line: [a, b, c] }
    }
  }
  return null
}

function getResult(state: TttState): GameResult | null {
  const win = findWin(state.board)
  if (win) {
    const winnerId = state.order.find((id) => state.marks[id] === win.mark) as PlayerId
    return { status: 'win', winnerId, scores: { [winnerId]: 1 } }
  }
  if (state.board.every((c) => c !== null)) return { status: 'draw' }
  return null
}

export const ticTacToeEngine: GameEngine<TttState, TttAction, TttView> = {
  id: 'tic-tac-toe',
  minPlayers: 2,
  maxPlayers: 2,

  createInitialState(players) {
    if (players.length !== 2) {
      throw new Error('Tic-Tac-Toe zahtijeva tačno 2 igrača')
    }
    const [p1, p2] = players
    return {
      board: Array(9).fill(null),
      marks: { [p1.id]: 'X', [p2.id]: 'O' },
      order: [p1.id, p2.id],
      turn: p1.id,
      winningLine: null,
    }
  },

  applyAction(state, playerId, action) {
    if (getResult(state)) throw new Error('Igra je završena')
    if (state.turn !== playerId) throw new Error('Nije tvoj potez')
    if (action.type !== 'place') throw new Error('Nepoznata akcija')
    const { index } = action
    if (!Number.isInteger(index) || index < 0 || index > 8) {
      throw new Error('Nevažeće polje')
    }
    if (state.board[index] !== null) throw new Error('Polje je zauzeto')

    const board = state.board.slice()
    board[index] = state.marks[playerId]
    const win = findWin(board)
    const nextTurn = state.order.find((id) => id !== playerId) as PlayerId

    return {
      ...state,
      board,
      turn: win ? state.turn : nextTurn,
      winningLine: win ? win.line : null,
    }
  },

  getView(state, playerId) {
    const result = getResult(state)
    return {
      board: state.board,
      yourMark: state.marks[playerId],
      turnMark: state.marks[state.turn],
      turn: state.turn,
      yourTurn: state.turn === playerId && !result,
      winningLine: state.winningLine,
      result,
    }
  },

  getCurrentPlayer(state) {
    return getResult(state) ? null : state.turn
  },

  getResult,
}
