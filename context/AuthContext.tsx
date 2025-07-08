import { createContext, useContext, useEffect, useState, ReactNode, useRef } from 'react'
import { useSupabase } from './SupabaseContext'
import { Session, User } from '@supabase/supabase-js'

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

const AUTO_LOGOUT_MINUTES = 60;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { client } = useSupabase()
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

  const logoutTimer = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    // Get initial session
    const getInitialSession = async () => {
      const { data: { session } } = await client.auth.getSession()
      setSession(session)
      setUser(session?.user || null)
      if (session?.user) {
        // Fetch is_admin from users table
        const { data, error } = await client
          .from('users')
          .select('is_admin')
          .eq('auth_user_id', session.user.id)
          .single()
        setIsAdmin(!!data?.is_admin)
      } else {
        setIsAdmin(false)
      }
      setLoading(false)
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (event, session) => {
      setSession(session)
      setUser(session?.user || null)
      if (session?.user) {
        const { data, error } = await client
          .from('users')
          .select('is_admin')
          .eq('auth_user_id', session.user.id)
          .single()
        setIsAdmin(!!data?.is_admin)
      } else {
        setIsAdmin(false)
      }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [client])

  const signOut = async () => {
    await client.auth.signOut()
    setSession(null)
    setUser(null)
    setIsAdmin(false)
  }

  // Inactivity auto-logout
  useEffect(() => {
    const resetTimer = () => {
      if (logoutTimer.current) clearTimeout(logoutTimer.current)
      logoutTimer.current = setTimeout(() => {
        signOut()
        // Optionally, show a toast or redirect to login
      }, AUTO_LOGOUT_MINUTES * 60 * 1000)
    }
    window.addEventListener('mousemove', resetTimer)
    window.addEventListener('keydown', resetTimer)
    window.addEventListener('scroll', resetTimer)
    resetTimer()
    return () => {
      if (logoutTimer.current) clearTimeout(logoutTimer.current)
      window.removeEventListener('mousemove', resetTimer)
      window.removeEventListener('keydown', resetTimer)
      window.removeEventListener('scroll', resetTimer)
    }
  }, [signOut])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await client.auth.signInWithPassword({ 
      email, 
      password 
    })
    return { data, error }
  }

  const signUp = async (email: string, password: string) => {
    const { data, error } = await client.auth.signUp({ 
      email, 
      password 
    })
    return { data, error }
  }

  // Re-fetch session on tab visibility change
  useEffect(() => {
    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'visible') {
        const { data: { session } } = await client.auth.getSession();
        setSession(session);
        setUser(session?.user || null);
        if (session?.user) {
          const { data } = await client
            .from('users')
            .select('is_admin')
            .eq('auth_user_id', session.user.id)
            .single();
          setIsAdmin(!!data?.is_admin);
        } else {
          setIsAdmin(false);
        }
        setLoading(false);
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [client]);

  return (
    <AuthContext.Provider value={{ 
      user, 
      session, 
      isAdmin,
      signIn, 
      signUp, 
      signOut, 
      loading 
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used inside AuthProvider')
  return context
}
