import type { CantStopAction, CantStopState } from './engine'

const TOP: Record<number, number> = {
  2: 3, 3: 5, 4: 7, 5: 9, 6: 11, 7: 13, 8: 11, 9: 9, 10: 7, 11: 5, 12: 3,
}

export function cantStopAI(s: CantStopState, p: string): CantStopAction {
  if (s.phase === 'rolling') return { type: 'roll' }

  if (s.phase === 'choosing') {
    // pick the pairing that advances the most, preferring near-top columns
    let best = 0
    let bestScore = -1
    s.pairings.forEach((pr, i) => {
      let score = pr.advance.length * 2
      for (const c of pr.advance) {
        const cur = s.temp[c] ?? s.progress[p][c]
        score += (cur + 1) / TOP[c] // closer to top is better
      }
      if (score > bestScore) {
        bestScore = score
        best = i
      }
    })
    return { type: 'choose', pairing: best }
  }

  // deciding: stop or push
  const runners = Object.keys(s.temp).length
  let gain = 0
  let toppedSomething = false
  for (const colStr of Object.keys(s.temp)) {
    const col = Number(colStr)
    gain += s.temp[col] - s.progress[p][col]
    if (s.temp[col] >= TOP[col]) toppedSomething = true
  }
  // greedier when fewer runners are committed; bank a topped column
  if (toppedSomething) return { type: 'stop' }
  const threshold = runners >= 3 ? 3 : 6
  if (gain >= threshold + Math.random() * 2) return { type: 'stop' }
  return { type: 'roll' }
}
