import * as React from 'react'
import { cn } from '@/lib/utils'
import styles from './badge.module.css'

const variantStyles = {
  default: styles.default,
  secondary: styles.secondary,
  destructive: styles.destructive,
  outline: styles.outline,
}

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: keyof typeof variantStyles
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <span
      data-slot="badge"
      className={cn(styles.badge, variantStyles[variant] ?? styles.default, className)}
      {...props}
    />
  )
}
