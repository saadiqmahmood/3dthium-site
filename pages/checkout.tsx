import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import type { ShippingAddress, ShippingRate } from '@/types'

export default function CheckoutPage() {
  const { cart } = useCart()
  const { user, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [checkoutMode, setCheckoutMode] = useState<'choice' | 'guest'>('choice')
  const [shippingStep, setShippingStep] = useState<'address' | 'rates' | 'payment'>('address')
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([])
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null)
  const [isLoadingRates, setIsLoadingRates] = useState(false)
  const router = useRouter()

  // Shipping address form
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: '',
    street1: '',
    street2: '',
    city: '',
    state: '',
    zip: '',
    country: 'GB',
    phone: '',
    email: '',
  })

  const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const shippingCost = selectedRate ? parseFloat(selectedRate.rate) : 0
  const total = subtotal + shippingCost

  // Calculate shipping rates when address is provided
  const calculateShippingRates = async () => {
    if (!shippingAddress.street1 || !shippingAddress.city || !shippingAddress.zip) {
      return
    }

    setIsLoadingRates(true)
    try {
      const response = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          address_to: shippingAddress,
          cart_items: cart,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to calculate shipping rates')
      }

      const data = await response.json()
      setShippingRates(data.rates)
      setShippingStep('rates')
    } catch (error) {
      console.error('Error calculating shipping rates:', error)
      alert('Failed to calculate shipping rates. Please try again.')
    } finally {
      setIsLoadingRates(false)
    }
  }

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (
      !shippingAddress.name ||
      !shippingAddress.street1 ||
      !shippingAddress.city ||
      !shippingAddress.zip
    ) {
      alert('Please fill in all required fields')
      return
    }
    calculateShippingRates()
  }

  const handleCheckout = async (customerEmail: string) => {
    if (!selectedRate) {
      alert('Please select a shipping method')
      return
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/checkout_sessions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          cart,
          email: customerEmail,
          user_id: user?.id || undefined,
          shipping_address: shippingAddress,
          shipping_rate_id: selectedRate.object_id,
          shipping_cost: shippingCost,
          shipping_provider: selectedRate.provider,
          shipping_service: selectedRate.servicelevel.name,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to create checkout session')
      }

      const { url } = await response.json()
      window.location.href = url
    } catch (error) {
      console.error('Checkout error:', error)
      alert('Failed to create checkout session. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleGuestCheckout = (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setEmailError('Please enter a valid email address.')
      return
    }
    setEmailError('')
    handleCheckout(email)
  }

  const handleLoggedInCheckout = () => {
    if (user?.email) {
      handleCheckout(user.email)
    }
  }

  // Update the main back button logic
  const handleBack = () => {
    if (shippingStep === 'rates') {
      setShippingStep('address')
    } else if (shippingStep === 'payment') {
      setShippingStep('rates')
    } else {
      router.back()
    }
  }

  // Show loading while checking auth status
  if (authLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-emerald-500/5 rounded-full blur-3xl"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl"></div>
      </div>
      
      <div className="relative max-w-4xl mx-auto py-24 px-6">
      <button
        type="button"
        onClick={handleBack}
        className="mb-6 text-sm text-blue-600 hover:underline flex items-center"
      >
        ← Back
      </button>
      <h1 className="text-3xl font-light mb-8 text-white text-center">Checkout</h1>

      {/* Checkout Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-center space-x-4">
          <div
            className={`flex items-center ${shippingStep === 'address' ? 'text-blue-600' : 'text-gray-400'}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${shippingStep === 'address' ? 'bg-zinc-900/50 text-zinc-950 text-white' : 'bg-gray-200'}`}
            >
              1
            </div>
            <span className="ml-2">Address</span>
          </div>
          <div
            className={`w-8 h-0.5 ${shippingStep === 'rates' || shippingStep === 'payment' ? 'bg-zinc-900/50 text-zinc-950' : 'bg-gray-200'}`}
          ></div>
          <div
            className={`flex items-center ${shippingStep === 'rates' ? 'text-blue-600' : shippingStep === 'payment' ? 'text-green-600' : 'text-gray-400'}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${shippingStep === 'rates' ? 'bg-zinc-900/50 text-zinc-950 text-white' : shippingStep === 'payment' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
            >
              2
            </div>
            <span className="ml-2">Shipping</span>
          </div>
          <div
            className={`w-8 h-0.5 ${shippingStep === 'payment' ? 'bg-green-600' : 'bg-gray-200'}`}
          ></div>
          <div
            className={`flex items-center ${shippingStep === 'payment' ? 'text-green-600' : 'text-gray-400'}`}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center ${shippingStep === 'payment' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
            >
              3
            </div>
            <span className="ml-2">Payment</span>
          </div>
        </div>
      </div>

      {/* Shipping Address Form */}
      {shippingStep === 'address' && (
        <div className="bg-zinc-900/50 rounded-xl shadow p-8 max-w-2xl mx-auto mb-8">
          <h2 className="text-xl font-semibold mb-6 text-white">Shipping Address</h2>
          <form onSubmit={handleAddressSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-base font-medium text-white mb-2">Full Name *</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 text-white rounded p-3"
                  value={shippingAddress.name}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-base font-medium text-white mb-2">
                  Address Line 1 *
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 text-white rounded p-3"
                  value={shippingAddress.street1}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, street1: e.target.value })
                  }
                  required
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-base font-medium text-white mb-2">
                  Address Line 2
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-300 text-white rounded p-3"
                  value={shippingAddress.street2}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, street2: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-base font-medium text-white mb-2">City *</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 text-white rounded p-3"
                  value={shippingAddress.city}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-base font-medium text-white mb-2">Postcode *</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 text-white rounded p-3"
                  value={shippingAddress.zip}
                  onChange={(e) => setShippingAddress({ ...shippingAddress, zip: e.target.value })}
                  required
                />
              </div>
              <div>
                <label className="block text-base font-medium text-white mb-2">Phone</label>
                <input
                  type="tel"
                  className="w-full border border-gray-300 text-white rounded p-3"
                  value={shippingAddress.phone}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="block text-base font-medium text-white mb-2">Email</label>
                <input
                  type="email"
                  className="w-full border border-gray-300 text-white rounded p-3"
                  value={shippingAddress.email}
                  onChange={(e) =>
                    setShippingAddress({ ...shippingAddress, email: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="mt-6">
              <button
                type="submit"
                disabled={isLoadingRates}
                className="w-full bg-zinc-900/50 text-zinc-950 text-white py-3 px-4 rounded-lg hover:bg-zinc-100 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
              >
                {isLoadingRates ? 'Calculating Rates...' : 'Continue to Shipping'}
              </button>
            </div>
          </form>
          <div className="mt-4 text-center">
            <span className="text-sm text-zinc-400">
              We care about your privacy. Learn how your information is protected in our{' '}
              <Link href="/privacy" className="text-blue-600 hover:underline">
                Privacy Policy.
              </Link>
            </span>
          </div>
        </div>
      )}

      {/* Shipping Rates Selection */}
      {shippingStep === 'rates' && (
        <div className="bg-zinc-900/50 rounded-xl shadow p-8 max-w-2xl mx-auto mb-8">
          <h2 className="text-xl font-semibold mb-6 text-white">Select Shipping Method</h2>
          <div className="space-y-4">
            {shippingRates.map((rate) => {
              const isSelected = selectedRate && selectedRate.object_id === rate.object_id
              return (
                <div
                  key={rate.object_id}
                  className={`border rounded-lg p-4 cursor-pointer transition ${isSelected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-300'}`}
                  onClick={() => setSelectedRate(rate)}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-gray-800">{rate.servicelevel.name}</h3>
                      <p className="text-base text-zinc-400">
                        {rate.days
                          ? `${rate.days} day${rate.days !== 1 ? 's' : ''} delivery`
                          : 'Delivery'}
                        {rate.arrives_by && ` • Arrives by ${rate.arrives_by}`}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-800">
                        £{parseFloat(rate.rate).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
          <div className="mt-6 flex flex-col sm:flex-row gap-4">
            <button
              onClick={() => setShippingStep('address')}
              className="w-full bg-zinc-900/50 border border-zinc-800 text-white py-3 px-4 rounded-lg hover:bg-gray-200 transition"
            >
              Back to Address
            </button>
            <button
              onClick={() => selectedRate && setShippingStep('payment')}
              disabled={!selectedRate}
              className="w-full bg-zinc-900/50 text-zinc-950 text-white py-3 px-4 rounded-lg hover:bg-zinc-100 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              Continue to Payment
            </button>
          </div>
        </div>
      )}

      {/* Checkout Options for non-logged-in users */}
      {!user &&
        shippingStep === 'payment' &&
        (checkoutMode === 'choice' ? (
          // User not logged in - show options
          <div className="bg-zinc-900/50 rounded-xl shadow p-8 max-w-lg mx-auto mb-8">
            <h3 className="text-lg font-semibold text-gray-900 mb-6 text-center">
              How would you like to checkout?
            </h3>

            <div className="space-y-4">
              <Link
                href="/auth"
                className="block w-full bg-zinc-900/50 text-zinc-950 text-white py-3 px-4 rounded-lg hover:bg-zinc-100 transition text-center"
              >
                Sign In / Create Account
              </Link>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-300" />
                </div>
                <div className="relative flex justify-center text-base">
                  <span className="px-2 bg-zinc-900/50 text-zinc-400">or</span>
                </div>
              </div>

              <button
                onClick={() => setCheckoutMode('guest')}
                className="w-full bg-zinc-900/50 border border-zinc-800 text-white py-3 px-4 rounded-lg hover:bg-gray-200 transition"
              >
                Checkout as Guest
              </button>
            </div>
          </div>
        ) : (
          // Guest checkout form
          <div className="bg-zinc-900/50 rounded-xl shadow p-8 max-w-lg mx-auto mb-8">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">Guest Checkout</h3>
              <p className="text-sm text-zinc-400">Enter your email to receive order updates</p>
            </div>

            <form onSubmit={handleGuestCheckout}>
              <label className="block text-sm font-medium text-white mb-2">Email Address</label>
              <input
                type="email"
                className="w-full border border-gray-300 text-white rounded p-3 mb-2"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                placeholder="your@email.com"
              />
              {emailError && <p className="text-red-500 text-base mb-4">{emailError}</p>}

              <div className="space-y-3">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full bg-zinc-900/50 text-zinc-950 text-white py-3 px-4 rounded-lg hover:bg-zinc-100 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
                >
                  {isLoading ? 'Processing...' : 'Complete Purchase'}
                </button>

                <button
                  type="button"
                  onClick={() => setCheckoutMode('choice')}
                  disabled={isLoading}
                  className="w-full bg-zinc-900/50 border border-zinc-800 text-white py-3 px-4 rounded-lg hover:bg-gray-200 transition disabled:bg-gray-300"
                >
                  Back to Options
                </button>
              </div>
            </form>
          </div>
        ))}

      {/* Order Summary - Always show */}
      <div className="bg-gray-50 rounded-xl p-8 mb-8">
        <h2 className="text-xl font-semibold mb-6 text-white">Order Summary</h2>
        <div className="space-y-6">
          {cart.map((item) => (
            <div
              key={item.product_id + '-' + (item.variant_id || 'base')}
              className="flex items-center gap-4 border-b pb-6"
            >
              <Image
                width={80}
                height={80}
                src={item.image_url}
                alt={item.name}
                className="w-16 h-16 object-cover rounded"
              />
              <div>
                <h3 className="font-semibold text-gray-800">{item.name}</h3>
                <p className="text-sm text-zinc-400">
                  {[item.size, item.color, item.material].filter(Boolean).join(' • ') ||
                    'Base product'}
                </p>
                <p className="text-sm text-zinc-400">Quantity: {item.quantity}</p>
              </div>
              <div className="ml-auto text-right">
                <p className="text-white font-medium">
                  £{(item.price * item.quantity).toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Shipping Information */}
        {selectedRate && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="flex justify-between items-center mb-2">
              <span className="text-zinc-400">Shipping ({selectedRate.servicelevel.name})</span>
              <span className="text-white">£{shippingCost.toFixed(2)}</span>
            </div>
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-gray-200 flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center">
          <div>
            <p className="text-lg font-semibold text-gray-900">Total:</p>
          </div>
          <p className="text-xl font-bold text-blue-600">£{total.toFixed(2)}</p>
        </div>

        {/* Complete Purchase button for logged-in users */}
        {user && shippingStep === 'payment' && (
          <div className="mt-8 pt-6 border-t border-gray-200 flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => setShippingStep('rates')}
              className="w-full sm:w-64 bg-zinc-900/50 border border-zinc-800 text-white py-3 px-6 rounded-lg hover:bg-gray-200 transition"
            >
              Back to Shipping
            </button>
            <button
              onClick={handleLoggedInCheckout}
              disabled={isLoading}
              className="w-full sm:w-64 bg-zinc-900/50 text-zinc-950 text-white py-3 px-6 rounded-lg hover:bg-zinc-100 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {isLoading ? 'Processing...' : 'Complete Purchase'}
            </button>
          </div>
        )}
      </div>
      </div>
    </div>
  )
}
