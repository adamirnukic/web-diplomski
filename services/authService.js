import { getSupabaseBrowserClient } from './supabaseClient'

function getClient() {
  return getSupabaseBrowserClient()
}

export async function signInWithPassword({ email, password }) {
  try {
    const supabase = getClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'Unable to connect to the server. Please try again.',
    }
  }
}

export async function signUp({ email, password, username, redirectTo }) {
  try {
    const supabase = getClient()
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo,
        data: {
          username: username?.toLowerCase(),
          display_name: username,
        },
      },
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'Unable to connect to the server. Please try again.',
    }
  }
}

export async function sendPasswordResetEmail(email, redirectTo) {
  try {
    const supabase = getClient()
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'Unable to send reset email. Please try again.',
    }
  }
}

export async function getPasswordResetSession() {
  try {
    const supabase = getClient()
    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      return { hasSession: false, error: error.message }
    }

    return { hasSession: Boolean(session), error: null }
  } catch (err) {
    return {
      hasSession: false,
      error:
        err instanceof Error
          ? err.message
          : 'Unable to verify the reset session. Please try again.',
    }
  }
}

export async function updatePassword(password) {
  try {
    const supabase = getClient()
    const { error } = await supabase.auth.updateUser({
      password,
    })

    if (error) {
      return { success: false, error: error.message }
    }

    return { success: true, error: null }
  } catch (err) {
    return {
      success: false,
      error:
        err instanceof Error
          ? err.message
          : 'Unable to reset password. Please try again.',
    }
  }
}

export async function getCurrentUser() {
  try {
    const supabase = getClient()
    const { data, error } = await supabase.auth.getUser()
    if (error) return null
    return data?.user ?? null
  } catch (error) {
    return null
  }
}

export function onAuthStateChange(callback) {
  const supabase = getClient()
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback?.(session?.user ?? null)
  })
  return data?.subscription
}

export async function signOut() {
  const supabase = getClient()
  const { error } = await supabase.auth.signOut()
  return { success: !error, error: error?.message ?? null }
}

