'use client'

import { useState } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { GameCard } from '@/components/game-card'
import { GAMES, CATEGORIES } from '@/lib/games/registry'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Search } from 'lucide-react'
import styles from './games.module.css'

export default function GamesPage() {
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')

  const filteredGames = GAMES.filter((game) => {
    const matchesCategory =
      selectedCategory === 'all' || game.category === selectedCategory
    const matchesSearch =
      game.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      game.description.toLowerCase().includes(searchQuery.toLowerCase())
    return matchesCategory && matchesSearch
  })

  return (
    <div className={styles.page}>
      <Navbar />

      <main className={styles.main}>
        {/* Header */}
        <div className={styles.header}>
          <h1 className={`${styles.title} neon-text-cyan`}>
            Game Library
          </h1>
          <p className={styles.subtitle}>
            Choose from {GAMES.length} games to play locally or online
          </p>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          {/* Search */}
          <div className={styles.searchWrapper}>
            <Search className={styles.searchIcon} />
            <Input
              placeholder="Search games..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>

          {/* Category Filter */}
          <div className={styles.categoryFilters}>
            {CATEGORIES.map((category) => (
              <Button
                key={category.id}
                variant={selectedCategory === category.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(category.id)}
                className={
                  selectedCategory === category.id
                    ? `${styles.categoryButtonActive} neon-glow-cyan`
                    : styles.categoryButton
                }
              >
                {category.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Games Grid */}
        {filteredGames.length > 0 ? (
          <div className={styles.grid}>
            {filteredGames.map((game) => (
              <GameCard key={game.id} game={game} />
            ))}
          </div>
        ) : (
          <div className={styles.emptyState}>
            <p className={styles.emptyText}>
              No games found matching your criteria
            </p>
            <Button
              variant="outline"
              className={styles.categoryButton}
              onClick={() => {
                setSelectedCategory('all')
                setSearchQuery('')
              }}
            >
              Clear Filters
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}
