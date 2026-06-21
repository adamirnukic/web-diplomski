import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { AlertTriangle } from 'lucide-react'
import styles from '../auth.module.css'

export default function AuthErrorPage() {
  return (
    <div className={`${styles.page} bg-grid-pattern`}>
      <div className={styles.container}>
        <div className={`${styles.card} ${styles.cardError}`}>
          <div className={`${styles.iconCircleSquare} ${styles.errorIconBackground}`}>
            <AlertTriangle className={`${styles.iconLarge} ${styles.error}`} />
          </div>
          <div className={styles.cardContent}>
            <h1 className={styles.title}>Authentication Error</h1>
            <p className={styles.mutedText}>
              Something went wrong during authentication. Please try again.
            </p>
          </div>
          <Link href="/auth/login">
            <Button>Try Again</Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
