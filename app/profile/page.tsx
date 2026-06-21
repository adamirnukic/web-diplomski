'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Navbar } from '@/components/layout/navbar'
import { useAuth } from '@/lib/auth'
import { apiStats, type GameStatRow } from '@/lib/api'
import { getGameMeta } from '@/lib/games-catalog'
import styles from './profile.module.css'

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}

export default function ProfilePage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const [stats, setStats] = useState<GameStatRow[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    if (!loading && !user) router.push('/login')
  }, [loading, user, router])

  useEffect(() => {
    if (!user) return
    apiStats(user.id)
      .then((r) => setStats(r.stats))
      .catch(() => {})
      .finally(() => setLoaded(true))
  }, [user])

  if (loading || !user) {
    return (
      <div className={styles.page}>
        <Navbar />
        <main className={`container ${styles.main}`}>
          <p className={styles.muted}>Učitavanje…</p>
        </main>
      </div>
    )
  }

  const totalXp = stats.reduce((s, r) => s + r.xp, 0)
  const totalWins = stats.reduce((s, r) => s + r.wins, 0)
  const totalGames = stats.reduce((s, r) => s + r.games_played, 0)
  const level = Math.floor(totalXp / 100) + 1

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={`container ${styles.main}`}>
        <div className={styles.head}>
          <div className={`${styles.avatar} neon-glow-cyan`}>
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <h1 className={styles.name}>{user.username}</h1>
            <p className={styles.email}>{user.email}</p>
            <p className={styles.level}>
              Nivo {level} · {totalXp} XP
            </p>
          </div>
        </div>

        <div className={styles.statRow}>
          <Stat label="Pobjede" value={totalWins} />
          <Stat label="Odigrano" value={totalGames} />
          <Stat label="Ukupno XP" value={totalXp} />
        </div>

        <h2 className={styles.section}>Po igrama</h2>
        {loaded && stats.length === 0 ? (
          <p className={styles.muted}>
            Još nema odigranih partija. Odigraj online meč da skupiš XP!
          </p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Igra</th>
                <th>Pob.</th>
                <th>Ner.</th>
                <th>Por.</th>
                <th>XP</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.game_id}>
                  <td>{getGameMeta(s.game_id)?.name ?? s.game_id}</td>
                  <td>{s.wins}</td>
                  <td>{s.draws}</td>
                  <td>{s.losses}</td>
                  <td>{s.xp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </main>
    </div>
  )
}
