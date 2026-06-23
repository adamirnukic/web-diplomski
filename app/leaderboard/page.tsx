'use client'

import { useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { apiLeaderboard, type LeaderboardRow } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import styles from './leaderboard.module.css'

export default function LeaderboardPage() {
  const { user } = useAuth()
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [loaded, setLoaded] = useState(false)
  const [scope, setScope] = useState<'all' | 'friends'>('all')

  useEffect(() => {
    // Friends scope needs auth; fall back to "all" when logged out.
    if (scope === 'friends' && !user) {
      setScope('all')
      return
    }
    setLoaded(false)
    apiLeaderboard(scope === 'friends' ? 'friends' : undefined)
      .then((r) => setRows(r.leaderboard))
      .catch(() => setRows([]))
      .finally(() => setLoaded(true))
  }, [scope, user])

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={`container ${styles.main}`}>
        <header className={styles.header}>
          <Trophy className="text-neon-green" size={28} />
          <h1 className={styles.title}>Rang-lista</h1>
        </header>

        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem' }}>
          <Button
            size="sm"
            variant={scope === 'all' ? undefined : 'outline'}
            onClick={() => setScope('all')}
          >
            Svi
          </Button>
          <Button
            size="sm"
            variant={scope === 'friends' ? undefined : 'outline'}
            onClick={() => setScope('friends')}
            disabled={!user}
            title={user ? undefined : 'Prijavi se da vidiš prijatelje'}
          >
            Ja i prijatelji
          </Button>
        </div>

        {loaded && rows.length === 0 ? (
          <p className={styles.muted}>
            {scope === 'friends'
              ? 'Ti i tvoji prijatelji još nemate rezultata. Odigrajte online meč!'
              : 'Još nema rezultata. Budi prvi!'}
          </p>
        ) : (
          <ol className={styles.list}>
            {rows.map((r, i) => (
              <li
                key={r.username}
                className={cn(styles.row, scope === 'all' && i < 3 && styles.top)}
              >
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
