import { getSupabaseServerClient } from './supabaseServer'

export async function getCurrentProfile() {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, status: 401, error: 'Unauthorized' }
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    return { success: false, status: 500, error: error.message }
  }

  return { success: true, profile, email: user.email }
}

export async function updateCurrentProfile({
  username,
  display_name,
  bio,
  avatar_url,
}) {
  const supabase = await getSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { success: false, status: 401, error: 'Unauthorized' }
  }

  if (username) {
    const { data: existing } = await supabase
      .from('profiles')
      .select('id')
      .eq('username', username)
      .neq('id', user.id)
      .single()

    if (existing) {
      return { success: false, status: 400, error: 'Username already taken' }
    }
  }

  const updateData = {
    updated_at: new Date().toISOString(),
  }

  if (username !== undefined) updateData.username = username
  if (display_name !== undefined) updateData.display_name = display_name
  if (bio !== undefined) updateData.bio = bio
  if (avatar_url !== undefined) updateData.avatar_url = avatar_url

  const { data, error } = await supabase
    .from('profiles')
    .update(updateData)
    .eq('id', user.id)
    .select()
    .single()

  if (error) {
    return { success: false, status: 500, error: error.message }
  }

  return { success: true, profile: data }
}
