export const XP_REWARDS = {
  win: 25,
  draw: 10,
  loss: 5,
}

export function calculateLevel(xp) {
  return Math.floor(xp / 100) + 1
}

export function xpForNextLevel(xp) {
  const currentLevel = calculateLevel(xp)
  return currentLevel * 100
}

export function xpProgress(xp) {
  return xp % 100
}

export function getLevelTitle(level) {
  if (level >= 50) return 'Legendary'
  if (level >= 40) return 'Grandmaster'
  if (level >= 30) return 'Master'
  if (level >= 20) return 'Expert'
  if (level >= 15) return 'Veteran'
  if (level >= 10) return 'Skilled'
  if (level >= 5) return 'Apprentice'
  return 'Novice'
}
