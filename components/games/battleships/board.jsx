'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import styles from './board.module.css'

const BOARD_SIZE = 10
const SHIPS = [
  { name: 'Carrier', size: 5 },
  { name: 'Battleship', size: 4 },
  { name: 'Cruiser', size: 3 },
  { name: 'Submarine', size: 3 },
  { name: 'Destroyer', size: 2 },
]

function createEmptyGrid() {
  return Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill('empty'))
}

function placeShipsRandomly() {
  const grid = createEmptyGrid()
  for (const ship of SHIPS) {
    let placed = false
    while (!placed) {
      const horizontal = Math.random() > 0.5
      const r = Math.floor(Math.random() * BOARD_SIZE)
      const c = Math.floor(Math.random() * BOARD_SIZE)
      let valid = true
      const positions = []
      for (let i = 0; i < ship.size; i++) {
        const nr = horizontal ? r : r + i
        const nc = horizontal ? c + i : c
        if (nr >= BOARD_SIZE || nc >= BOARD_SIZE || grid[nr][nc] === 'ship') {
          valid = false
          break
        }
        positions.push([nr, nc])
      }
      if (valid) {
        for (const [pr, pc] of positions) grid[pr][pc] = 'ship'
        placed = true
      }
    }
  }
  return grid
}

function countShips(grid) {
  return grid.flat().filter((c) => c === 'ship').length
}

export default function BattleshipsBoard({ mode, onGameEnd }) {
  const [phase, setPhase] = useState('setup')
  const [p1Ships, setP1Ships] = useState(createEmptyGrid())
  const [p2Ships, setP2Ships] = useState(createEmptyGrid())
  const [p1Shots, setP1Shots] = useState(createEmptyGrid())
  const [p2Shots, setP2Shots] = useState(createEmptyGrid())
  const [winner, setWinner] = useState(null)
  const [transitioning, setTransitioning] = useState(false)

  const startGame = () => {
    setP1Ships(placeShipsRandomly())
    setP2Ships(placeShipsRandomly())
    setP1Shots(createEmptyGrid())
    setP2Shots(createEmptyGrid())
    setPhase('p1-turn')
    setWinner(null)
  }

  const shoot = useCallback(
    (r, c) => {
      if (transitioning) return

      if (phase === 'p1-turn') {
        if (p1Shots[r][c] !== 'empty') return
        const newShots = p1Shots.map((row) => [...row])
        newShots[r][c] = p2Ships[r][c] === 'ship' ? 'hit' : 'miss'
        setP1Shots(newShots)

        // Check win
        const hitsNeeded = countShips(p2Ships)
        const totalHits = newShots.flat().filter((c) => c === 'hit').length
        if (totalHits >= hitsNeeded) {
          setWinner(1)
          setPhase('over')
          return
        }
        setTransitioning(true)
        setTimeout(() => {
          setPhase('p2-turn')
          setTransitioning(false)
        }, 1500)
      } else if (phase === 'p2-turn') {
        if (p2Shots[r][c] !== 'empty') return
        const newShots = p2Shots.map((row) => [...row])
        newShots[r][c] = p1Ships[r][c] === 'ship' ? 'hit' : 'miss'
        setP2Shots(newShots)

        const hitsNeeded = countShips(p1Ships)
        const totalHits = newShots.flat().filter((c) => c === 'hit').length
        if (totalHits >= hitsNeeded) {
          setWinner(2)
          setPhase('over')
          return
        }
        setTransitioning(true)
        setTimeout(() => {
          setPhase('p1-turn')
          setTransitioning(false)
        }, 1500)
      }
    },
    [phase, p1Shots, p2Shots, p1Ships, p2Ships, transitioning],
  )

  const reset = () => {
    setPhase('setup')
    setP1Ships(createEmptyGrid())
    setP2Ships(createEmptyGrid())
    setP1Shots(createEmptyGrid())
    setP2Shots(createEmptyGrid())
    setWinner(null)
  }

  const renderGrid = (shots, ships, showShips, interactive) => (
    <div className={styles.gridFrame}>
      <div className={styles.grid}>
        {Array.from({ length: BOARD_SIZE }).map((_, r) =>
          Array.from({ length: BOARD_SIZE }).map((_, c) => {
            const shot = shots[r][c]
            const isShip = ships[r][c] === 'ship'
            return (
              <button
                key={`${r}-${c}`}
                onClick={() => interactive && shoot(r, c)}
                disabled={!interactive || shot !== 'empty'}
                className={cn(
                  styles.cell,
                  shot === 'hit'
                    ? styles.cellHit
                    : shot === 'miss'
                      ? styles.cellMiss
                      : showShips && isShip
                        ? styles.cellShip
                        : styles.cellEmpty,
                  interactive && shot === 'empty' && styles.cellInteractive,
                )}
              >
                {shot === 'hit' && 'X'}
                {shot === 'miss' && '·'}
              </button>
            )
          }),
        )}
      </div>
    </div>
  )

  if (phase === 'setup') {
    return (
      <div className={styles.root}>
        <h2 className={styles.title}>Battleships</h2>
        <p className={styles.subtitle}>
          Ships will be placed randomly for both players.
        </p>
        <Button onClick={startGame} className="neon-glow-cyan">
          Start Battle
        </Button>
      </div>
    )
  }

  const isP1Turn = phase === 'p1-turn'
  const currentShots = isP1Turn ? p1Shots : p2Shots
  const ownShips = isP1Turn ? p1Ships : p2Ships
  const opponentShots = isP1Turn ? p2Shots : p1Shots

  return (
    <div className={styles.root}>
      {/* Status */}
      <p className={cn(
        styles.status,
        phase === 'over' ? styles.statusWin : styles.statusDefault,
      )}>
        {phase === 'over'
          ? `Player ${winner} wins!`
          : transitioning
            ? 'Switching turns...'
            : `Player ${isP1Turn ? '1' : '2'}'s turn - Fire!`}
      </p>

      <div className={styles.boards}>
        {/* Attack grid */}
        <div className={styles.boardGroup}>
          <span className={cn(styles.boardLabel, 'text-neon-magenta')}>Enemy Waters</span>
          {renderGrid(
            currentShots,
            isP1Turn ? p2Ships : p1Ships,
            false,
            !transitioning && phase !== 'over',
          )}
        </div>

        {/* Own grid */}
        <div className={styles.boardGroup}>
          <span className={cn(styles.boardLabel, 'text-neon-cyan')}>Your Fleet</span>
          {renderGrid(opponentShots, ownShips, true, false)}
        </div>
      </div>

      {phase === 'over' && (
        <Button onClick={reset} className={styles.resetButton}>
          <RotateCcw size={16} />
          Play Again
        </Button>
      )}
    </div>
  )
}
