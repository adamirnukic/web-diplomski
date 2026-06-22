'use client'

import { use, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { getGameMeta } from '@/lib/games-catalog'
import { getEngine } from '@shared/games/registry'
import { getGameComponent } from '@/components/games/registry'
import { PassDevice } from '@/components/games/PassDevice'
import { PokerLocal } from '@/components/games/poker/PokerLocal'
import { useLocalGame } from '@/lib/useLocalGame'
import type { EnginePlayer } from '@shared/types'
import styles from './local.module.css'

const LOCAL_PLAYERS: EnginePlayer[] = [
  { id: 'p1', username: 'Igrač 1' },
  { id: 'p2', username: 'Igrač 2' },
]

function LocalRunner({
  gameId,
  secret,
  reviewOnPass,
}: {
  gameId: string
  secret: boolean
  reviewOnPass: boolean
}) {
  const engine = getEngine(gameId)!
  const Comp = getGameComponent(gameId)!
  const players = useMemo(() => LOCAL_PLAYERS, [])
  const { view, viewFor, dispatch, restart, currentPlayer } = useLocalGame(engine, players)
  const [viewerId, setViewerId] = useState<string | null>(currentPlayer)
  const [reviewing, setReviewing] = useState(false)

  // Manage the pass-and-play hand-off (and an optional brief result review).
  useEffect(() => {
    if (!secret) {
      setViewerId(currentPlayer)
      return
    }
    if (currentPlayer == null || currentPlayer === viewerId) {
      setReviewing(false)
      return
    }
    // turn moved to a different player
    if (reviewOnPass && viewerId != null) {
      setReviewing(true)
      const t = setTimeout(() => setReviewing(false), 1600)
      return () => clearTimeout(t)
    }
    setReviewing(false)
  }, [currentPlayer, viewerId, secret, reviewOnPass])

  const handleRestart = () => {
    restart()
    setViewerId(LOCAL_PLAYERS[0].id)
    setReviewing(false)
  }

  const common = { onRestart: handleRestart, mode: 'local' as const, players }

  // Perfect-information games: no hand-off needed.
  if (!secret) {
    return <Comp view={view} onAction={dispatch} {...common} />
  }

  // Game over: show the final board.
  if (currentPlayer == null) {
    return <Comp view={viewFor(viewerId ?? players[0].id)} onAction={() => {}} {...common} />
  }

  // Brief read-only review so the player who just moved sees the outcome.
  if (reviewing && viewerId != null) {
    return <Comp view={viewFor(viewerId)} onAction={() => {}} mode="local" players={players} />
  }

  // Hand the device to the next player before revealing their secret view.
  if (currentPlayer !== viewerId) {
    const name = players.find((p) => p.id === currentPlayer)?.username ?? 'Igrač'
    return <PassDevice name={name} onReady={() => setViewerId(currentPlayer)} />
  }

  // Normal play for the current viewer.
  return <Comp view={viewFor(viewerId)} onAction={dispatch} {...common} />
}

export default function LocalGamePage({
  params,
}: {
  params: Promise<{ gameId: string }>
}) {
  const { gameId } = use(params)
  const game = getGameMeta(gameId)
  const ready = Boolean(game && getEngine(gameId) && getGameComponent(gameId))

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={`container ${styles.main}`}>
        <Link href={`/games/${gameId}`} className={styles.back}>
          <ArrowLeft size={16} /> Nazad
        </Link>
        <h1 className={styles.title}>
          {game?.name ?? 'Igra'} <span className={styles.muted}>— lokalno</span>
        </h1>
        {!ready ? (
          <p className={styles.muted}>Ova igra još nije dostupna.</p>
        ) : gameId === 'poker' ? (
          <PokerLocal />
        ) : (
          <LocalRunner
            gameId={gameId}
            secret={game?.secret ?? false}
            reviewOnPass={game?.reviewOnPass ?? false}
          />
        )}
      </main>
    </div>
  )
}
