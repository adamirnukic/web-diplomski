import Link from 'next/link'
import { Gamepad2, Globe, Monitor, Trophy, ArrowRight, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { GAMES } from '@/lib/games-catalog'
import styles from './page.module.css'

const FEATURES = [
  {
    icon: Globe,
    title: 'Online sobe',
    text: 'Napravi sobu, podijeli 6-znakovni kod i igraj s bilo kim u stvarnom vremenu.',
    color: 'text-neon-cyan',
  },
  {
    icon: Monitor,
    title: 'Lokalna igra',
    text: 'Svaka igra ima i lokalni mod — igrajte na istom uređaju, jedan pored drugog.',
    color: 'text-neon-magenta',
  },
  {
    icon: Trophy,
    title: 'Statistika i XP',
    text: 'Skupljaj XP za svaki meč, prati pobjede i penji se na rang-listi.',
    color: 'text-neon-green',
  },
]

export default function LandingPage() {
  const playable = GAMES.filter((g) => g.implemented).length

  return (
    <div className={styles.page}>
      <nav className={styles.nav}>
        <div className={`container ${styles.navInner}`}>
          <div className={styles.brand}>
            <span className={`${styles.logo} neon-glow-cyan`}>
              <Gamepad2 size={20} />
            </span>
            <span className={styles.brandText}>
              Game<span className="neon-text-cyan">Vault</span>
            </span>
          </div>
          <div className={styles.navActions}>
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Prijava
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm" className="neon-glow-cyan">
                Registruj se
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      <section className={styles.hero}>
        <div className="bg-grid-pattern" aria-hidden="true" />
        <div className={styles.heroInner}>
          <div className={styles.pill}>
            <Zap size={14} /> {GAMES.length} igara · {playable} već igrivo
          </div>
          <h1 className={styles.heroTitle}>
            Tvoja arena za <span className="neon-text-cyan">multiplayer</span>{' '}
            mini-igre
          </h1>
          <p className={styles.heroText}>
            Igraj Tic-Tac-Toe, Poker, Battleships, Yahtzee i još 8 igara.
            Izazovi prijatelje online preko koda sobe ili igraj lokalno.
          </p>
          <div className={styles.heroActions}>
            <Link href="/register">
              <Button size="lg" className="neon-glow-cyan animate-pulse-glow">
                Počni igrati <ArrowRight size={18} />
              </Button>
            </Link>
            <Link href="/games">
              <Button size="lg" variant="outline">
                Pogledaj igre
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <section className={`container ${styles.features}`}>
        {FEATURES.map((f) => (
          <div key={f.title} className={styles.featureCard}>
            <f.icon className={f.color} size={28} />
            <h3 className={styles.featureTitle}>{f.title}</h3>
            <p className={styles.featureText}>{f.text}</p>
          </div>
        ))}
      </section>

      <footer className={styles.footer}>
        <div className={`container ${styles.footerInner}`}>
          <span className={styles.footerBrand}>
            <Gamepad2 size={18} /> GameVault
          </span>
          <span className={styles.footerNote}>
            Napravljeno s Next.js, Socket.IO i node:sqlite
          </span>
        </div>
      </footer>
    </div>
  )
}
