import { useRouter } from 'next/router'
import { useEffect } from 'react'
import { useAuth } from '@/context/AuthContext'

export default function EmailChangedPage() {
  const { user } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!user) {
      // Redirect to login if not authenticated
      router.replace('/auth')
    }
  }, [user, router])

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
        <div className="max-w-md w-full bg-white rounded-xl shadow p-8 text-center">
          <h1 className="text-2xl font-bold mb-6 text-stone-800">Email Change</h1>
          <p className="text-gray-700">Please log in to complete your email change.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow p-8 text-center">
        <h1 className="text-2xl font-bold mb-6 text-stone-800">Email Changed!</h1>
        <p className="text-green-700 text-lg font-semibold mb-4">
          Your email has been successfully updated.
        </p>
        <button
          type="button"
          onClick={() => router.push('/account')}
          className="mt-6 w-full text-blue-600 hover:underline text-sm"
        >
          &larr; Back to Account
        </button>
      </div>
    </div>
  )
}
