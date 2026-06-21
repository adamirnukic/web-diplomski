import * as React from 'react'

import { cn } from '@/lib/utils'
import styles from './badge.module.css'

const variantStyles = {
  default: styles.default,
  secondary: styles.secondary,
  destructive: styles.destructive,
  outline: styles.outline,
}

function Badge({ className, variant = 'default', ...props }) {
  return (
    <span
      data-slot="badge"
      className={cn(styles.badge, variantStyles[variant] || styles.default, className)}
      {...props}
    />
  )
}

export { Badge }
