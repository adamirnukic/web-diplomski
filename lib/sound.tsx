'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react'

export type SoundName = 'move' | 'win' | 'lose' | 'draw' | 'notify'

interface SoundValue {
  enabled: boolean
  toggle: () => void
  play: (s: SoundName) => void
}

const Ctx = createContext<SoundValue | null>(null)

/** Tiny synth so we need zero audio assets. Each sound is a short envelope. */
function playTone(ac: AudioContext, name: SoundName) {
  const now = ac.currentTime
  const beep = (freq: number, start: number, dur: number, type: OscillatorType, vol: number) => {
    const o = ac.createOscillator()
    const g = ac.createGain()
    o.type = type
    o.frequency.value = freq
    o.connect(g)
    g.connect(ac.destination)
    g.gain.setValueAtTime(0.0001, now + start)
    g.gain.exponentialRampToValueAtTime(vol, now + start + 0.01)
    g.gain.exponentialRampToValueAtTime(0.0001, now + start + dur)
    o.start(now + start)
    o.stop(now + start + dur + 0.02)
  }
  switch (name) {
    case 'move':
      beep(330, 0, 0.08, 'triangle', 0.14)
      break
    case 'notify':
      beep(620, 0, 0.13, 'sine', 0.16)
      break
    case 'win':
      ;[523, 659, 784, 1047].forEach((f, i) => beep(f, i * 0.09, 0.16, 'triangle', 0.2))
      break
    case 'lose':
      ;[392, 311, 247].forEach((f, i) => beep(f, i * 0.11, 0.22, 'sawtooth', 0.14))
      break
    case 'draw':
      beep(440, 0, 0.12, 'sine', 0.12)
      beep(440, 0.15, 0.12, 'sine', 0.12)
      break
  }
}

export function SoundProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(true)
  const acRef = useRef<AudioContext | null>(null)

  useEffect(() => {
    if (window.localStorage.getItem('gv_sound') === 'off') setEnabled(false)
  }, [])

  const toggle = useCallback(() => {
    setEnabled((e) => {
      const next = !e
      window.localStorage.setItem('gv_sound', next ? 'on' : 'off')
      return next
    })
  }, [])

  const play = useCallback(
    (name: SoundName) => {
      if (!enabled) return
      try {
        let ac = acRef.current
        if (!ac) {
          const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
          ac = new AC()
          acRef.current = ac
        }
        if (ac.state === 'suspended') void ac.resume()
        playTone(ac, name)
      } catch {
        // audio unavailable — ignore
      }
    },
    [enabled],
  )

  return <Ctx.Provider value={{ enabled, toggle, play }}>{children}</Ctx.Provider>
}

export function useSound(): SoundValue {
  const c = useContext(Ctx)
  if (!c) throw new Error('useSound se mora koristiti unutar <SoundProvider>')
  return c
}
