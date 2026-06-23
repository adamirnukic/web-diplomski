'use client'
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { Bot, User } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { PassDevice } from '@/components/games/PassDevice'
import { getEngine } from '@shared/games/registry'
import { getGameComponent } from '@/components/games/registry'
import { aiDecide } from '@shared/games/ai'
import type { Difficulty, EnginePlayer } from '@shared/types'
import { useT } from '@/lib/i18n'
import styles from './AiLocal.module.css'

interface Props {
  gameId: string
  minPlayers: number
  maxPlayers: number
  secret: boolean
  /** brief read-only review of the just-finished move before the device hand-off */
  reviewOnPass?: boolean
}

/** Generic local runner for games that support bots + a player-count setup. */
export function AiLocal({ gameId, minPlayers, maxPlayers, secret, reviewOnPass = false }: Props) {
  const [cfg, setCfg] = useState<{ total: number; bots: number; difficulty: Difficulty } | null>(null)
  if (!cfg) {
    return (
      <Setup
        minP={minPlayers}
        maxP={maxPlayers}
        onStart={(total, bots, difficulty) => setCfg({ total, bots, difficulty })}
      />
    )
  }
  return (
    <Game
      key={`${cfg.total}-${cfg.bots}-${cfg.difficulty}`}
      gameId={gameId}
      secret={secret}
      reviewOnPass={reviewOnPass}
      total={cfg.total}
      bots={cfg.bots}
      difficulty={cfg.difficulty}
      onExit={() => setCfg(null)}
    />
  )
}

function Setup({
  minP,
  maxP,
  onStart,
}: {
  minP: number
  maxP: number
  onStart: (total: number, bots: number, difficulty: Difficulty) => void
}) {
  const { t } = useT()
  const [total, setTotal] = useState(Math.max(2, minP))
  const [bots, setBots] = useState(1)
  const [difficulty, setDifficulty] = useState<Difficulty>('normal')
  const humans = total - bots
  const totals: number[] = []
  for (let n = minP; n <= maxP; n++) totals.push(n)

  const changeTotal = (t: number) => {
    setTotal(t)
    if (bots > t - 1) setBots(t - 1)
  }

  return (
    <div className={styles.setup}>
      <div className={styles.field}>
        <span className={styles.label}>{t('setup.players')}</span>
        <div className={styles.opts}>
          {totals.map((n) => (
            <button key={n} className={cn(styles.opt, total === n && styles.optActive)} onClick={() => changeTotal(n)}>
              {n}
            </button>
          ))}
        </div>
      </div>
      <div className={styles.field}>
        <span className={styles.label}>{t('setup.bots')}</span>
        <div className={styles.opts}>
          {Array.from({ length: total }).map((_, n) => (
            <button
              key={n}
              className={cn(styles.opt, bots === n && styles.optActive)}
              disabled={n > total - 1}
              onClick={() => setBots(n)}
            >
              {n}
            </button>
          ))}
        </div>
      </div>
      {bots > 0 && (
        <div className={styles.field}>
          <span className={styles.label}>{t('setup.difficulty')}</span>
          <div className={styles.opts}>
            {(['easy', 'normal', 'hard'] as Difficulty[]).map((d) => (
              <button
                key={d}
                className={cn(styles.opt, difficulty === d && styles.optActive)}
                onClick={() => setDifficulty(d)}
              >
                {t(`diff.${d}`)}
              </button>
            ))}
          </div>
        </div>
      )}
      <p className={styles.summary}>
        <User size={15} /> {humans} &nbsp;·&nbsp; <Bot size={15} /> {bots}
      </p>
      <Button size="lg" className="neon-glow-cyan" onClick={() => onStart(total, bots, difficulty)}>
        {t('setup.start')}
      </Button>
    </div>
  )
}

function Game({
  gameId,
  secret,
  reviewOnPass,
  total,
  bots,
  difficulty,
  onExit,
}: {
  gameId: string
  secret: boolean
  reviewOnPass: boolean
  total: number
  bots: number
  difficulty: Difficulty
  onExit: () => void
}) {
  const { t } = useT()
  const engine = getEngine(gameId)!
  const Comp = getGameComponent(gameId)!
  const players = useMemo<EnginePlayer[]>(() => {
    const humans = total - bots
    const list: EnginePlayer[] = []
    for (let i = 0; i < humans; i++) {
      list.push({ id: `h${i}`, username: humans === 1 ? 'Ti' : `Igrač ${i + 1}` })
    }
    for (let i = 0; i < bots; i++) list.push({ id: `b${i}`, username: `Bot ${i + 1}` })
    return list
  }, [total, bots])
  const aiIds = useMemo(() => players.filter((p) => p.id[0] === 'b').map((p) => p.id), [players])
  const humanIds = useMemo(() => players.filter((p) => p.id[0] === 'h').map((p) => p.id), [players])

  const [state, setState] = useState<any>(() => engine.createInitialState(players, { ai: aiIds }))
  const [viewer, setViewer] = useState<string>(humanIds[0])
  const [reviewing, setReviewing] = useState(false)

  const dispatch = useCallback(
    (action: unknown, actor: string) => {
      setState((prev: any) => {
        try {
          return engine.applyAction(prev, actor, action as never)
        } catch {
          return prev
        }
      })
    },
    [engine],
  )

  const cp = engine.getCurrentPlayer(state)
  const over = engine.getResult(state) != null
  const isAi = (id: string | null) => !!id && aiIds.includes(id)

  useEffect(() => {
    if (!cp || !isAi(cp)) return
    const t = setTimeout(() => {
      const a = aiDecide(gameId, state, cp, difficulty)
      if (a) dispatch(a, cp)
    }, 850)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state, cp])

  // The device must move to a different human (hidden-information games only).
  const needHandoff = secret && !!cp && !isAi(cp) && cp !== viewer && humanIds.length > 1

  // Briefly keep the outgoing player's board on screen so they see the result.
  useEffect(() => {
    if (reviewOnPass && needHandoff) {
      setReviewing(true)
      const t = setTimeout(() => setReviewing(false), 1500)
      return () => clearTimeout(t)
    }
    setReviewing(false)
  }, [needHandoff, reviewOnPass])

  const restart = () => {
    setState(engine.createInitialState(players, { ai: aiIds }))
    setViewer(humanIds[0])
    setReviewing(false)
  }

  // Read-only review of the just-finished move before the hand-off screen.
  if (needHandoff && reviewing) {
    return (
      <div className={styles.wrap}>
        <Comp view={engine.getView(state, viewer)} onAction={() => {}} mode="local" players={players} />
      </div>
    )
  }

  // Hand the device to the next human.
  if (needHandoff && cp) {
    const name = players.find((p) => p.id === cp)?.username ?? 'Igrač'
    return <PassDevice name={name} onReady={() => setViewer(cp)} />
  }

  const vId = secret
    ? viewer ?? humanIds[0]
    : cp && !isAi(cp)
      ? cp
      : humanIds[0] ?? players[0].id

  const onAction = (action: unknown) => {
    if (cp && !isAi(cp)) dispatch(action, cp)
    // round transitions with no "current" player (e.g. Love Letter "Next round")
    else if (!cp && !over) dispatch(action, vId)
  }

  return (
    <div className={styles.wrap}>
      <Comp
        view={engine.getView(state, vId)}
        onAction={onAction}
        onRestart={restart}
        mode="local"
        players={players}
      />
      <button className={styles.exit} onClick={onExit}>
        ↩ {t('setup.change')}
      </button>
    </div>
  )
}
