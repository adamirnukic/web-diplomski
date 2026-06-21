'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import styles from './label.module.css'

export type LabelProps = React.LabelHTMLAttributes<HTMLLabelElement>

export function Label({ className, ...props }: LabelProps) {
  return (
    <label data-slot="label" className={cn(styles.label, className)} {...props} />
  )
}
