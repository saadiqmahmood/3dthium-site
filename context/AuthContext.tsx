import { createContext, useContext, useEffect, useState, ReactNode } from 'react'
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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const { client } = useSupabase()
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [loading, setLoading] = useState(true)

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

  const signOut = async () => {
    await client.auth.signOut()
    setSession(null)
    setUser(null)
    setIsAdmin(false)
  }

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
