'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import {
  RoomManager,
} from '@/services/roomService'

export function useGameRoom({
  gameId,
  player,
  onGameEvent,
}) {
  const managerRef = useRef(null)
  const [roomCode, setRoomCode] = useState('')
  const [players, setPlayers] = useState([])
  const [isHost, setIsHost] = useState(false)
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const manager = new RoomManager()
    managerRef.current = manager

    manager.setCallbacks({
      onPresenceSync: (p) => {
        setPlayers(p)
        setIsConnected(true)
      },
      onPlayerLeave: () => {},
      onGameEvent: onGameEvent,
    })

    return () => {
      manager.leave()
    }
  }, [gameId]) // eslint-disable-line react-hooks/exhaustive-deps

  const createRoom = useCallback(async () => {
    if (!managerRef.current) return ''
    const code = await managerRef.current.createRoom(gameId, player)
    setRoomCode(code)
    setIsHost(true)
    return code
  }, [gameId, player])

  const joinRoom = useCallback(
    async (code) => {
      if (!managerRef.current) return
      await managerRef.current.joinRoom(code, gameId, player)
      setRoomCode(code.toUpperCase())
      setIsHost(false)
    },
    [gameId, player],
  )

  const sendEvent = useCallback(
    async (type, payload) => {
      if (!managerRef.current) return
      await managerRef.current.sendGameEvent(type, payload)
    },
    [],
  )

  const setReady = useCallback(async (ready) => {
    if (!managerRef.current) return
    await managerRef.current.setReady(ready)
  }, [])

  const leave = useCallback(async () => {
    if (!managerRef.current) return
    await managerRef.current.leave()
    setRoomCode('')
    setPlayers([])
    setIsConnected(false)
    setIsHost(false)
  }, [])

  return {
    roomCode,
    players,
    isHost,
    isConnected,
    createRoom,
    joinRoom,
    sendEvent,
    setReady,
    leave,
  }
}
