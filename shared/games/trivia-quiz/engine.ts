import type { GameEngine, GameResult, PlayerId } from '../../types'
import { shuffle } from '../_cards'

interface Question {
  q: string
  options: string[]
  correct: number
}

const BANK: Question[] = [
  { q: 'Koji je glavni grad Bosne i Hercegovine?', options: ['Banja Luka', 'Sarajevo', 'Mostar', 'Tuzla'], correct: 1 },
  { q: 'Koliko iznosi 7 × 8?', options: ['54', '56', '64', '49'], correct: 1 },
  { q: 'Koja planeta je najbliža Suncu?', options: ['Venera', 'Mars', 'Merkur', 'Zemlja'], correct: 2 },
  { q: 'Ko je napisao "Na Drini ćuprija"?', options: ['Meša Selimović', 'Ivo Andrić', 'Branko Ćopić', 'Skender Kulenović'], correct: 1 },
  { q: 'Koji je hemijski simbol za zlato?', options: ['Zl', 'Au', 'Ag', 'Go'], correct: 1 },
  { q: 'Koliko kontinenata postoji?', options: ['5', '6', '7', '8'], correct: 2 },
  { q: 'Koje godine je počeo Prvi svjetski rat?', options: ['1912', '1914', '1918', '1939'], correct: 1 },
  { q: 'Koja je najveća rijeka u BiH po dužini?', options: ['Una', 'Drina', 'Sava', 'Neretva'], correct: 1 },
  { q: 'Koliko stranica ima šestougao?', options: ['5', '6', '7', '8'], correct: 1 },
  { q: 'Koji jezik se koristi za stiliziranje web stranica?', options: ['HTML', 'CSS', 'Python', 'SQL'], correct: 1 },
  { q: 'Najveći ocean na Zemlji je?', options: ['Atlantski', 'Indijski', 'Tihi', 'Arktički'], correct: 2 },
  { q: 'Koliko nogu ima pauk?', options: ['6', '8', '10', '12'], correct: 1 },
]

const NUM_QUESTIONS = 8

export interface TriviaState {
  questions: Question[]
  index: number
  order: PlayerId[]
  turn: PlayerId
  scores: Record<PlayerId, number>
  pending: { chosen: number } | null
}

export type TriviaAction = { type: 'answer'; option: number } | { type: 'next' }

export interface TriviaView {
  question: { q: string; options: string[] } | null
  questionNumber: number
  total: number
  phase: 'answering' | 'revealed'
  chosen: number | null
  correctIndex: number | null
  yourTurn: boolean
  yourScore: number
  oppScore: number
  result: GameResult | null
}

function getResult(state: TriviaState): GameResult | null {
  if (state.index < state.questions.length) return null
  const [a, b] = state.order
  const sa = state.scores[a] ?? 0
  const sb = state.scores[b] ?? 0
  if (sa === sb) return { status: 'draw' }
  const winnerId = sa > sb ? a : b
  return { status: 'win', winnerId, scores: { [a]: sa, [b]: sb } }
}

export const triviaEngine: GameEngine<TriviaState, TriviaAction, TriviaView> = {
  id: 'trivia-quiz',
  minPlayers: 2,
  maxPlayers: 2,

  createInitialState(players) {
    if (players.length !== 2) throw new Error('Kviz zahtijeva 2 igrača')
    const [p1, p2] = players
    const questions = shuffle(BANK).slice(0, NUM_QUESTIONS)
    return {
      questions,
      index: 0,
      order: [p1.id, p2.id],
      turn: p1.id,
      scores: { [p1.id]: 0, [p2.id]: 0 },
      pending: null,
    }
  },

  applyAction(state, playerId, action) {
    if (getResult(state)) throw new Error('Igra je završena')
    if (state.turn !== playerId) throw new Error('Nije tvoj red')

    if (action.type === 'answer') {
      if (state.pending) throw new Error('Već si odgovorio')
      const q = state.questions[state.index]
      if (!q) throw new Error('Nema pitanja')
      if (action.option < 0 || action.option >= q.options.length) {
        throw new Error('Nevažeći odgovor')
      }
      const scores = { ...state.scores }
      if (action.option === q.correct) scores[playerId] = (scores[playerId] ?? 0) + 1
      return { ...state, scores, pending: { chosen: action.option } }
    }

    if (action.type === 'next') {
      if (!state.pending) throw new Error('Prvo odgovori')
      const other = state.order.find((id) => id !== playerId) as PlayerId
      return { ...state, index: state.index + 1, pending: null, turn: other }
    }

    throw new Error('Nepoznata akcija')
  },

  getView(state, playerId) {
    const other = state.order.find((id) => id !== playerId) as PlayerId
    const q = state.questions[state.index]
    return {
      question: q ? { q: q.q, options: q.options } : null,
      questionNumber: Math.min(state.index + 1, state.questions.length),
      total: state.questions.length,
      phase: state.pending ? 'revealed' : 'answering',
      chosen: state.pending?.chosen ?? null,
      correctIndex: state.pending && q ? q.correct : null,
      yourTurn: state.turn === playerId && !getResult(state),
      yourScore: state.scores[playerId] ?? 0,
      oppScore: state.scores[other] ?? 0,
      result: getResult(state),
    }
  },

  getCurrentPlayer(state) {
    return getResult(state) ? null : state.turn
  },

  getResult,
}
