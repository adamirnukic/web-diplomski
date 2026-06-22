import type { SkullAction, SkullState } from './engine'

export function skullAI(s: SkullState, p: string): SkullAction {
  const stack = s.stack[p]
  const placedFlowers = stack.filter((d) => d === 'flower').length
  const handFlowers = s.flowers[p] - placedFlowers
  const handSkull = s.hasSkull[p] && !stack.includes('skull')
  const total = s.order.reduce((a, id) => a + (s.alive[id] ? s.stack[id].length : 0), 0)

  if (s.phase === 'placing') {
    const canBid = s.order.every((id) => !s.alive[id] || s.stack[id].length >= 1)
    const mustBid = handFlowers <= 0 && !handSkull
    if (mustBid || (canBid && Math.random() < 0.33)) {
      const count = Math.max(1, Math.min(placedFlowers || 1, total))
      return { type: 'bid', count }
    }
    if (handSkull && stack.length === 0 && Math.random() < 0.3) return { type: 'place', disc: 'skull' }
    if (handFlowers > 0) return { type: 'place', disc: 'flower' }
    if (handSkull) return { type: 'place', disc: 'skull' }
    return { type: 'bid', count: Math.max(1, Math.min(1, total)) }
  }

  if (s.phase === 'bidding') {
    const otherPlaced = total - stack.length
    const safe = placedFlowers + Math.floor(otherPlaced * 0.45)
    if (s.bid < safe && s.bid < total && Math.random() < 0.55) {
      return { type: 'bid', count: s.bid + 1 }
    }
    return { type: 'pass' }
  }

  // revealing (p is the challenger)
  const ownDone = s.revealedN[p] >= s.stack[p].length
  if (!ownDone) return { type: 'flip', target: p }
  const targets = s.order.filter(
    (id) => s.alive[id] && id !== p && s.revealedN[id] < s.stack[id].length,
  )
  const t = targets[Math.floor(Math.random() * targets.length)] ?? p
  return { type: 'flip', target: t }
}
