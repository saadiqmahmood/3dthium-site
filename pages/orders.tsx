import {
  Check,
  ChevronRight,
  Package,
  PackageCheck,
  ShoppingBag,
  ShoppingCart,
  Truck,
  X,
} from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import Toast from '@/components/ui/Toast'
import { useAuth } from '@/context/AuthContext'
import { authFetch } from '@/lib/api/authFetch'
import { formatMoney } from '@/lib/format/money'

interface OrderItemVariant {
  size?: string | null
  color?: string | null
  material?: string | null
  image_url?: string | null
}

interface OrderItemProduct {
  id: string
  name: string
}

interface OrderItem {
  id: string
  quantity: number
  size?: string | null
  price_at_purchase: number
  variant_id?: string | null
  variant_new?: OrderItemVariant
  product_new?: OrderItemProduct | null
}

interface Order {
  id: string
  total_price: number
  status: string
  created_at: string
  shipping_name?: string
  shipping_address?: string
  shipping_city?: string
  shipping_postcode?: string
  shipping_country?: string
  shipping_phone?: string
  shipping_method?: string
  shipping_cost?: number
  tracking_number?: string
  tracking_url?: string
  shipped_at?: string
  order_items: OrderItem[]
}

function PrinterIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* Motor housing */}
      <rect x="9.5" y="1" width="5" height="2" rx="0.5" />
      <circle cx="11.5" cy="2" r="0.4" fill="currentColor" stroke="none" />
      <circle cx="13.5" cy="2" r="0.4" fill="currentColor" stroke="none" />
      {/* Gantry rail */}
      <rect x="1.5" y="3" width="21" height="1.5" rx="0.5" />
      {/* Vertical rails */}
      <line x1="2.5" y1="4.5" x2="2.5" y2="22" />
      <line x1="21.5" y1="4.5" x2="21.5" y2="22" />
      {/* Feet */}
      <line x1="1" y1="22" x2="4" y2="22" />
      <line x1="20" y1="22" x2="23" y2="22" />
      {/* Print head */}
      <path d="M9.5 4.5 L14.5 4.5 L13.5 8 L10.5 8 Z" />
      {/* Nozzle */}
      <path d="M10.5 8 L13.5 8 L12 9.5 Z" />
      {/* Filament path */}
      <path d="M12 9.5 C10.5 11 13.5 12 12 13" fill="none" />
      {/* Cube — top face */}
      <path d="M8 14.5 L12 13 L16 14.5 L12 16 Z" />
      {/* Cube — left face */}
      <path d="M8 14.5 L8 19 L12 20.5 L12 16 Z" />
      {/* Cube — right face */}
      <path d="M16 14.5 L16 19 L12 20.5 L12 16 Z" />
    </svg>
  )
}

const PROGRESS_STEPS = [
  { key: 'pending', label: 'Order Placed', Icon: ShoppingCart },
  { key: 'printing', label: 'Printing', Icon: PrinterIcon },
  { key: 'packaging', label: 'Packaging', Icon: Package },
  { key: 'shipped', label: 'Shipped', Icon: Truck },
  { key: 'delivered', label: 'Delivered', Icon: PackageCheck },
]

const STATUS_BADGE: Record<string, string> = {
  pending: 'bg-amber-50 text-amber-700 border-amber-200',
  printing: 'bg-violet-50 text-violet-700 border-violet-200',
  packaging: 'bg-orange-50 text-orange-700 border-orange-200',
  shipped: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  delivered: 'bg-emerald-100 text-emerald-800 border-emerald-300',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
  refunded: 'bg-red-50 text-red-700 border-red-200',
}

