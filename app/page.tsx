'use client'

import Link from 'next/link'
import { Gamepad2, Users, Sofa, TrendingUp, ArrowRight, Zap, User } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { LangToggle } from '@/components/ui/lang-toggle'
import { useAuth } from '@/lib/auth'
import { useT } from '@/lib/i18n'
import { GAMES } from '@/lib/games-catalog'
import styles from './page.module.css'

const FEATURES = [
  { icon: Users, titleKey: 'land.f1t', textKey: 'land.f1x', accent: 'cyan' },
  { icon: Sofa, titleKey: 'land.f2t', textKey: 'land.f2x', accent: 'magenta' },
  { icon: TrendingUp, titleKey: 'land.f3t', textKey: 'land.f3x', accent: 'green' },
]

export default function LandingPage() {
  const { user, loading } = useAuth()
  const { t } = useT()
  const playable = GAMES.filter((g) => g.implemented).length

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <div className={`container ${styles.navInner}`}>
          <Link href="/" className={styles.brand}>
            <span className={`${styles.logo} neon-glow-cyan`}>
              <Gamepad2 size={20} />
            </span>
            <span className={styles.brandText}>
              Game<span className="neon-text-cyan">Vault</span>
            </span>
          </Link>
          <div className={styles.navActions}>
            <LangToggle />
            {!loading &&
              (user ? (
                <>
                  <Link href="/games">
                    <Button size="sm" className="neon-glow-cyan">
                      {t('nav.play')}
                    </Button>
                  </Link>
                  <Link href="/profile">
                    <Button variant="ghost" size="sm">
                      <User size={16} /> {user.username}
                    </Button>
                  </Link>
                </>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm">
                      {t('nav.login')}
                    </Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm" className="neon-glow-cyan">
                      {t('nav.register')}
                    </Button>
                  </Link>
                </>
              ))}
          </div>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className="bg-grid-pattern" aria-hidden="true" />
        <div className={styles.heroInner}>
          <div className={styles.pill}>
            <Zap size={14} /> {t('land.pill', { count: GAMES.length, playable })}
          </div>
          <h1 className={styles.heroTitle}>{t('land.heroTitle')}</h1>
          <p className={styles.heroText}>{t('land.heroText')}</p>
          <div className={styles.heroActions}>
            <Link href={user ? '/games' : '/register'}>
              <Button size="lg" className="neon-glow-cyan animate-pulse-glow">
                {user ? t('land.play') : t('land.start')} <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href={user ? '/leaderboard' : '/games'}>
              <Button size="lg" variant="outline">
                {user ? t('nav.leaderboard') : t('land.viewGames')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className={`container ${styles.features}`}>
        {FEATURES.map((f) => (
          <div key={f.titleKey} className={styles.featureCard} data-accent={f.accent}>
            <span className={styles.featureIcon}>
              <f.icon size={24} />
            </span>
            <h3 className={styles.featureTitle}>{t(f.titleKey)}</h3>
            <p className={styles.featureText}>{t(f.textKey)}</p>
          </div>
        ))}
      </section>

      <footer className={styles.footer}>
        <div className={`container ${styles.footerInner}`}>
          <span className={styles.footerBrand}>
            <Gamepad2 size={18} /> GameVault
          </span>
          <span className={styles.footerNote}>© {new Date().getFullYear()} GameVault</span>
        </div>
      </footer>
    </div>
  )
}
