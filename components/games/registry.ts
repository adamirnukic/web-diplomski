import type { ComponentType } from 'react'
import { TicTacToeBoard } from './tic-tac-toe/TicTacToe'
import { ConnectFourBoard } from './connect-four/ConnectFour'
import { MemoryBoard } from './memory/Memory'
import { RockPaperScissorsGame } from './rock-paper-scissors/RockPaperScissors'
import { HangmanGame } from './hangman/Hangman'
import { YahtzeeGame } from './yahtzee/Yahtzee'
import { BlackjackTable } from './blackjack/Blackjack'
import { MinesweeperBoard } from './minesweeper/Minesweeper'
import { TriviaQuizGame } from './trivia/Trivia'
import { CheckersBoard } from './checkers/Checkers'
import { PokerTable } from './poker/Poker'
import { BattleshipsBoard } from './battleships/Battleships'
import { LoveLetterBoard } from './love-letter/LoveLetter'
import { DotsAndBoxesBoard } from './dots-and-boxes/DotsAndBoxes'

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface GameBoardProps {
  // `any` is deliberate: each board casts these to its own engine's types,
  // so local/online pages can render any game generically.
  view: any
  onAction: (action: any) => void
  onRestart?: () => void
  mode: 'local' | 'online'
  /** players in the match, used to label whose turn it is (esp. local hot-seat) */
  players?: { id: string; username: string }[]
}

export const GAME_COMPONENTS: Record<string, ComponentType<GameBoardProps>> = {
  'tic-tac-toe': TicTacToeBoard,
  'connect-four': ConnectFourBoard,
  memory: MemoryBoard,
  'rock-paper-scissors': RockPaperScissorsGame,
  hangman: HangmanGame,
  yahtzee: YahtzeeGame,
  blackjack: BlackjackTable,
  minesweeper: MinesweeperBoard,
  'trivia-quiz': TriviaQuizGame,
  checkers: CheckersBoard,
  poker: PokerTable,
  battleships: BattleshipsBoard,
  'love-letter': LoveLetterBoard,
  'dots-and-boxes': DotsAndBoxesBoard,
}

export function getGameComponent(id: string): ComponentType<GameBoardProps> | undefined {
  return GAME_COMPONENTS[id]
}
