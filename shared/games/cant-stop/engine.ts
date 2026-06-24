import type { GameEngine, GameEvent, GameResult, PlayerId } from '../../types'

const COLS = [2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]
const TOP: Record<number, number> = {
  2: 3, 3: 5, 4: 7, 5: 9, 6: 11, 7: 13, 8: 11, 9: 9, 10: 7, 11: 5, 12: 3,
}
const COLUMNS_TO_WIN = 3

export interface CantStopState {
  order: PlayerId[]
  names: Record<PlayerId, string>
  ai: Record<PlayerId, boolean>
  claimed: Record<number, PlayerId | null>
  progress: Record<PlayerId, Record<number, number>>
  temp: Record<number, number>
  turn: PlayerId
  phase: 'rolling' | 'choosing' | 'deciding' | 'matchover'
  dice: number[]
  pairings: { sums: [number, number]; advance: number[] }[]
  message: string
  events: GameEvent[]
}

export type CantStopAction =
  | { type: 'roll' }
  | { type: 'choose'; pairing: number }
  | { type: 'stop' }

export interface CantStopColView {
  col: number
  top: number
  claimedBy: PlayerId | null
  marks: { id: PlayerId; height: number }[]
  temp: number | null
}

export interface CantStopView {
  you: PlayerId
  turnName: string
  turnId: PlayerId
  isAI: boolean
  columns: CantStopColView[]
  claimedCount: Record<PlayerId, number>
  names: Record<PlayerId, string>
  order: PlayerId[]
  phase: CantStopState['phase']
  dice: number[]
  pairings: { sums: [number, number]; advance: number[] }[]
  runnersUsed: number
  yourTurn: boolean
  message: string
  result: GameResult | null
}

const d6 = () => 1 + Math.floor(Math.random() * 6)
const runnersUsed = (s: CantStopState) => Object.keys(s.temp).length

function nextPlayer(s: CantStopState): PlayerId {
  const i = s.order.indexOf(s.turn)
  return s.order[(i + 1) % s.order.length]
}

function heightFor(s: CantStopState, col: number): number {
  return s.temp[col] ?? s.progress[s.turn][col]
}

function advanceable(s: CantStopState, col: number): boolean {
  if (s.claimed[col] != null) return false
  if (heightFor(s, col) >= TOP[col]) return false
  if (!(col in s.temp) && runnersUsed(s) >= 3) return false
  return true
}

function computePairings(s: CantStopState): { sums: [number, number]; advance: number[] }[] {
  const [a, b, c, d] = s.dice
  const combos: [number, number][] = [
    [a + b, c + d],
    [a + c, b + d],
    [a + d, b + c],
  ]
  return combos.map((sums) => ({
    sums,
    advance: sums.filter((x) => advanceable(s, x)),
  }))
}

function getResult(s: CantStopState): GameResult | null {
  if (s.phase !== 'matchover') return null
  const winnerId = s.order.find(
    (id) => COLS.filter((c) => s.claimed[c] === id).length >= COLUMNS_TO_WIN,
  ) as PlayerId
  return { status: 'win', winnerId, scores: { [winnerId]: 1 } }
}

