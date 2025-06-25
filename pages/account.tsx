import { useAuth } from '@/context/AuthContext'
import { useRouter } from 'next/router'
import { useEffect } from 'react'

export default function AccountPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth')
    }
  }, [user, loading, router])

  if (loading || !user) {
    return <p className="text-center py-20 text-gray-600">Loading account...</p>
  }

  return (
    <div className="px-4 sm:px-8 py-6">
      {/* 🔙 Back Button */}
      <button
        onClick={() => router.back()}
        className="ml-4 mt-6 text-blue-600 hover:text-blue-800 text-sm flex items-center"
      >
        ← Back
      </button>

      <div className="max-w-md mx-auto px-6 py-20">
        <h1 className="text-3xl font-bold text-center text-stone-800 mb-6">
          My Account
        </h1>

        <div className="space-y-6 bg-white p-8 rounded-xl shadow">
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email:
                </label>
                <p className="text-base text-stone-800 bg-transparent">
                    {user.email}
                </p>
            </div>
          <button
            onClick={signOut}
            className="w-full bg-stone-800 text-white py-2 rounded hover:bg-stone-700 transition"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  )
}
