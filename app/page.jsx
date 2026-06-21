import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { GAMES } from '@/lib/games/registry'
import { Gamepad2, Zap, Users, Trophy, ArrowRight } from 'lucide-react'
import styles from './page.module.css'

export default function LandingPage() {
	const featuredGames = GAMES.slice(0, 6)

	return (
		<div className={styles.page}>
			{/* Nav */}
			<nav className={styles.navbar}>
				<div className={`container ${styles.navInner}`}>
					<div className={styles.brand}>
						<div className={`${styles.logo} neon-glow-cyan`}>
							<Gamepad2 className={styles.logoIcon} />
						</div>
						<span className={styles.brandText}>
							Game<span className="neon-text-cyan">Vault</span>
						</span>
					</div>
					<div className={styles.navActions}>
						<Link href="/auth/login">
							<Button variant="ghost" size="sm">
								Log In
							</Button>
						</Link>
						<Link href="/auth/sign-up">
							<Button size="sm" className="neon-glow-cyan">
								Sign Up Free
							</Button>
						</Link>
					</div>
				</div>
			</nav>

			{/* Hero */}
			<section className={styles.hero}>
				<div className="bg-grid-pattern" aria-hidden="true" />
				<div className={styles.heroInner}>
					<div className={styles.heroPill}>
						<Zap className={styles.heroPillIcon} />
						12 games and counting
					</div>
					<h1 className={styles.heroTitle}>
						Your arena for{' '}
						<span className="neon-text-cyan">multiplayer</span>{' '}
						mini-games
					</h1>
					<p className={styles.heroDescription}>
						Play Battleships, Poker, Tic-Tac-Toe and 9 more games. Challenge
						friends online with room codes or play locally on the same device.
					</p>
					<div className={styles.heroActions}>
						<Link href="/auth/sign-up">
							<Button
								size="lg"
								className="neon-glow-cyan animate-pulse-glow"
							>
								Start Playing
								<ArrowRight className={styles.actionIcon} />
							</Button>
						</Link>
						<Link href="/dashboard">
							<Button size="lg" variant="outline">
								Browse Games
							</Button>
						</Link>
					</div>
				</div>
			</section>

			{/* Features */}
			<section className={styles.features}>
				<div className={styles.featureGrid}>
					{[
						{
							icon: Users,
							title: 'Online Rooms',
							description:
								'Create a room, share the 6-digit code, and play with anyone in real-time.',
							color: 'text-neon-cyan',
							bg: 'bg-neon-cyan-10',
						},
						{
							icon: Gamepad2,
							title: 'Local Play',
							description:
								'Every game has a local mode. Play on the same device with friends next to you.',
							color: 'text-neon-magenta',
							bg: 'bg-neon-magenta-10',
						},
						{
							icon: Trophy,
							title: 'Leaderboard & XP',
							description:
								'Earn XP for every match. Level up, track stats, and climb the leaderboard.',
							color: 'text-neon-green',
							bg: 'bg-neon-green-10',
						},
					].map((feature) => (
						<div key={feature.title} className={styles.featureCard}>
							<div className={`${styles.featureIcon} ${feature.bg}`}>
								<feature.icon
									className={`${styles.featureIconSvg} ${feature.color}`}
								/>
							</div>
							<h3 className={styles.featureTitle}>{feature.title}</h3>
							<p className={styles.featureDescription}>
								{feature.description}
							</p>
						</div>
					))}
				</div>
			</section>

			{/* Game Preview Grid */}
			<section className={styles.preview}>
				<div className="container">
					<div className={styles.previewHeader}>
						<h2 className={styles.previewTitle}>12 Games Ready to Play</h2>
						<p className={styles.previewSubtitle}>
							From strategy classics to fast-paced card games
						</p>
					</div>
					<div className={styles.previewGrid}>
						{featuredGames.map((game) => {
							const Icon = game.icon
							const colorClass =
								game.color === 'cyan'
									? 'neon-cyan'
									: game.color === 'magenta'
									? 'neon-magenta'
									: game.color === 'green'
									? 'neon-green'
									: 'neon-purple'
							return (
								<div key={game.id} className={styles.previewCard}>
									<div className={`${styles.previewIcon} ${colorClass}`}>
										<Icon className={styles.previewIconSvg} />
									</div>
									<div>
										<h3 className={styles.previewCardTitle}>{game.name}</h3>
										<p className={styles.previewCardDescription}>
											{game.description}
										</p>
									</div>
								</div>
							)
						})}
					</div>
					<div className={styles.previewFooter}>
						<Link href="/dashboard">
							<Button variant="outline">
								View All 12 Games
								<ArrowRight className={styles.actionIcon} />
							</Button>
						</Link>
					</div>
				</div>
			</section>

			{/* Footer */}
			<footer className={styles.footer}>
				<div className={`container ${styles.footerInner}`}>
					<div className={styles.footerBrand}>
						<Gamepad2 className={styles.footerIcon} />
						GameVault
					</div>
					<p className={styles.footerNote}>
						Built with Next.js, Supabase & shadcn/ui
					</p>
				</div>
			</footer>
		</div>
	)
}
