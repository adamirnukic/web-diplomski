import Link from 'next/link'
import { Button } from '@/components/ui/button'
import styles from './not-found.module.css'

export default function NotFound() {
  return (
    <div className={styles.wrap}>
      <h1 className={styles.code}>404</h1>
      <p className={styles.text}>Ova stranica ne postoji.</p>
      <Link href="/">
        <Button className="neon-glow-cyan">Nazad na početnu</Button>
      </Link>
    </div>
  )
}
