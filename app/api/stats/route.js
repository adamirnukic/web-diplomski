import { NextResponse } from 'next/server'
import {
  updateStatsForCurrentUser,
  getStatsForCurrentUser,
} from '@/services/statsServerService'

export async function POST(request) {
  try {
    const body = await request.json()
    const { gameType, result, score } = body
    const resultData = await updateStatsForCurrentUser({
      gameType,
      result,
      score,
    })

    if (!resultData.success) {
      return NextResponse.json(
        { error: resultData.error || 'Failed to update stats' },
        { status: resultData.status || 500 },
      )
    }

    return NextResponse.json(resultData.data)
  } catch (error) {
    console.error('Stats API error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url)
    const gameType = searchParams.get('gameType')
    const resultData = await getStatsForCurrentUser({ gameType })

    if (!resultData.success) {
      return NextResponse.json(
        { error: resultData.error || 'Failed to fetch stats' },
        { status: resultData.status || 500 },
      )
    }

    return NextResponse.json(resultData.data)
  } catch (error) {
    console.error('Stats GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
