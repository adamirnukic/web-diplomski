import { getSupabaseBrowserClient } from './supabaseClient'

function getClient() {
  return getSupabaseBrowserClient()
}

export async function getUserProfile(userId) {
  if (!userId) {
    return { success: false, error: 'Missing user id.', profile: null }
  }

  try {
    const supabase = getClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('username')
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
