import './globals.css'
import type { Metadata, Viewport } from 'next'
import type { ReactNode } from 'react'
import { Geist } from 'next/font/google'
import { Providers } from '@/components/Providers'

const geist = Geist({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GameVault — Platforma za mini-igre',
  description:
    'Igraj mini-igre online ili lokalno. Tic-Tac-Toe, Poker, Battleships i još mnogo toga. Napravi sobu, pozovi prijatelje, penji se na rang-listi.',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0a0a1a',
  colorScheme: 'dark',
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="bs" className="dark">
      <body className={`${geist.className} app-body`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}
