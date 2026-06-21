'use client'

import { use } from 'react'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Navbar } from '@/components/layout/navbar'
import { GameModeSelector } from '@/components/game-mode-selector'
import { getGameById } from '@/lib/games/registry'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { getCurrentUser } from '@/services/authService'
import styles from './game-detail.module.css'

export default function GameDetailPage({
  params,
}) {
  const { gameId } = use(params)
  const game = getGameById(gameId)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    getCurrentUser().then((user) => {
      setIsLoggedIn(Boolean(user))
    })
  }, [])

  if (!game) return notFound()

  const Icon = game.icon
  const colorClass =
    game.color === 'cyan'
      ? styles.colorCyan
      : game.color === 'magenta'
        ? styles.colorMagenta
        : game.color === 'green'
          ? styles.colorGreen
          : styles.colorPurple

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <Link href="/dashboard">
          <Button variant="ghost" size="sm" className={styles.backButton}>
            <ArrowLeft className={styles.backIcon} />
            Back to Games
          </Button>
        </Link>

        <div className={styles.content}>
          <div className={`${styles.iconBadge} ${colorClass}`}>
            <Icon className={styles.icon} />
          </div>
          <div className={styles.titleGroup}>
            <h1 className={styles.title}>{game.name}</h1>
            <p className={styles.description}>{game.description}</p>
            <div className={styles.meta}>
              <span>
                {game.minPlayers === game.maxPlayers
                  ? `${game.minPlayers} Players`
                  : `${game.minPlayers}-${game.maxPlayers} Players`}
              </span>
              <span className={styles.separator}>|</span>
              <span className={styles.capitalized}>{game.category}</span>
            </div>
          </div>

          {/* Mode Selection */}
          <div className={styles.modeSelector}>
            <GameModeSelector game={game} isLoggedIn={isLoggedIn} />
          </div>
        </div>
      </main>
    </div>
  )
}
