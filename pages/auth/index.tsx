import { zodResolver } from '@hookform/resolvers/zod'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useId, useState } from 'react'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import Toast from '@/components/ui/Toast'
import { useAuth } from '@/context/AuthContext'
import { useSupabase } from '@/context/SupabaseContext'

const authSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})
type AuthFormValues = z.infer<typeof authSchema>

const resetSchema = z.object({
  email: z.string().email('Enter a valid email'),
})
type ResetFormValues = z.infer<typeof resetSchema>

export default function AuthPage() {
  const router = useRouter()
  const { signIn, signUp } = useAuth()
  const supabaseContext = useSupabase()
  const fId = useId()
  const [isLogin, setIsLogin] = useState(true)
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null)
  const [resetMode, setResetMode] = useState(false)
  const [resendLoading, setResendLoading] = useState(false)

  const {
    register: authRegister,
    handleSubmit: authHandleSubmit,
    getValues: authGetValues,
    watch: authWatch,
    setError: authSetError,
    clearErrors: authClearErrors,
    formState: { errors: authErrors, isSubmitting: authSubmitting },
  } = useForm<AuthFormValues>({ resolver: zodResolver(authSchema) })

  const {
    register: resetRegister,
    handleSubmit: resetHandleSubmit,
    setValue: resetSetValue,
    formState: { errors: resetErrors, isSubmitting: resetSubmitting },
  } = useForm<ResetFormValues>({ resolver: zodResolver(resetSchema) })

  const watchedEmail = authWatch('email')

  useEffect(() => {
    if (router.query.reset === 'success') {
      setToast({ message: 'Password updated! You can now log in.', type: 'success' })

      const cleaned = { ...router.query }
      delete cleaned.reset
      router.replace({ pathname: router.pathname, query: cleaned }, undefined, { shallow: true })
    }
  }, [router.query, router])

  if (!supabaseContext) {
    return <div className="p-8">Error: Supabase client not available</div>
  }
  const { client: supabase } = supabaseContext

  const onResetSubmit = async (data: ResetFormValues) => {
    const { error } = await supabase.auth.resetPasswordForEmail(data.email, {
      redirectTo: `${window.location.origin}/auth/reset`,
    })
    if (error) {
      setToast({ message: error.message, type: 'error' })
      return
    }
    setToast({ message: 'Password reset email sent!', type: 'success' })
  }

  const onAuthSubmit = async (data: AuthFormValues) => {
    authClearErrors()
    setToast(null)

    try {
      console.log('Attempting auth:', isLogin ? 'signIn' : 'signUp', { email: data.email })

      const action = isLogin ? signIn : signUp
      const { error } = await action(data.email, data.password)

      if (error) {
        let errorMessage = error.message
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = 'Invalid email or password. Please check your credentials and try again.'
          console.log('Login failed: Invalid credentials')
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = 'Please check your email and confirm your account before logging in.'
          console.log('Login failed: Email not confirmed')
        } else if (error.message.includes('User already registered')) {
          errorMessage = 'An account with this email already exists. Please log in instead.'
          console.log('Signup failed: User already exists')
        } else {
          console.error('Unexpected auth error:', error)
        }
        authSetError('root', { message: errorMessage })
        return
      }

      console.log('Auth successful:', isLogin ? 'signIn' : 'signUp')

      setToast({
        message: isLogin ? 'Logged in successfully!' : 'Account created successfully!',
        type: 'success',
      })

      const redirectTo = (router.query.from as string) || '/'
      await new Promise((resolve) => setTimeout(resolve, 1500))
      router.push(redirectTo)
    } catch (err) {
      console.error('Unexpected auth error:', err)
      const errorMessage =
        err instanceof Error ? err.message : 'An unexpected error occurred. Please try again.'
      authSetError('root', { message: errorMessage })
    }
  }

  const handleResendConfirmation = async () => {
    const email = authGetValues('email')
    if (!email) {
      setToast({ message: 'Please enter your email address first.', type: 'error' })
      return
    }
    setResendLoading(true)
    const { error } = await supabase.auth.resend({ type: 'signup', email })
    if (error) {
      setToast({ message: error.message, type: 'error' })
    } else {
      setToast({ message: 'Confirmation email resent! Please check your inbox.', type: 'success' })
    }
    setResendLoading(false)
  }

  return (
    <div className="min-h-screen bg-white px-4 sm:px-8 py-6 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/3 right-1/3 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/3 left-1/3 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
      </div>

      <div className="relative">
        <button
          type="button"
          onClick={() => router.back()}
          className="ml-4 mt-6 text-emerald-600 hover:text-emerald-700 text-base flex items-center"
        >
          ← Back
        </button>

        <div className="max-w-md mx-auto px-6 py-20">
          <h1 className="text-3xl font-light text-center text-zinc-900 mb-6">
            {isLogin ? 'Login' : 'Create an Account'}
          </h1>
          {resetMode ? (
            <form
              onSubmit={resetHandleSubmit(onResetSubmit)}
              noValidate
              className="space-y-6 bg-gray-50 border border-gray-200 p-8 rounded-2xl"
            >
              <h2 className="text-xl font-semibold text-center text-zinc-900">
                Reset Your Password
              </h2>

              <div>
                <label
                  htmlFor={`${fId}-reset-email`}
                  className="block text-base font-medium text-zinc-900"
                >
                  Email
                </label>
                <input
                  type="email"
                  id={`${fId}-reset-email`}
                  {...resetRegister('email')}
                  className="mt-1 p-2 w-full border border-gray-300 bg-white text-zinc-900 rounded"
                />
                {resetErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{resetErrors.email.message}</p>
                )}
              </div>
              <button
                type="submit"
                disabled={resetSubmitting}
                className="w-full bg-zinc-900 text-white py-3 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 font-medium"
              >
                {resetSubmitting ? 'Sending...' : 'Send Reset Link'}
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
            <form
              onSubmit={authHandleSubmit(onAuthSubmit)}
              noValidate
              className="space-y-6 bg-gray-50 border border-gray-200 p-8 rounded-2xl"
            >
              {authErrors.root && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 p-3 rounded-lg text-sm">
                  <div className="flex items-center gap-2">
                    <svg
                      aria-hidden="true"
                      focusable="false"
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
                    <span>{authErrors.root.message}</span>
                  </div>
                </div>
              )}

              <div>
                <label
                  htmlFor={`${fId}-email`}
                  className="block text-base font-medium text-zinc-900"
                >
                  Email
                </label>
                <input
                  type="email"
                  id={`${fId}-email`}
                  {...authRegister('email')}
                  className="mt-1 p-2 w-full border border-gray-300 bg-white text-zinc-900 rounded"
                />
                {authErrors.email && (
                  <p className="mt-1 text-sm text-red-600">{authErrors.email.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor={`${fId}-password`}
                  className="block text-base font-medium text-zinc-900"
                >
                  Password
                </label>
                <input
                  type="password"
                  id={`${fId}-password`}
                  {...authRegister('password')}
                  className="mt-1 p-2 w-full border border-gray-300 bg-white text-zinc-900 rounded"
                />
                {authErrors.password && (
                  <p className="mt-1 text-sm text-red-600">{authErrors.password.message}</p>
                )}
              </div>
              {isLogin && !resetMode && (
                <>
                  <p className="text-right text-base mt-2">
                    <button
                      type="button"
                      className="text-emerald-600 hover:underline"
                      onClick={() => {
                        resetSetValue('email', authGetValues('email') || '')
                        setResetMode(true)
                      }}
                    >
                      Forgot password?
                    </button>
                  </p>
                  {watchedEmail &&
                    authErrors.root?.message &&
                    /confirm/i.test(authErrors.root.message) && (
                      <p className="text-right text-xs mt-1">
                        <button
                          type="button"
                          className="text-emerald-600 hover:underline"
                          onClick={handleResendConfirmation}
                          disabled={resendLoading}
                        >
                          Resend confirmation email
                        </button>
                      </p>
                    )}
                </>
              )}
              <button
                type="submit"
                disabled={authSubmitting}
                className="w-full bg-zinc-900 text-white py-3 rounded-lg hover:bg-zinc-800 transition-colors disabled:opacity-50 font-medium"
              >
                {authSubmitting ? 'Please wait...' : isLogin ? 'Login' : 'Sign Up'}
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
                  onClick={() => {
                    setIsLogin(!isLogin)
                    authClearErrors()
                  }}
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
