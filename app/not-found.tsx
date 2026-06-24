'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { useT } from '@/lib/i18n'
import styles from './not-found.module.css'

export default function NotFound() {
  const { t } = useT()
  return (
    <div className={styles.wrap}>
      <h1 className={styles.code}>404</h1>
      <p className={styles.text}>{t('nf.text')}</p>
      <Link href="/">
        <Button className="neon-glow-cyan">{t('nf.home')}</Button>
      </Link>
    </div>
  )
}
