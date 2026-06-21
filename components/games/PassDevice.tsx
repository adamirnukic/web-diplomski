'use client'

import { EyeOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import styles from './PassDevice.module.css'

export function PassDevice({ name, onReady }: { name: string; onReady: () => void }) {
  return (
    <div className={styles.wrap}>
      <EyeOff size={44} className="text-neon-cyan" />
      <h2 className={styles.title}>Predaj uređaj</h2>
      <p className={styles.text}>
        Da protivnik ne vidi tvoje tajne, predaj uređaj igraču <strong>{name}</strong>.
      </p>
      <Button onClick={onReady} size="lg" className="neon-glow-cyan">
        Ja sam {name} — spreman
      </Button>
    </div>
  )
}
