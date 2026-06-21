import { Geist } from 'next/font/google'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'

const geist = Geist({ subsets: ['latin'] })

export const metadata = {
  title: 'GameVault - Multiplayer Mini-Games Platform',
  description:
    'Play 12+ mini-games online or locally. Battleships, Poker, Blackjack, Tic-Tac-Toe and more. Create rooms, challenge friends, climb the leaderboard.',
  generator: 'v0.app',
  icons: {
    icon: [
      {
        url: '/icon-light-32x32.png',
        media: '(prefers-color-scheme: light)',
      },
      {
        url: '/icon-dark-32x32.png',
        media: '(prefers-color-scheme: dark)',
      },
      {
        url: '/icon.svg',
        type: 'image/svg+xml',
      },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport = {
  themeColor: '#0a0a1a',
  colorScheme: 'dark',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" className="dark">
      <body className={`${geist.className} app-body`}>
        {children}
        <Analytics />
      </body>
    </html>
  )
}
