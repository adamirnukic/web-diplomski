'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import styles from './navbar.module.css'

import { getCurrentUser, onAuthStateChange, signOut } from '@/services/authService'
import { Button } from '@/components/ui/button'
import { Gamepad2, LayoutDashboard, Trophy, User, LogOut, Menu, X } from 'lucide-react'

const NAV_LINKS = [
  { href: '/dashboard', label: 'Games', icon: LayoutDashboard },
  { href: '/leaderboard', label: 'Leaderboard', icon: Trophy },
]

export function Navbar() {
  const pathname = usePathname()
  const [user, setUser] = useState(null)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    getCurrentUser().then((currentUser) => setUser(currentUser))
    const subscription = onAuthStateChange((nextUser) => setUser(nextUser))
    return () => subscription?.unsubscribe()
  }, [])

  useEffect(() => {
    if (!userMenuOpen) return
    const handleClick = (event) => {
      if (!menuRef.current) return
      if (!menuRef.current.contains(event.target)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [userMenuOpen])

  const handleSignOut = async () => {
    await signOut()
    window.location.href = '/'
  }

  const initials =
    user?.user_metadata?.username?.slice(0, 2)?.toUpperCase() ?? 'GV'

  return (
    <nav className={styles.navbar}>
      <div className={`container ${styles.inner}`}>
        <Link href={user ? '/dashboard' : '/'} className={styles.brand}>
          <div className={`${styles.logo} neon-glow-cyan`}>
            <Gamepad2 className={styles.logoIcon} />
          </div>
          <span className={styles.brandText}>
            Game<span className="neon-text-cyan">Vault</span>
          </span>
        </Link>

        <div className={styles.navLinks}>
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href}>
              <Button
                variant={pathname === link.href ? 'secondary' : 'ghost'}
                size="sm"
                className={pathname === link.href ? styles.active : undefined}
              >
                <link.icon className="icon-sm" />
                {link.label}
              </Button>
            </Link>
          ))}
        </div>

        <div className={styles.navActions}>
          {user ? (
            <div className={styles.userMenu} ref={menuRef}>
              <Button
                variant="ghost"
                size="sm"
                className={styles.userButton}
                onClick={() => setUserMenuOpen((open) => !open)}
                aria-haspopup="menu"
                aria-expanded={userMenuOpen}
              >
                <span className={styles.avatar}>{initials}</span>
                <span className={styles.userName}>
                  {user.user_metadata?.username ?? 'Player'}
                </span>
              </Button>
              {userMenuOpen && (
                <div className={styles.menuContent} role="menu">
                  <Link
                    href="/profile"
                    className={styles.menuItem}
                    role="menuitem"
                    onClick={() => setUserMenuOpen(false)}
                  >
                    <User className="icon-sm" />
                    Profile
                  </Link>
                  <div className={styles.menuSeparator} />
                  <button
                    type="button"
                    className={`${styles.menuItem} ${styles.menuItemDanger}`}
                    onClick={handleSignOut}
                  >
                    <LogOut className="icon-sm" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className={styles.authLinks}>
              <Link href="/auth/login">
                <Button variant="ghost" size="sm">Log In</Button>
              </Link>
              <Link href="/auth/sign-up">
                <Button size="sm" className="neon-glow-cyan">Sign Up</Button>
              </Link>
            </div>
          )}

          <Button
            variant="ghost"
            size="sm"
            className={styles.mobileToggle}
            onClick={() => setMobileOpen(!mobileOpen)}
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X className="icon-md" /> : <Menu className="icon-md" />}
          </Button>
        </div>
      </div>

      {mobileOpen && (
        <div className={styles.mobileMenu}>
          <div className={styles.mobileMenuInner}>
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className={styles.mobileLink}
              >
                <Button
                  variant={pathname === link.href ? 'secondary' : 'ghost'}
                  className={`${styles.mobileButton} ${pathname === link.href ? styles.active : ''}`}
                >
                  <link.icon className="icon-sm" />
                  {link.label}
                </Button>
              </Link>
            ))}
            {user ? (
              <>
                <Link href="/profile" onClick={() => setMobileOpen(false)} className={styles.mobileLink}>
                  <Button variant="ghost" className={styles.mobileButton}>
                    <User className="icon-sm" />
                    Profile
                  </Button>
                </Link>
                <Button
                  variant="ghost"
                  className={`${styles.mobileButton} ${styles.danger}`}
                  onClick={handleSignOut}
                >
                  <LogOut className="icon-sm" />
                  Sign Out
                </Button>
              </>
            ) : (
              <>
                <Link href="/auth/login" onClick={() => setMobileOpen(false)} className={styles.mobileLink}>
                  <Button variant="ghost" className={styles.mobileButton}>Log In</Button>
                </Link>
                <Link href="/auth/sign-up" onClick={() => setMobileOpen(false)} className={styles.mobileLink}>
                  <Button className={`${styles.mobileButton} neon-glow-cyan`}>Sign Up</Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  )
}
