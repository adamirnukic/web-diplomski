'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { RotateCcw, Flag, Bomb } from 'lucide-react'
import styles from './board.module.css'
const DIFFICULTIES = {
  easy: { rows: 9, cols: 9, mines: 10 },
  medium: { rows: 12, cols: 12, mines: 30 },
  hard: { rows: 16, cols: 16, mines: 50 },
}

function createBoard(rows, cols, mines, firstR, firstC) {
  const board = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => ({
      isMine: false,
      isRevealed: false,
      isFlagged: false,
      adjacentMines: 0,
    })),
  )

  // Place mines
  let placed = 0
  while (placed < mines) {
    const r = Math.floor(Math.random() * rows)
    const c = Math.floor(Math.random() * cols)
    if (board[r][c].isMine) continue
    if (firstR !== undefined && Math.abs(r - firstR) <= 1 && Math.abs(c - (firstC ?? 0)) <= 1) continue
    board[r][c].isMine = true
    placed++
  }

  // Count adjacent
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].isMine) continue
      let count = 0
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr, nc = c + dc
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].isMine) count++
        }
      }
      board[r][c].adjacentMines = count
    }
  }

  return board
}

const NUMBER_COLORS = {
  1: styles.num1,
  2: styles.num2,
  3: styles.num3,
  4: styles.num4,
  5: styles.num5,
  6: styles.num6,
  7: styles.num7,
  8: styles.num8,
}

export default function MinesweeperBoard({ mode, onGameEnd }) {
  const [difficulty, setDifficulty] = useState('easy')
  const { rows, cols, mines } = DIFFICULTIES[difficulty]
  const [board, setBoard] = useState(() => createBoard(rows, cols, mines))
  const [gameState, setGameState] = useState('playing')
  const [firstClick, setFirstClick] = useState(true)
  const [flagMode, setFlagMode] = useState(false)

  const flagCount = board.flat().filter((c) => c.isFlagged).length
  const revealedCount = board.flat().filter((c) => c.isRevealed).length
  const totalSafe = rows * cols - mines

  const reveal = useCallback(
    (r, c, currentBoard) => {
      if (r < 0 || r >= rows || c < 0 || c >= cols) return currentBoard
      if (currentBoard[r][c].isRevealed || currentBoard[r][c].isFlagged) return currentBoard

      const newBoard = currentBoard.map((row) => row.map((cell) => ({ ...cell })))
      newBoard[r][c].isRevealed = true

      if (newBoard[r][c].adjacentMines === 0 && !newBoard[r][c].isMine) {
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue
            const result = reveal(r + dr, c + dc, newBoard)
            for (let i = 0; i < rows; i++) {
              for (let j = 0; j < cols; j++) {
                newBoard[i][j] = result[i][j]
              }
            }
          }
        }
      }
      return newBoard
    },
    [rows, cols],
  )

  const handleClick = (r, c) => {
    if (gameState !== 'playing') return
    const cell = board[r][c]
    if (cell.isRevealed) return

    if (flagMode) {
      const newBoard = board.map((row) => row.map((c) => ({ ...c })))
      newBoard[r][c].isFlagged = !newBoard[r][c].isFlagged
      setBoard(newBoard)
      return
    }

    if (cell.isFlagged) return

    let currentBoard = board
    if (firstClick) {
      currentBoard = createBoard(rows, cols, mines, r, c)
      setFirstClick(false)
    }

    if (currentBoard[r][c].isMine) {
      const newBoard = currentBoard.map((row) =>
        row.map((c) => (c.isMine ? { ...c, isRevealed: true } : c)),
      )
      setBoard(newBoard)
      setGameState('lost')
      return
    }

    const newBoard = reveal(r, c, currentBoard)
    setBoard(newBoard)

    const newRevealed = newBoard.flat().filter((c) => c.isRevealed).length
    if (newRevealed >= totalSafe) {
      setGameState('won')
    }
  }

  const handleContextMenu = (e, r, c) => {
    e.preventDefault()
    if (gameState !== 'playing' || board[r][c].isRevealed) return
    const newBoard = board.map((row) => row.map((c) => ({ ...c })))
    newBoard[r][c].isFlagged = !newBoard[r][c].isFlagged
    setBoard(newBoard)
  }

  const reset = (diff) => {
    const d = diff ?? difficulty
    if (diff) setDifficulty(diff)
    const { rows: r, cols: c, mines: m } = DIFFICULTIES[d]
    setBoard(createBoard(r, c, m))
    setGameState('playing')
    setFirstClick(true)
    setFlagMode(false)
  }

  return (
    <div className={styles.root}>
      {/* Difficulty selector */}
      <div className={styles.difficultyRow}>
        {['easy', 'medium', 'hard'].map((d) => (
          <button
            key={d}
            onClick={() => reset(d)}
            className={cn(
              styles.difficultyButton,
              difficulty === d
                ? styles.difficultyActive
                : styles.difficultyInactive,
            )}
          >
            {d}
          </button>
        ))}
      </div>

      {/* Status bar */}
      <div className={styles.statusRow}>
        <div className={styles.statusInfo}>
          <Bomb className={cn(styles.iconSmall, styles.iconMagenta)} />
          <span className={cn('font-mono', 'text-foreground')}>{mines - flagCount}</span>
        </div>
        <p className={cn(
          styles.statusText,
          gameState === 'won'
            ? styles.statusWin
            : gameState === 'lost'
              ? styles.statusLose
              : styles.statusDefault,
        )}>
          {gameState === 'won' ? 'You win!' : gameState === 'lost' ? 'Game over!' : 'Click to reveal'}
        </p>
        <button
          onClick={() => setFlagMode(!flagMode)}
          className={cn(
            styles.flagButton,
            flagMode ? styles.flagActive : styles.flagInactive,
          )}
        >
          <Flag className={styles.iconTiny} />
          Flag
        </button>
      </div>

      {/* Board */}
      <div className={styles.boardFrame}>
        <div
          className={styles.boardGrid}
          style={{ gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))` }}
        >
          {board.map((row, r) =>
            row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => handleClick(r, c)}
                onContextMenu={(e) => handleContextMenu(e, r, c)}
                disabled={cell.isRevealed || gameState !== 'playing'}
                className={cn(
                  styles.cell,
                  cell.isRevealed
                    ? cell.isMine
                      ? styles.cellMine
                      : styles.cellRevealed
                    : styles.cellHidden,
                  !cell.isRevealed && styles.cellBorder,
                )}
                aria-label={`Row ${r + 1}, Col ${c + 1}`}
              >
                {cell.isFlagged && !cell.isRevealed && (
                  <Flag className={cn(styles.iconTiny, styles.iconMagenta)} />
                )}
                {cell.isRevealed && cell.isMine && (
                  <Bomb className={styles.iconTiny} />
                )}
                {cell.isRevealed && !cell.isMine && cell.adjacentMines > 0 && (
                  <span className={NUMBER_COLORS[cell.adjacentMines]}>
                    {cell.adjacentMines}
                  </span>
                )}
              </button>
            )),
          )}
        </div>
      </div>

      {gameState !== 'playing' && (
        <Button onClick={() => reset()} className={styles.resetButton}>
          <RotateCcw size={16} />
          Play Again
        </Button>
      )}
    </div>
  )
}
