'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Gamepad2, Loader2, CheckCircle } from 'lucide-react'
import {
  getPasswordResetSession,
  updatePassword,
} from '@/services/authService'
import styles from '../auth.module.css'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    // Check if we have a valid session from the reset link
    const checkSession = async () => {
      const { hasSession } = await getPasswordResetSession()
      if (!hasSession) {
        // No session means the reset link wasn't clicked or expired
        router.push('/auth/forgot-password')
      }
    }
    checkSession()
  }, [router])

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      setLoading(false)
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters')
      setLoading(false)
      return
    }

    try {
      const { success: updateSuccess, error: updateError } =
        await updatePassword(password)

      if (!updateSuccess) {
        setError(updateError || 'Unable to reset password. Please try again.')
        setLoading(false)
        return
      }

      setSuccess(true)
      setTimeout(() => {
        router.push('/dashboard')
      }, 2000)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to reset password. Please try again.',
      )
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className={`${styles.page} bg-grid-pattern`}>
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={`${styles.iconCircle} bg-neon-green-10 neon-glow-green`}>
              <CheckCircle className={`${styles.iconLarge} text-neon-green`} />
            </div>
            <h1 className={styles.title}>Password reset successful!</h1>
            <p className={styles.mutedText}>
              Your password has been updated. Redirecting you to the dashboard...
            </p>
            <Loader2 className={styles.spinnerLarge} />
          </div>
        </div>
      </div>
    )
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
            Set new password
          </h1>
          <p className={`${styles.subtitle} ${styles.subtitleCenter}`}>
            Enter your new password below
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleResetPassword}
          className={styles.form}
        >
          <div className={styles.field}>
            <Label htmlFor="password">New Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter new password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
            />
          </div>
          <div className={styles.field}>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              type="password"
              placeholder="Confirm new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
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
              'Reset password'
            )}
          </Button>

          <p className={`${styles.centerText} ${styles.mutedText}`}>
            Remember your password?{' '}
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
