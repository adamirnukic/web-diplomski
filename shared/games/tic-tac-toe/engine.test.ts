// Minimal engine test, no test framework needed.
// Run: pnpm test   (or: tsx shared/games/tic-tac-toe/engine.test.ts)
import assert from 'node:assert/strict'
import { ticTacToeEngine as e } from './engine'

const players = [
  { id: 'a', username: 'Ana' },
  { id: 'b', username: 'Bob' },
]

let s = e.createInitialState(players)
assert.equal(s.turn, 'a', 'prvi igrač je na potezu')
assert.equal(e.getView(s, 'a').yourMark, 'X')
assert.equal(e.getView(s, 'b').yourMark, 'O')

// turn enforcement
assert.throws(
  () => e.applyAction(s, 'b', { type: 'place', index: 0 }),
  /Nije tvoj potez/,
)

// a wins the top row: a@0, b@3, a@1, b@4, a@2
s = e.applyAction(s, 'a', { type: 'place', index: 0 })
s = e.applyAction(s, 'b', { type: 'place', index: 3 })
s = e.applyAction(s, 'a', { type: 'place', index: 1 })
s = e.applyAction(s, 'b', { type: 'place', index: 4 })
assert.equal(e.getResult(s), null, 'igra još traje')
s = e.applyAction(s, 'a', { type: 'place', index: 2 })

const r = e.getResult(s)
assert.ok(r && r.status === 'win' && r.winnerId === 'a', 'a pobjeđuje')
assert.deepEqual(s.winningLine, [0, 1, 2])

// no moves after game over
assert.throws(
  () => e.applyAction(s, 'b', { type: 'place', index: 5 }),
  /Igra je završena/,
)

// occupied cell rejected (fresh game)
let s2 = e.createInitialState(players)
s2 = e.applyAction(s2, 'a', { type: 'place', index: 4 })
assert.throws(
  () => e.applyAction(s2, 'b', { type: 'place', index: 4 }),
  /Polje je zauzeto/,
)

// draw detection
let d = e.createInitialState(players)
// X O X / X X O / O X O  -> full board, no 3-in-a-row
const moves: Array<[string, number]> = [
  ['a', 0], ['b', 1], ['a', 2],
  ['b', 4], ['a', 3], ['b', 5],
  ['a', 7], ['b', 6], ['a', 8],
]
for (const [pid, idx] of moves) d = e.applyAction(d, pid, { type: 'place', index: idx })
assert.equal(e.getResult(d)?.status, 'draw', 'neriješeno se detektuje')

console.log('✓ Tic-Tac-Toe engine: svi testovi prošli')
