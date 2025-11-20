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
    setError('')
    setToast(null) // Clear any previous toast

    try {
      console.log('Attempting auth:', isLogin ? 'signIn' : 'signUp', { email })

      const action = isLogin ? signIn : signUp
      const { error } = await action(email, password)

      if (error) {
        // Provide user-friendly error messages
        let errorMessage = error.message
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.'
          // Only log unexpected errors, not expected auth failures
          console.log('Login failed: Invalid credentials')
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and confirm your account before logging in.'
          console.log('Login failed: Email not confirmed')
        } else if (error.message.includes('User already registered')) {
          errorMessage = 'An account with this email already exists. Please log in instead.'
          console.log('Signup failed: User already exists')
        } else {
          // Log unexpected errors for debugging
          console.error('Unexpected auth error:', error)
        }

        setError(errorMessage)
        setLoading(false)
        return
      }

      console.log('Auth successful:', isLogin ? 'signIn' : 'signUp')

      // ✅ Success
      setError('')
      setToast({
        message: isLogin ? 'Logged in successfully!' : 'Account created successfully!',
        type: 'success',
      })

      // ✅ Delay redirect to show toast
      const redirectTo = (router.query.from as string) || '/'
      setTimeout(() => {
        setLoading(false)
        router.push(redirectTo)
      }, 1500)
    } catch (err) {
      // Catch any unexpected errors
      console.error('Unexpected auth error:', err)
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.'
      setError(errorMessage)
      setLoading(false)
    }
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
    <div className="min-h-screen bg-zinc-950 px-4 sm:px-8 py-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 left-1/3 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative">
      <button
        type="button"
        onClick={() => router.back()}
        className="ml-4 mt-6 text-emerald-400 hover:text-blue-800 text-sm flex items-center"
      >
        ← Back
      </button>

      <div className="max-w-md mx-auto px-6 py-20">
        <h1 className="text-3xl font-light text-center text-white mb-6">
          {isLogin ? 'Login' : 'Create an Account'}
        </h1>
        {resetMode ? (
          <form onSubmit={handlePasswordReset} className="space-y-6 bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl">
            <h2 className="text-xl font-semibold text-center text-white">
              Reset Your Password
            </h2>

            <div>
              <label htmlFor="reset-email" className="block text-base font-medium text-white">
                Email
              </label>
              <input
                type="email"
                id="reset-email"
                className="mt-1 p-2 w-full border border-zinc-700 bg-zinc-900 text-white rounded text-white"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            {isLogin && (
              <p className="text-right text-base">
                <button
                  type="button"
                  className="text-emerald-400 hover:underline"
                  onClick={() => setResetMode(true)}
                >
                  Forgot password?
                </button>
              </p>
            )}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-white text-zinc-950 py-3 rounded-lg hover:bg-zinc-100 transition-colors disabled:opacity-50 font-medium"
            >
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>

            <p className="text-center text-sm text-gray-600">
              <button
                type="button"
                onClick={() => setResetMode(false)}
                className="text-emerald-400 hover:underline"
              >
                ← Back to {isLogin ? 'Login' : 'Sign Up'}
              </button>
            </p>
          </form>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6 bg-zinc-900/50 border border-zinc-800 p-8 rounded-2xl">
            {error && (
              <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm">
                <div className="flex items-center gap-2">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-5 w-5 flex-shrink-0"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{error}</span>
                </div>
              </div>
            )}

            <div>
              <label htmlFor="email" className="block text-base font-medium text-white">
                Email
              </label>
              <input
                type="email"
                id="email"
                className="mt-1 p-2 w-full border border-zinc-700 bg-zinc-900 text-white text-white rounded"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-base font-medium text-white">
                Password
              </label>
              <input
                type="password"
                id="password"
                className="mt-1 p-2 w-full border border-zinc-700 bg-zinc-900 text-white text-white rounded"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            {isLogin && !resetMode && (
              <>
                <p className="text-right text-base mt-2">
                  <button
                    type="button"
                    className="text-emerald-400 hover:underline"
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
                      className="text-emerald-400 hover:underline"
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
              className="w-full bg-white text-zinc-950 py-3 rounded-lg hover:bg-zinc-100 transition-colors disabled:opacity-50 font-medium"
            >
              {loading ? 'Please wait...' : isLogin ? 'Login' : 'Sign Up'}
            </button>

            {!isLogin && (
              <p className="text-center text-xs text-gray-500 mt-2">
                By signing up, you agree to our{' '}
                <Link href="/privacy" className="text-emerald-400 hover:underline">
                  Privacy Policy
                </Link>
                .
              </p>
            )}
            <p className="text-center text-sm text-gray-600">
              {isLogin ? "Don't have an account?" : 'Already have an account?'}{' '}
              <button
                type="button"
                className="text-emerald-400 hover:underline"
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
    </div>
  )
}
