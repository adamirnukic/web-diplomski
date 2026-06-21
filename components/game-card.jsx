'use client'

import Link from 'next/link'
import styles from './game-card.module.css'

const colorClassMap = {
  cyan: styles.colorCyan,
  magenta: styles.colorMagenta,
  green: styles.colorGreen,
  purple: styles.colorPurple,
}

export function GameCard({ game }) {
  const colorClass = colorClassMap[game.color] || styles.colorCyan
  const Icon = game.icon

  return (
    <Link href={`/games/${game.id}`}>
      <div className={`${styles.card} ${colorClass}`}>
        {/* Icon */}
        <div className={styles.icon}>
          <Icon className={styles.iconSvg} />
        </div>

        {/* Info */}
        <div className={styles.info}>
          <h3 className={styles.title}>{game.name}</h3>
          <p className={styles.description}>
            {game.description}
          </p>
        </div>

        {/* Tags */}
        <div className={styles.tags}>
          <span className={styles.badge}>
            {game.category}
          </span>
          <span className={styles.badgeMuted}>
            {game.minPlayers === game.maxPlayers
              ? `${game.minPlayers}P`
              : `${game.minPlayers}-${game.maxPlayers}P`}
          </span>
        </div>
      </div>
    </Link>
  )
}
