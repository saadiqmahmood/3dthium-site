import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useId, useState } from 'react'
import Toast from '@/components/ui/Toast'
import { useAuth } from '@/context/AuthContext'
import { useCart } from '@/context/CartContext'
import { formatMoney } from '@/lib/format/money'
import type { CartQuote } from '@/lib/pricing/quoteCart'
import type { ShippingAddress, ShippingRate } from '@/types'

function humanizeCode(val: string | null | undefined): string | null {
  if (!val) return null
  const stripped = val.replace(/^(height|size|colour|color|material|design|weight|width|length|depth)-/i, '')
  const readable = stripped.replace(/-/g, ' ').trim()
  return readable.charAt(0).toUpperCase() + readable.slice(1)
}

const STEPS = ['Address', 'Shipping', 'Payment'] as const
const STEP_KEYS = ['address', 'rates', 'payment'] as const

const inputClass =
  'w-full border border-gray-200 rounded-lg px-4 py-2.5 text-sm font-light text-zinc-900 placeholder:text-zinc-400 focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 focus:outline-none transition-colors'
const labelClass = 'block text-sm font-light text-zinc-700 mb-1.5'
const cardClass = 'bg-white border border-gray-100 rounded-2xl shadow-sm p-8'
const primaryBtn =
  'w-full bg-zinc-900 text-white py-3 px-4 rounded-lg hover:bg-zinc-800 transition-colors font-medium text-sm disabled:opacity-40 disabled:cursor-not-allowed'
const secondaryBtn =
  'w-full bg-white border border-gray-200 text-zinc-700 py-3 px-4 rounded-lg hover:bg-gray-50 transition-colors font-light text-sm'

