'use client'

import { EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useT } from '@/lib/i18n'
import styles from './PassDevice.module.css'

export function PassDevice({ name, onReady }: { name: string; onReady: () => void }) {
  const { t } = useT()
  return (
    <div className={styles.wrap}>
      <EyeOff size={44} className="text-neon-cyan" />
      <h2 className={styles.title}>{t('pass.title')}</h2>
      <p className={styles.text}>{t('pass.text', { name })}</p>
      <Button onClick={onReady} size="lg" className="neon-glow-cyan">
        {t('pass.ready', { name })}
      </Button>
    </div>
  )
}
