import * as React from 'react'
import { cn } from '@/lib/utils'
import styles from './button.module.css'

const variantStyles = {
  default: styles.default,
  destructive: styles.destructive,
  outline: styles.outline,
  secondary: styles.secondary,
  ghost: styles.ghost,
  link: styles.link,
}

const sizeStyles = {
  default: styles.sizeDefault,
  sm: styles.sizeSm,
  lg: styles.sizeLg,
  icon: styles.sizeIcon,
  'icon-sm': styles.sizeIconSm,
  'icon-lg': styles.sizeIconLg,
}

function Button({ className, variant = 'default', size = 'default', ...props }) {
  return (
    <button
      data-slot="button"
      className={cn(
        styles.button,
        variantStyles[variant] || variantStyles.default,
        sizeStyles[size] || sizeStyles.default,
        className,
      )}
      {...props}
    />
  )
}

export { Button }
