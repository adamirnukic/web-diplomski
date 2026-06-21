import { NextResponse } from 'next/server'
import {
  getCurrentProfile,
  updateCurrentProfile,
} from '@/services/profileServerService'

export async function GET() {
  try {
    const result = await getCurrentProfile()

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to fetch profile' },
        { status: result.status || 500 },
      )
    }

    return NextResponse.json({ profile: result.profile, email: result.email })
  } catch (error) {
    console.error('Profile GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(request) {
  try {
    const body = await request.json()
    const { username, display_name, bio, avatar_url } = body
    const result = await updateCurrentProfile({
      username,
      display_name,
      bio,
      avatar_url,
    })

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to update profile' },
        { status: result.status || 500 },
      )
    }

    return NextResponse.json({ profile: result.profile })
  } catch (error) {
    console.error('Profile PATCH error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
