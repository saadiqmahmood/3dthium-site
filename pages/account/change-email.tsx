import Link from 'next/link'
import { useRouter } from 'next/router'
import { useId, useState } from 'react'
import Toast from '@/components/ui/Toast'
import { useAuth } from '@/context/AuthContext'
import { useSupabase } from '@/context/SupabaseContext'

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export default function ChangeEmailPage() {
  const { user, loading: authLoading } = useAuth()
  const supabaseContext = useSupabase()
  const router = useRouter()
  const fId = useId()

  const [newEmail, setNewEmail] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const emailValid = isValidEmail(newEmail)
  const isSame = newEmail.trim().toLowerCase() === (user?.email ?? '').toLowerCase()
  const canSubmit = emailValid && !isSame

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!canSubmit || !supabaseContext) return

    setSubmitting(true)
    const { error } = await supabaseContext.client.auth.updateUser({
      email: newEmail.trim(),
    })
    setSubmitting(false)

    if (error) {
      setToast({ message: error.message, type: 'error' })
      return
    }

    setSent(true)
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
          {sent ? (
            /* ── Success state ── */
            <div className="py-2">
              <div className="w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-5">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" className="w-6 h-6 text-emerald-600">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-zinc-900 mb-3">Check your inbox</h2>
              <p className="text-sm font-light text-zinc-600 leading-relaxed mb-4">
                We&apos;ve sent confirmation emails to:
              </p>
              <div className="space-y-2 mb-5">
                <div className="flex items-center gap-3 bg-zinc-50 rounded-lg px-4 py-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-zinc-400 w-12 flex-shrink-0">Current</span>
                  <span className="text-sm text-zinc-700 font-light truncate">{user.email}</span>
                </div>
                <div className="flex items-center gap-3 bg-emerald-50 rounded-lg px-4 py-3">
                  <span className="text-xs font-medium uppercase tracking-wide text-emerald-500 w-12 flex-shrink-0">New</span>
                  <span className="text-sm text-zinc-700 font-light truncate">{newEmail.trim()}</span>
                </div>
              </div>
              <p className="text-sm font-light text-zinc-500 leading-relaxed mb-6">
                Click the confirmation link in the email sent to your <span className="text-zinc-700">new address</span> to complete the change. The link expires in 24 hours.
              </p>
              <Link
                href="/account"
                className="inline-flex items-center gap-2 text-sm font-medium text-emerald-600 hover:text-emerald-700 transition-colors"
              >
                Back to account
              </Link>
            </div>
          ) : (
            /* ── Form ── */
            <>
              <div className="mb-8">
                <h1 className="text-2xl font-bold text-zinc-900 mb-1.5">Change email</h1>
                <p className="text-sm font-light text-zinc-500">
                  We&apos;ll send a confirmation link to your new address before the change takes effect.
                </p>
              </div>

              {/* Current email (read-only, for context) */}
              <div className="mb-6 p-4 bg-zinc-50 rounded-lg border border-zinc-100">
                <p className="text-xs font-medium uppercase tracking-wide text-zinc-400 mb-1">Current email</p>
                <p className="text-sm text-zinc-700 font-light">{user.email}</p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="space-y-5">
                <div>
                  <label
                    htmlFor={`${fId}-email`}
                    className="block text-sm font-light text-zinc-700 mb-1.5"
                  >
                    New email address
                  </label>
                  <input
                    id={`${fId}-email`}
                    type="email"
                    value={newEmail}
                    onChange={(e) => setNewEmail(e.target.value)}
                    required
                    autoComplete="email"
                    placeholder="you@example.com"
                    className={`w-full border rounded-lg px-4 py-2.5 text-sm font-light text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 focus:outline-none transition-colors ${
                      newEmail.length > 0 && !emailValid ? 'border-red-300' : 'border-gray-200'
                    }`}
                  />
                  {newEmail.length > 0 && !emailValid && (
                    <p className="mt-1.5 text-xs text-red-500">Enter a valid email address</p>
                  )}
                  {isSame && emailValid && (
                    <p className="mt-1.5 text-xs text-zinc-400">This is your current email address</p>
                  )}
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={!canSubmit || submitting}
                    className="w-full bg-emerald-600 text-white rounded-lg py-2.5 text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Sending&hellip;
                      </>
                    ) : (
                      'Send confirmation email'
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
