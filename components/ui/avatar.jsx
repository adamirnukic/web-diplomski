'use client'

import * as React from 'react'

import { cn } from '@/lib/utils'
import styles from './avatar.module.css'

function Avatar({ className, ...props }) {
  return (
    <div data-slot="avatar" className={cn(styles.avatar, className)} {...props} />
  )
}

function AvatarImage({ className, ...props }) {
  return (
    <img
      data-slot="avatar-image"
      className={cn(styles.image, className)}
      alt=""
      {...props}
    />
  )
}

function AvatarFallback({ className, ...props }) {
  return (
    <div
      data-slot="avatar-fallback"
      className={cn(styles.fallback, className)}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
