import { type Card, SUIT_SYMBOL, isRed } from '@shared/games/_cards'
import { cn } from '@/lib/utils'
import styles from './card.module.css'

export function PlayingCard({
  card,
  hidden,
  small,
}: {
  card?: Card | null
  hidden?: boolean
  small?: boolean
}) {
  if (hidden || !card) {
    return (
      <div className={cn(styles.card, styles.back, small && styles.small)}>
        <span className={styles.backMark}>◆</span>
      </div>
    )
  }
  return (
    <div
      className={cn(
        styles.card,
        isRed(card) ? styles.red : styles.black,
        small && styles.small,
      )}
    >
      <span className={styles.rank}>{card.rank}</span>
      <span className={styles.suit}>{SUIT_SYMBOL[card.suit]}</span>
    </div>
  )
}
