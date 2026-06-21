'use client'

import { useState, useCallback, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { RotateCcw } from 'lucide-react'
import styles from './game.module.css'
const QUESTIONS = [
  { question: "What planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correct: 1, category: "Science" },
  { question: "Which element has the chemical symbol 'O'?", options: ["Gold", "Osmium", "Oxygen", "Oganesson"], correct: 2, category: "Science" },
  { question: "What is the capital of Japan?", options: ["Seoul", "Beijing", "Tokyo", "Bangkok"], correct: 2, category: "Geography" },
  { question: "Who painted the Mona Lisa?", options: ["Michelangelo", "Da Vinci", "Raphael", "Donatello"], correct: 1, category: "History" },
  { question: "What is the largest ocean on Earth?", options: ["Atlantic", "Indian", "Arctic", "Pacific"], correct: 3, category: "Geography" },
  { question: "What gas do plants absorb from the atmosphere?", options: ["Oxygen", "Nitrogen", "CO2", "Hydrogen"], correct: 2, category: "Science" },
  { question: "In what year did World War II end?", options: ["1943", "1944", "1945", "1946"], correct: 2, category: "History" },
  { question: "What is the smallest country in the world?", options: ["Monaco", "Vatican City", "San Marino", "Liechtenstein"], correct: 1, category: "Geography" },
  { question: "What is the hardest natural substance?", options: ["Gold", "Iron", "Diamond", "Platinum"], correct: 2, category: "Science" },
  { question: "Who wrote 'Romeo and Juliet'?", options: ["Dickens", "Shakespeare", "Austen", "Twain"], correct: 1, category: "History" },
  { question: "What is the speed of light approximately?", options: ["300k km/s", "150k km/s", "500k km/s", "100k km/s"], correct: 0, category: "Science" },
  { question: "Which continent is the Sahara Desert on?", options: ["Asia", "Africa", "Australia", "S. America"], correct: 1, category: "Geography" },
  { question: "What is the largest mammal?", options: ["Elephant", "Blue Whale", "Giraffe", "Hippo"], correct: 1, category: "Science" },
  { question: "Who discovered penicillin?", options: ["Pasteur", "Fleming", "Curie", "Darwin"], correct: 1, category: "Science" },
  { question: "What is the capital of Australia?", options: ["Sydney", "Melbourne", "Canberra", "Perth"], correct: 2, category: "Geography" },
  { question: "Which planet has the most moons?", options: ["Jupiter", "Saturn", "Uranus", "Neptune"], correct: 1, category: "Science" },
  { question: "What year was the first iPhone released?", options: ["2005", "2006", "2007", "2008"], correct: 2, category: "History" },
  { question: "What is the longest river in the world?", options: ["Amazon", "Nile", "Mississippi", "Yangtze"], correct: 1, category: "Geography" },
  { question: "What element does 'Fe' represent?", options: ["Fluorine", "Iron", "Fermium", "Francium"], correct: 1, category: "Science" },
  { question: "Who was the first person to walk on the Moon?", options: ["Buzz Aldrin", "Neil Armstrong", "John Glenn", "Yuri Gagarin"], correct: 1, category: "History" },
  { question: "What is the boiling point of water in Celsius?", options: ["90", "100", "110", "120"], correct: 1, category: "Science" },
  { question: "Which country is known as the Land of the Rising Sun?", options: ["China", "Japan", "Korea", "Thailand"], correct: 1, category: "Geography" },
  { question: "What is the square root of 144?", options: ["10", "11", "12", "13"], correct: 2, category: "Science" },
  { question: "Who invented the telephone?", options: ["Edison", "Bell", "Tesla", "Marconi"], correct: 1, category: "History" },
  { question: "What is the chemical formula for water?", options: ["H2O", "CO2", "NaCl", "O2"], correct: 0, category: "Science" },
]

function shuffleArray(arr) {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

const TOTAL_QUESTIONS = 10

export default function QuizGame({ mode, onGameEnd }) {
  const [questions, setQuestions] = useState([])
  const [currentIndex, setCurrentIndex] = useState(0)
  const [scores, setScores] = useState({ 1: 0, 2: 0 })
  const [currentPlayer, setCurrentPlayer] = useState(1)
  const [selected, setSelected] = useState(null)
  const [showResult, setShowResult] = useState(false)
  const [gameStarted, setGameStarted] = useState(false)

  const startGame = () => {
    setQuestions(shuffleArray(QUESTIONS).slice(0, TOTAL_QUESTIONS))
    setCurrentIndex(0)
    setScores({ 1: 0, 2: 0 })
    setCurrentPlayer(1)
    setSelected(null)
    setShowResult(false)
    setGameStarted(true)
  }

  const gameOver = currentIndex >= TOTAL_QUESTIONS && gameStarted

  const handleAnswer = (optionIndex) => {
    if (showResult) return
    setSelected(optionIndex)
    setShowResult(true)

    const isCorrect = optionIndex === questions[currentIndex].correct
    if (isCorrect) {
      setScores((s) => ({ ...s, [currentPlayer]: s[currentPlayer] + 1 }))
    }

    setTimeout(() => {
      setSelected(null)
      setShowResult(false)
      if (currentPlayer === 2) {
        setCurrentIndex((i) => i + 1)
        setCurrentPlayer(1)
      } else {
        setCurrentPlayer(2)
      }
    }, 1500)
  }

  if (!gameStarted) {
    return (
      <div className={styles.root}>
        <h2 className={styles.title}>Trivia Quiz</h2>
        <p className={styles.subtitle}>
          {TOTAL_QUESTIONS} questions. Players take turns answering.
          <br />
          Most correct answers wins!
        </p>
        <Button onClick={startGame} size="lg" className="neon-glow-cyan">
          Start Quiz
        </Button>
      </div>
    )
  }

  if (gameOver) {
    return (
      <div className={styles.root}>
        <div className={styles.scoreRow}>
          <div className={styles.scoreCard}>
            <span className={styles.scoreLabel}>Player 1</span>
            <span className={cn(styles.scoreValue, styles.scoreValueLarge, 'text-neon-cyan')}>{scores[1]}</span>
          </div>
          <div className={styles.scoreCard}>
            <span className={styles.scoreLabel}>Player 2</span>
            <span className={cn(styles.scoreValue, styles.scoreValueLarge, 'text-neon-magenta')}>{scores[2]}</span>
          </div>
        </div>
        <p className={styles.resultText}>
          {scores[1] > scores[2]
            ? 'Player 1 wins!'
            : scores[2] > scores[1]
              ? 'Player 2 wins!'
              : "It's a tie!"}
        </p>
        <Button onClick={startGame} className={styles.resetButton}>
          <RotateCcw size={16} /> Play Again
        </Button>
      </div>
    )
  }

  const q = questions[currentIndex]

  return (
    <div className={styles.root}>
      {/* Scores */}
      <div className={styles.scoreRow}>
        <div className={cn(styles.scoreCard, currentPlayer !== 1 && styles.scoreInactive)}>
          <span className={styles.scoreLabel}>Player 1</span>
          <span className={cn(styles.scoreValue, 'text-neon-cyan')}>{scores[1]}</span>
        </div>
        <div className={styles.centerInfo}>
          <span>Q{currentIndex + 1}/{TOTAL_QUESTIONS}</span>
        </div>
        <div className={cn(styles.scoreCard, currentPlayer !== 2 && styles.scoreInactive)}>
          <span className={styles.scoreLabel}>Player 2</span>
          <span className={cn(styles.scoreValue, 'text-neon-magenta')}>{scores[2]}</span>
        </div>
      </div>

      <p className={styles.turnText}>
        Player {currentPlayer}&apos;s turn
      </p>

      {/* Question */}
      <div className={styles.questionWrap}>
        <div className={styles.questionCard}>
          <span className={styles.questionCategory}>{q.category}</span>
          <p className={styles.questionText}>{q.question}</p>
        </div>

        <div className={styles.answerList}>
          {q.options.map((option, i) => {
            const isCorrect = i === q.correct
            const isSelected = selected === i
            return (
              <button
                key={i}
                onClick={() => handleAnswer(i)}
                disabled={showResult}
                className={cn(
                  styles.answerButton,
                  showResult
                    ? isCorrect
                      ? styles.answerCorrect
                      : isSelected
                        ? styles.answerWrong
                        : styles.answerMuted
                    : styles.answerIdle,
                )}
              >
                <span className={styles.answerLetter}>{String.fromCharCode(65 + i)}.</span>
                {option}
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}
