'use client'

import { useEffect, useState } from 'react'
import { Navbar } from '@/components/layout/navbar'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import { Textarea } from '@/components/ui/textarea'
import { calculateLevel, xpForNextLevel, xpProgress, getLevelTitle } from '@/lib/games/xp'
import { GAMES } from '@/lib/games/registry'
import { Trophy, Gamepad2, Star, Edit2, Check, X } from 'lucide-react'
import { getCurrentUser } from '@/services/authService'
import { getProfileById, updateProfile } from '@/services/profileService'
import { getUserStats } from '@/services/statsService'
import styles from './profile.module.css'

export default function ProfilePage() {
  const [profile, setProfile] = useState(null)
  const [stats, setStats] = useState([])
  const [editing, setEditing] = useState(false)
  const [displayName, setDisplayName] = useState('')
  const [bio, setBio] = useState('')

  useEffect(() => {
    async function load() {
      const user = await getCurrentUser()
      if (!user) return

      const { profile: p } = await getProfileById(user.id)

      if (p) {
        setProfile(p)
        setDisplayName(p.display_name || '')
        setBio(p.bio || '')
      }

      const { stats: s } = await getUserStats(user.id)

      if (s) setStats(s)
    }
    load()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleSave = async () => {
    if (!profile) return
    const { profile: updated } = await updateProfile(profile.id, {
      display_name: displayName,
      bio,
    })

    if (updated) {
      setProfile(updated)
    } else {
      setProfile({ ...profile, display_name: displayName, bio })
    }
    setEditing(false)
  }

  if (!profile) {
    return (
      <div className={styles.page}>
        <Navbar />
        <div className={styles.loading}>
          Loading profile...
        </div>
      </div>
    )
  }

  const level = calculateLevel(profile.xp)
  const nextLevelXp = xpForNextLevel(profile.xp)
  const progress = xpProgress(profile.xp)
  const title = getLevelTitle(level)

  return (
    <div className={styles.page}>
      <Navbar />
      <main className={styles.main}>
        {/* Profile Header */}
        <div className={styles.headerCard}>
          <Avatar className={`${styles.avatar} neon-glow-cyan`}>
            <AvatarFallback className={styles.avatarFallback}>
              {profile.username.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>

          <div className={styles.profileContent}>
            {editing ? (
              <div className={styles.editForm}>
                <div className={styles.field}>
                  <Label>Display Name</Label>
                  <Input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    maxLength={30}
                  />
                </div>
                <div className={styles.field}>
                  <Label>Bio</Label>
                  <Textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    maxLength={200}
                    rows={2}
                  />
                </div>
                <div className={styles.actionRow}>
                  <Button size="sm" onClick={handleSave} className={styles.actionButton}>
                    <Check className={styles.actionIcon} /> Save
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setEditing(false)} className={styles.actionButton}>
                    <X className={styles.actionIcon} /> Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className={styles.headerRow}>
                  <h1 className={styles.title}>
                    {profile.display_name || profile.username}
                  </h1>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditing(true)}
                    className={styles.editButton}
                  >
                    <Edit2 className={styles.actionIcon} />
                  </Button>
                </div>
                <p className={styles.username}>@{profile.username}</p>
                {profile.bio && (
                  <p className={styles.bio}>{profile.bio}</p>
                )}
              </>
            )}

            {/* Level Bar */}
            <div className={styles.levelRow}>
              <div className={styles.levelMeta}>
                <span className={styles.levelTitle}>
                  Level {level} - {title}
                </span>
                <span className={styles.levelXp}>
                  {progress}/{nextLevelXp > progress ? 100 : 100} XP
                </span>
              </div>
              <Progress value={progress} className={styles.progress} />
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className={styles.statsGrid}>
          {[
            {
              icon: Gamepad2,
              label: 'Games Played',
              value: profile.total_games_played,
              color: 'text-neon-cyan',
            },
            {
              icon: Trophy,
              label: 'Total Wins',
              value: profile.total_wins,
              color: 'text-neon-green',
            },
            {
              icon: Star,
              label: 'Total XP',
              value: profile.xp,
              color: 'text-neon-magenta',
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className={styles.statCard}
            >
              <stat.icon className={`${styles.statIcon} ${stat.color}`} />
              <span className={styles.statValue}>
                {stat.value}
              </span>
              <span className={styles.statLabel}>{stat.label}</span>
            </div>
          ))}
        </div>

        {/* Per-Game Stats */}
        <div>
          <h2 className={styles.sectionTitle}>Game Statistics</h2>
          {stats.length === 0 ? (
            <div className={styles.emptyStats}>
              No games played yet. Start playing to see your stats!
            </div>
          ) : (
            <div className={styles.statsList}>
              {stats.map((stat) => {
                const game = GAMES.find((g) => g.id === stat.game_type)
                if (!game) return null
                const Icon = game.icon
                const winRate =
                  stat.games_played > 0
                    ? Math.round((stat.wins / stat.games_played) * 100)
                    : 0
                return (
                  <div
                    key={stat.id}
                    className={styles.statRow}
                  >
                    <div className={styles.gameIcon}>
                      <Icon className={styles.gameIconSvg} />
                    </div>
                    <div className={styles.statInfo}>
                      <p className={styles.statName}>{game.name}</p>
                      <p className={styles.statMeta}>
                        {stat.wins}W / {stat.losses}L / {stat.draws}D
                        {' - '}
                        {winRate}% win rate
                      </p>
                    </div>
                    <span className={styles.statCount}>
                      {stat.games_played} played
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
