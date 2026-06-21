'use client'

import { useState } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { GameCard } from '@/components/game-card'
import { GAMES, CATEGORIES } from '@/lib/games/registry'
import styles from './dashboard.module.css'

export default function DashboardPage() {
  const [activeCategory, setActiveCategory] = useState('all')

  const filtered =
    activeCategory === 'all'
      ? GAMES
      : GAMES.filter((g) => g.category === activeCategory)

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={styles.title}>Games</h1>
          <p className={styles.subtitle}>
            Choose a game and start playing. All games support local and online multiplayer.
          </p>
        </div>

        {/* Category Filters */}
        <div className={styles.filters}>
          {CATEGORIES.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`${styles.filterButton} ${
                activeCategory === cat.id ? `${styles.filterButtonActive} neon-glow-cyan` : ''
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Games Grid */}
        <div className={styles.grid}>
          {filtered.map((game) => (
            <GameCard key={game.id} game={game} />
          ))}
        </div>
      </main>
    </div>
  )
}
