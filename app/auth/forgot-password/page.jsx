'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Gamepad2, Loader2, ArrowLeft, Mail } from 'lucide-react'
import { sendPasswordResetEmail } from '@/services/authService'
import styles from '../auth.module.css'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleResetPassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { success: resetSuccess, error: resetError } =
        await sendPasswordResetEmail(
          email,
          `${window.location.origin}/auth/reset-password`,
        )

      if (!resetSuccess) {
        setError(resetError || 'Unable to send reset email. Please try again.')
        setLoading(false)
        return
      }

      setSuccess(true)
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Unable to send reset email. Please try again.',
      )
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className={`${styles.page} bg-grid-pattern`}>
        <div className={styles.container}>
          <div className={styles.card}>
            <div className={`${styles.iconCircle} neon-glow-cyan`}>
              <Mail className={`${styles.iconLarge} ${styles.iconPrimary}`} />
            </div>
            <h1 className={styles.title}>Check your email</h1>
            <p className={styles.mutedText}>
              We&apos;ve sent a password reset link to{' '}
              <span className={styles.highlightText}>{email}</span>
            </p>
            <p className={styles.mutedText}>
              Click the link in the email to reset your password. If you don&apos;t see it, check your spam folder.
            </p>
            <Link href="/auth/login">
              <Button variant="outline">
                <ArrowLeft className={styles.iconSmall} />
                Back to login
              </Button>
            </Link>
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
            Reset your password
          </h1>
          <p className={`${styles.subtitle} ${styles.subtitleCenter}`}>
            Enter your email and we&apos;ll send you a link to reset your password
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleResetPassword}
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

          {error && (
            <p className={styles.error}>{error}</p>
          )}

          <Button type="submit" disabled={loading} className="neon-glow-cyan">
            {loading ? (
              <Loader2 className={styles.spinnerSmall} />
            ) : (
              'Send reset link'
            )}
          </Button>

          <Link
            href="/auth/login"
            className={styles.inlineLink}
          >
            <ArrowLeft className={styles.iconSmall} />
            Back to login
          </Link>
        </form>
      </div>
    </div>
  )
}
