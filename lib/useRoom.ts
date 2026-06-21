'use client'

import { useCallback, useEffect, useRef, useState } from 'react'
import type { Socket } from 'socket.io-client'
import { createSocket } from './socket'
import { getToken } from './api'
import type { GameResult } from '@shared/types'

export interface RoomPlayerInfo {
  id: string
  username: string
  ready: boolean
  connected: boolean
  isHost: boolean
}

export interface LobbyState {
  code: string
  gameId: string
  hostId: string
  status: 'lobby' | 'playing' | 'finished'
  players: RoomPlayerInfo[]
}

interface AckResponse {
  error?: string
  code?: string
  [key: string]: unknown
}

/**
 * Client side of the authoritative online room. Connects with the auth token,
 * relays room/game events, exposes actions that round-trip to the server, and
 * automatically re-joins the room after a dropped connection.
 */
export function useRoom(gameId: string) {
  const socketRef = useRef<Socket | null>(null)
  const joinedCodeRef = useRef<string>('')
  const everConnectedRef = useRef(false)
  const [connected, setConnected] = useState(false)
  const [reconnecting, setReconnecting] = useState(false)
  const [lobby, setLobby] = useState<LobbyState | null>(null)
  const [view, setView] = useState<unknown>(null)
  const [result, setResult] = useState<GameResult | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const token = getToken()
    if (!token) {
      setError('Niste prijavljeni')
      return
    }
    const socket = createSocket(token)
    socketRef.current = socket

    socket.on('connect', () => {
      setConnected(true)
      // On a reconnect, re-link this socket to the room we were in.
      if (everConnectedRef.current && joinedCodeRef.current) {
        socket.emit('room:join', { code: joinedCodeRef.current }, () => {})
      }
      setReconnecting(false)
      everConnectedRef.current = true
    })
    socket.on('disconnect', () => {
      setConnected(false)
      if (joinedCodeRef.current) setReconnecting(true)
    })
    socket.on('connect_error', (e: Error) => setError(e.message))
    socket.on('room:update', (l: LobbyState) => setLobby(l))
    socket.on('game:state', (v: unknown) => {
      setView(v)
      setResult(null)
    })
    socket.on('game:over', (r: GameResult) => setResult(r))
    socket.on('error', (e: { message?: string }) => setError(e?.message ?? 'Greška'))

    return () => {
      socket.close()
      socketRef.current = null
    }
  }, [gameId])

  const emit = useCallback(
    (event: string, payload: unknown): Promise<AckResponse> =>
      new Promise((resolve) => {
        const s = socketRef.current
        if (!s) return resolve({ error: 'Nije povezano' })
        s.emit(event, payload, (resp: AckResponse) => resolve(resp ?? {}))
      }),
    [],
  )

  const createRoom = useCallback(async () => {
    const r = await emit('room:create', { gameId })
    if (r.error) setError(r.error)
    else if (r.code) joinedCodeRef.current = r.code
    return r
  }, [emit, gameId])

  const joinRoom = useCallback(
    async (code: string) => {
      const r = await emit('room:join', { code })
      if (r.error) setError(r.error)
      else joinedCodeRef.current = r.code ?? code.toUpperCase()
      return r
    },
    [emit],
  )

  const setReady = useCallback(
    (ready: boolean) => emit('room:ready', { ready }),
    [emit],
  )

  const start = useCallback(async () => {
    const r = await emit('room:start', {})
    if (r.error) setError(r.error)
    return r
  }, [emit])

  const sendAction = useCallback(
    async (action: unknown) => {
      const r = await emit('game:action', { action })
      if (r.error) setError(r.error)
      return r
    },
    [emit],
  )

  const leave = useCallback(() => {
    joinedCodeRef.current = ''
    setReconnecting(false)
    return emit('room:leave', {})
  }, [emit])

  return {
    connected,
    reconnecting,
    lobby,
    view,
    result,
    error,
    setError,
    createRoom,
    joinRoom,
    setReady,
    start,
    sendAction,
    leave,
  }
}
