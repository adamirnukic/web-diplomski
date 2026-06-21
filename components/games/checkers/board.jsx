'use client'

import { useState, useCallback } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import styles from './board.module.css'
// r=red, R=red-king, b=black, B=black-king
const INITIAL_BOARD = () => {
  const board = Array.from({ length: 8 }, () => Array(8).fill(null))
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 8; c++)
      if ((r + c) % 2 === 1) board[r][c] = 'b'
  for (let r = 5; r < 8; r++)
    for (let c = 0; c < 8; c++)
      if ((r + c) % 2 === 1) board[r][c] = 'r'
  return board
}

function isPlayerPiece(piece, player) {
  if (!piece) return false
  return player === 'red' ? (piece === 'r' || piece === 'R') : (piece === 'b' || piece === 'B')
}

function isKing(piece) {
  return piece === 'R' || piece === 'B'
}

function getValidMoves(board, r, c) {
  const piece = board[r][c]
  if (!piece) return []

  const moves = []
  const isRed = piece === 'r' || piece === 'R'
  const dirs = isKing(piece) ? [-1, 1] : isRed ? [-1] : [1]

  for (const dr of dirs) {
    for (const dc of [-1, 1]) {
      const nr = r + dr, nc = c + dc
      if (nr < 0 || nr >= 8 || nc < 0 || nc >= 8) continue

      if (board[nr][nc] === null) {
        moves.push({ to: [nr, nc], captures: [] })
      } else {
        const opponent = isRed
          ? (board[nr][nc] === 'b' || board[nr][nc] === 'B')
          : (board[nr][nc] === 'r' || board[nr][nc] === 'R')
        if (opponent) {
          const jr = nr + dr, jc = nc + dc
          if (jr >= 0 && jr < 8 && jc >= 0 && jc < 8 && board[jr][jc] === null) {
            moves.push({ to: [jr, jc], captures: [[nr, nc]] })
          }
        }
      }
    }
  }
  return moves
}

export default function CheckersBoard({ mode, onGameEnd }) {
  const [board, setBoard] = useState(INITIAL_BOARD())
  const [currentPlayer, setCurrentPlayer] = useState('red')
  const [selected, setSelected] = useState(null)
  const [validMoves, setValidMoves] = useState([])
  const [scores, setScores] = useState({ red: 12, black: 12 })

  const redCount = board.flat().filter((p) => p === 'r' || p === 'R').length
  const blackCount = board.flat().filter((p) => p === 'b' || p === 'B').length
  const gameOver = redCount === 0 || blackCount === 0

  const handleCellClick = useCallback(
    (r, c) => {
      if (gameOver) return
      const piece = board[r][c]

      if (selected) {
        const move = validMoves.find(
          (m) => m.to[0] === r && m.to[1] === c,
        )
        if (move) {
          const newBoard = board.map((row) => [...row])
          newBoard[r][c] = newBoard[selected[0]][selected[1]]
          newBoard[selected[0]][selected[1]] = null
          for (const [cr, cc] of move.captures) {
            newBoard[cr][cc] = null
          }
          // King promotion
          if (r === 0 && newBoard[r][c] === 'r') newBoard[r][c] = 'R'
          if (r === 7 && newBoard[r][c] === 'b') newBoard[r][c] = 'B'

          setBoard(newBoard)
          setSelected(null)
          setValidMoves([])
          setCurrentPlayer(currentPlayer === 'red' ? 'black' : 'red')
          return
        }
      }

      if (isPlayerPiece(piece, currentPlayer)) {
        setSelected([r, c])
        setValidMoves(getValidMoves(board, r, c))
      } else {
        setSelected(null)
        setValidMoves([])
      }
    },
    [board, selected, validMoves, currentPlayer, gameOver],
  )

  const isValidTarget = (r, c) =>
    validMoves.some((m) => m.to[0] === r && m.to[1] === c)

  const reset = () => {
    setBoard(INITIAL_BOARD())
    setCurrentPlayer('red')
    setSelected(null)
    setValidMoves([])
  }

  return (
    <div className={styles.root}>
      {/* Scores */}
      <div className={styles.scoreRow}>
        <div className={cn(
          styles.scoreCard,
          currentPlayer !== 'red' && !gameOver && styles.scoreInactive,
        )}>
          <div className={cn(styles.scoreDot, styles.scoreDotRed)} />
          <span className={styles.scoreValue}>{redCount}</span>
        </div>
        <span className={styles.vsText}>VS</span>
        <div className={cn(
          styles.scoreCard,
          currentPlayer !== 'black' && !gameOver && styles.scoreInactive,
        )}>
          <div className={cn(styles.scoreDot, styles.scoreDotBlack)} />
          <span className={styles.scoreValue}>{blackCount}</span>
        </div>
      </div>

      {/* Status */}
      <p className={cn(
        styles.status,
        gameOver ? styles.statusWin : styles.statusDefault,
      )}>
        {gameOver
          ? `${redCount === 0 ? 'Black' : 'Red'} wins!`
          : `${currentPlayer === 'red' ? 'Red' : 'Black'}'s turn`}
      </p>

      {/* Board */}
      <div className={styles.boardFrame}>
        <div className={styles.boardGrid}>
          {board.map((row, r) =>
            row.map((cell, c) => {
              const isDark = (r + c) % 2 === 1
              const isSelected = selected?.[0] === r && selected?.[1] === c
              const isTarget = isValidTarget(r, c)
              return (
                <button
                  key={`${r}-${c}`}
                  onClick={() => handleCellClick(r, c)}
                  className={cn(
                    styles.cell,
                    isDark ? styles.cellDark : styles.cellLight,
                    isSelected && styles.cellSelected,
                    isTarget && styles.cellTarget,
                  )}
                  aria-label={`Row ${r + 1}, Col ${c + 1}, ${cell || 'empty'}`}
                >
                  {cell && (
                    <div
                      className={cn(
                        styles.piece,
                        (cell === 'r' || cell === 'R')
                          ? styles.pieceRed
                          : styles.pieceBlack,
                        isSelected && styles.pieceSelected,
                      )}
                    >
                      {isKing(cell) && (
                        <div className={styles.kingBadge}>
                          K
                        </div>
                      )}
                    </div>
                  )}
                  {!cell && isTarget && (
                    <div className={styles.targetDot} />
                  )}
                </button>
              )
            }),
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
