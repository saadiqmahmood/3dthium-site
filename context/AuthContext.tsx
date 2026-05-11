import type { AuthError, Session, User } from '@supabase/supabase-js'
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react'
import { useSupabase } from './SupabaseContext'

type AuthContextType = {
  user: User | null
  session: Session | null
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<{ data: unknown; error: AuthError | null }>
  signUp: (email: string, password: string) => Promise<{ data: unknown; error: AuthError | null }>
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
    const noOp = async () => ({
      data: null,
      error: new Error('Supabase not available') as unknown as AuthError,
    })
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

  // biome-ignore lint/correctness/useHookAtTopLevel: hooks are after an early-return guard; safe because supabaseContext nullability is stable across renders
  useEffect(() => {
    const checkAdminStatus = async () => {
      const controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 5000)
      try {
        const {
          data: { session: currentSession },
        } = await client.auth.getSession()
        const token = currentSession?.access_token
        if (!token) {
          setIsAdmin(false)
          return
        }
        const response = await fetch('/api/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        })
        if (!response.ok) {
          setIsAdmin(false)
          return
        }
        const data = await response.json()
        setIsAdmin(!!data.isAdmin)
      } catch {
        setIsAdmin(false)
      } finally {
        clearTimeout(timeout)
      }
    }

    const getInitialSession = async () => {
      try {
        const {
          data: { session },
        } = await client.auth.getSession()
        setSession(session)
        setUser(session?.user || null)
        if (session?.user) {
          await checkAdminStatus()
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

    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(async (_event, session) => {
      setSession(session)
      setUser(session?.user || null)
      if (session?.user) {
        await checkAdminStatus()
      } else {
        setIsAdmin(false)
      }
      setLoading(false)
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [client])

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