export default function CheckoutPage() {
  const { cart } = useCart()
  const { user, loading: authLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [emailError, setEmailError] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [checkoutMode, setCheckoutMode] = useState<'choice' | 'guest'>('choice')
  const [shippingStep, setShippingStep] = useState<'address' | 'rates' | 'payment'>('address')
  const [shippingRates, setShippingRates] = useState<ShippingRate[]>([])
  const [selectedRate, setSelectedRate] = useState<ShippingRate | null>(null)
  const [isLoadingRates, setIsLoadingRates] = useState(false)
  const [quote, setQuote] = useState<CartQuote | null>(null)
  const router = useRouter()
  const nameId = useId()
  const street1Id = useId()
  const street2Id = useId()
  const cityId = useId()
  const zipId = useId()
  const phoneId = useId()
  const shippingEmailId = useId()
  const guestEmailId = useId()

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: '', street1: '', street2: '', city: '', state: '', zip: '',
    country: 'GB', phone: '', email: '',
  })

  useEffect(() => {
    if (cart.length === 0) return
    let cancelled = false
    fetch('/api/cart/quote', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        cart: cart.map((i) => ({
          product_id: i.product_id, variant_id: i.variant_id ?? null,
          quantity: i.quantity, name: i.name, image_url: i.image_url,
        })),
        ...(selectedRate ? { shipping_rate_id: selectedRate.object_id } : {}),
      }),
    })
      .then((r) => r.json())
      .then((q) => { if (!cancelled && q.subtotal !== undefined) setQuote(q) })
      .catch(() => {})
    return () => { cancelled = true }
  }, [cart, selectedRate])

  const subtotal = quote?.subtotal ?? cart.reduce((acc, item) => acc + item.price * item.quantity, 0)
  const shippingCost = selectedRate
    ? quote?.shipping != null && quote.shipping > 0 ? quote.shipping : parseFloat(selectedRate.rate)
    : 0
  const total = selectedRate && quote?.total != null ? quote.total : subtotal + shippingCost

  const calculateShippingRates = async () => {
    if (!shippingAddress.street1 || !shippingAddress.city || !shippingAddress.zip) return
    setIsLoadingRates(true)
    try {
      const response = await fetch('/api/shipping/rates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address_to: shippingAddress, cart_items: cart }),
      })
      if (!response.ok) throw new Error('Failed to calculate shipping rates')
      const data = await response.json()
      if (!data.rates || data.rates.length === 0) {
        setToast({ message: 'No shipping options available for this address. Please check your address and try again.', type: 'error' })
        return
      }
      setShippingRates(data.rates)
      setShippingStep('rates')
    } catch {
      setToast({ message: 'Failed to calculate shipping rates. Please try again.', type: 'error' })
    } finally {
      setIsLoadingRates(false)
    }
  }

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!shippingAddress.name || !shippingAddress.street1 || !shippingAddress.city || !shippingAddress.zip) {
      setToast({ message: 'Please fill in all required fields', type: 'error' })
      return
    }
    calculateShippingRates()
  }

  const handleCheckout = async (customerEmail: string) => {
    if (!selectedRate) { setToast({ message: 'Please select a shipping method', type: 'error' }); return }
    setIsLoading(true)
    try {
      const response = await fetch('/api/checkout_sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cart, email: customerEmail, user_id: user?.id || undefined,
          shipping_address: shippingAddress, shipping_rate_id: selectedRate.object_id,
          shipping_cost: shippingCost, shipping_provider: selectedRate.provider,
          shipping_service: selectedRate.servicelevel.name,
        }),
      })
      if (!response.ok) { const error = await response.json(); throw new Error(error.message || 'Failed to create checkout session') }
      const { url } = await response.json()
      window.location.href = url
    } catch {
      setToast({ message: 'Failed to create checkout session. Please try again.', type: 'error' })
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

  const handleLoggedInCheckout = () => { if (user?.email) handleCheckout(user.email) }

  const handleBack = () => {
    if (shippingStep === 'rates') setShippingStep('address')
    else if (shippingStep === 'payment') setShippingStep('rates')
    else router.back()
  }

  const currentStepIdx = STEP_KEYS.indexOf(shippingStep)

  if (authLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    )
  }

  // ── Order summary (reused for sidebar + mobile) ──────────────────
  const orderSummary = (
    <div className={cardClass}>
      <h2 className="text-base font-semibold text-zinc-900 mb-5">Order Summary</h2>

      <div className="space-y-4 mb-5">
        {cart.map((item) => (
          <div key={`${item.product_id}-${item.variant_id || 'base'}`} className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-xl overflow-hidden bg-zinc-50 border border-zinc-100 flex-shrink-0">
              <Image width={56} height={56} src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-zinc-900 truncate">{item.name}</p>
              <p className="text-xs font-light text-zinc-400 mt-0.5">
                {[item.size_display || humanizeCode(item.size), item.color_display || humanizeCode(item.color), item.material_display || humanizeCode(item.material)].filter(Boolean).join(' · ') || 'Base product'}
              </p>
              <p className="text-xs text-zinc-400 font-light">Qty {item.quantity}</p>
            </div>
            <p className="text-sm font-medium text-zinc-900 flex-shrink-0">
              {formatMoney(quote?.items.find((qi) => qi.product_id === item.product_id && qi.variant_id === (item.variant_id ?? null))?.line_total ?? item.price * item.quantity)}
            </p>
          </div>
        ))}
      </div>

      <div className="border-t border-zinc-100 pt-4 space-y-2">
        <div className="flex justify-between text-sm">
          <span className="text-zinc-500 font-light">Subtotal</span>
          <span className="text-zinc-900 font-medium">{formatMoney(subtotal)}</span>
        </div>
        {selectedRate && (
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500 font-light">Shipping</span>
            <span className="text-zinc-900 font-medium">{formatMoney(shippingCost)}</span>
          </div>
        )}
        {!selectedRate && (
          <div className="flex justify-between text-sm">
            <span className="text-zinc-500 font-light">Shipping</span>
            <span className="text-zinc-400 text-xs font-light">Calculated next</span>
          </div>
        )}
        {quote?.discount != null && quote.discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-emerald-600 font-light">Discount{quote.promo_code ? ` (${quote.promo_code})` : ''}</span>
            <span className="text-emerald-600 font-medium">−{formatMoney(quote.discount)}</span>
          </div>
        )}
        <div className="flex justify-between items-baseline pt-3 border-t border-zinc-100">
          <span className="text-base font-medium text-zinc-900">Total</span>
          <span className="text-xl font-semibold text-zinc-900">{formatMoney(total)}</span>
        </div>
      </div>

      <p className="text-center text-xs text-zinc-400 mt-4">
        Secure checkout ·{' '}
        <Link href="/privacy" className="text-emerald-600 hover:text-emerald-700 transition-colors">Privacy Policy</Link>
      </p>
    </div>
  )

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-5xl mx-auto py-24 px-6">

        {/* Back */}
        <button type="button" onClick={handleBack} className="inline-flex items-center gap-1.5 text-sm font-light text-zinc-400 hover:text-zinc-700 transition-colors mb-8 group">
          <svg aria-hidden="true" className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>

        <h1 className="text-3xl font-bold text-zinc-900 text-center mb-10">Checkout</h1>

        {/* Progress stepper */}
        <div className="flex items-start justify-center mb-10">
          {STEPS.map((label, idx) => {
            const isDone = currentStepIdx > idx
            const isCurrent = currentStepIdx === idx
            return (
              <div key={label} className="flex items-center">
                <div className="flex flex-col items-center gap-1.5">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${isDone ? 'bg-emerald-600 text-white' : isCurrent ? 'bg-zinc-900 text-white' : 'bg-zinc-100 text-zinc-400'}`}>
                    {isDone ? (
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                    ) : idx + 1}
                  </div>
                  <span className={`text-xs font-light whitespace-nowrap ${isCurrent ? 'text-zinc-900 font-medium' : isDone ? 'text-emerald-600' : 'text-zinc-400'}`}>
                    {label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`w-16 h-px mb-5 mx-2 transition-colors ${isDone ? 'bg-emerald-400' : 'bg-zinc-200'}`} />
                )}
              </div>
            )
          })}
        </div>

        {/* Two-column layout on desktop */}
        <div className="lg:grid lg:grid-cols-[1fr_340px] lg:gap-10 lg:items-start">

          {/* ── Left: step panels ── */}
          <div className="space-y-6">

            {/* Step 1: Address */}
            {shippingStep === 'address' && (
              <div className={cardClass}>
                <h2 className="text-lg font-semibold text-zinc-900 mb-6">Shipping Address</h2>
                <form onSubmit={handleAddressSubmit} className="space-y-4">
                  <div>
                    <label htmlFor={nameId} className={labelClass}>Full name <span className="text-red-400">*</span></label>
                    <input id={nameId} type="text" required placeholder="Jane Smith" className={inputClass}
                      value={shippingAddress.name} onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })} />
                  </div>
                  <div>
                    <label htmlFor={street1Id} className={labelClass}>Address line 1 <span className="text-red-400">*</span></label>
                    <input id={street1Id} type="text" required placeholder="12 Example Street" className={inputClass}
                      value={shippingAddress.street1} onChange={(e) => setShippingAddress({ ...shippingAddress, street1: e.target.value })} />
                  </div>
                  <div>
                    <label htmlFor={street2Id} className={labelClass}>Address line 2 <span className="text-zinc-400 font-light">(optional)</span></label>
                    <input id={street2Id} type="text" placeholder="Flat 3, Building B" className={inputClass}
                      value={shippingAddress.street2} onChange={(e) => setShippingAddress({ ...shippingAddress, street2: e.target.value })} />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor={cityId} className={labelClass}>City <span className="text-red-400">*</span></label>
                      <input id={cityId} type="text" required placeholder="London" className={inputClass}
                        value={shippingAddress.city} onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })} />
                    </div>
                    <div>
                      <label htmlFor={zipId} className={labelClass}>Postcode <span className="text-red-400">*</span></label>
                      <input id={zipId} type="text" required placeholder="SW1A 1AA" className={inputClass}
                        value={shippingAddress.zip} onChange={(e) => setShippingAddress({ ...shippingAddress, zip: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label htmlFor={phoneId} className={labelClass}>Phone <span className="text-zinc-400 font-light">(optional)</span></label>
                      <input id={phoneId} type="tel" placeholder="+44 7700 900000" className={inputClass}
                        value={shippingAddress.phone} onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })} />
                    </div>
                    <div>
                      <label htmlFor={shippingEmailId} className={labelClass}>Email <span className="text-zinc-400 font-light">(optional)</span></label>
                      <input id={shippingEmailId} type="email" placeholder="you@example.com" className={inputClass}
                        value={shippingAddress.email} onChange={(e) => setShippingAddress({ ...shippingAddress, email: e.target.value })} />
                    </div>
                  </div>
                  <div className="pt-2">
                    <button type="submit" disabled={isLoadingRates} className={primaryBtn}>
                      {isLoadingRates ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Calculating rates…
                        </span>
                      ) : 'Continue to Shipping'}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Step 2: Shipping rates */}
            {shippingStep === 'rates' && (
              <div className={cardClass}>
                <h2 className="text-lg font-semibold text-zinc-900 mb-6">Select Delivery Method</h2>
                <div className="space-y-3 mb-6">
                  {shippingRates.map((rate) => {
                    const isSelected = selectedRate?.object_id === rate.object_id
                    return (
                      <button
                        type="button"
                        key={rate.object_id}
                        onClick={() => setSelectedRate(rate)}
                        className={`w-full text-left border rounded-xl p-4 transition-all ${
                          isSelected
                            ? 'border-emerald-500 bg-emerald-50 ring-1 ring-emerald-200'
                            : 'border-gray-200 hover:border-emerald-300 hover:bg-zinc-50'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 flex items-center justify-center ${
                              isSelected ? 'border-emerald-500 bg-emerald-500' : 'border-gray-300'
                            }`}>
                              {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-zinc-900">{rate.servicelevel.name}</p>
                              <p className="text-xs font-light text-zinc-500 mt-0.5">
                                {rate.days ? `${rate.days} day${rate.days !== 1 ? 's' : ''}` : 'Standard delivery'}
                                {rate.arrives_by && ` · Arrives by ${rate.arrives_by}`}
                              </p>
                            </div>
                          </div>
                          <p className="text-sm font-semibold text-zinc-900 flex-shrink-0">{formatMoney(rate.rate)}</p>
                        </div>
                      </button>
                    )
                  })}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button type="button" onClick={() => setShippingStep('address')} className={secondaryBtn}>Back to Address</button>
                  <button
                    type="button"
                    onClick={() => setShippingStep('payment')}
                    disabled={!selectedRate}
                    className={`w-full py-3 px-4 rounded-lg transition-colors font-medium text-sm ${
                      selectedRate
                        ? 'bg-zinc-900 text-white hover:bg-zinc-800'
                        : 'bg-zinc-100 text-zinc-400 cursor-not-allowed'
                    }`}
                  >
                    Continue to Payment
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Payment — guest options */}
            {!user && shippingStep === 'payment' && (
              checkoutMode === 'choice' ? (
                <div className={cardClass}>
                  <h2 className="text-lg font-semibold text-zinc-900 mb-6 text-center">How would you like to pay?</h2>
                  <div className="space-y-4">
                    <Link href="/auth" className="flex items-center justify-center w-full bg-zinc-900 text-white py-3 px-4 rounded-lg hover:bg-zinc-800 transition-colors font-medium text-sm">
                      Sign in / Create account
                    </Link>
                    <div className="relative flex items-center gap-3">
                      <div className="flex-1 border-t border-gray-200" />
                      <span className="text-xs text-zinc-400 font-light flex-shrink-0">or</span>
                      <div className="flex-1 border-t border-gray-200" />
                    </div>
                    <button type="button" onClick={() => setCheckoutMode('guest')} className={secondaryBtn}>
                      Continue as guest
                    </button>
                  </div>
                </div>
              ) : (
                <div className={cardClass}>
                  <h2 className="text-lg font-semibold text-zinc-900 mb-1">Guest Checkout</h2>
                  <p className="text-sm font-light text-zinc-500 mb-6">Enter your email to receive order updates</p>
                  <form onSubmit={handleGuestCheckout} className="space-y-4">
                    <div>
                      <label htmlFor={guestEmailId} className={labelClass}>Email address</label>
                      <input id={guestEmailId} type="email" required placeholder="you@example.com"
                        className={inputClass} value={email}
                        onChange={(e) => setEmail(e.target.value)} disabled={isLoading} />
                      {emailError && <p className="text-xs text-red-500 mt-1.5">{emailError}</p>}
                    </div>
                    <button type="submit" disabled={isLoading} className={primaryBtn}>
                      {isLoading ? (
                        <span className="flex items-center justify-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          Processing…
                        </span>
                      ) : 'Complete Purchase'}
                    </button>
                    <button type="button" onClick={() => setCheckoutMode('choice')} disabled={isLoading} className={secondaryBtn}>
                      Back to Options
                    </button>
                  </form>
                </div>
              )
            )}

            {/* Step 3: Payment — logged-in review & pay */}
            {user && shippingStep === 'payment' && (
              <div className={cardClass}>
                <h2 className="text-lg font-semibold text-zinc-900 mb-6">Review &amp; Pay</h2>

                <div className="space-y-5">
                  {/* Delivery address */}
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1.5">Delivering to</p>
                      <p className="text-sm font-medium text-zinc-900">{shippingAddress.name}</p>
                      <p className="text-sm font-light text-zinc-500">
                        {[shippingAddress.street1, shippingAddress.street2].filter(Boolean).join(', ')}
                      </p>
                      <p className="text-sm font-light text-zinc-500">
                        {[shippingAddress.city, shippingAddress.zip].filter(Boolean).join(', ')}
                      </p>
                    </div>
                    <button type="button" onClick={() => setShippingStep('address')}
                      className="text-xs font-light text-emerald-600 hover:text-emerald-700 transition-colors flex-shrink-0">
                      Edit
                    </button>
                  </div>

                  <div className="border-t border-zinc-100" />

                  {/* Shipping method */}
                  {selectedRate && (
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1.5">Shipping</p>
                        <p className="text-sm font-medium text-zinc-900">{selectedRate.servicelevel.name}</p>
                        <p className="text-sm font-light text-zinc-500">
                          {selectedRate.days ? `${selectedRate.days} day${selectedRate.days !== 1 ? 's' : ''}` : 'Standard delivery'}
                          {' · '}{formatMoney(selectedRate.rate)}
                        </p>
                      </div>
                      <button type="button" onClick={() => setShippingStep('rates')}
                        className="text-xs font-light text-emerald-600 hover:text-emerald-700 transition-colors flex-shrink-0">
                        Edit
                      </button>
                    </div>
                  )}

                  <div className="border-t border-zinc-100" />

                  {/* Email */}
                  <div>
                    <p className="text-xs font-medium text-zinc-400 uppercase tracking-wide mb-1.5">Order confirmation to</p>
                    <p className="text-sm font-light text-zinc-500">{user.email}</p>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  <button type="button" onClick={handleLoggedInCheckout} disabled={isLoading} className={primaryBtn}>
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Processing…
                      </span>
                    ) : 'Complete Purchase'}
                  </button>
                  <button type="button" onClick={() => setShippingStep('rates')} className={secondaryBtn}>
                    Back to Shipping
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* ── Right: order summary (desktop sidebar) ── */}
          <div className="hidden lg:block sticky top-24">
            {orderSummary}
          </div>
        </div>

        {/* Mobile: order summary below */}
        <div className="lg:hidden mt-8">
          {orderSummary}
        </div>

      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
