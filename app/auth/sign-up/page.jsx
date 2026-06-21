'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Gamepad2, Loader2 } from 'lucide-react'
import { signUp } from '@/services/authService'
import styles from '../auth.module.css'

export default function SignUpPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [username, setUsername] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSignUp = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (username.length < 3) {
      setError('Username must be at least 3 characters')
      setLoading(false)
      return
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setError('Username can only contain letters, numbers, and underscores')
      setLoading(false)
      return
    }

    try {
      const redirectTo =
        process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ||
        `${window.location.origin}/dashboard`

      const { success, error: signUpError } = await signUp({
        email,
        password,
        username,
        redirectTo,
      })

      if (!success) {
        setError(signUpError || 'Unable to create account. Please try again.')
        setLoading(false)
        return
      }

      router.push('/auth/sign-up-success')
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to connect to the server. Please try again.',
      )
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
            Join{' '}
            <span className="neon-text-cyan">GameVault</span>
          </h1>
          <p className={styles.subtitle}>
            Create your account and start playing
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSignUp}
          className={styles.form}
        >
          <div className={styles.field}>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              type="text"
              placeholder="coolplayer99"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              minLength={3}
              maxLength={20}
            />
            <p className={styles.helpText}>
              3-20 characters, letters, numbers, underscores only
            </p>
          </div>
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
              placeholder="Min. 6 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>

          {error && (
            <p className={styles.error}>{error}</p>
          )}

          <Button type="submit" disabled={loading} className="neon-glow-cyan">
            {loading ? (
              <Loader2 className={styles.spinnerSmall} />
            ) : (
              'Create Account'
            )}
          </Button>

          <p className={`${styles.centerText} ${styles.mutedText}`}>
            Already have an account?{' '}
            <Link
              href="/auth/login"
              className={styles.link}
            >
              Log in
            </Link>
          </p>
        </form>
      </div>
    </div>
  )
}
