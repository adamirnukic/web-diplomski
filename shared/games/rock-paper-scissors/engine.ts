import type { GameEngine, GameEvent, GameResult, PlayerId } from '../../types'

export type Choice = 'rock' | 'paper' | 'scissors'
const TARGET = 3 // best of 5

export interface RpsState {
  order: [PlayerId, PlayerId]
  scores: Record<PlayerId, number>
  round: number
  choices: Partial<Record<PlayerId, Choice>>
  last: { choices: Record<PlayerId, Choice>; winnerId: PlayerId | null } | null
  events: GameEvent[]
}

export type RpsAction = { type: 'choose'; choice: Choice }

export interface RpsView {
  round: number
  yourScore: number
  oppScore: number
  yourChoice: Choice | null
  waitingForOpponent: boolean
  yourTurn: boolean
  last: { yours: Choice; theirs: Choice; outcome: 'win' | 'lose' | 'draw' } | null
  result: GameResult | null
}

const BEATS: Record<Choice, Choice> = {
  rock: 'scissors',
  scissors: 'paper',
  paper: 'rock',
}

function getResult(state: RpsState): GameResult | null {
  const [a, b] = state.order
  const sa = state.scores[a] ?? 0
  const sb = state.scores[b] ?? 0
  if (sa >= TARGET || sb >= TARGET) {
    const winnerId = sa > sb ? a : b
    return { status: 'win', winnerId, scores: { [a]: sa, [b]: sb } }
  }
  return null
}

function currentPlayer(state: RpsState): PlayerId | null {
  if (getResult(state)) return null
  return state.order.find((id) => !state.choices[id]) ?? null
}

export const rockPaperScissorsEngine: GameEngine<RpsState, RpsAction, RpsView> = {
  id: 'rock-paper-scissors',
  minPlayers: 2,
  maxPlayers: 2,

  createInitialState(players) {
    if (players.length !== 2) throw new Error('Igra zahtijeva 2 igrača')
    const [p1, p2] = players
    return {
      order: [p1.id, p2.id],
      scores: { [p1.id]: 0, [p2.id]: 0 },
      round: 1,
      choices: {},
      last: null,
      events: [],
    }
  },

  applyAction(state, playerId, action) {
    if (getResult(state)) throw new Error('Igra je završena')
    if (action.type !== 'choose') throw new Error('Nepoznata akcija')
    if (currentPlayer(state) !== playerId) throw new Error('Nije tvoj red')
    if (!BEATS[action.choice]) throw new Error('Nevažeći izbor')

    const choices = { ...state.choices, [playerId]: action.choice }
    const [a, b] = state.order

    if (choices[a] && choices[b]) {
      const ca = choices[a] as Choice
      const cb = choices[b] as Choice
      let winnerId: PlayerId | null = null
      if (BEATS[ca] === cb) winnerId = a
      else if (BEATS[cb] === ca) winnerId = b

      const scores = { ...state.scores }
      if (winnerId) scores[winnerId] = (scores[winnerId] ?? 0) + 1

      // match-winning round with the opponent still on zero = a clean sweep
      let events = state.events
      const sa = scores[a] ?? 0
      const sb = scores[b] ?? 0
      if (sa >= TARGET || sb >= TARGET) {
        const champ = sa > sb ? a : b
        const loserScore = champ === a ? sb : sa
        if (loserScore === 0) events = [...state.events, { player: champ, tag: 'rps.flawless' }]
      }

      return {
        ...state,
        scores,
        round: state.round + 1,
        choices: {},
        last: { choices: { [a]: ca, [b]: cb }, winnerId },
        events,
      }
    }

    return { ...state, choices }
  },

  getView(state, playerId) {
    const other = state.order.find((id) => id !== playerId) as PlayerId
    const yourChoice = state.choices[playerId] ?? null
    let last: RpsView['last'] = null
    if (state.last) {
      const yours = state.last.choices[playerId]
      const theirs = state.last.choices[other]
      last = {
        yours,
        theirs,
        outcome:
          state.last.winnerId === null
            ? 'draw'
            : state.last.winnerId === playerId
              ? 'win'
              : 'lose',
      }
    }
    return {
      round: state.round,
      yourScore: state.scores[playerId] ?? 0,
      oppScore: state.scores[other] ?? 0,
      yourChoice,
      waitingForOpponent: Boolean(yourChoice) && !getResult(state),
      yourTurn: currentPlayer(state) === playerId,
      last,
      result: getResult(state),
    }
  },

  getCurrentPlayer: currentPlayer,

  getResult,
}
