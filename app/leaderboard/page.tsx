'use client'

import { useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { apiLeaderboard, type LeaderboardRow } from '@/lib/api'
import { cn } from '@/lib/utils'
import styles from './leaderboard.module.css'

export default function LeaderboardPage() {
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    apiLeaderboard()
      .then((r) => setRows(r.leaderboard))
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [])

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={`container ${styles.main}`}>
        <header className={styles.header}>
          <Trophy className="text-neon-green" size={28} />
          <h1 className={styles.title}>Rang-lista</h1>
        </header>

        {loaded && rows.length === 0 ? (
          <p className={styles.muted}>Još nema rezultata. Budi prvi!</p>
        ) : (
          <ol className={styles.list}>
            {rows.map((r, i) => (
              <li key={r.username} className={cn(styles.row, i < 3 && styles.top)}>
                <span className={styles.rank}>{i + 1}</span>
                <span className={styles.user}>{r.username}</span>
                <span className={styles.wins}>{r.wins} pob.</span>
                <span className={styles.xp}>{r.xp} XP</span>
              </li>
            ))}
          </ol>
        )}
      </main>
    </div>
  )
}
