import type { GameEngine } from '../types'
import { ticTacToeEngine } from './tic-tac-toe/engine'
import { connectFourEngine } from './connect-four/engine'
import { memoryEngine } from './memory/engine'
import { rockPaperScissorsEngine } from './rock-paper-scissors/engine'
import { hangmanEngine } from './hangman/engine'
import { yahtzeeEngine } from './yahtzee/engine'
import { blackjackEngine } from './blackjack/engine'
import { minesweeperEngine } from './minesweeper/engine'
import { triviaEngine } from './trivia-quiz/engine'
import { checkersEngine } from './checkers/engine'
import { pokerEngine } from './poker/engine'
import { battleshipsEngine } from './battleships/engine'
import { loveLetterEngine } from './love-letter/engine'
import { dotsAndBoxesEngine } from './dots-and-boxes/engine'
import { perudoEngine } from './perudo/engine'
import { cantStopEngine } from './cant-stop/engine'
import { skullEngine } from './skull/engine'

/**
 * Authoritative engine registry. The server uses this to run online games and
 * the client uses it to run local games — same logic, both places.
 */
export const ENGINES: Record<string, GameEngine<any, any, any>> = {
  'tic-tac-toe': ticTacToeEngine,
  'connect-four': connectFourEngine,
  memory: memoryEngine,
  'rock-paper-scissors': rockPaperScissorsEngine,
  hangman: hangmanEngine,
  yahtzee: yahtzeeEngine,
  blackjack: blackjackEngine,
  minesweeper: minesweeperEngine,
  'trivia-quiz': triviaEngine,
  checkers: checkersEngine,
  poker: pokerEngine,
  battleships: battleshipsEngine,
  'love-letter': loveLetterEngine,
  'dots-and-boxes': dotsAndBoxesEngine,
  perudo: perudoEngine,
  'cant-stop': cantStopEngine,
  skull: skullEngine,
}

export function getEngine(id: string): GameEngine<any, any, any> | undefined {
  return ENGINES[id]
}

export function hasOnlineEngine(id: string): boolean {
  return id in ENGINES
}
