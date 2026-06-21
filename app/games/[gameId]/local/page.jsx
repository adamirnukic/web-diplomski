'use client'

import { use } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { getGameById } from '@/lib/games/registry'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import styles from './local-game.module.css'

const gameComponents = {
  'tic-tac-toe': dynamic(() => import('@/components/games/tic-tac-toe/board')),
  'connect-four': dynamic(() => import('@/components/games/connect-four/board')),
  'rock-paper-scissors': dynamic(() => import('@/components/games/rock-paper-scissors/game')),
  'memory': dynamic(() => import('@/components/games/memory/board')),
  'hangman': dynamic(() => import('@/components/games/hangman/game')),
  'minesweeper': dynamic(() => import('@/components/games/minesweeper/board')),
  'checkers': dynamic(() => import('@/components/games/checkers/board')),
  'battleships': dynamic(() => import('@/components/games/battleships/board')),
  'yahtzee': dynamic(() => import('@/components/games/yahtzee/scorecard')),
  'blackjack': dynamic(() => import('@/components/games/blackjack/table')),
  'poker': dynamic(() => import('@/components/games/poker/table')),
  'trivia-quiz': dynamic(() => import('@/components/games/quiz/game')),
}

export default function LocalGamePage({
  params,
}) {
  const { gameId } = use(params)
  const game = getGameById(gameId)

  if (!game) return null

  const GameComponent = gameComponents[gameId]

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <Link href={`/games/${gameId}`}>
          <Button variant="ghost" size="sm" className={styles.backButton}>
            <ArrowLeft className={styles.backIcon} />
            Back to {game.name}
          </Button>
        </Link>

        <h1 className={styles.heading}>
          {game.name}{' '}
          <span className={styles.headingMuted}>- Local Play</span>
        </h1>

        {GameComponent ? (
          <GameComponent mode="local" onGameEnd={() => {}} />
        ) : (
          <div className={styles.loading}>
            Game loading...
          </div>
        )}
      </main>
    </div>
  )
}
