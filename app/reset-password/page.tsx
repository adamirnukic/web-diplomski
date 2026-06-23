'use client'

import { Suspense, useState, type FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Gamepad2 } from 'lucide-react'
import { apiResetPassword } from '@/lib/api'
import { useAuth } from '@/lib/auth'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BackButton } from '@/components/ui/back-button'
import { useT } from '@/lib/i18n'
import styles from '@/components/AuthForm.module.css'

function ResetInner() {
  const params = useSearchParams()
  const token = params.get('token') ?? ''
  const router = useRouter()
  const { applySession } = useAuth()
  const { t } = useT()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  if (!token) {
    return (
      <p className={styles.subtitle}>
        {t('reset.missing')}{' '}
        <Link href="/forgot-password" className="neon-text-cyan">
          {t('reset.requestNew')}
        </Link>
      </p>
    )
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    if (password !== confirm) {
      setError(t('reset.mismatch'))
      return
    }
    setLoading(true)
    try {
      const r = await apiResetPassword(token, password)
      applySession(r.user, r.token)
      router.push('/games')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={submit} className={styles.form}>
      <div className={styles.field}>
        <Label htmlFor="password">{t('reset.new')}</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>
      <div className={styles.field}>
        <Label htmlFor="confirm">{t('reset.confirm')}</Label>
        <Input
          id="confirm"
          type="password"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          required
          minLength={6}
          autoComplete="new-password"
        />
      </div>
      {error && <p className={styles.error}>{error}</p>}
      <Button type="submit" disabled={loading} className="neon-glow-cyan">
        {loading ? t('auth.wait') : t('reset.submit')}
      </Button>
    </form>
  )
}

export default function ResetPasswordPage() {
  const { t } = useT()
  return (
    <div className={styles.wrap}>
      <BackButton />
      <Link href="/" className={styles.brand}>
        <span className={`${styles.logo} neon-glow-cyan`}>
          <Gamepad2 size={22} />
        </span>
        <span className={styles.brandText}>
          Game<span className="neon-text-cyan">Vault</span>
        </span>
      </Link>

      <div className={styles.card}>
        <h1 className={styles.title}>{t('reset.title')}</h1>
        <p className={styles.subtitle}>{t('reset.subtitle')}</p>
        <Suspense fallback={<p className={styles.subtitle}>{t('common.loading')}</p>}>
          <ResetInner />
        </Suspense>
        <p className={styles.switch}>
          <Link href="/login" className="neon-text-cyan">
            {t('reset.back')}
          </Link>
        </p>
      </div>
    </div>
  )
}
