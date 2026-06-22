'use client'

import { use, useMemo, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { getGameMeta } from '@/lib/games-catalog'
import { getEngine } from '@shared/games/registry'
import { getGameComponent } from '@/components/games/registry'
import { PassDevice } from '@/components/games/PassDevice'
import { useLocalGame } from '@/lib/useLocalGame'
import type { EnginePlayer } from '@shared/types'
import styles from './local.module.css'

const LOCAL_PLAYERS: EnginePlayer[] = [
  { id: 'p1', username: 'Igrač 1' },
  { id: 'p2', username: 'Igrač 2' },
]

function LocalRunner({ gameId, secret }: { gameId: string; secret: boolean }) {
  const engine = getEngine(gameId)!
  const Comp = getGameComponent(gameId)!
  const players = useMemo(() => LOCAL_PLAYERS, [])
  const { view, dispatch, restart, currentPlayer } = useLocalGame(engine, players)
  const [revealedFor, setRevealedFor] = useState<string | null>(currentPlayer)

  const handleRestart = () => {
    restart()
    setRevealedFor(LOCAL_PLAYERS[0].id)
  }

  // Hidden-information games: hand the device over before showing the next
  // player's secret view (prevents peeking on a single screen).
  if (secret && currentPlayer && revealedFor !== currentPlayer) {
    const name = players.find((p) => p.id === currentPlayer)?.username ?? 'Igrač'
    return <PassDevice name={name} onReady={() => setRevealedFor(currentPlayer)} />
  }

  return (
    <Comp
      view={view}
      onAction={dispatch}
      onRestart={handleRestart}
      mode="local"
      players={players}
    />
  )
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
        {ready ? (
          <LocalRunner gameId={gameId} secret={game?.secret ?? false} />
        ) : (
          <p className={styles.muted}>Ova igra još nije dostupna.</p>
        )}
      </main>
    </div>
  )
}