function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_BADGE[status] ?? 'bg-zinc-100 text-zinc-600 border-zinc-200'
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${cls}`}>
      {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
    </span>
  )
}

function getStepIndex(status: string) {
  return PROGRESS_STEPS.findIndex((s) => s.key === status)
}

function ProgressBar({ status }: { status: string }) {
  const isCancelled = status === 'cancelled' || status === 'refunded'
  const currentIdx = getStepIndex(status)

  if (isCancelled) {
    return (
      <div className="flex items-center gap-3 py-2">
        <div className="flex items-center justify-center w-9 h-9 rounded-full bg-red-100 border-2 border-red-300 flex-shrink-0">
          <X className="w-4 h-4 text-red-500" />
        </div>
        <span className="text-sm font-medium text-red-600 capitalize">{status}</span>
      </div>
    )
  }

  const currentStep = PROGRESS_STEPS[currentIdx]
  const prevStep = currentIdx > 0 ? PROGRESS_STEPS[currentIdx - 1] : null
  const nextStep = currentIdx < PROGRESS_STEPS.length - 1 ? PROGRESS_STEPS[currentIdx + 1] : null
  const pct = Math.round(((currentIdx + 1) / PROGRESS_STEPS.length) * 100)

  return (
    <>
      {/* Mobile: compact single-step view */}
      <div className="sm:hidden space-y-3">
        <div className="flex items-center gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100">
          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)] flex-shrink-0">
            {currentStep && <currentStep.Icon className="w-5 h-5 text-white" />}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-zinc-900">{currentStep?.label}</p>
            <p className="text-xs text-zinc-400">Step {currentIdx + 1} of {PROGRESS_STEPS.length}</p>
          </div>
          <span className="text-sm font-semibold text-emerald-600">{pct}%</span>
        </div>
        <div className="relative h-1.5 bg-zinc-100 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-emerald-500 rounded-full transition-all duration-700"
            style={{ width: `${pct}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-zinc-400">
          {prevStep ? <span>← {prevStep.label}</span> : <span />}
          {nextStep ? <span>{nextStep.label} →</span> : <span className="text-emerald-600 font-medium">Complete</span>}
        </div>
      </div>

      {/* Desktop: full chain */}
      <div className="hidden sm:block w-full overflow-x-auto pb-1">
        <div className="flex items-start w-full gap-0">
          {PROGRESS_STEPS.map((step, idx) => {
            const isDone = currentIdx > idx
            const isCurrent = currentIdx === idx
            const { Icon } = step
            return (
              <div key={step.key} className="flex items-center flex-1 last:flex-none">
                <div className="flex flex-col items-center gap-2 flex-shrink-0">
                  <div
                    className={`relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-500 ${
                      isDone
                        ? 'bg-emerald-500 border-emerald-500'
                        : isCurrent
                          ? 'bg-white border-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,0.15)]'
                          : 'bg-white border-zinc-200'
                    }`}
                  >
                    {isDone ? (
                      <Check className="w-4 h-4 text-white" strokeWidth={2.5} />
                    ) : (
                      <Icon
                        className={`w-4 h-4 ${isCurrent ? 'text-emerald-500' : 'text-zinc-300'}`}
                        strokeWidth={isCurrent ? 2 : 1.5}
                      />
                    )}
                    {isCurrent && (
                      <span className="absolute inset-0 rounded-full animate-ping bg-emerald-400 opacity-20" />
                    )}
                  </div>
                  <span
                    className={`text-xs font-medium whitespace-nowrap ${
                      isDone ? 'text-emerald-600' : isCurrent ? 'text-zinc-900' : 'text-zinc-400'
                    }`}
                  >
                    {step.label}
                  </span>
                </div>
                {idx < PROGRESS_STEPS.length - 1 && (
                  <div
                    className={`flex-1 h-0.5 mx-1 mb-5 transition-colors duration-500 ${
                      isDone ? 'bg-emerald-400' : 'bg-zinc-200'
                    }`}
                  />
                )}
              </div>
            )
          })}
        </div>
      </div>
    </>
  )
}

const SUPPORT_ISSUES = [
  'My Order Status',
  'Invoice / Documents',
  'Cancel My Order',
  'Change of Shipping Address',
  'My Deliveries',
  'Other Order Support',
] as const

