import type { GameEngine, GameEvent, GameResult, PlayerId } from '../../types'
import { shuffle } from '../_cards'

const SYMBOLS = ['🍒', '⚡', '🎮', '🚀', '🌟', '🔥', '💎', '🎲']

interface MemoryCard {
  id: number
  symbol: string
  faceUp: boolean
  matched: boolean
}

export interface MemoryState {
  cards: MemoryCard[]
  revealed: number[]
  scores: Record<PlayerId, number>
  order: [PlayerId, PlayerId]
  turn: PlayerId
  events: GameEvent[]
}

export type MemoryAction = { type: 'flip'; index: number }

export interface MemoryViewCard {
  id: number
  faceUp: boolean
  matched: boolean
  symbol: string | null
}

export interface MemoryView {
  cards: MemoryViewCard[]
  yourTurn: boolean
  turn: PlayerId
  yourScore: number
  oppScore: number
  scores: Record<PlayerId, number>
  result: GameResult | null
}

function getResult(state: MemoryState): GameResult | null {
  if (!state.cards.every((c) => c.matched)) return null
  const [a, b] = state.order
  const sa = state.scores[a] ?? 0
  const sb = state.scores[b] ?? 0
  if (sa === sb) return { status: 'draw' }
  const winnerId = sa > sb ? a : b
  return { status: 'win', winnerId, scores: { [a]: sa, [b]: sb } }
}

export const memoryEngine: GameEngine<MemoryState, MemoryAction, MemoryView> = {
  id: 'memory',
  minPlayers: 2,
  maxPlayers: 2,

  createInitialState(players) {
    if (players.length !== 2) throw new Error('Memory zahtijeva 2 igrača')
    const [p1, p2] = players
    const pairs = SYMBOLS.flatMap((s) => [s, s])
    const cards = shuffle(pairs).map((symbol, id) => ({
      id,
      symbol,
      faceUp: false,
      matched: false,
    }))
    return {
      cards,
      revealed: [],
      scores: { [p1.id]: 0, [p2.id]: 0 },
      order: [p1.id, p2.id],
      turn: p1.id,
      events: [],
    }
  },

  applyAction(state, playerId, action) {
    if (getResult(state)) throw new Error('Igra je završena')
    if (state.turn !== playerId) throw new Error('Nije tvoj potez')
    if (action.type !== 'flip') throw new Error('Nepoznata akcija')

    const cards = state.cards.map((c) => ({ ...c }))
    let revealed = [...state.revealed]

    // A previous mismatched pair is still showing -> turn it back down first.
    if (revealed.length === 2) {
      for (const i of revealed) cards[i].faceUp = false
      revealed = []
    }

    const card = cards[action.index]
    if (!card) throw new Error('Nevažeća karta')
    if (card.matched || card.faceUp) throw new Error('Karta je već okrenuta')

    card.faceUp = true
    revealed.push(action.index)

    let turn = state.turn
    const scores = { ...state.scores }
    let events = state.events

    if (revealed.length === 2) {
      const [i, j] = revealed
      if (cards[i].symbol === cards[j].symbol) {
        cards[i].matched = true
        cards[j].matched = true
        revealed = []
        scores[playerId] = (scores[playerId] ?? 0) + 1
        // matching player keeps the turn
        // last pair matched while the opponent never scored = total recall
        if (cards.every((c) => c.matched)) {
          const other = state.order.find((id) => id !== playerId) as PlayerId
          if ((scores[other] ?? 0) === 0) {
            events = [...state.events, { player: playerId, tag: 'mm.flawless' }]
          }
        }
      } else {
        turn = state.order.find((id) => id !== playerId) as PlayerId
      }
    }

    return { ...state, cards, revealed, scores, turn, events }
  },

  getView(state, playerId) {
    const other = state.order.find((id) => id !== playerId) as PlayerId
    return {
      cards: state.cards.map((c) => ({
        id: c.id,
        faceUp: c.faceUp,
        matched: c.matched,
        symbol: c.faceUp || c.matched ? c.symbol : null,
      })),
      yourTurn: state.turn === playerId && !getResult(state),
      turn: state.turn,
      yourScore: state.scores[playerId] ?? 0,
      oppScore: state.scores[other] ?? 0,
      scores: state.scores,
      result: getResult(state),
    }
  },

  getCurrentPlayer(state) {
    return getResult(state) ? null : state.turn
  },

  getResult,
}
