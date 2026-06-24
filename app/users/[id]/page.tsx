'use client'

import { use, useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { Navbar } from '@/components/layout/navbar'
import { useT } from '@/lib/i18n'
import { apiUserProfile, type AchievementRow, type GameStatRow, type PublicProfile } from '@/lib/api'
import { getGameMeta } from '@/lib/games-catalog'
import { cn } from '@/lib/utils'
import styles from '../../profile/profile.module.css'

export default function PublicProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params)
  const { t } = useT()
  const [user, setUser] = useState<PublicProfile | null>(null)
  const [stats, setStats] = useState<GameStatRow[]>([])
  const [achievements, setAchievements] = useState<AchievementRow[]>([])
  const [loaded, setLoaded] = useState(false)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    apiUserProfile(id)
      .then((r) => {
        setUser(r.user)
        setStats(r.stats)
        setAchievements(r.achievements)
      })
      .catch(() => setNotFound(true))
      .finally(() => setLoaded(true))
  }, [id])

  if (!loaded) {
    return (
      <div className={styles.page}>
        <Navbar />
        <main className={`container ${styles.main}`}>
          <p className={styles.muted}>{t('common.loading')}</p>
        </main>
      </div>
    )
  }

  if (notFound || !user) {
    return (
      <div className={styles.page}>
        <Navbar />
        <main className={`container ${styles.main}`}>
          <Link href="/leaderboard" className={styles.muted} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
            <ArrowLeft size={16} /> {t('common.back')}
          </Link>
          <p className={styles.muted} style={{ marginTop: '1rem' }}>{t('pub.notFound')}</p>
        </main>
      </div>
    )
  }

  const totalXp = stats.reduce((s, r) => s + r.xp, 0)
  const totalWins = stats.reduce((s, r) => s + r.wins, 0)
  const totalGames = stats.reduce((s, r) => s + r.games_played, 0)
  const level = Math.floor(totalXp / 100) + 1
  const earned = achievements.filter((a) => a.earned)

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={`container ${styles.main}`}>
        <Link href="/leaderboard" className={styles.muted} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', marginBottom: '1rem' }}>
          <ArrowLeft size={16} /> {t('common.back')}
        </Link>

        <div className={styles.head}>
          {user.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img className={styles.avatarImg} src={user.avatar} alt={user.username} />
          ) : (
            <div className={`${styles.avatar} neon-glow-cyan`}>
              {user.username.charAt(0).toUpperCase()}
            </div>
          )}
          <div className={styles.headMain}>
            <h1 className={styles.name}>{user.username}</h1>
            <p className={styles.level}>{t('prof.level', { level, xp: totalXp })}</p>
          </div>
        </div>

        <div className={styles.statRow}>
          <Stat label={t('prof.wins')} value={totalWins} />
          <Stat label={t('prof.played')} value={totalGames} />
          <Stat label={t('prof.totalXp')} value={totalXp} />
        </div>

        <h2 className={styles.section}>{t('prof.perGame')}</h2>
        {stats.length === 0 ? (
          <p className={styles.muted}>{t('prof.noGames')}</p>
        ) : (
          <table className={styles.table}>
            <thead>
              <tr>
                <th>{t('prof.game')}</th>
                <th>{t('prof.wins')}</th>
                <th>{t('res.draw')}</th>
                <th>{t('res.loss')}</th>
                <th>XP</th>
              </tr>
            </thead>
            <tbody>
              {stats.map((s) => (
                <tr key={s.game_id}>
                  <td>{getGameMeta(s.game_id) ? t(`game.${s.game_id}.name`) : s.game_id}</td>
                  <td>{s.wins}</td>
                  <td>{s.draws}</td>
                  <td>{s.losses}</td>
                  <td>{s.xp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h2 className={styles.section}>{t('ach.title')}</h2>
        <div className={styles.badges}>
          {earned.length === 0 ? (
            <p className={styles.muted}>—</p>
          ) : (
            earned.map((a) => (
              <div key={a.id} className={cn(styles.badge, styles.badgeEarned)}>
                <span className={styles.badgeIcon}>{a.icon}</span>
                <span>
                  <div className={styles.badgeName}>{t(`ach.${a.id}.name`)}</div>
                  <div className={styles.badgeDesc}>{t(`ach.${a.id}.desc`)}</div>
                </span>
              </div>
            ))
          )}
        </div>
      </main>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className={styles.stat}>
      <span className={styles.statValue}>{value}</span>
      <span className={styles.statLabel}>{label}</span>
    </div>
  )
}
