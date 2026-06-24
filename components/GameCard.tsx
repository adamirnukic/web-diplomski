'use client'

import Link from 'next/link'
import { Users } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'
import { Badge } from '@/components/ui/badge'
import type { GameMeta } from '@/lib/games-catalog'
import styles from './GameCard.module.css'

const colorClass: Record<GameMeta['color'], string> = {
  cyan: 'neon-cyan',
  magenta: 'neon-magenta',
  green: 'neon-green',
  purple: 'neon-purple',
}

export function GameCard({ game }: { game: GameMeta }) {
  const { t } = useT()
  const Icon = game.icon
  const players =
    game.minPlayers === game.maxPlayers
      ? `${game.maxPlayers}`
      : `${game.minPlayers}-${game.maxPlayers}`

  const inner = (
    <div className={cn(styles.card, !game.implemented && styles.disabled)}>
      <div className={cn(styles.icon, colorClass[game.color])}>
        <Icon size={28} />
      </div>
      <div className={styles.body}>
        <div className={styles.titleRow}>
          <h3 className={styles.title}>{t(`game.${game.id}.name`)}</h3>
          {!game.implemented && <Badge variant="outline">{t('games.soon')}</Badge>}
        </div>
        <p className={styles.desc}>{t(`game.${game.id}.desc`)}</p>
        <div className={styles.meta}>
          <span className={styles.players}>
            <Users size={14} /> {t('games.players', { count: players })}
          </span>
        </div>
      </div>
    </div>
  )

  if (!game.implemented) return inner
  return (
    <Link href={`/games/${game.id}`} className={styles.link}>
      {inner}
    </Link>
  )
}
