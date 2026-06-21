'use client'

import useSWR from 'swr'

const fetcher = (url) => fetch(url).then((res) => res.json())

export function useStats(gameType) {
  const url = gameType ? `/api/stats?gameType=${gameType}` : '/api/stats'
  const { data, error, isLoading, mutate } = useSWR(url, fetcher)

  return {
    stats: data?.stats ?? [],
    isLoading,
    isError: !!error,
    mutate,
  }
}

export function useProfile() {
  const { data, error, isLoading, mutate } = useSWR('/api/profile', fetcher)

  return {
    profile: data?.profile ?? null,
    email: data?.email ?? null,
    isLoading,
    isError: !!error,
    mutate,
  }
}

export function useLeaderboard(type = 'xp', gameType) {
  const params = new URLSearchParams({ type })
  if (gameType) params.append('gameType', gameType)

  const { data, error, isLoading } = useSWR(
    `/api/leaderboard?${params.toString()}`,
    fetcher
  )

  return {
    leaderboard: data?.leaderboard ?? [],
    isLoading,
    isError: !!error,
  }
}

export function useMatches(gameType, limit = 20) {
  const params = new URLSearchParams({ limit: String(limit) })
  if (gameType) params.append('gameType', gameType)

  const { data, error, isLoading, mutate } = useSWR(
    `/api/matches?${params.toString()}`,
    fetcher
  )

  return {
    matches: data?.matches ?? [],
    isLoading,
    isError: !!error,
    mutate,
  }
}

export async function recordGameResult(gameType, result, score) {
  const response = await fetch('/api/stats', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ gameType, result, score }),
  })

  return response.json()
}

export async function saveMatch(data) {
  const response = await fetch('/api/matches', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })

  return response.json()
}
