import { perudoAI } from './perudo/ai'
import { cantStopAI } from './cant-stop/ai'
import { skullAI } from './skull/ai'
import { blackjackAI } from './blackjack/ai'
import { ticTacToeAI } from './tic-tac-toe/ai'
import { connectFourAI } from './connect-four/ai'
import { dotsAndBoxesAI } from './dots-and-boxes/ai'
import { checkersAI } from './checkers/ai'
import { rpsAI } from './rock-paper-scissors/ai'
import { yahtzeeAI } from './yahtzee/ai'
import { battleshipsAI } from './battleships/ai'
import { loveLetterAI } from './love-letter/ai'
import { coupAI } from './coup/ai'
import { sixNimmtAI } from './six-nimmt/ai'
import { flip7AI } from './flip-7/ai'
import type { Difficulty } from '../types'

/* eslint-disable @typescript-eslint/no-explicit-any */
type AiFn = (state: any, playerId: string, difficulty: Difficulty) => any

/** Per-game AI decision functions (used by the local "vs bots" runner). */
export const AI_DECISIONS: Record<string, AiFn> = {
  perudo: perudoAI,
  'cant-stop': cantStopAI,
  skull: skullAI,
  blackjack: blackjackAI,
  'tic-tac-toe': ticTacToeAI,
  'connect-four': connectFourAI,
  'dots-and-boxes': dotsAndBoxesAI,
  checkers: checkersAI,
  'rock-paper-scissors': rpsAI,
  yahtzee: yahtzeeAI,
  battleships: battleshipsAI,
  'love-letter': loveLetterAI,
  coup: coupAI,
  'six-nimmt': sixNimmtAI,
  'flip-7': flip7AI,
}

export function aiDecide(
  gameId: string,
  state: any,
  playerId: string,
  difficulty: Difficulty = 'normal',
): any {
  const fn = AI_DECISIONS[gameId]
  return fn ? fn(state, playerId, difficulty) : null
}
