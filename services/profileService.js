import { getSupabaseBrowserClient } from './supabaseClient'

function getClient() {
  return getSupabaseBrowserClient()
}

export async function getProfileById(userId) {
  if (!userId) {
    return { success: false, error: 'Missing user id.', profile: null }
  }

  try {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (error) {
      return { success: false, error: error.message, profile: null }
    }

    return { success: true, error: null, profile: data }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unable to load profile.',
      profile: null,
    }
  }
}

export async function updateProfile(userId, updates) {
  if (!userId) {
    return { success: false, error: 'Missing user id.', profile: null }
  }

  try {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates })
      .eq('id', userId)
      .select()
      .single()

    if (error) {
      return { success: false, error: error.message, profile: null }
    }

    return { success: true, error: null, profile: data }
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Unable to update profile.',
      profile: null,
    }
  }
}
