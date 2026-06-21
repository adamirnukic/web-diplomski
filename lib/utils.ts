import { clsx, type ClassValue } from 'clsx'

/** Join class names (used for conditional CSS-module classes). */
export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs)
}
