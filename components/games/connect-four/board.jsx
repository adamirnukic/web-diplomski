'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import styles from './board.module.css'

const ROWS = 6
const COLS = 7

// 0=empty, 1=player1(red), 2=player2(yellow)
function createEmptyBoard() {
  return Array.from({ length: ROWS }, () => Array(COLS).fill(0))
}

function checkWinner(board) {
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]]
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (board[r][c] === 0) continue
      for (const [dr, dc] of directions) {
        const positions = []
        let valid = true
        for (let i = 0; i < 4; i++) {
          const nr = r + dr * i
          const nc = c + dc * i
          if (nr < 0 || nr >= ROWS || nc < 0 || nc >= COLS || board[nr][nc] !== board[r][c]) {
            valid = false
            break
          }
          positions.push([nr, nc])
        }
        if (valid) return { winner: board[r][c], positions }
      }
    }
  }
  return { winner: 0, positions: null }
}

function getLowestRow(board, col) {
  for (let r = ROWS - 1; r >= 0; r--) {
    if (board[r][col] === 0) return r
  }
  return -1
}

export default function ConnectFourBoard({ mode, onGameEnd }) {
  const [board, setBoard] = useState(createEmptyBoard())
  const [currentPlayer, setCurrentPlayer] = useState(1)
  const [scores, setScores] = useState({ 1: 0, 2: 0 })
  const [hoverCol, setHoverCol] = useState(-1)

  const { winner, positions } = checkWinner(board)
  const isDraw = !winner && board[0].every((c) => c !== 0)
  const gameOver = winner !== 0 || isDraw

  const isWinCell = (r, c) =>
    positions?.some(([wr, wc]) => wr === r && wc === c) ?? false

  const drop = useCallback(
    (col) => {
      if (gameOver) return
      const row = getLowestRow(board, col)
      if (row < 0) return
      const newBoard = board.map((r) => [...r])
      newBoard[row][col] = currentPlayer
      setBoard(newBoard)

      const result = checkWinner(newBoard)
      if (result.winner) {
        setScores((s) => ({ ...s, [result.winner]: s[result.winner] + 1 }))
      }
      setCurrentPlayer(currentPlayer === 1 ? 2 : 1)
    },
    [board, currentPlayer, gameOver],
  )

  const reset = () => {
    setBoard(createEmptyBoard())
    setCurrentPlayer(1)
  }

  return (
    <div className={styles.root}>
      {/* Scores */}
      <div className={styles.scoreRow}>
        <div className={cn(
          styles.scoreCard,
          currentPlayer !== 1 && !gameOver && styles.scoreInactive,
        )}>
          <div className={cn(styles.scoreDot, styles.scoreDotCyan, 'neon-glow-cyan')} />
          <span className={styles.scoreValue}>{scores[1]}</span>
        </div>
        <span className={styles.vsText}>VS</span>
        <div className={cn(
          styles.scoreCard,
          currentPlayer !== 2 && !gameOver && styles.scoreInactive,
        )}>
          <div className={cn(styles.scoreDot, styles.scoreDotMagenta, 'neon-glow-magenta')} />
          <span className={styles.scoreValue}>{scores[2]}</span>
        </div>
      </div>

      {/* Status */}
      <p className={cn(
        styles.status,
        winner ? styles.statusWin : styles.statusDefault,
      )}>
        {winner ? `Player ${winner} wins!` : isDraw ? "It's a draw!" : `Player ${currentPlayer}'s turn`}
      </p>

      {/* Board */}
      <div
        className={styles.boardFrame}
        onMouseLeave={() => setHoverCol(-1)}
      >
        <div className={styles.boardGrid}>
          {Array.from({ length: COLS }).map((_, c) => (
            <div key={`indicator-${c}`} className={styles.indicatorCell}>
              {hoverCol === c && !gameOver && (
                <div className={cn(
                  styles.indicatorDot,
                  currentPlayer === 1 ? styles.indicatorCyan : styles.indicatorMagenta,
                )} />
              )}
            </div>
          ))}
          {board.map((row, r) =>
            row.map((cell, c) => (
              <button
                key={`${r}-${c}`}
                onClick={() => drop(c)}
                onMouseEnter={() => setHoverCol(c)}
                disabled={gameOver || getLowestRow(board, c) < 0}
                className={cn(
                  styles.cell,
                  cell === 0 ? styles.cellEmpty : styles.cellFilled,
                  isWinCell(r, c) && styles.cellWin,
                )}
                aria-label={`Row ${r + 1}, Column ${c + 1}`}
              >
                {cell === 1 && (
                  <div className={cn(styles.disc, styles.discCyan, 'neon-glow-cyan')} />
                )}
                {cell === 2 && (
                  <div className={cn(styles.disc, styles.discMagenta, 'neon-glow-magenta')} />
                )}
              </button>
            )),
          )}
        </div>
      </div>

      {gameOver && (
        <Button onClick={reset} className={styles.resetButton}>
          <RotateCcw size={16} />
          Play Again
        </Button>
      )}
    </div>
  )
}
