import type { GameEngine, GameEvent, GameResult, PlayerId } from '../../types'

const MAX_WRONG = 6

export interface HangmanState {
  order: [PlayerId, PlayerId] // [setter, guesser]
  phase: 'setup' | 'playing'
  word: string // uppercase, letters/spaces
  guessed: string[]
  wrong: number
  /** event-based achievement signals collected during the match */
  events: GameEvent[]
}

export type HangmanAction =
  | { type: 'setWord'; word: string }
  | { type: 'guess'; letter: string }

export interface HangmanView {
  phase: 'setup' | 'playing'
  role: 'setter' | 'guesser'
  masked: (string | null)[] // null = unknown, ' ' = space
  fullWord: string | null // shown to setter, and to everyone at the end
  guessed: string[]
  wrong: number
  maxWrong: number
  yourTurn: boolean
  result: GameResult | null
}

function normalize(raw: string): string {
  return String(raw ?? '')
    .toUpperCase()
    .replace(/[^A-ZČĆŽŠĐ ]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
}

function uniqueLetters(word: string): string[] {
  return [...new Set(word.replace(/ /g, '').split(''))]
}

function getResult(state: HangmanState): GameResult | null {
  if (state.phase !== 'playing') return null
  const [setter, guesser] = state.order
  if (state.wrong >= MAX_WRONG) {
    return { status: 'win', winnerId: setter, scores: { [setter]: 1 } }
  }
  if (uniqueLetters(state.word).every((l) => state.guessed.includes(l))) {
    return { status: 'win', winnerId: guesser, scores: { [guesser]: 1 } }
  }
  return null
}

export const hangmanEngine: GameEngine<HangmanState, HangmanAction, HangmanView> = {
  id: 'hangman',
  minPlayers: 2,
  maxPlayers: 2,

  createInitialState(players) {
    if (players.length !== 2) throw new Error('Vješalo zahtijeva 2 igrača')
    const [p1, p2] = players
    return { order: [p1.id, p2.id], phase: 'setup', word: '', guessed: [], wrong: 0, events: [] }
  },

  applyAction(state, playerId, action) {
    if (getResult(state)) throw new Error('Igra je završena')
    const [setter, guesser] = state.order

    if (action.type === 'setWord') {
      if (state.phase !== 'setup') throw new Error('Riječ je već postavljena')
      if (playerId !== setter) throw new Error('Samo postavljač bira riječ')
      const word = normalize(action.word)
      if (uniqueLetters(word).length < 1) throw new Error('Unesi riječ (samo slova)')
      if (word.length > 24) throw new Error('Riječ je predugačka')
      return { ...state, word, phase: 'playing' }
    }

    if (action.type === 'guess') {
      if (state.phase !== 'playing') throw new Error('Riječ još nije postavljena')
      if (playerId !== guesser) throw new Error('Samo pogađač pogađa')
      const letter = normalize(action.letter)
      if (letter.length !== 1) throw new Error('Pogodi jedno slovo')
      if (state.guessed.includes(letter)) throw new Error('Slovo je već pokušano')
      const guessed = [...state.guessed, letter]
      const wrong = state.word.includes(letter) ? state.wrong : state.wrong + 1
      const events = [...state.events]
      // solved the word on the last life left (one more wrong = a loss)
      const solved = uniqueLetters(state.word).every((l) => guessed.includes(l))
      if (solved && wrong === MAX_WRONG - 1) {
        events.push({ player: guesser, tag: 'hm.clutch' })
      }
      return { ...state, guessed, wrong, events }
    }

    throw new Error('Nepoznata akcija')
  },

  getView(state, playerId) {
    const [setter] = state.order
    const role = playerId === setter ? 'setter' : 'guesser'
    const result = getResult(state)
    const reveal = role === 'setter' || Boolean(result)
    const masked = state.word
      .split('')
      .map((ch) =>
        ch === ' ' ? ' ' : reveal || state.guessed.includes(ch) ? ch : null,
      )
    return {
      phase: state.phase,
      role,
      masked,
      fullWord: reveal ? state.word : null,
      guessed: state.guessed,
      wrong: state.wrong,
      maxWrong: MAX_WRONG,
      yourTurn: this.getCurrentPlayer(state) === playerId,
      result,
    }
  },

  getCurrentPlayer(state) {
    if (getResult(state)) return null
    const [setter, guesser] = state.order
    return state.phase === 'setup' ? setter : guesser
  },

  getResult,
}
