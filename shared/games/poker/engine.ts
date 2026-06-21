import type { GameEngine, GameResult, PlayerId } from '../../types'
import { type Card, freshDeck, shuffle } from '../_cards'
import { bestScore, compareHands, handName } from './evaluate'

const START_CHIPS = 100
const SB = 1
const BB = 2
const RAISE_STEP = 4

type Street = 'preflop' | 'flop' | 'turn' | 'river'

export interface PokerState {
  order: [PlayerId, PlayerId]
  chips: Record<PlayerId, number>
  deck: Card[]
  holes: Record<PlayerId, Card[]>
  community: Card[]
  pot: number
  committed: Record<PlayerId, number>
  acted: Record<PlayerId, boolean>
  street: Street
  toAct: PlayerId
  dealer: PlayerId
  phase: 'betting' | 'handover' | 'matchover'
  hand: { winnerId: PlayerId | null; reason: string; reveal: boolean } | null
}

export type PokerAction =
  | { type: 'fold' }
  | { type: 'check' }
  | { type: 'call' }
  | { type: 'raise' }
  | { type: 'next' }

export interface PokerView {
  you: PlayerId
  yourChips: number
  oppChips: number
  yourHole: Card[]
  oppHole: (Card | null)[]
  community: Card[]
  pot: number
  toCall: number
  canCheck: boolean
  canRaise: boolean
  street: Street
  yourTurn: boolean
  phase: 'betting' | 'handover' | 'matchover'
  hand: { winnerId: PlayerId | null; reason: string } | null
  yourHandName: string | null
  result: GameResult | null
}

const other = (state: PokerState, id: PlayerId): PlayerId =>
  state.order.find((p) => p !== id) as PlayerId

function currentBet(state: PokerState): number {
  const [a, b] = state.order
  return Math.max(state.committed[a], state.committed[b])
}

function dealHand(
  order: [PlayerId, PlayerId],
  chips: Record<PlayerId, number>,
  dealer: PlayerId,
): PokerState {
  const deck = shuffle(freshDeck())
  const nonDealer = order.find((p) => p !== dealer) as PlayerId
  const holes: Record<PlayerId, Card[]> = {
    [dealer]: [deck.pop() as Card, deck.pop() as Card],
    [nonDealer]: [deck.pop() as Card, deck.pop() as Card],
  }
  const newChips = { ...chips }
  const sb = Math.min(SB, newChips[dealer])
  const bb = Math.min(BB, newChips[nonDealer])
  newChips[dealer] -= sb
  newChips[nonDealer] -= bb
  return {
    order,
    chips: newChips,
    deck,
    holes,
    community: [],
    pot: 0,
    committed: { [dealer]: sb, [nonDealer]: bb },
    acted: { [dealer]: false, [nonDealer]: false },
    street: 'preflop',
    toAct: dealer, // small blind acts first preflop (heads-up)
    dealer,
    phase: 'betting',
    hand: null,
  }
}

function award(state: PokerState, winnerId: PlayerId, reason: string, reveal: boolean): PokerState {
  const total = state.pot + state.committed[state.order[0]] + state.committed[state.order[1]]
  const chips = { ...state.chips, [winnerId]: state.chips[winnerId] + total }
  const broke = state.order.some((id) => chips[id] <= 0)
  return {
    ...state,
    chips,
    pot: 0,
    committed: { [state.order[0]]: 0, [state.order[1]]: 0 },
    hand: { winnerId, reason, reveal },
    phase: broke ? 'matchover' : 'handover',
  }
}

function splitPot(state: PokerState, reason: string): PokerState {
  const total = state.pot + state.committed[state.order[0]] + state.committed[state.order[1]]
  const half = Math.floor(total / 2)
  const [a, b] = state.order
  const chips = { ...state.chips, [a]: state.chips[a] + half, [b]: state.chips[b] + (total - half) }
  const broke = state.order.some((id) => chips[id] <= 0)
  return {
    ...state,
    chips,
    pot: 0,
    committed: { [a]: 0, [b]: 0 },
    hand: { winnerId: null, reason, reveal: true },
    phase: broke ? 'matchover' : 'handover',
  }
}

function showdown(state: PokerState): PokerState {
  const [a, b] = state.order
  const ha = [...state.holes[a], ...state.community]
  const hb = [...state.holes[b], ...state.community]
  const c = compareHands(ha, hb)
  if (c > 0) return award(state, a, `${handName(ha)}`, true)
  if (c < 0) return award(state, b, `${handName(hb)}`, true)
  return splitPot(state, 'Podijeljen pot')
}

