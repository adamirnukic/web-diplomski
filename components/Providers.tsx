'use client'

import type { ReactNode } from 'react'
import { I18nProvider } from '@/lib/i18n'
import { SoundProvider } from '@/lib/sound'
import { AuthProvider } from '@/lib/auth'
import { RealtimeProvider } from '@/lib/realtime'
import { InviteToasts } from '@/components/InviteToasts'
import { AchievementToasts } from '@/components/AchievementToasts'

export function Providers({ children }: { children: ReactNode }) {
  return (
    <I18nProvider>
      <SoundProvider>
        <AuthProvider>
          <RealtimeProvider>
            {children}
            <InviteToasts />
            <AchievementToasts />
          </RealtimeProvider>
        </AuthProvider>
      </SoundProvider>
    </I18nProvider>
  )
}
