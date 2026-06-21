'use client'

import { useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import styles from './board.module.css'
function checkWinner(board) {
  const lines = [
    [0, 1, 2], [3, 4, 5], [6, 7, 8],
    [0, 3, 6], [1, 4, 7], [2, 5, 8],
    [0, 4, 8], [2, 4, 6],
  ]
  for (const [a, b, c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a], line: [a, b, c] }
    }
  }
  return { winner: null, line: null }
}

export default function TicTacToeBoard({ mode, onGameEnd }) {
  const [board, setBoard] = useState(Array(9).fill(null))
  const [isXTurn, setIsXTurn] = useState(true)
  const [scores, setScores] = useState({ X: 0, O: 0 })

  const { winner, line } = checkWinner(board)
  const isDraw = !winner && board.every((c) => c !== null)
  const gameOver = !!winner || isDraw

  const handleClick = useCallback(
    (index) => {
      if (board[index] || gameOver) return
      const newBoard = [...board]
      newBoard[index] = isXTurn ? 'X' : 'O'
      setBoard(newBoard)
      setIsXTurn(!isXTurn)
    },
    [board, isXTurn, gameOver],
  )

  useEffect(() => {
    if (winner) {
      setScores((prev) => ({ ...prev, [winner]: prev[winner] + 1 }))
    }
  }, [winner])

  const reset = () => {
    setBoard(Array(9).fill(null))
    setIsXTurn(true)
  }

  const statusText = gameOver
    ? winner
      ? `Player ${winner} wins!`
      : "It's a draw!"
    : `Player ${isXTurn ? 'X' : 'O'}'s turn`

  return (
    <div className={styles.root}>
      {/* Scoreboard */}
      <div className={styles.scoreRow}>
        <div className={cn(
          styles.scoreCard,
          !isXTurn && !gameOver && styles.scoreInactive,
        )}>
          <span className={cn(styles.scoreLetter, 'neon-text-cyan')}>X</span>
          <span className={styles.scoreValue}>{scores.X}</span>
        </div>
        <span className={styles.vsText}>VS</span>
        <div className={cn(
          styles.scoreCard,
          isXTurn && !gameOver && styles.scoreInactive,
        )}>
          <span className={cn(styles.scoreLetter, 'neon-text-magenta')}>O</span>
          <span className={styles.scoreValue}>{scores.O}</span>
        </div>
      </div>

      {/* Status */}
      <p className={cn(
        styles.status,
        winner ? styles.statusWin : isDraw ? styles.statusDraw : styles.statusDefault,
      )}>
        {statusText}
      </p>

      {/* Board */}
      <div className={styles.boardGrid}>
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => handleClick(i)}
            disabled={!!cell || gameOver}
            className={cn(
              styles.cell,
              cell ? styles.cellFilled : styles.cellEmpty,
              line?.includes(i) && styles.cellWin,
              line?.includes(i) && 'neon-glow-green',
            )}
            aria-label={`Cell ${i + 1}, ${cell || 'empty'}`}
          >
            {cell === 'X' && (
              <span className="neon-text-cyan">X</span>
            )}
            {cell === 'O' && (
              <span className="neon-text-magenta">O</span>
            )}
          </button>
        ))}
      </div>

      {/* Reset */}
      {gameOver && (
        <Button onClick={reset} className={styles.resetButton}>
          <RotateCcw size={16} />
          Play Again
        </Button>
      )}
    </div>
  )
}
