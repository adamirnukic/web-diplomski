import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Mail, Gamepad2 } from 'lucide-react'
import styles from '../auth.module.css'

export default function SignUpSuccessPage() {
  return (
    <div className={`${styles.page} bg-grid-pattern`}>
      <div className={styles.container}>
        <div className={styles.card}>
          <div className={`${styles.iconCircleSquare} bg-neon-green-10 neon-glow-green`}>
            <Mail className={`${styles.iconLarge} text-neon-green`} />
          </div>
          <div className={styles.cardContent}>
            <h1 className={styles.title}>Check your email</h1>
            <p className={`${styles.mutedText} ${styles.relaxed}`}>
              {"We've sent a confirmation link to your email address. Click the link to activate your account and join the"}{' '}
              <span className={styles.primaryText}>GameVault</span> arena.
            </p>
          </div>
          <Link href="/auth/login">
            <Button variant="outline">
              <Gamepad2 className={styles.iconSmall} />
              Back to Login
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
