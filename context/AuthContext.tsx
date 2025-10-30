import { Session, User } from '@supabase/supabase-js'
import { createContext, ReactNode, useContext, useEffect, useState } from 'react'
import { useSupabase } from './SupabaseContext'

type AuthContextType = {
  user: User | null
  session: Session | null
  isAdmin: boolean
  signIn: (email: string, password: string) => Promise<any>
  signUp: (email: string, password: string) => Promise<any>
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

  // Helper function to check admin status with logging
  const checkAdminStatus = async (userId: string) => {
    console.log('🔍 [AuthContext] Checking admin status for user:', userId)
    try {
      // Use API route to bypass RLS issues
      const response = await fetch('/api/auth/check-admin', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId }),
      })

      if (!response.ok) {
        console.error('❌ [AuthContext] Error checking admin status:', response.status)
        setIsAdmin(false)
        return
      }

      const data = await response.json()
      console.log('✅ [AuthContext] Admin status result:', data)
      setIsAdmin(!!data.isAdmin)
    } catch (err) {
      console.error('❌ [AuthContext] Exception checking admin status:', err)
      setIsAdmin(false)
    }
  }

  useEffect(() => {
    console.log('🚀 [AuthContext] Initializing AuthProvider')

    // Get initial session
    const getInitialSession = async () => {
      console.log('🔄 [AuthContext] Getting initial session...')
      try {
        const {
          data: { session },
          error,
        } = await client.auth.getSession()

        if (error) {
          console.error('❌ [AuthContext] Error getting initial session:', error)
        }

        console.log('📋 [AuthContext] Initial session:', {
          hasSession: !!session,
          userId: session?.user?.id,
          email: session?.user?.email,
          expiresAt: session?.expires_at,
        })

        // Check if session is expired
        if (session && session.expires_at) {
          const now = Math.floor(Date.now() / 1000)
          if (session.expires_at < now) {
            console.log('⚠️ [AuthContext] Session expired, signing out')
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
          console.log('👤 [AuthContext] User found, checking admin status...')
          await checkAdminStatus(session.user.id)
        } else {
          console.log('👤 [AuthContext] No user in session')
          setIsAdmin(false)
        }
      } catch (error) {
        console.error('❌ [AuthContext] Exception getting initial session:', error)
        setIsAdmin(false)
      } finally {
        console.log('✅ [AuthContext] Initial session setup complete')
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    console.log('👂 [AuthContext] Setting up auth state listener...')
    const {
      data: { subscription },
    } = client.auth.onAuthStateChange(async (event, session) => {
      console.log('🔄 [AuthContext] Auth state changed:', {
        event,
        userId: session?.user?.id,
        email: session?.user?.email,
        hasSession: !!session,
      })

      // Handle session expiry
      if (session && session.expires_at) {
        const now = Math.floor(Date.now() / 1000)
        if (session.expires_at < now) {
          console.log('⚠️ [AuthContext] Session expired during auth state change')
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
        console.log('👤 [AuthContext] User authenticated, checking admin status...')
        await checkAdminStatus(session.user.id)
      } else {
        console.log('👤 [AuthContext] User signed out')
        setIsAdmin(false)
      }
      setLoading(false)
    })

    return () => {
      console.log('🧹 [AuthContext] Cleaning up auth listener')
      subscription.unsubscribe()
    }
  }, [client])

  const signOut = async () => {
    console.log('🚪 [AuthContext] Signing out...')
    try {
      const { error } = await client.auth.signOut()
      if (error) {
        console.error('❌ [AuthContext] Error signing out:', error)
      } else {
        console.log('✅ [AuthContext] Sign out successful')
      }
      setSession(null)
      setUser(null)
      setIsAdmin(false)
    } catch (error) {
      console.error('❌ [AuthContext] Exception during sign out:', error)
    }
  }

  const signIn = async (email: string, password: string) => {
    console.log('�� [AuthContext] Signing in:', email)
    const { data, error } = await client.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      console.error('❌ [AuthContext] Sign in error:', error)
    } else {
      console.log('✅ [AuthContext] Sign in successful:', data.user?.email)
    }

    return { data, error }
  }

  const signUp = async (email: string, password: string) => {
    console.log('📝 [AuthContext] Signing up:', email)
    const { data, error } = await client.auth.signUp({
      email,
      password,
    })

    if (error) {
      console.error('❌ [AuthContext] Sign up error:', error)
    } else {
      console.log('✅ [AuthContext] Sign up successful:', data.user?.email)
    }

    return { data, error }
  }

  // Check session expiration periodically
  useEffect(() => {
    if (!session?.expires_at) return

    const checkExpiration = () => {
      const now = Math.floor(Date.now() / 1000)
      if (session.expires_at && session.expires_at < now) {
        console.log('⚠️ [AuthContext] Session expired - logging out automatically')
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
      
      console.log(`⏰ [AuthContext] Setting session expiration check in ${timeUntilExpiry} seconds`)
      
      const timeoutId = setTimeout(() => {
        checkExpiration()
      }, timeoutMs)

      return () => {
        clearTimeout(timeoutId)
      }
    }
  }, [session, client])

  // Log state changes
  useEffect(() => {
    console.log('📊 [AuthContext] State updated:', {
      hasUser: !!user,
      hasSession: !!session,
      isAdmin,
      loading,
      userId: user?.id,
      email: user?.email,
      expiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toISOString() : null,
    })
  }, [user, session, isAdmin, loading])

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
