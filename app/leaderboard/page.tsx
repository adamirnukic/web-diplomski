'use client'

import { useEffect, useState } from 'react'
import { Trophy } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { apiLeaderboard, type LeaderboardRow } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { useT } from '@/lib/i18n'
import { GAMES } from '@/lib/games-catalog'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import styles from './leaderboard.module.css'

export default function LeaderboardPage() {
  const { user } = useAuth()
  const { t } = useT()
  const [rows, setRows] = useState<LeaderboardRow[]>([])
  const [loaded, setLoaded] = useState(false)
  const [scope, setScope] = useState<'all' | 'friends'>('all')
  const [gameId, setGameId] = useState('') // '' = all games combined

  useEffect(() => {
    if (scope === 'friends' && !user) {
      setScope('all')
      return
    }
    setLoaded(false)
    apiLeaderboard(scope === 'friends' ? 'friends' : undefined, gameId || undefined)
      .then((r) => setRows(r.leaderboard))
      .catch(() => setRows([]))
      .finally(() => setLoaded(true))
  }, [scope, gameId, user])

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={`container ${styles.main}`}>
        <header className={styles.header}>
          <Trophy className="text-neon-green" size={28} />
          <h1 className={styles.title}>{t('lb.title')}</h1>
        </header>

        <div style={{ display: 'flex', gap: '0.6rem', marginBottom: '1.25rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Button size="sm" variant={scope === 'all' ? undefined : 'outline'} onClick={() => setScope('all')}>
            {t('lb.all')}
          </Button>
          <Button
            size="sm"
            variant={scope === 'friends' ? undefined : 'outline'}
            onClick={() => setScope('friends')}
            disabled={!user}
          >
            {t('lb.friends')}
          </Button>
          <select
            value={gameId}
            onChange={(e) => setGameId(e.target.value)}
            style={{
              marginLeft: 'auto',
              background: 'var(--secondary)',
              color: 'inherit',
              border: '1px solid var(--border)',
              borderRadius: 8,
              padding: '0.35rem 0.6rem',
              fontSize: '0.85rem',
            }}
          >
            <option value="">{t('lb.allGames')}</option>
            {GAMES.filter((g) => g.implemented).map((g) => (
              <option key={g.id} value={g.id}>
                {t(`game.${g.id}.name`)}
              </option>
            ))}
          </select>
        </div>

        {loaded && rows.length === 0 ? (
          <p className={styles.muted}>{scope === 'friends' ? t('lb.noneFriends') : t('lb.none')}</p>
        ) : (
          <ol className={styles.list}>
            {rows.map((r, i) => (
              <li key={r.username} className={cn(styles.row, i < 3 && styles.top)}>
                <span className={styles.rank}>{i + 1}</span>
                <span className={styles.user}>{r.username}</span>
                <span className={styles.wins}>
                  {r.wins} {t('lb.wins')}
                </span>
                <span className={styles.xp}>{r.xp} XP</span>
              </li>
            ))}
          </ol>
        )}
      </main>
    </div>
  )
}
