import { getSupabaseBrowserClient } from './supabaseClient'

function getClient() {
  return getSupabaseBrowserClient()
}

function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

export class RoomManager {
  constructor() {
    this.channel = null
    this.supabase = getClient()
    this._roomCode = ''
    this._playerId = ''
    this._isHost = false
    this.callbacks = {}
  }

  get roomCode() {
    return this._roomCode
  }

  get playerId() {
    return this._playerId
  }

  get isHost() {
    return this._isHost
  }

  async createRoom(gameId, player) {
    const code = generateRoomCode()
    this._roomCode = code
    this._playerId = player.id
    this._isHost = true
    await this.joinChannel(code, gameId, player, true)
    return code
  }

  async joinRoom(code, gameId, player) {
    this._roomCode = code.toUpperCase()
    this._playerId = player.id
    this._isHost = false
    await this.joinChannel(this._roomCode, gameId, player, false)
  }

  async joinChannel(code, gameId, player, isHost) {
    this.channel = this.supabase.channel(`game-room-${gameId}-${code}`, {
      config: {
        presence: { key: player.id },
        broadcast: { self: false },
      },
    })

    this.channel
      .on('presence', { event: 'sync' }, () => {
        const presenceState = this.channel?.presenceState() ?? {}
        const players = Object.values(presenceState)
          .flat()
          .map((p) => ({
            id: p.id,
            username: p.username,
            isHost: p.isHost,
            isReady: p.isReady,
          }))
        this.callbacks.onPresenceSync?.(players)
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        for (const p of newPresences) {
          this.callbacks.onPlayerJoin?.({
            id: p.id,
            username: p.username,
          })
        }
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        for (const p of leftPresences) {
          this.callbacks.onPlayerLeave?.(p.id)
        }
      })
      .on('broadcast', { event: 'game-event' }, ({ payload }) => {
        this.callbacks.onGameEvent?.(payload)
      })

    await this.channel.subscribe(async (status) => {
      if (status === 'SUBSCRIBED') {
        await this.channel?.track({
          id: player.id,
          username: player.username,
          isHost,
          isReady: isHost,
        })
      }
    })
  }

  setCallbacks(callbacks) {
    this.callbacks = callbacks
  }

  async sendGameEvent(type, payload) {
    if (!this.channel) return
    await this.channel.send({
      type: 'broadcast',
      event: 'game-event',
      payload: { type, payload, senderId: this._playerId },
    })
  }

  async setReady(isReady) {
    if (!this.channel) return
    await this.channel.track({
      id: this._playerId,
      username: '',
      isHost: this._isHost,
      isReady,
    })
  }

  async leave() {
    if (this.channel) {
      await this.channel.untrack()
      this.supabase.removeChannel(this.channel)
      this.channel = null
    }
    this._roomCode = ''
    this._isHost = false
  }
}
