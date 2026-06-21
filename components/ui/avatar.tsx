'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'
import styles from './avatar.module.css'

export function Avatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div data-slot="avatar" className={cn(styles.avatar, className)} {...props} />
}

export function AvatarImage({
  className,
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      data-slot="avatar-image"
      className={cn(styles.image, className)}
      alt={props.alt ?? ''}
      {...props}
    />
  )
}

export function AvatarFallback({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div data-slot="avatar-fallback" className={cn(styles.fallback, className)} {...props} />
  )
}