function OrderModal({ order, onClose }: { order: Order; onClose: () => void }) {
  const [visible, setVisible] = useState(false)
  const [supportOpen, setSupportOpen] = useState(false)
  const [issueType, setIssueType] = useState('')
  const [supportMessage, setSupportMessage] = useState('')
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)
  const [supportError, setSupportError] = useState<string | null>(null)
  const { user } = useAuth()

  const handleClose = useCallback(() => {
    setVisible(false)
    setTimeout(onClose, 280)
  }, [onClose])

  const handleSupportSubmit = async () => {
    if (!issueType) return
    setSending(true)
    setSupportError(null)
    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: user?.user_metadata?.full_name || user?.email || 'Customer',
          email: user?.email || '',
          subject: `${issueType} — Order #${order.id.slice(-8).toUpperCase()}`,
          message: supportMessage.trim() || `Issue type: ${issueType}\nOrder: #${order.id.slice(-8).toUpperCase()}`,
        }),
      })
      if (!res.ok) throw new Error('Failed to send')
      setSent(true)
    } catch {
      setSupportError('Something went wrong. Please try again.')
    } finally {
      setSending(false)
    }
  }

  useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true))
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') handleClose()
    }
    document.addEventListener('keydown', handleKey)
    document.body.style.overflow = 'hidden'
    return () => {
      cancelAnimationFrame(raf)
      document.removeEventListener('keydown', handleKey)
      document.body.style.overflow = ''
    }
  }, [handleClose])

  const fmt = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: modal backdrop
    <div
      className={`fixed inset-0 z-50 flex items-end sm:items-center justify-center transition-colors duration-300 ${visible ? 'bg-black/40' : 'bg-transparent'}`}
      onClick={handleClose}
      onKeyDown={(e) => e.key === 'Escape' && handleClose()}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: modal content */}
      <div
        className={`bg-white w-full sm:max-w-2xl rounded-t-3xl sm:rounded-2xl shadow-2xl max-h-[92vh] overflow-y-auto transition-all duration-300 ${
          visible ? 'translate-y-0 opacity-100 sm:scale-100' : 'translate-y-8 opacity-0 sm:scale-95'
        }`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Drag handle (mobile) */}
        <div className="sm:hidden flex justify-center pt-3 pb-1">
          <div className="w-10 h-1 rounded-full bg-zinc-200" />
        </div>

        {/* Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-zinc-100 px-6 py-4 flex items-center justify-between z-10">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-zinc-400 mb-0.5">
              Order details
            </p>
            <h2 className="text-lg font-semibold text-zinc-900">
              #{order.id.slice(-8).toUpperCase()}
            </h2>
          </div>
          <button
            type="button"
            onClick={handleClose}
            aria-label="Close"
            className="p-2 text-zinc-400 hover:text-zinc-700 transition-colors rounded-xl hover:bg-zinc-100"
          >
            <svg
              aria-hidden="true"
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-6 space-y-8">
          {/* Status row */}
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-2">
              <StatusBadge status={order.status} />
              <p className="text-sm text-zinc-500">{fmt(order.created_at)}</p>
            </div>
            <div className="text-right">
              <p className="text-2xl font-semibold text-zinc-900">{formatMoney(order.total_price)}</p>
              <p className="text-xs text-zinc-400 mt-0.5">
                {order.order_items.length} item
                {order.order_items.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>

          {/* Progress */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">
              Order Progress
            </p>
            <ProgressBar status={order.status} />
          </div>

          {/* Items */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-4">
              Items
            </p>
            {order.order_items.length === 0 ? (
              <p className="text-sm text-zinc-400 bg-zinc-50 rounded-xl p-4">No items found</p>
            ) : (
              <div className="space-y-3">
                {order.order_items.map((item) => {
                  const name = item.product_new?.name || 'Product'
                  const imageUrl = item.variant_new?.image_url || '/placeholder.png'
                  const { color, size, material } = item.variant_new || {}
                  return (
                    <div
                      key={item.id}
                      className="flex gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-100"
                    >
                      <div className="relative w-16 h-16 flex-shrink-0 rounded-xl overflow-hidden bg-white border border-zinc-100">
                        <Image
                          src={imageUrl}
                          alt={name}
                          fill
                          className="object-contain"
                          sizes="64px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-zinc-900 mb-1.5 truncate">{name}</p>
                        <div className="flex flex-wrap gap-1.5 mb-2">
                          {color && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-100">
                              {color}
                            </span>
                          )}
                          {size && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-violet-50 text-violet-700 border border-violet-100">
                              {size}
                            </span>
                          )}
                          {material && (
                            <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-100">
                              {material}
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-zinc-400">Qty {item.quantity}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="text-sm font-semibold text-zinc-900">
                          {formatMoney(item.price_at_purchase * item.quantity)}
                        </p>
                        {item.quantity > 1 && (
                          <p className="text-xs text-zinc-400 mt-0.5">
                            {formatMoney(item.price_at_purchase)} each
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>

          {/* Shipping */}
          {order.shipping_name && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400 mb-3">
                Delivery
              </p>
              <div className="p-4 bg-zinc-50 rounded-xl border border-zinc-100 text-sm text-zinc-700 space-y-1">
                <p className="font-medium">{order.shipping_name}</p>
                {order.shipping_address && <p className="text-zinc-500">{order.shipping_address}</p>}
                {(order.shipping_city || order.shipping_postcode) && (
                  <p className="text-zinc-500">
                    {[order.shipping_city, order.shipping_postcode].filter(Boolean).join(', ')}
                  </p>
                )}
                {order.shipping_method && (
                  <p className="text-zinc-400 text-xs mt-2">
                    {order.shipping_method}
                    {order.shipping_cost ? ` · ${formatMoney(order.shipping_cost)}` : ''}
                  </p>
                )}
                {order.tracking_number && (
                  <div className="mt-3 pt-3 border-t border-zinc-200">
                    <p className="text-xs text-zinc-400 mb-0.5">Tracking</p>
                    {order.tracking_url ? (
                      <a
                        href={order.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-600 hover:text-emerald-700 text-sm font-medium"
                      >
                        {order.tracking_number} →
                      </a>
                    ) : (
                      <span className="text-sm font-mono text-zinc-700">{order.tracking_number}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Support panel */}
          <div className="border-t border-zinc-100 pt-4 pb-2">
            {sent ? (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center">
                <p className="text-sm font-medium text-emerald-800 mb-1">Message sent</p>
                <p className="text-xs text-emerald-600">We&apos;ll get back to you as soon as possible.</p>
                <button
                  type="button"
                  onClick={() => { setSent(false); setSupportOpen(false); setIssueType(''); setSupportMessage('') }}
                  className="mt-3 text-xs text-emerald-700 hover:text-emerald-900 underline"
                >
                  Close
                </button>
              </div>
            ) : !supportOpen ? (
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-zinc-900">Need help on this order?</p>
                <button
                  type="button"
                  onClick={() => setSupportOpen(true)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-zinc-900 text-white text-xs font-medium rounded-xl hover:bg-zinc-700 transition-colors"
                >
                  Contact customer support
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  type="button"
                  onClick={() => { setSupportOpen(false); setIssueType(''); setSupportMessage(''); setSupportError(null) }}
                  className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-700 transition-colors"
                >
                  <ChevronRight className="w-3 h-3 rotate-180" />
                  Back to Actions
                </button>

                <div>
                  <p className="text-sm font-semibold text-zinc-900 mb-0.5">Contact Customer Support</p>
                  <p className="text-xs text-zinc-400">Please select an issue type to get started on your support options.</p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-700 mb-1.5">Select Issue</label>
                  <select
                    value={issueType}
                    onChange={(e) => setIssueType(e.target.value)}
                    className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 bg-white"
                  >
                    <option value="">Select One</option>
                    {SUPPORT_ISSUES.map((issue) => (
                      <option key={issue} value={issue}>{issue}</option>
                    ))}
                  </select>
                </div>

                {issueType && (
                  <div>
                    <label className="block text-xs font-medium text-zinc-700 mb-1.5">Additional details <span className="text-zinc-400 font-normal">(optional)</span></label>
                    <textarea
                      value={supportMessage}
                      onChange={(e) => setSupportMessage(e.target.value)}
                      rows={3}
                      placeholder="Tell us more about your issue…"
                      className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 resize-none"
                    />
                  </div>
                )}

                {supportError && (
                  <p className="text-xs text-red-600">{supportError}</p>
                )}

                <button
                  type="button"
                  onClick={handleSupportSubmit}
                  disabled={!issueType || sending}
                  className="w-full py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {sending ? 'Sending…' : 'Send'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      const res = await authFetch('/api/orders')
      if (!res.ok) throw new Error('Failed')
      const data = await res.json()
      setOrders(data)
    } catch {
      setToast({ message: 'Failed to load your orders', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (authLoading) return
    if (!user) {
      router.push('/auth')
      return
    }
    fetchOrders()
  }, [user?.id, authLoading, router, fetchOrders])

  if (authLoading) {
    return (
      <div className="max-w-3xl mx-auto py-20 px-6 text-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-zinc-200 mx-auto" />
      </div>
    )
  }

  if (!user) return null

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })

  return (
    <div className="min-h-screen bg-white">
      <div className="max-w-3xl mx-auto py-24 px-4 sm:px-6">
        <div className="mb-10">
          <h1 className="text-4xl font-light text-zinc-900 mb-2">My Orders</h1>
          <p className="text-zinc-500">View and track your purchases</p>
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-zinc-200 mx-auto" />
            <p className="mt-4 text-zinc-400 text-sm">Loading orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20 bg-zinc-50 rounded-2xl border border-zinc-100">
            <div className="w-16 h-16 bg-white rounded-full border border-zinc-100 flex items-center justify-center mx-auto mb-4 shadow-sm">
              <ShoppingBag className="w-7 h-7 text-zinc-300" strokeWidth={1.5} />
            </div>
            <h3 className="text-base font-semibold text-zinc-900 mb-1.5">No orders yet</h3>
            <p className="text-sm text-zinc-400 mb-6 max-w-xs mx-auto">
              Your orders will appear here once you have made a purchase.
            </p>
            <button
              type="button"
              onClick={() => router.push('/products')}
              className="px-5 py-2.5 bg-zinc-900 text-white text-sm font-medium rounded-xl hover:bg-zinc-800 transition-colors"
            >
              Browse products
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map((order) => {
              const stepIdx = getStepIndex(order.status)
              const isCancelled = order.status === 'cancelled' || order.status === 'refunded'
              return (
                <button
                  key={order.id}
                  type="button"
                  onClick={() => setSelectedOrder(order)}
                  className="w-full text-left bg-white border border-zinc-200 rounded-2xl px-5 py-4 hover:border-zinc-300 hover:shadow-sm transition-all duration-200 group"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2.5 mb-1.5">
                        <span className="text-sm font-semibold text-zinc-900 font-mono">
                          #{order.id.slice(-8).toUpperCase()}
                        </span>
                        <StatusBadge status={order.status} />
                      </div>
                      <p className="text-xs text-zinc-400">
                        {formatDate(order.created_at)} ·{' '}
                        {order.order_items.length} item
                        {order.order_items.length !== 1 ? 's' : ''}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-base font-semibold text-zinc-900">
                        {formatMoney(order.total_price)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 transition-colors" />
                    </div>
                  </div>

                  {/* Mini progress bar */}
                  {!isCancelled ? (
                    <div className="mt-3 flex items-center gap-0.5">
                      {PROGRESS_STEPS.map((step, idx) => (
                        <div
                          key={step.key}
                          className={`flex-1 h-1 rounded-full transition-colors duration-500 ${
                            stepIdx >= idx ? 'bg-emerald-400' : 'bg-zinc-100'
                          }`}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="mt-3 h-1 rounded-full bg-red-100" />
                  )}
                </button>
              )
            })}
          </div>
        )}
      </div>

      {selectedOrder && (
        <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
