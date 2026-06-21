'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Gamepad2, Loader2 } from 'lucide-react'
import { signInWithPassword } from '@/services/authService'
import styles from '../auth.module.css'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { success, error: loginError } = await signInWithPassword({
        email,
        password,
      })

      if (!success) {
        setError(loginError || 'Unable to log in. Please try again.')
        setLoading(false)
        return
      }

      router.push('/dashboard')
    } catch (err) {
      console.log('[v0] Login error:', err)
      setError('Unable to connect to the server. Please try again.')
      setLoading(false)
    }
  }

  return (
    <div className={`${styles.page} bg-grid-pattern`}>
      <div className={styles.container}>
        {/* Logo */}
        <div className={styles.logo}>
          <div className={`${styles.logoIcon} neon-glow-cyan`}>
            <Gamepad2 className={`${styles.iconLarge} ${styles.iconPrimary}`} />
          </div>
          <h1 className={styles.title}>
            Welcome back to{' '}
            <span className="neon-text-cyan">GameVault</span>
          </h1>
          <p className={styles.subtitle}>
            Log in to continue your gaming journey
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleLogin}
          className={styles.form}
        >
          <div className={styles.field}>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="player@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div className={styles.field}>
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {error && (
            <p className={styles.error}>{error}</p>
          )}

          <Button type="submit" disabled={loading} className="neon-glow-cyan">
            {loading ? <Loader2 className={styles.spinnerSmall} /> : 'Log In'}
          </Button>

          <p className={`${styles.centerText} ${styles.mutedText}`}>
            {"Don't have an account? "}
            <Link
              href="/auth/sign-up"
              className={styles.link}
            >
              Sign up
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