export const cantStopEngine: GameEngine<CantStopState, CantStopAction, CantStopView> = {
  id: 'cant-stop',
  minPlayers: 2,
  maxPlayers: 4,

  createInitialState(players, options) {
    if (players.length < 2 || players.length > 4) throw new Error("Can't Stop: 2-4 igrača")
    const order = players.map((p) => p.id)
    const names: Record<PlayerId, string> = {}
    const ai: Record<PlayerId, boolean> = {}
    const progress: Record<PlayerId, Record<number, number>> = {}
    const aiIds = (options?.ai as string[] | undefined) ?? []
    for (const p of players) {
      names[p.id] = p.username
      ai[p.id] = aiIds.includes(p.id)
      progress[p.id] = {}
      for (const c of COLS) progress[p.id][c] = 0
    }
    const claimed: Record<number, PlayerId | null> = {}
    for (const c of COLS) claimed[c] = null
    return {
      order,
      names,
      ai,
      claimed,
      progress,
      temp: {},
      turn: order[0],
      phase: 'rolling',
      dice: [],
      pairings: [],
      message: `${names[order[0]]} je na potezu — baci kockice`,
      events: [],
    }
  },

  applyAction(s, p, action) {
    if (s.phase === 'matchover') throw new Error('Meč je završen')
    if (s.turn !== p) throw new Error('Nije tvoj red')

    if (action.type === 'roll') {
      if (s.phase !== 'rolling' && s.phase !== 'deciding') throw new Error('Ne možeš sada bacati')
      const dice = [d6(), d6(), d6(), d6()]
      const rolled = { ...s, dice }
      const pairings = computePairings(rolled)
      const usable = pairings.some((pr) => pr.advance.length > 0)
      if (!usable) {
        // bust: lose temp progress
        return {
          ...s,
          dice,
          temp: {},
          pairings: [],
          turn: nextPlayer(s),
          phase: 'rolling',
          message: `${s.names[p]} je bustao! (nema poteza) — sljedeći igra`,
        }
      }
      return { ...rolled, pairings, phase: 'choosing', message: 'Izaberi par' }
    }

    if (action.type === 'choose') {
      if (s.phase !== 'choosing') throw new Error('Nije vrijeme za izbor')
      const pr = s.pairings[action.pairing]
      if (!pr || pr.advance.length === 0) throw new Error('Nevažeći izbor')
      const temp = { ...s.temp }
      for (const col of pr.sums) {
        if (s.claimed[col] != null) continue
        const used = Object.keys(temp).length
        const has = col in temp
        if (!has && used >= 3) continue
        const cur = temp[col] ?? s.progress[p][col]
        if (cur >= TOP[col]) continue
        temp[col] = cur + 1
      }
      return { ...s, temp, phase: 'deciding', message: 'Baci ponovo ili stani' }
    }

    // stop -> bank progress
    if (s.phase !== 'deciding') throw new Error('Sada ne možeš stati')
    const progress = { ...s.progress, [p]: { ...s.progress[p] } }
    const claimed = { ...s.claimed }
    let newlyClaimed = 0
    for (const colStr of Object.keys(s.temp)) {
      const col = Number(colStr)
      progress[p][col] = s.temp[col]
      if (s.temp[col] >= TOP[col] && claimed[col] == null) {
        claimed[col] = p
        newlyClaimed++
      }
    }
    // banking progress that completes (claims) a column to the top
    const events =
      newlyClaimed > 0 ? [...s.events, { player: p, tag: 'cs.column' }] : s.events
    const won = COLS.filter((c) => claimed[c] === p).length >= COLUMNS_TO_WIN
    if (won) {
      return { ...s, progress, claimed, temp: {}, phase: 'matchover', message: `${s.names[p]} pobjeđuje!`, events }
    }
    return {
      ...s,
      progress,
      claimed,
      temp: {},
      turn: nextPlayer(s),
      phase: 'rolling',
      message: `${s.names[p]} staje. Sljedeći na potezu.`,
      events,
    }
  },

  getView(s, playerId) {
    const result = getResult(s)
    const columns: CantStopColView[] = COLS.map((col) => ({
      col,
      top: TOP[col],
      claimedBy: s.claimed[col],
      marks: s.order.map((id) => ({ id, height: s.progress[id][col] })),
      temp: col in s.temp ? s.temp[col] : null,
    }))
    const claimedCount: Record<PlayerId, number> = {}
    for (const id of s.order) claimedCount[id] = COLS.filter((c) => s.claimed[c] === id).length
    return {
      you: playerId,
      turnName: s.names[s.turn],
      turnId: s.turn,
      isAI: s.ai[s.turn],
      columns,
      claimedCount,
      names: s.names,
      order: s.order,
      phase: s.phase,
      dice: s.dice,
      pairings: s.pairings,
      runnersUsed: runnersUsed(s),
      yourTurn: s.turn === playerId && s.phase !== 'matchover',
      message: s.message,
      result,
    }
  },

  getCurrentPlayer(s) {
    return s.phase === 'matchover' ? null : s.turn
  },

  getResult,
}
