import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useSupabase } from '@/context/SupabaseContext'

type DebugInfo = {
  data?: unknown
  error?: unknown
}

export default function SessionDebug() {
  const { user, session, isAdmin, loading } = useAuth()
  const supabaseContext = useSupabase()
  const [debugInfo, setDebugInfo] = useState<DebugInfo | null>(null)

  if (!supabaseContext) {
    return null
  }
  const { client } = supabaseContext

  const checkSession = async () => {
    console.log('🔍 [SessionDebug] Checking session manually...')
    const { data, error } = await client.auth.getSession()
    console.log('📋 [SessionDebug] Manual session check:', { data, error })
    setDebugInfo({ data, error })
  }

  const testUserQuery = async () => {
    if (!user) {
      console.log('❌ [SessionDebug] No user to test query with')
      return
    }

    console.log('🔍 [SessionDebug] Testing user query...')
    const { data, error } = await client
      .from('users')
      .select('*')
      .eq('auth_user_id', user.id)
      .single()

    console.log('📋 [SessionDebug] User query result:', { data, error })
    setDebugInfo({ data, error })
  }

  if (process.env.NODE_ENV === 'production') {
    return null // Don't show in production
  }

  return (
    <div className="fixed bottom-4 right-4 bg-black text-white p-4 rounded-lg text-xs max-w-sm z-50">
      <h3 className="font-bold mb-2">🔧 Session Debug</h3>
      <div className="space-y-1">
        <div>Loading: {loading ? 'Yes' : 'No'}</div>
        <div>Has User: {user ? 'Yes' : 'No'}</div>
        <div>Has Session: {session ? 'Yes' : 'No'}</div>
        <div>Is Admin: {isAdmin ? 'Yes' : 'No'}</div>
        {user && (
          <>
            <div>User ID: {user.id}</div>
            <div>Email: {user.email}</div>
          </>
        )}
        {session && (
          <div>Session Expires: {new Date(session.expires_at! * 1000).toLocaleString()}</div>
        )}
      </div>

      <div className="mt-3 space-y-1">
        <button
          type="button"
          onClick={checkSession}
          className="bg-blue-600 px-2 py-1 rounded text-xs mr-2"
        >
          Check Session
        </button>
        <button
          type="button"
          onClick={testUserQuery}
          className="bg-green-600 px-2 py-1 rounded text-xs"
        >
          Test Query
        </button>
      </div>

      {debugInfo && (
        <div className="mt-2 p-2 bg-gray-800 rounded text-xs">
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
