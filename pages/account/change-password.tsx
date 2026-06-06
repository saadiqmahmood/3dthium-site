import Link from 'next/link'
import { useRouter } from 'next/router'
import { useId, useState } from 'react'
import Toast from '@/components/ui/Toast'
import { useAuth } from '@/context/AuthContext'
import { useSupabase } from '@/context/SupabaseContext'

function EyeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  )
}

function EyeOffIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  )
}

export default function ChangePasswordPage() {
  const { user, loading: authLoading } = useAuth()
  const supabaseContext = useSupabase()
  const router = useRouter()
  const fId = useId()

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [done, setDone] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const tooShort = newPassword.length > 0 && newPassword.length < 8
  const mismatch = confirmPassword.length > 0 && newPassword !== confirmPassword
  const valid = newPassword.length >= 8 && newPassword === confirmPassword

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!valid || !supabaseContext) return

    setSubmitting(true)
    const { error } = await supabaseContext.client.auth.updateUser({ password: newPassword })
    setSubmitting(false)

    if (error) {
      setToast({ message: error.message, type: 'error' })
      return
    }

    setDone(true)
    setTimeout(() => router.push('/account'), 2500)
  }

  if (authLoading) return null

  if (!user) {
    router.replace('/auth')
    return null
  }

  return (
    <div className="min-h-screen bg-white pt-24 pb-16">
      <div className="max-w-lg mx-auto px-6">

        <Link
          href="/account"
          className="inline-flex items-center gap-2 text-sm font-light text-zinc-400 hover:text-zinc-700 transition-colors mb-8 group"
        >
          <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 transition-transform group-hover:-translate-x-0.5">
            <path d="M12.5 5L7.5 10l5 5" />
          </svg>
          Back to account
        </Link>

        <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-8">
          {done ? (
            <div className="text-center py-6">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-emerald-600">
                  <path d="M20 6L9 17l-5-5" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-zinc-900 mb-2">Password updated</h2>
              <p className="text-sm font-light text-zinc-500">
                Your password has been changed. Redirecting you back&hellip;
              </p>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-zinc-900 mb-1.5">Change password</h1>
                <p className="text-sm font-light text-zinc-500">
                  Choose a strong password — at least 8 characters.
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                {/* New password */}
                <div>
                  <label
                    htmlFor={`${fId}-new`}
                    className="block text-sm font-light text-zinc-700 mb-1.5"
                  >
                    New password
                  </label>
                  <div className="relative">
                    <input
                      id={`${fId}-new`}
                      type={showNew ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      placeholder="At least 8 characters"
                      className={`w-full border rounded-lg px-4 py-2.5 pr-10 text-sm font-light text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 focus:outline-none transition-colors ${
                        tooShort ? 'border-red-300' : 'border-gray-200'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNew((v) => !v)}
                      aria-label={showNew ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      {showNew ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {tooShort && (
                    <p className="mt-1.5 text-xs text-red-500">Must be at least 8 characters</p>
                  )}
                </div>

                {/* Confirm password */}
                <div>
                  <label
                    htmlFor={`${fId}-confirm`}
                    className="block text-sm font-light text-zinc-700 mb-1.5"
                  >
                    Confirm new password
                  </label>
                  <div className="relative">
                    <input
                      id={`${fId}-confirm`}
                      type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      autoComplete="new-password"
                      placeholder="Re-enter your new password"
                      className={`w-full border rounded-lg px-4 py-2.5 pr-10 text-sm font-light text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 focus:outline-none transition-colors ${
                        mismatch ? 'border-red-300' : 'border-gray-200'
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((v) => !v)}
                      aria-label={showConfirm ? 'Hide password' : 'Show password'}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 transition-colors"
                    >
                      {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </div>
                  {mismatch && (
                    <p className="mt-1.5 text-xs text-red-500">Passwords don&apos;t match</p>
                  )}
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={!valid || submitting}
                    className="w-full bg-emerald-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Updating&hellip;
                      </>
                    ) : (
                      'Update password'
                    )}
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />
      )}
    </div>
  )
}
