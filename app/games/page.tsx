'use client'

import { useState } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { GameCard } from '@/components/GameCard'
import { CATEGORIES, GAMES, type GameCategory } from '@/lib/games-catalog'
import { cn } from '@/lib/utils'
import { useT } from '@/lib/i18n'
import styles from './games.module.css'

export default function GamesPage() {
  const { t } = useT()
  const [cat, setCat] = useState<GameCategory | 'all'>('all')
  const games = cat === 'all' ? GAMES : GAMES.filter((g) => g.category === cat)

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={`container ${styles.main}`}>
        <header className={styles.header}>
          <h1 className={styles.title}>{t('nav.games')}</h1>
          <p className={styles.subtitle}>{t('games.subtitle')}</p>
        </header>

        <div className={styles.filters}>
          {CATEGORIES.map((c) => (
            <button
              key={c.id}
              className={cn(styles.filter, cat === c.id && styles.filterActive)}
              onClick={() => setCat(c.id)}
            >
              {t(`cat.${c.id}`)}
            </button>
          ))}
        </div>

        <div className={styles.grid}>
          {games.map((g) => (
            <GameCard key={g.id} game={g} />
          ))}
        </div>
      </main>
    </div>
  )
}
