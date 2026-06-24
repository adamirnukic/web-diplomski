import type { GameEngine, GameEvent, GameResult, PlayerId } from '../../types'
import { type Card, freshDeck, shuffle } from '../_cards'

export interface BJState {
  order: PlayerId[]
  names: Record<PlayerId, string>
  ai: Record<PlayerId, boolean>
  deck: Card[]
  hands: Record<PlayerId, Card[]>
  standing: Record<PlayerId, boolean>
  dealer: Card[]
  dealerDone: boolean
  turn: PlayerId | null
  events: GameEvent[]
}

export type BJAction = { type: 'hit' } | { type: 'stand' }

export type Outcome = 'win' | 'push' | 'lose'

export interface BJHandView {
  cards: Card[]
  value: number
  busted: boolean
  standing: boolean
  outcome: Outcome | null
}

export interface BJView {
  order: PlayerId[]
  you: PlayerId
  names: Record<PlayerId, string>
  ai: Record<PlayerId, boolean>
  hands: Record<PlayerId, BJHandView>
  dealer: { cards: (Card | null)[]; value: number | null; busted: boolean }
  turn: PlayerId | null
  yourTurn: boolean
  phase: 'playing' | 'done'
  result: GameResult | null
}

export function handValue(cards: Card[]): number {
  let total = 0
  let aces = 0
  for (const c of cards) {
    if (c.rank === 'A') {
      aces++
      total += 11
    } else if (c.rank === 'K' || c.rank === 'Q' || c.rank === 'J' || c.rank === '10') {
      total += 10
    } else {
      total += Number(c.rank)
    }
  }
  while (total > 21 && aces > 0) {
    total -= 10
    aces--
  }
  return total
}

function nextActor(state: BJState): PlayerId | null {
  for (const id of state.order) {
    if (!state.standing[id] && handValue(state.hands[id]) < 21) return id
  }
  return null
}

function playDealer(deck: Card[], dealer: Card[]): { deck: Card[]; dealer: Card[] } {
  const d = deck.slice()
  const h = dealer.slice()
  while (handValue(h) < 17) {
    const card = d.pop()
    if (!card) break
    h.push(card)
  }
  return { deck: d, dealer: h }
}

function outcomeFor(hand: Card[], dealer: Card[]): Outcome {
  const pv = handValue(hand)
  if (pv > 21) return 'lose'
  const dv = handValue(dealer)
  if (dv > 21) return 'win'
  if (pv > dv) return 'win'
  if (pv < dv) return 'lose'
  return 'push'
}

function getResult(state: BJState): GameResult | null {
  if (!state.dealerDone) return null
  const score: Record<Outcome, number> = { win: 2, push: 1, lose: 0 }
  const ranked = state.order
    .map((id) => ({ id, s: score[outcomeFor(state.hands[id], state.dealer)] }))
    .sort((a, b) => b.s - a.s)

  if (state.order.length === 1) {
    const only = ranked[0]
    return only.s === 2
      ? { status: 'win', winnerId: only.id, scores: { [only.id]: 1 } }
      : { status: 'draw' }
  }
  if (ranked[0].s === ranked[1].s) return { status: 'draw' }
  return { status: 'win', winnerId: ranked[0].id, scores: { [ranked[0].id]: 1 } }
}

export const blackjackEngine: GameEngine<BJState, BJAction, BJView> = {
  id: 'blackjack',
  minPlayers: 1,
  maxPlayers: 6,

  createInitialState(players, options) {
    if (players.length < 1) throw new Error('Potreban je bar 1 igrač')
    const order = players.map((p) => p.id)
    const names: Record<PlayerId, string> = {}
    const ai: Record<PlayerId, boolean> = {}
    const aiIds = (options?.ai as string[] | undefined) ?? []
    for (const p of players) {
      names[p.id] = p.username
      ai[p.id] = aiIds.includes(p.id)
    }
    const deck = shuffle(freshDeck())
    const hands: Record<PlayerId, Card[]> = {}
    const standing: Record<PlayerId, boolean> = {}
    for (const id of order) {
      hands[id] = [deck.pop() as Card, deck.pop() as Card]
      standing[id] = false
    }
    const dealer = [deck.pop() as Card, deck.pop() as Card]
    // a two-card 21 is a natural blackjack
    const events: GameEvent[] = []
    for (const id of order) {
      if (hands[id].length === 2 && handValue(hands[id]) === 21) {
        events.push({ player: id, tag: 'bj.blackjack' })
      }
    }
    return { order, names, ai, deck, hands, standing, dealer, dealerDone: false, turn: order[0], events }
  },

  applyAction(state, playerId, action) {
    if (state.dealerDone) throw new Error('Runda je završena')
    if (state.turn !== playerId) throw new Error('Nije tvoj potez')

    const deck = state.deck.slice()
    const hands = { ...state.hands, [playerId]: state.hands[playerId].slice() }
    const standing = { ...state.standing }

    if (action.type === 'hit') {
      const card = deck.pop()
      if (card) hands[playerId].push(card)
      if (handValue(hands[playerId]) >= 21) standing[playerId] = true
    } else if (action.type === 'stand') {
      standing[playerId] = true
    } else {
      throw new Error('Nepoznata akcija')
    }

    let next = nextActor({ ...state, hands, standing })
    let dealer = state.dealer
    let dealerDone = false
    let finalDeck = deck
    if (!next) {
      const played = playDealer(deck, state.dealer)
      dealer = played.dealer
      finalDeck = played.deck
      dealerDone = true
      next = null
    }

    return { ...state, deck: finalDeck, hands, standing, dealer, dealerDone, turn: next }
  },

  getView(state, playerId) {
    const result = getResult(state)
    const hands: Record<PlayerId, BJHandView> = {}
    for (const id of state.order) {
      const cards = state.hands[id]
      hands[id] = {
        cards,
        value: handValue(cards),
        busted: handValue(cards) > 21,
        standing: state.standing[id],
        outcome: state.dealerDone ? outcomeFor(cards, state.dealer) : null,
      }
    }
    const dealer = state.dealerDone
      ? { cards: state.dealer as (Card | null)[], value: handValue(state.dealer), busted: handValue(state.dealer) > 21 }
      : { cards: [state.dealer[0], null], value: null, busted: false }
    return {
      order: state.order,
      you: playerId,
      names: state.names,
      ai: state.ai,
      hands,
      dealer,
      turn: state.turn,
      yourTurn: state.turn === playerId && !result,
      phase: state.dealerDone ? 'done' : 'playing',
      result,
    }
  },

  getCurrentPlayer(state) {
    return state.dealerDone ? null : state.turn
  },

  getResult,
}
