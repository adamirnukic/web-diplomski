// Game component exports
export { TicTacToeBoard } from './tic-tac-toe/board'
export { ConnectFourBoard } from './connect-four/board'
export { RockPaperScissorsGame } from './rock-paper-scissors/game'
export { MemoryBoard } from './memory/board'
export { HangmanGame } from './hangman/game'
export { MinesweeperBoard } from './minesweeper/board'
export { CheckersBoard } from './checkers/board'
export { BattleshipsBoard } from './battleships/board'
export { YahtzeeGame } from './yahtzee/scorecard'
export { BlackjackTable } from './blackjack/table'
export { PokerTable } from './poker/table'
export { TriviaQuizGame } from './quiz/game'

// Game component map for dynamic loading
import { TicTacToeBoard } from './tic-tac-toe/board'
import { ConnectFourBoard } from './connect-four/board'
import { RockPaperScissorsGame } from './rock-paper-scissors/game'
import { MemoryBoard } from './memory/board'
import { HangmanGame } from './hangman/game'
import { MinesweeperBoard } from './minesweeper/board'
import { CheckersBoard } from './checkers/board'
import { BattleshipsBoard } from './battleships/board'
import { YahtzeeGame } from './yahtzee/scorecard'
import { BlackjackTable } from './blackjack/table'
import { PokerTable } from './poker/table'
import { TriviaQuizGame } from './quiz/game'
export const GAME_COMPONENTS = {
  'tic-tac-toe': TicTacToeBoard,
  'connect-four': ConnectFourBoard,
  'rock-paper-scissors': RockPaperScissorsGame,
  'memory': MemoryBoard,
  'hangman': HangmanGame,
  'minesweeper': MinesweeperBoard,
  'checkers': CheckersBoard,
  'battleships': BattleshipsBoard,
  'yahtzee': YahtzeeGame,
  'blackjack': BlackjackTable,
  'poker': PokerTable,
  'trivia-quiz': TriviaQuizGame,
}
