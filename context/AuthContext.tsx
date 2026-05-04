import type { Session, User } from '@supabase/supabase-js'
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'
import { useSupabase } from './SupabaseContext'

type AuthContextType = {
  user: User | null
  session: Session | null
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<{ data: unknown; error: unknown }>
  signUp: (email: string, password: string) => Promise<{ data: unknown; error: unknown }>
  signOut: () => Promise<void>
  loading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const supabaseContext = useSupabase()
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  if (!supabaseContext) {
    // Return a fallback provider that doesn't require Supabase
    const noOp = async () => ({ data: null, error: new Error('Supabase not available') })
    const noOpVoid = async () => {}
    return (
      <AuthContext.Provider
        value={{
          user: null,
          session: null,
          isAdmin: false,
          loading: false,
          signIn: noOp,
          signUp: noOp,
          signOut: noOpVoid,
        }}
      >
        {children}
      </AuthContext.Provider>
    )
  }
  const { client } = supabaseContext

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const checkAdminStatus = async (_userId: string) => {
    try {
      const response = await fetch('/api/auth/me')
      if (!response.ok) {
        setIsAdmin(false)
        return
      }
      const data = await response.json()
      setIsAdmin(!!data.isAdmin)
    } catch {
      setIsAdmin(false)
    }
  }

  // biome-ignore lint/correctness/useHookAtTopLevel: hooks are after an early-return guard; safe because supabaseContext nullability is stable across renders
  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await client.auth.getSession()

        // Check if session is expired
        if (session?.expires_at) {
          const now = Math.floor(Date.now() / 1000)
          if (session.expires_at < now) {
            await client.auth.signOut()
            setSession(null)
            setUser(null)
            setIsAdmin(false)
            setLoading(false)
            return
          }
        }

        setSession(session)
        setUser(session?.user || null)

        if (session?.user) {
          await checkAdminStatus(session.user.id)
        } else {
          setIsAdmin(false)
        }
      } catch (_error) {
        setIsAdmin(false)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(async (_event, session) => {
      // Handle session expiry
      if (session?.expires_at) {
        const now = Math.floor(Date.now() / 1000)
        if (session.expires_at < now) {
          setSession(null)
          setUser(null)
          setIsAdmin(false)
          setLoading(false)
          return
        }
      }

      setSession(session)
      setUser(session?.user || null)

      if (session?.user) {
        await checkAdminStatus(session.user.id)
      } else {
        setIsAdmin(false)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
    // biome-ignore lint/correctness/useExhaustiveDependencies: checkAdminStatus is stable within a given render cycle; including it would cause loop
  }, [client, checkAdminStatus])

  const signOut = async () => {
    try {
      await client.auth.signOut()
      setSession(null)
      setUser(null)
      setIsAdmin(false)
    } catch (_error) {
      // Silently handle error
    }
  }

  const signIn = async (email: string, password: string) => {
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    })
    return { data, error }
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await client.auth.signUp({
      email,
      password,
    })
    return { data, error }
  }

  // Check session expiration periodically
  // biome-ignore lint/correctness/useHookAtTopLevel: same guard pattern as above — safe
  useEffect(() => {
    if (!session?.expires_at) return

    const checkExpiration = () => {
      const now = Math.floor(Date.now() / 1000)
      if (session.expires_at && session.expires_at < now) {
        client.auth.signOut()
        setSession(null)
        setUser(null)
        setIsAdmin(false)
      }
    }

    // Check immediately
    checkExpiration()

    // Calculate time until expiration
    const timeUntilExpiry = session.expires_at - Math.floor(Date.now() / 1000)

    // Only set timer if session hasn't expired yet
    if (timeUntilExpiry > 0) {
      // Set timer to check 1 second after expiration (in milliseconds)
      const timeoutMs = (timeUntilExpiry + 1) * 1000

      const timeoutId = setTimeout(() => {
        checkExpiration()
      }, timeoutMs)

      return () => {
        clearTimeout(timeoutId)
      }
    }
  }, [session, client])

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        isAdmin,
        signIn,
        signUp,
        signOut,
        loading,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
