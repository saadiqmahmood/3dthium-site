import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useCart } from '../context/CartContext'
import { formatMoney } from '@/lib/format/money'

export default function SuccessPage() {
  const router = useRouter()
  const { clearCart } = useCart()
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [promoCode, setPromoCode] = useState<string | null>(null)
  const [discount, setDiscount] = useState<string | null>(null)

  useEffect(() => {
    // Get session_id from URL query params
    const { session_id } = router.query
    if (session_id && typeof session_id === 'string') {
      setSessionId(session_id)
      // Fetch promo code/discount from backend
      fetch(`/api/stripe/session?session_id=${session_id}`)
        .then((res) => res.json())
        .then((data) => {
          setPromoCode(data.promo_code || null)
          setDiscount(data.discount || null)
        })
    }
    // Clear the cart on successful payment
    clearCart()
  }, [router.query, clearCart])

  const handleContinueShopping = () => {
    console.log('Navigating to home page...')
    try {
      router.push('/')
    } catch (error) {
      console.error('Router navigation failed:', error)
      // Fallback to window.location
      window.location.href = '/'
    }
  }

  const handleContactSupport = () => {
    console.log('Navigating to contact page...')
    try {
      router.push('/contact')
    } catch (error) {
      console.error('Router navigation failed:', error)
      // Fallback to window.location
      window.location.href = '/contact'
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-20 px-6 text-center">
      <div className="bg-white rounded-xl shadow p-8 max-w-lg mx-auto">
        <div className="mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-green-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Successful!</h1>
          <p className="text-gray-600">
            Thank you for your order. We&apos;ll send you a confirmation email shortly.
          </p>
        </div>

        {sessionId && (
          <div className="bg-gray-50 rounded-lg p-4 mb-6">
            <p className="text-sm text-gray-600">Order Reference:</p>
            <div className="overflow-x-auto">
              <p
                className="font-mono text-xs text-gray-800 break-all min-w-0"
                style={{ wordBreak: 'break-all', maxWidth: '100%' }}
              >
                {sessionId}
              </p>
            </div>
            {promoCode && (
              <p className="text-green-700 text-sm mt-2">
                Promo code: <span className="font-mono font-semibold">{promoCode}</span>
              </p>
            )}
            {discount && (
              <p className="text-green-700 text-sm">
                Discount: -{formatMoney(discount)}
              </p>
            )}
          </div>
        )}

        <div className="space-y-4">
          <button
            onClick={handleContinueShopping}
            className="block w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition"
          >
            Continue Shopping
          </button>
          <button
            onClick={handleContactSupport}
            className="block w-full bg-gray-100 text-gray-700 py-3 px-4 rounded-lg hover:bg-gray-200 transition"
          >
            Contact Support
          </button>
        </div>
      </div>
    </div>
  )
}