function advanceStreet(state: PokerState): PokerState {
  const [a, b] = state.order
  const pot = state.pot + state.committed[a] + state.committed[b]
  const committed = { [a]: 0, [b]: 0 }
  const acted = { [a]: false, [b]: false }
  const deck = state.deck.slice()
  const community = state.community.slice()
  const nonDealer = other(state, state.dealer)

  let street: Street = state.street
  if (state.street === 'preflop') {
    community.push(deck.pop() as Card, deck.pop() as Card, deck.pop() as Card)
    street = 'flop'
  } else if (state.street === 'flop') {
    community.push(deck.pop() as Card)
    street = 'turn'
  } else if (state.street === 'turn') {
    community.push(deck.pop() as Card)
    street = 'river'
  }
  return { ...state, pot, committed, acted, deck, community, street, toAct: nonDealer }
}

function settleOrContinue(state: PokerState): PokerState {
  const [a, b] = state.order
  const bothActed = state.acted[a] && state.acted[b]
  const equal = state.committed[a] === state.committed[b]
  if (!bothActed || !equal) return state
  if (state.street === 'river') return showdown(state)
  return advanceStreet(state)
}

function getResult(state: PokerState): GameResult | null {
  if (state.phase !== 'matchover') return null
  const winnerId = state.order.find((id) => state.chips[id] > 0) as PlayerId
  return { status: 'win', winnerId, scores: { [winnerId]: 1 } }
}

export const pokerEngine: GameEngine<PokerState, PokerAction, PokerView> = {
  id: 'poker',
  minPlayers: 2,
  maxPlayers: 2,

  createInitialState(players) {
    if (players.length !== 2) throw new Error("Texas Hold'em zahtijeva 2 igrača")
    const [p1, p2] = players
    const order: [PlayerId, PlayerId] = [p1.id, p2.id]
    return dealHand(order, { [p1.id]: START_CHIPS, [p2.id]: START_CHIPS }, p1.id)
  },

  applyAction(state, playerId, action) {
    if (state.phase === 'matchover') throw new Error('Meč je završen')

    if (state.phase === 'handover') {
      if (action.type !== 'next') throw new Error('Ruka je gotova — podijeli novu')
      const newDealer = other(state, state.dealer)
      return dealHand(state.order, state.chips, newDealer)
    }

    // betting
    if (state.toAct !== playerId) throw new Error('Nije tvoj red')
    const opp = other(state, playerId)
    const toCall = currentBet(state) - state.committed[playerId]
    let s: PokerState = { ...state, committed: { ...state.committed }, acted: { ...state.acted }, chips: { ...state.chips } }

    switch (action.type) {
      case 'fold':
        return award(s, opp, 'Protivnik se predao', false)
      case 'check':
        if (toCall > 0) throw new Error('Moraš platiti ili odustati')
        s.acted[playerId] = true
        s.toAct = opp
        return settleOrContinue(s)
      case 'call': {
        const pay = Math.min(toCall, s.chips[playerId])
        s.chips[playerId] -= pay
        s.committed[playerId] += pay
        s.acted[playerId] = true
        s.toAct = opp
        return settleOrContinue(s)
      }
      case 'raise': {
        const target = currentBet(s) + RAISE_STEP
        const pay = Math.min(target - s.committed[playerId], s.chips[playerId])
        if (pay <= 0) throw new Error('Nemaš dovoljno žetona')
        s.chips[playerId] -= pay
        s.committed[playerId] += pay
        s.acted[playerId] = true
        s.acted[opp] = false // opponent must respond
        s.toAct = opp
        return s
      }
      default:
        throw new Error('Nepoznata akcija')
    }
  },

  getView(state, playerId) {
    const opp = other(state, playerId)
    const reveal = Boolean(state.hand?.reveal) || state.phase === 'matchover'
    const toCall = currentBet(state) - state.committed[playerId]
    const yourHole = state.holes[playerId]
    return {
      you: playerId,
      yourChips: state.chips[playerId],
      oppChips: state.chips[opp],
      yourHole,
      oppHole: reveal ? state.holes[opp] : [null, null],
      community: state.community,
      pot: state.pot + state.committed[playerId] + state.committed[opp],
      toCall: Math.max(0, toCall),
      canCheck: toCall <= 0,
      canRaise: state.chips[playerId] > toCall,
      street: state.street,
      yourTurn: state.phase === 'betting' && state.toAct === playerId,
      phase: state.phase,
      hand: state.hand ? { winnerId: state.hand.winnerId, reason: state.hand.reason } : null,
      yourHandName:
        state.community.length >= 3 ? handName([...yourHole, ...state.community]) : null,
      result: getResult(state),
    }
  },

  getCurrentPlayer(state) {
    if (state.phase === 'betting') return state.toAct
    return null
  },

  getResult,
}

// re-export so the engine module is self-contained for consumers
export { bestScore }
