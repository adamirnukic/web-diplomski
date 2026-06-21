'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Monitor, Wifi } from 'lucide-react'
import styles from './game-mode-selector.module.css'

export function GameModeSelector({
  game,
  isLoggedIn,
}) {
  const router = useRouter()
  const [joinCode, setJoinCode] = useState('')
  const [showJoin, setShowJoin] = useState(false)

  return (
    <div className={styles.wrapper}>
      {/* Local Mode */}
      {game.hasLocalMode && (
        <Button
          size="lg"
          variant="outline"
          className={`${styles.modeButton} ${styles.modeButtonLocal} neon-glow-cyan`}
          onClick={() => router.push(`/games/${game.id}/local`)}
        >
          <Monitor className={`${styles.modeIcon} text-neon-cyan`} />
          <span className={styles.modeTitle}>Local Play</span>
          <span className={styles.modeSubtitle}>
            Play on the same device
          </span>
        </Button>
      )}

      {/* Online Mode */}
      {game.hasOnlineMode && (
        <div className={styles.onlineSection}>
          <Button
            size="lg"
            className={`${styles.modeButton} ${styles.onlineButton} neon-glow-magenta`}
            onClick={() => {
              if (!isLoggedIn) {
                router.push('/auth/login')
                return
              }
              router.push(`/games/${game.id}/online`)
            }}
          >
            <Wifi className={styles.modeIcon} />
            <span className={styles.modeTitle}>Online Play</span>
            <span className={`${styles.modeSubtitle} ${styles.onlineSubtitle}`}>
              {isLoggedIn ? 'Create or join a room' : 'Login required'}
            </span>
          </Button>

          {isLoggedIn && (
            <div className={styles.joinWrapper}>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowJoin(!showJoin)}
                className={styles.joinToggle}
              >
                Have a room code?
              </Button>
              {showJoin && (
                <div className={styles.joinRow}>
                  <Input
                    placeholder="Enter code..."
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={6}
                    className={styles.joinInput}
                  />
                  <Button
                    onClick={() => {
                      if (joinCode.length === 6) {
                        router.push(
                          `/games/${game.id}/online?join=${joinCode}`,
                        )
                      }
                    }}
                    disabled={joinCode.length !== 6}
                  >
                    Join
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
