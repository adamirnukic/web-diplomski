'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import styles from './progress.module.css'

export interface ProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: number
}

export function Progress({ className, value, ...props }: ProgressProps) {
  return (
    <div data-slot="progress" className={cn(styles.progress, className)} {...props}>
      <div
        data-slot="progress-indicator"
        className={styles.indicator}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </div>
  )
}
