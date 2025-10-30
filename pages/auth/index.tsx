import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Toast from '@/components/ui/Toast'
import { useAuth } from '@/context/AuthContext'
import { useSupabase } from '@/context/SupabaseContext'

export default function AuthPage() {
  const router = useRouter()
  const { signIn, signUp } = useAuth()
  const supabaseContext = useSupabase()
  const [isLogin, setIsLogin] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null)
  const [resetMode, setResetMode] = useState(false)

  useEffect(() => {
    if (router.query.reset === 'success') {
      setToast({ message: 'Password updated! You can now log in.', type: 'success' })

      // Optionally remove the query from the URL after showing the toast
      const cleaned = { ...router.query }
      delete cleaned.reset
      router.replace({ pathname: router.pathname, query: cleaned }, undefined, { shallow: true })
    }
  }, [router.query, router])

  if (!supabaseContext) {
    return <div className="p-8">Error: Supabase client not available</div>
  }
  const { client: supabase } = supabaseContext

  const handlePasswordReset = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    })

    if (error) {
      setToast({ message: error.message, type: 'error' })
      setLoading(false)
      return
    }

    setToast({ message: 'Password reset email sent!', type: 'success' })
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('') // Optional if you're not displaying `error`

    console.log('Attempting auth:', isLogin ? 'signIn' : 'signUp', { email })

    const action = isLogin ? signIn : signUp
    const { error } = await action(email, password)

    if (error) {
      console.error('Auth error:', error)
      setToast({ message: error.message, type: 'error' })
      setLoading(false) // 🔥 ensure button is re-enabled
      return
    }

    console.log('Auth successful:', isLogin ? 'signIn' : 'signUp')

    // ✅ Success
    setToast({
      message: isLogin ? 'Logged in successfully!' : 'Account created successfully!',
      type: 'success',
    })

    // ✅ Delay redirect to show toast
    const redirectTo = (router.query.from as string) || '/'
    setTimeout(() => {
      setLoading(false) // optional here since you're leaving the page
      router.push(redirectTo)
    }, 1500)
  }

  const handleResendConfirmation = async () => {
    if (!email) {
      setToast({ message: 'Please enter your email address first.', type: 'error' })
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) {
      setToast({ message: error.message, type: 'error' })
    } else {
      setToast({ message: 'Confirmation email resent! Please check your inbox.', type: 'success' })
    }
    setLoading(false)
  }

  return (
    <div className="px-4 sm:px-8 py-6">
      <button
        type="button"
        onClick={() => router.back()}
        className="ml-4 mt-6 text-blue-600 hover:text-blue-800 text-sm flex items-center"
      >
        ← Back
      </button>

      <div className="max-w-md mx-auto px-6 py-20">
        <h1 className="text-3xl font-bold text-center text-stone-800 mb-6">
          {isLogin ? 'Login' : 'Create an Account'}
        </h1>
        {resetMode ? (
          <form onSubmit={handlePasswordReset} className="space-y-6 bg-white p-8 rounded-xl shadow">
            <h2 className="text-xl font-semibold text-center text-stone-800">
              Reset Your Password
            </h2>

            <div>
              <label htmlFor="reset-email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="reset-email"
                className="mt-1 p-2 w-full border border-gray-300 rounded text-stone-800"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {isLogin && (
              <p className="text-right text-sm">
                <button
                  type="button"
                  className="text-blue-600 hover:underline"
                  onClick={() => setResetMode(true)}
                >
                  Forgot password?
                </button>
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <p className="text-center text-sm text-gray-600">
              <button
                type="button"
                onClick={() => setResetMode(false)}
                className="text-blue-600 hover:underline"
              >
                ← Back to {isLogin ? 'Login' : 'Sign Up'}
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-xl shadow">
            {error && (
              <div className="bg-red-100 text-red-700 border border-red-300 p-3 rounded">
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="mt-1 p-2 w-full border border-gray-300 text-stone-800 rounded"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                id="password"
                className="mt-1 p-2 w-full border border-gray-300 text-stone-800 rounded"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {isLogin && !resetMode && (
              <>
                <p className="text-right text-sm mt-2">
                  <button
                    type="button"
                    className="text-blue-600 hover:underline"
                    onClick={() => setResetMode(true)}
                  >
                    Forgot password?
                  </button>
                </p>
                {/* Only show resend link if error message indicates email not confirmed */}
                {email && error && /confirm/i.test(error) && (
                  <p className="text-right text-xs mt-1">
                    <button
                      type="button"
                      className="text-blue-600 hover:underline"
                      onClick={handleResendConfirmation}
                      disabled={loading}
                    >
                      Resend confirmation email
                    </button>
                  </p>
                )}
              </>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? 'Please wait...' : isLogin ? 'Login' : 'Sign Up'}
            </button>

            {!isLogin && (
              <p className="text-center text-xs text-gray-500 mt-2">
                By signing up, you agree to our{' '}
                <Link href="/privacy" className="text-blue-600 hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            )}
            <p className="text-center text-sm text-gray-600">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                className="text-blue-600 hover:underline"
                onClick={() => setIsLogin(!isLogin)}
              >
                {isLogin ? 'Sign Up' : 'Login'}
              </button>
            </p>
          </form>
        )}
        {toast && (
          <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
        )}
      </div>
    </div>
  )
}
