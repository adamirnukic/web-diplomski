'use client'

import { useEffect, useState } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { GAMES } from '@/lib/games/registry'
import { getLevelTitle, calculateLevel } from '@/lib/games/xp'
import { Trophy, Medal, Award } from 'lucide-react'
import { getXpLeaderboard } from '@/services/leaderboardService'
import styles from './leaderboard.module.css'

export default function LeaderboardPage() {
  const [players, setPlayers] = useState([])
  const [filter, setFilter] = useState('overall')

  useEffect(() => {
    async function load() {
      const { leaderboard } = await getXpLeaderboard(50)

      if (leaderboard) {
        setPlayers(
          leaderboard.map((p, i) => ({
            ...p,
            rank: i + 1,
          })),
        )
      }
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const RankIcon = ({ rank }) => {
    if (rank === 1) return <Trophy className={`${styles.rankIcon} text-yellow-400`} />
    if (rank === 2) return <Medal className={`${styles.rankIcon} text-gray-300`} />
    if (rank === 3) return <Award className={`${styles.rankIcon} text-amber-600`} />
    return <span className={styles.rankText}>{rank}</span>
  }

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        <div className={styles.header}>
          <h1 className={styles.title}>Leaderboard</h1>
          <p className={styles.subtitle}>Top players ranked by XP</p>
        </div>

        {/* Filters */}
        <div className={styles.filters}>
          <button
            onClick={() => setFilter('overall')}
            className={`${styles.filterButton} ${
              filter === 'overall' ? `${styles.filterButtonActive} neon-glow-cyan` : ''
            }`}
          >
            Overall
          </button>
          {GAMES.slice(0, 6).map((g) => (
            <button
              key={g.id}
              onClick={() => setFilter(g.id)}
              className={`${styles.filterButton} ${
                filter === g.id ? `${styles.filterButtonActive} neon-glow-cyan` : ''
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>

        {/* Leaderboard Table */}
        <div className={styles.list}>
          {players.length === 0 ? (
            <div className={styles.empty}>
              No players yet. Be the first to climb the leaderboard!
            </div>
          ) : (
            players.map((player) => (
              <div
                key={player.id}
                className={`${styles.row} ${player.rank <= 3 ? styles.rowTop : ''}`}
              >
                <div className={styles.rank}>
                  <RankIcon rank={player.rank} />
                </div>
                <Avatar className={styles.avatar}>
                  <AvatarFallback className={styles.avatarFallback}>
                    {player.username?.slice(0, 2).toUpperCase() ?? 'GV'}
                  </AvatarFallback>
                </Avatar>
                <div className={styles.playerInfo}>
                  <p className={styles.playerName}>
                    {player.display_name || player.username}
                  </p>
                  <p className={styles.playerMeta}>
                    Level {calculateLevel(player.xp)} - {getLevelTitle(calculateLevel(player.xp))}
                  </p>
                </div>
                <div className={styles.stats}>
                  <div className={styles.statsDetail}>
                    <span>{player.total_wins}W</span>
                    <span className={styles.statsDivider}> / </span>
                    <span>{player.total_games_played}G</span>
                  </div>
                  <span className={styles.xp}>
                    {player.xp} XP
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}
