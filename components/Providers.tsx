'use client'

import type { ReactNode } from 'react'
import { AuthProvider } from '@/lib/auth'
import { RealtimeProvider } from '@/lib/realtime'
import { InviteToasts } from '@/components/InviteToasts'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <AuthProvider>
      <RealtimeProvider>
        {children}
        <InviteToasts />
      </RealtimeProvider>
    </AuthProvider>
  )
}
