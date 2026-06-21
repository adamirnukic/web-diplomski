'use client'

import { use, useEffect, useState, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { RoomLobby } from '@/components/room-lobby'
import { getGameById } from '@/lib/games/registry'
import { useGameRoom } from '@/lib/realtime/use-game-room'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'
import { getCurrentUser } from '@/services/authService'
import { getUserProfile } from '@/services/userService'
import styles from './online-game.module.css'

// Dynamic game component imports
import dynamic from 'next/dynamic'

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

export default function OnlineGamePage({
  params,
}) {
  const { gameId } = use(params)
  const searchParams = useSearchParams()
  const joinCode = searchParams.get('join')
  const router = useRouter()

  const game = getGameById(gameId)
  const [player, setPlayer] = useState(null)
  const [gameStarted, setGameStarted] = useState(false)

  const handleGameEvent = useCallback(() => {}, [])

  const {
    roomCode,
    players,
    isHost,
    createRoom,
    joinRoom,
    sendEvent,
    leave,
  } = useGameRoom({
    gameId,
    player: player ?? { id: '', username: '' },
    onGameEvent: handleGameEvent,
  })

  useEffect(() => {
    const loadPlayer = async () => {
      const user = await getCurrentUser()
      if (!user) {
        router.push('/auth/login')
        return
      }
      const { profile } = await getUserProfile(user.id)
      setPlayer({
        id: user.id,
        username: profile?.username ?? 'Player',
      })
    }
    loadPlayer()
  }, [router])

  useEffect(() => {
    if (!player) return
    if (joinCode) {
      joinRoom(joinCode)
    } else {
      createRoom()
    }
  }, [player]) // eslint-disable-line react-hooks/exhaustive-deps

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

        {!gameStarted ? (
          <RoomLobby
            roomCode={roomCode}
            players={players}
            isHost={isHost}
            minPlayers={game.minPlayers}
            onStart={() => {
              sendEvent('game-start', {})
              setGameStarted(true)
            }}
            onLeave={() => {
              leave()
              router.push(`/games/${gameId}`)
            }}
          />
        ) : GameComponent ? (
          <GameComponent
            mode="online"
            roomCode={roomCode}
            playerId={player?.id}
            isHost={isHost}
            onGameEnd={() => setGameStarted(false)}
          />
        ) : (
          <div className={styles.loading}>
            Game loading...
          </div>
        )}
      </main>
    </div>
  )
}
