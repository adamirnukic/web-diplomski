import { NextResponse } from 'next/server'
import { createMatch, getMatches } from '@/services/matchServerService'

export async function POST(request) {
  try {
    const body = await request.json()
    const { gameType, player2Id, winnerId, durationSeconds, scores, mode } = body
    const result = await createMatch({
      gameType,
      player2Id,
      winnerId,
      durationSeconds,
      scores,
      mode,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to save match' },
        { status: result.status || 500 },
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Match API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '20')
    const gameType = searchParams.get('gameType')
    const result = await getMatches({ limit, gameType })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch matches' },
        { status: result.status || 500 },
      )
    }

    return NextResponse.json(result.data)
  } catch (error) {
    console.error('Match GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
