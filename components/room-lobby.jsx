'use client'

import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import styles from './room-lobby.module.css'

export function RoomLobby({
  roomCode,
  players,
  isHost,
  minPlayers,
  onStart,
  onLeave,
}) {
  const canStart =
    isHost && players.length >= minPlayers && players.every((p) => p.isReady)

  return (
    <div className={styles.wrapper}>
      {/* Room Code Display */}
      <div className={styles.codeBlock}>
        <p className={styles.codeLabel}>Room Code</p>
        <div className={`${styles.codeCard} neon-glow-cyan`}>
          <span className={`${styles.codeText} neon-text-cyan`}>
            {roomCode}
          </span>
        </div>
        <p className={styles.codeHelp}>
          Share this code with your friend
        </p>
      </div>

      {/* Players */}
      <div className={styles.players}>
        <h3 className={styles.playersTitle}>
          Players ({players.length}/{minPlayers})
        </h3>
        {players.map((player) => (
          <div
            key={player.id}
            className={`${styles.playerRow} ${player.isReady ? styles.playerReady : ''}`}
          >
            <Avatar className={styles.avatar}>
              <AvatarFallback className={styles.avatarFallback}>
                {player.username.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span className={styles.playerName}>
              {player.username}
            </span>
            {player.isHost && (
              <Badge variant="outline" className={styles.hostBadge}>
                Host
              </Badge>
            )}
            <div
              className={`${styles.readyDot} ${player.isReady ? styles.readyDotActive : ''}`}
            />
          </div>
        ))}

        {players.length < minPlayers && (
          <div className={styles.waiting}>
            Waiting for players...
          </div>
        )}
      </div>

      {/* Actions */}
      <div className={styles.actions}>
        <button
          onClick={onLeave}
          className={styles.actionButton}
        >
          Leave
        </button>
        {isHost && (
          <button
            onClick={onStart}
            disabled={!canStart}
            className={`${styles.startButton} ${canStart ? styles.startButtonActive : styles.startButtonDisabled}`}
          >
            Start Game
          </button>
        )}
      </div>
    </div>
  )
}
