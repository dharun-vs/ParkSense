import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { User, Session } from '@supabase/supabase-js'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import type { Profile } from '@/types/database'
import { demoStore } from '@/lib/demoStore'
import { signIn as authServiceSignIn, type SignInResult } from '@/features/auth/authService'

interface AuthContextValue {
  user: User | null
  session: Session | null
  profile: Profile | null
  isLoading: boolean
  isAdmin: boolean
  signIn: (usernameOrEmail: string, password: string) => Promise<SignInResult>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function createSyntheticUser(profile: Profile): User {
  return {
    id: profile.id,
    email: `${profile.username}@parksense.demo`,
    app_metadata: { provider: 'demo', roles: [profile.role] },
    user_metadata: { display_name: profile.display_name, username: profile.username, role: profile.role },
    aud: 'authenticated',
    created_at: profile.created_at,
  } as unknown as User
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<Profile | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchProfile = async (userId: string) => {
    if (isSupabaseConfigured) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (!error && data) {
        setProfile(data as Profile)
      }
    } else {
      const demoUser = demoStore.getCurrentUser()
      if (demoUser) {
        setProfile(demoUser)
      }
    }
  }

  const refreshProfile = async () => {
    if (user) await fetchProfile(user.id)
  }

  useEffect(() => {
    if (isSupabaseConfigured) {
      // Get initial Supabase session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setSession(session)
        setUser(session?.user ?? null)
        if (session?.user) {
          fetchProfile(session.user.id).finally(() => setIsLoading(false))
        } else {
          setIsLoading(false)
        }
      })

      // Listen for auth state changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (_event, session) => {
          setSession(session)
          setUser(session?.user ?? null)
          if (session?.user) {
            await fetchProfile(session.user.id)
          } else {
            setProfile(null)
          }
          setIsLoading(false)
        }
      )

      return () => subscription.unsubscribe()
    } else {
      // Local demo mode restoration
      const demoUser = demoStore.getCurrentUser()
      if (demoUser) {
        setProfile(demoUser)
        setUser(createSyntheticUser(demoUser))
        setSession({
          access_token: `demo-${demoUser.role}-token`,
          refresh_token: 'demo-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          user: createSyntheticUser(demoUser),
        } as unknown as Session)
      } else {
        setUser(null)
        setProfile(null)
        setSession(null)
      }
      setIsLoading(false)
    }
  }, [])

  const signIn = async (usernameOrEmail: string, password: string): Promise<SignInResult> => {
    const result = await authServiceSignIn(usernameOrEmail, password)

    if (result.profile) {
      setProfile(result.profile)
      if (!isSupabaseConfigured) {
        const syntheticUser = createSyntheticUser(result.profile)
        setUser(syntheticUser)
        setSession({
          access_token: `demo-${result.profile.role}-token`,
          refresh_token: 'demo-refresh-token',
          expires_in: 3600,
          token_type: 'bearer',
          user: syntheticUser,
        } as unknown as Session)
      }
    }

    if (result.user && isSupabaseConfigured) {
      setUser(result.user as User)
      setSession(result.session as Session)
    }

    setIsLoading(false)
    return result
  }

  const signOut = async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut()
      } else {
        demoStore.logoutDemo()
      }
    } finally {
      setUser(null)
      setSession(null)
      setProfile(null)
      setIsLoading(false)
    }
  }

  const isAdmin = profile?.role === 'admin'

  return (
    <AuthContext.Provider value={{ user, session, profile, isLoading, isAdmin, signIn, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
