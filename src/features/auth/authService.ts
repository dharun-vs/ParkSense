import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Profile } from '@/types/database'
import { demoStore } from '@/lib/demoStore'

/**
 * Standard Demo Accounts for Academic Evaluation
 */
export const DEMO_ACCOUNTS = {
  admin: {
    username: 'admin',
    email: 'admin@parksense.demo',
    password: 'admin',
    role: 'admin' as const,
    defaultPath: '/admin',
  },
  customer: {
    username: 'customer',
    email: 'customer@parksense.demo',
    password: '1234',
    role: 'user' as const,
    defaultPath: '/dashboard',
  },
} as const

/**
 * Clean resolution layer mapping entered identifiers to Supabase auth credentials.
 * - Trims whitespace and applies case-insensitive matching for demo aliases.
 * - Preserves standard email addresses without misidentifying them as usernames.
 */
export function resolveLoginIdentifier(identifier: string): string {
  const trimmed = identifier.trim()
  if (!trimmed) return ''

  // If it contains an '@', treat strictly as an email address
  if (trimmed.includes('@')) {
    return trimmed.toLowerCase()
  }

  const normalized = trimmed.toLowerCase()
  if (normalized === DEMO_ACCOUNTS.admin.username) {
    return DEMO_ACCOUNTS.admin.email
  }
  if (normalized === DEMO_ACCOUNTS.customer.username) {
    return DEMO_ACCOUNTS.customer.email
  }

  return trimmed
}

export interface SignInResult {
  session: unknown
  user: unknown
  profile: Profile | null
}

export async function signIn(usernameOrEmail: string, password: string): Promise<SignInResult> {
  const trimmedInput = usernameOrEmail.trim()
  const lowerInput = trimmedInput.toLowerCase()

  if (isSupabaseConfigured) {
    const resolvedEmail = resolveLoginIdentifier(trimmedInput)

    const { data, error } = await supabase.auth.signInWithPassword({
      email: resolvedEmail,
      password,
    })

    if (error || !data.user) {
      // Return a uniform, generic error to avoid user/account enumeration
      throw new Error('Invalid username/email or password. Please try again.')
    }

    // Authoritative server-side profile fetch to verify role from PostgreSQL
    let profile: Profile | null = null
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single()

      if (profileData) {
        profile = profileData as Profile
      }
    } catch {
      // Profile fetch fallback
    }

    return { session: data.session, user: data.user, profile }
  } else {
    // Local Academic Evaluation Fallback (when Supabase .env is not yet configured)
    // Authenticate exact demo credentials
    if (
      (lowerInput === 'admin' || lowerInput === DEMO_ACCOUNTS.admin.email) &&
      password === DEMO_ACCOUNTS.admin.password
    ) {
      const profile = demoStore.loginDemo('admin')
      return {
        session: { access_token: 'demo-admin-token' },
        user: { id: profile.id, email: DEMO_ACCOUNTS.admin.email },
        profile,
      }
    }

    if (
      (lowerInput === 'customer' || lowerInput === DEMO_ACCOUNTS.customer.email) &&
      password === DEMO_ACCOUNTS.customer.password
    ) {
      const profile = demoStore.loginDemo('customer')
      return {
        session: { access_token: 'demo-customer-token' },
        user: { id: profile.id, email: DEMO_ACCOUNTS.customer.email },
        profile,
      }
    }

    // Generic error for invalid credentials
    throw new Error('Invalid username/email or password. Please try again.')
  }
}

export async function signUp(email: string, password: string, displayName: string, username?: string) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
          username: username ? username.trim().toLowerCase() : undefined,
        },
      },
    })
    if (error) throw error
    return data
  } else {
    throw new Error(
      'Account registration requires an active Supabase database connection. Configure .env with your Supabase URL & Key.'
    )
  }
}

export async function signOut() {
  if (isSupabaseConfigured) {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  } else {
    demoStore.logoutDemo()
  }
}

export async function getProfile(userId: string): Promise<Profile> {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
    if (error) throw error
    return data as Profile
  } else {
    const p = demoStore.getCurrentUser()
    if (p) return p
    throw new Error('Profile not found')
  }
}

export async function updateProfile(userId: string, updates: { display_name?: string; username?: string }) {
  if (isSupabaseConfigured) {
    const { data, error } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', userId)
      .select()
      .single()
    if (error) throw error
    return data as Profile
  } else {
    const p = demoStore.getCurrentUser()
    if (p) {
      if (updates.display_name) p.display_name = updates.display_name
      if (updates.username) p.username = updates.username
      return { ...p }
    }
    throw new Error('Profile not found')
  }
}
