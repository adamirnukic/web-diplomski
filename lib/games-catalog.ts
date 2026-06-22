import {
  Grid3X3,
  Ship,
  Spade,
  CircleDot,
  Dice5,
  Columns3,
  Brain,
  Crown,
  Hand,
  PenLine,
  Bomb,
  HelpCircle,
  Mail,
  Box,
  Dices,
  type LucideIcon,
} from 'lucide-react'

export type GameCategory =
  | 'strategy'
  | 'cards'
  | 'dice'
  | 'puzzle'
  | 'trivia'
  | 'classic'

export type GameColor = 'cyan' | 'magenta' | 'green' | 'purple'

export interface GameMeta {
  id: string
  name: string
  description: string
  category: GameCategory
  minPlayers: number
  maxPlayers: number
  icon: LucideIcon
  color: GameColor
  hasLocal: boolean
  hasOnline: boolean
  /** true once both the engine and the UI exist */
  implemented: boolean
  /** hidden-information game -> local play uses a "pass device" gate */
  secret?: boolean
  /** show a brief read-only review of the last move before handing the device over */
  reviewOnPass?: boolean
  /** uses the generic local "vs bots" runner (player-count + bots setup) */
  aiLocal?: boolean
}

export const GAMES: GameMeta[] = [
  {
    id: 'tic-tac-toe',
    name: 'Tic-Tac-Toe',
    description: 'Klasični X i O na 3x3 mreži. Jednostavno, a strateški.',
    category: 'strategy',
    minPlayers: 2,
    maxPlayers: 2,
    icon: Grid3X3,
    color: 'cyan',
    hasLocal: true,
    hasOnline: true,
    implemented: true,
  },
  {
    id: 'connect-four',
    name: 'Connect Four',
    description: 'Ubacuj žetone i spoji četiri u nizu da pobijediš.',
    category: 'strategy',
    minPlayers: 2,
    maxPlayers: 2,
    icon: Columns3,
    color: 'magenta',
    hasLocal: true,
    hasOnline: true,
    implemented: true,
  },
  {
    id: 'dots-and-boxes',
    name: 'Točkice i kvadratići',
    description: 'Povlači ivice i zatvaraj kvadrate; ko zatvori — igra ponovo.',
    category: 'strategy',
    minPlayers: 2,
    maxPlayers: 2,
    icon: Box,
    color: 'green',
    hasLocal: true,
    hasOnline: true,
    implemented: true,
  },
  {
    id: 'battleships',
    name: 'Battleships',
    description: 'Rasporedi flotu i potopi protivnika prije nego on tebe.',
    category: 'strategy',
    minPlayers: 2,
    maxPlayers: 2,
    icon: Ship,
    color: 'purple',
    hasLocal: true,
    hasOnline: true,
    implemented: true,
    secret: true,
    reviewOnPass: true,
  },
  {
    id: 'blackjack',
    name: 'Blackjack',
    description: 'Priđi što bliže 21 a da ne pređeš.',
    category: 'cards',
    minPlayers: 1,
    maxPlayers: 2,
    icon: CircleDot,
    color: 'cyan',
    hasLocal: true,
    hasOnline: true,
    implemented: true,
  },
  {
    id: 'poker',
    name: "Texas Hold'em",
    description: 'Kralj kartaških igara — 2-6 igrača, AI botovi lokalno, custom ulozi.',
    category: 'cards',
    minPlayers: 2,
    maxPlayers: 6,
    icon: Spade,
    color: 'green',
    hasLocal: true,
    hasOnline: true,
    implemented: true,
    secret: true,
  },
  {
    id: 'love-letter',
    name: 'Love Letter',
    description: 'Nadmudri protivnike kartama dvora — pogađaj, mijenjaj, eliminiši.',
    category: 'cards',
    minPlayers: 2,
    maxPlayers: 4,
    icon: Mail,
    color: 'magenta',
    hasLocal: true,
    hasOnline: true,
    implemented: true,
    secret: true,
  },
  {
    id: 'yahtzee',
    name: 'Yahtzee',
    description: 'Bacaj pet kockica i lovi savršene kombinacije.',
    category: 'dice',
    minPlayers: 1,
    maxPlayers: 2,
    icon: Dice5,
    color: 'green',
    hasLocal: true,
    hasOnline: true,
    implemented: true,
  },
  {
    id: 'memory',
    name: 'Memory',
    description: 'Okreći karte i nađi parove. Testiraj pamćenje.',
    category: 'puzzle',
    minPlayers: 2,
    maxPlayers: 2,
    icon: Brain,
    color: 'purple',
    hasLocal: true,
    hasOnline: true,
    implemented: true,
  },
  {
    id: 'checkers',
    name: 'Dama',
    description: 'Preskači i pojedi sve protivničke figure.',
    category: 'strategy',
    minPlayers: 2,
    maxPlayers: 2,
    icon: Crown,
    color: 'cyan',
    hasLocal: true,
    hasOnline: true,
    implemented: true,
  },
  {
    id: 'rock-paper-scissors',
    name: 'Kamen-Papir-Makaze',
    description: 'Najbolji od 5 rundi. Biraj mudro i nadmudri protivnika.',
    category: 'classic',
    minPlayers: 2,
    maxPlayers: 2,
    icon: Hand,
    color: 'green',
    hasLocal: true,
    hasOnline: true,
    implemented: true,
    secret: true,
  },
  {
    id: 'hangman',
    name: 'Vješalo',
    description: 'Pogađaj riječ slovo po slovo prije nego istekne vrijeme.',
    category: 'puzzle',
    minPlayers: 2,
    maxPlayers: 2,
    icon: PenLine,
    color: 'magenta',
    hasLocal: true,
    hasOnline: true,
    implemented: true,
    secret: true,
  },
  {
    id: 'minesweeper',
    name: 'Minolovac',
    description: 'Očisti polje bez aktiviranja mina — sam ili u co-op-u.',
    category: 'puzzle',
    minPlayers: 1,
    maxPlayers: 2,
    icon: Bomb,
    color: 'cyan',
    hasLocal: true,
    hasOnline: true,
    implemented: true,
  },
  {
    id: 'trivia-quiz',
    name: 'Kviz znanja',
    description: 'Provjeri znanje iz nauke, historije, geografije i više.',
    category: 'trivia',
    minPlayers: 2,
    maxPlayers: 2,
    icon: HelpCircle,
    color: 'green',
    hasLocal: true,
    hasOnline: true,
    implemented: true,
  },
  {
    id: 'perudo',
    name: "Perudo (Liar's Dice)",
    description: 'Blefiraj kockicama — licitiraj koliko ih ima ili viči "laž!". 2-6, botovi.',
    category: 'dice',
    minPlayers: 2,
    maxPlayers: 6,
    icon: Dices,
    color: 'magenta',
    hasLocal: true,
    hasOnline: true,
    implemented: true,
    secret: true,
    aiLocal: true,
  },
]

export const CATEGORIES: { id: GameCategory | 'all'; label: string }[] = [
  { id: 'all', label: 'Sve igre' },
  { id: 'strategy', label: 'Strategija' },
  { id: 'cards', label: 'Karte' },
  { id: 'dice', label: 'Kockice' },
  { id: 'puzzle', label: 'Slagalice' },
  { id: 'trivia', label: 'Kviz' },
  { id: 'classic', label: 'Klasici' },
]

export function getGameMeta(id: string): GameMeta | undefined {
  return GAMES.find((g) => g.id === id)
}
