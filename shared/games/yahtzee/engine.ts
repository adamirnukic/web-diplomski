import type { GameEngine, GameEvent, GameResult, PlayerId } from '../../types'

export const CATEGORIES = [
  'ones', 'twos', 'threes', 'fours', 'fives', 'sixes',
  'threeKind', 'fourKind', 'fullHouse', 'smallStraight', 'largeStraight', 'yahtzee', 'chance',
] as const
export type Category = (typeof CATEGORIES)[number]

const UPPER: Category[] = ['ones', 'twos', 'threes', 'fours', 'fives', 'sixes']

export interface YState {
  order: PlayerId[]
  turn: PlayerId
  dice: number[] // 5 values, 0 = not yet rolled
  held: boolean[]
  rollsLeft: number
  rolled: boolean
  scores: Record<PlayerId, Partial<Record<Category, number>>>
  events: GameEvent[]
}

export type YAction =
  | { type: 'roll' }
  | { type: 'toggleHold'; index: number }
  | { type: 'score'; category: Category }

export interface YView {
  dice: number[]
  held: boolean[]
  rollsLeft: number
  rolled: boolean
  yourTurn: boolean
  turn: PlayerId
  you: PlayerId
  order: PlayerId[]
  scores: Record<PlayerId, Partial<Record<Category, number>>>
  potential: Partial<Record<Category, number>>
  totals: Record<PlayerId, number>
  result: GameResult | null
}

function counts(dice: number[]): number[] {
  const c = [0, 0, 0, 0, 0, 0, 0]
  for (const d of dice) if (d >= 1 && d <= 6) c[d]++
  return c
}

function maxRun(c: number[]): number {
  let best = 0
  let run = 0
  for (let f = 1; f <= 6; f++) {
    if (c[f] > 0) {
      run++
      best = Math.max(best, run)
    } else run = 0
  }
  return best
}

export function scoreCategory(cat: Category, dice: number[]): number {
  const c = counts(dice)
  const sum = dice.reduce((a, b) => a + (b > 0 ? b : 0), 0)
  switch (cat) {
    case 'ones': return c[1] * 1
    case 'twos': return c[2] * 2
    case 'threes': return c[3] * 3
    case 'fours': return c[4] * 4
    case 'fives': return c[5] * 5
    case 'sixes': return c[6] * 6
    case 'threeKind': return c.some((x) => x >= 3) ? sum : 0
    case 'fourKind': return c.some((x) => x >= 4) ? sum : 0
    case 'fullHouse': return c.some((x) => x === 3) && c.some((x) => x === 2) ? 25 : 0
    case 'smallStraight': return maxRun(c) >= 4 ? 30 : 0
    case 'largeStraight': return maxRun(c) >= 5 ? 40 : 0
    case 'yahtzee': return c.some((x) => x === 5) ? 50 : 0
    case 'chance': return sum
  }
}

function totalFor(card: Partial<Record<Category, number>>): number {
  let upper = 0
  let total = 0
  for (const cat of CATEGORIES) {
    const v = card[cat]
    if (typeof v === 'number') {
      total += v
      if (UPPER.includes(cat)) upper += v
    }
  }
  if (upper >= 63) total += 35 // upper-section bonus
  return total
}

function isFull(card: Partial<Record<Category, number>>): boolean {
  return CATEGORIES.every((cat) => typeof card[cat] === 'number')
}

function getResult(state: YState): GameResult | null {
  if (!state.order.every((id) => isFull(state.scores[id]))) return null
  const totals = state.order.map((id) => ({ id, total: totalFor(state.scores[id]) }))
  totals.sort((a, b) => b.total - a.total)
  if (state.order.length === 1) {
    return { status: 'win', winnerId: totals[0].id, scores: { [totals[0].id]: totals[0].total } }
  }
  if (totals[0].total === totals[1].total) return { status: 'draw' }
  return {
    status: 'win',
    winnerId: totals[0].id,
    scores: Object.fromEntries(totals.map((t) => [t.id, t.total])),
  }
}

function rollDie(): number {
  return 1 + Math.floor(Math.random() * 6)
}

export const yahtzeeEngine: GameEngine<YState, YAction, YView> = {
  id: 'yahtzee',
  minPlayers: 1,
  maxPlayers: 2,

  createInitialState(players) {
    if (players.length < 1) throw new Error('Potreban je bar 1 igrač')
    const order = players.map((p) => p.id)
    const scores: YState['scores'] = {}
    for (const id of order) scores[id] = {}
    return {
      order,
      turn: order[0],
      dice: [0, 0, 0, 0, 0],
      held: [false, false, false, false, false],
      rollsLeft: 3,
      rolled: false,
      scores,
      events: [],
    }
  },

  applyAction(state, playerId, action) {
    if (getResult(state)) throw new Error('Igra je završena')
    if (state.turn !== playerId) throw new Error('Nije tvoj potez')

    if (action.type === 'roll') {
      if (state.rollsLeft <= 0) throw new Error('Nema više bacanja')
      const dice = state.dice.map((d, i) =>
        state.rolled && state.held[i] ? d : rollDie(),
      )
      return { ...state, dice, rollsLeft: state.rollsLeft - 1, rolled: true }
    }

    if (action.type === 'toggleHold') {
      if (!state.rolled) throw new Error('Prvo baci kockice')
      if (action.index < 0 || action.index > 4) throw new Error('Nevažeća kockica')
      const held = state.held.slice()
      held[action.index] = !held[action.index]
      return { ...state, held }
    }

    if (action.type === 'score') {
      if (!state.rolled) throw new Error('Prvo baci kockice')
      if (!CATEGORIES.includes(action.category)) throw new Error('Nepoznata kategorija')
      if (typeof state.scores[playerId][action.category] === 'number') {
        throw new Error('Kategorija je već iskorištena')
      }
      const scores = {
        ...state.scores,
        [playerId]: {
          ...state.scores[playerId],
          [action.category]: scoreCategory(action.category, state.dice),
        },
      }
      const idx = state.order.indexOf(playerId)
      const nextTurn = state.order[(idx + 1) % state.order.length]
      // scoring while holding five of a kind = a Yahtzee
      const events = counts(state.dice).some((x) => x === 5)
        ? [...state.events, { player: playerId, tag: 'y.yahtzee' }]
        : state.events
      return {
        ...state,
        scores,
        turn: nextTurn,
        dice: [0, 0, 0, 0, 0],
        held: [false, false, false, false, false],
        rollsLeft: 3,
        rolled: false,
        events,
      }
    }

    throw new Error('Nepoznata akcija')
  },

  getView(state, playerId) {
    const result = getResult(state)
    const potential: Partial<Record<Category, number>> = {}
    if (state.rolled && state.turn === playerId) {
      for (const cat of CATEGORIES) {
        if (typeof state.scores[playerId][cat] !== 'number') {
          potential[cat] = scoreCategory(cat, state.dice)
        }
      }
    }
    const totals: Record<PlayerId, number> = {}
    for (const id of state.order) totals[id] = totalFor(state.scores[id])
    return {
      dice: state.dice,
      held: state.held,
      rollsLeft: state.rollsLeft,
      rolled: state.rolled,
      yourTurn: state.turn === playerId && !result,
      turn: state.turn,
      you: playerId,
      order: state.order,
      scores: state.scores,
      potential,
      totals,
      result,
    }
  },

  getCurrentPlayer(state) {
    return getResult(state) ? null : state.turn
  },

  getResult,
}
