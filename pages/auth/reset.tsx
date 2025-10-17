import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Toast from '@/components/ui/Toast'
import { useSupabase } from '@/context/SupabaseContext'

export default function PasswordResetPage() {
  const [newPassword, setNewPassword] = useState('')
  const [loading, setLoading] = useState(true)
  const [validSession, setValidSession] = useState(false)
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null)
  const router = useRouter()
  const { client: supabase } = useSupabase()

  // Check if session is valid (link not expired)
  useEffect(() => {
    const checkSession = async () => {
      const { data } = await supabase.auth.getSession()
      if (data.session) {
        setValidSession(true)
      } else {
        setToast({
          message: 'This reset link has expired or is invalid. Please request a new one.',
          type: 'error',
        })
      }
      setLoading(false)
    }

    checkSession()
  }, [supabase])

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    const { error } = await supabase.auth.updateUser({ password: newPassword })

    if (error) {
      setToast({ message: error.message, type: 'error' })
      setLoading(false)
      return
    }

    setToast({ message: 'Password updated successfully!', type: 'success' })
    setTimeout(() => router.push('/auth?reset=success'), 2000)
  }

  if (loading) {
    return <p className="text-center py-10 text-gray-600">Checking session...</p>
  }

  if (!validSession) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white shadow-md p-8 rounded-lg space-y-6 text-center">
          <h1 className="text-xl font-semibold text-red-600">Reset Link Invalid or Expired</h1>
          <p className="text-gray-700">Please go back and request a new password reset email.</p>
          <button
            onClick={() => router.push('/auth')}
            className="mt-4 inline-block bg-blue-600 text-white py-2 px-4 rounded hover:bg-blue-700"
          >
            Return to Login
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form
        onSubmit={handlePasswordUpdate}
        className="max-w-md w-full bg-white shadow-md p-8 rounded-lg space-y-6"
      >
        <h1 className="text-2xl font-semibold text-center text-stone-800">Set New Password</h1>

        <div>
          <label htmlFor="new-password" className="block text-sm font-medium text-gray-700">
            New Password
          </label>
          <input
            id="new-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            className="mt-1 p-2 w-full border border-gray-300 rounded text-stone-800"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
        >
          {loading ? 'Updating...' : 'Update Password'}
        </button>

        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </form>
    </div>
  )
}
