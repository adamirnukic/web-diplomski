'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { Gamepad2, LogOut, User } from 'lucide-react'
import { useAuth } from '@/lib/auth'
import { useRealtime } from '@/lib/realtime'
import { useT } from '@/lib/i18n'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { LangToggle } from '@/components/ui/lang-toggle'
import styles from './navbar.module.css'

export function Navbar() {
  const { user, logout } = useAuth()
  const { incomingCount } = useRealtime()
  const { t } = useT()
  const router = useRouter()
  const pathname = usePathname()
  const isActive = (href: string) =>
    pathname === href || pathname?.startsWith(href + '/')

  return (
    <nav className={styles.nav}>
      <div className={`container ${styles.inner}`}>
        <Link href="/" className={styles.brand}>
          <span className={`${styles.logo} neon-glow-cyan`}>
            <Gamepad2 size={20} />
          </span>
          <span className={styles.brandText}>
            Game<span className="neon-text-cyan">Vault</span>
          </span>
        </Link>

        <div className={styles.links}>
          <Link
            href="/games"
            className={cn(styles.link, isActive('/games') && styles.linkActive)}
          >
            {t('nav.games')}
          </Link>
          <Link
            href="/leaderboard"
            className={cn(styles.link, isActive('/leaderboard') && styles.linkActive)}
          >
            {t('nav.leaderboard')}
          </Link>
          {user && (
            <Link
              href="/friends"
              className={cn(styles.link, isActive('/friends') && styles.linkActive)}
            >
              {t('nav.friends')}
              {incomingCount > 0 && (
                <span
                  style={{
                    marginLeft: '0.35rem',
                    background: 'var(--neon-magenta)',
                    color: '#0a0a1a',
                    borderRadius: '999px',
                    fontSize: '0.7rem',
                    fontWeight: 800,
                    padding: '0 0.4rem',
                    minWidth: '1.1rem',
                    display: 'inline-block',
                    textAlign: 'center',
                  }}
                >
                  {incomingCount}
                </span>
              )}
            </Link>
          )}
        </div>

        <div className={styles.actions}>
          <LangToggle />
          {user ? (
            <>
              <Link href="/profile" className={styles.userChip}>
                {user.avatar ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.avatar}
                    alt=""
                    width={20}
                    height={20}
                    style={{ borderRadius: '50%', objectFit: 'cover' }}
                  />
                ) : (
                  <User size={16} />
                )}
                <span>{user.username}</span>
              </Link>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label="Odjava"
                onClick={() => {
                  logout()
                  router.push('/')
                }}
              >
                <LogOut size={16} />
              </Button>
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
          )}
        </div>
      </div>
    </nav>
  )
}
