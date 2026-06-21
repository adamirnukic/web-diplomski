import * as React from 'react'
import { cn } from '@/lib/utils'
import styles from './input.module.css'

export type InputProps = React.InputHTMLAttributes<HTMLInputElement>

export function Input({ className, type, ...props }: InputProps) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(styles.input, className)}
      {...props}
    />
  )
}
