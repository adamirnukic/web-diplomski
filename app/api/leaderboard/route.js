import { NextResponse } from 'next/server'
import { getLeaderboard } from '@/services/leaderboardServerService'

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') || 'xp'
    const gameType = searchParams.get('gameType')
    const limit = parseInt(searchParams.get('limit') || '50')
    const result = await getLeaderboard({ type, gameType, limit })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch leaderboard' },
        { status: result.status || 500 },
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Leaderboard GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
