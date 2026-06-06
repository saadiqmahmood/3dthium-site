import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Toast from '@/components/ui/Toast'
import { useAuth } from '@/context/AuthContext'
import { useCart, type CartItem } from '@/context/CartContext'
import { authFetch } from '@/lib/api/authFetch'
import { formatMoney } from '@/lib/format/money'

interface OrderItem {
  id: string
  quantity: number
  size: string | null
  price_at_purchase: number
  variant_id: string | null
  variant_new?: { color: string | null; material: string | null; image_url: string | null }
  product_new?: { id: string; name: string }
}
interface Order {
  id: string
  total_price: number
  status: string
  created_at: string
  order_items: OrderItem[]
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    paid:      'bg-emerald-50 text-emerald-700 border border-emerald-200',
    shipped:   'bg-blue-50 text-blue-700 border border-blue-200',
    pending:   'bg-amber-50 text-amber-700 border border-amber-200',
    cancelled: 'bg-red-50 text-red-600 border border-red-200',
  }
  const cls = map[status] ?? 'bg-zinc-100 text-zinc-600 border border-zinc-200'
  return (
    <span className={`inline-flex items-center px-2.5 py-1 rounded text-xs font-medium ${cls}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  )
}

export default function AccountPage() {
  const { user, loading, signOut } = useAuth()
  const { addToCart } = useCart()
  const router = useRouter()
  const [section, setSection] = useState<'profile' | 'orders'>('profile')
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [reorderLoading, setReorderLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    if (!loading && !user) router.push('/auth')
  }, [user?.id, loading, router])

  useEffect(() => {
    if (user && section === 'orders' && orders.length === 0) fetchOrders()
  }, [user?.id, section])

  const fetchOrders = async () => {
    setOrdersLoading(true)
    try {
      const res = await authFetch('/api/orders')
      if (!res.ok) { setToast({ message: 'Failed to load orders', type: 'error' }); return }
      setOrders(await res.json())
    } catch {
      setOrders([])
    } finally {
      setOrdersLoading(false)
    }
  }

  const handleReorder = async (order: Order) => {
    setReorderLoading(true)
    try {
      for (const item of order.order_items) {
        if (!item.product_new?.id) continue
        const cartItem: CartItem = {
          product_id: item.product_new.id,
          variant_id: item.variant_id ?? null,
          quantity: item.quantity,
          size: item.size,
          color: item.variant_new?.color ?? null,
          material: item.variant_new?.material ?? null,
          size_display: item.size,
          color_display: item.variant_new?.color ?? null,
          material_display: item.variant_new?.material ?? null,
          price: item.price_at_purchase,
          name: item.product_new.name,
          image_url: item.variant_new?.image_url ?? '',
        }
        addToCart(cartItem)
      }
      setToast({
        message: `${order.order_items.length} item${order.order_items.length !== 1 ? 's' : ''} added to your cart`,
        type: 'success',
      })
      setTimeout(() => router.push('/cart'), 1200)
    } finally {
      setReorderLoading(false)
    }
  }

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
      </div>
    )
  }

  const tab = (id: 'profile' | 'orders', label: string) => (
    <button
      type="button"
      onClick={() => { setSection(id); setSelectedOrder(null) }}
      className={`pb-4 text-base transition-colors border-b-2 ${
        section === id
          ? 'text-zinc-900 font-medium border-emerald-500'
          : 'text-zinc-400 font-light border-transparent hover:text-zinc-700'
      }`}
    >
      {label}
    </button>
  )

  return (
    <div className="min-h-screen bg-white pt-24 pb-20">
      <div className="max-w-4xl mx-auto px-6">

        {/* ── Page header ── */}
        <div className="flex items-start justify-between gap-6 mb-10">
          <div>
            <h1 className="text-3xl font-bold text-zinc-900 mb-1">My Account</h1>
            <p className="text-sm font-light text-zinc-400">{user.email}</p>
          </div>
          <button
            type="button"
            onClick={signOut}
            className="flex items-center gap-2 text-sm font-light text-zinc-500 border border-gray-200 px-4 py-2 rounded-lg hover:text-red-600 hover:border-red-200 hover:bg-red-50 transition-colors flex-shrink-0 mt-1"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" x2="9" y1="12" y2="12" />
            </svg>
            Sign out
          </button>
        </div>

        {/* ── Tab bar ── */}
        <div className="flex gap-8 border-b border-zinc-100 mb-10">
          {tab('profile', 'Profile')}
          {tab('orders', 'Orders')}
        </div>

        {/* ── Profile ── */}
        {section === 'profile' && (
          <div className="max-w-xl space-y-8">

            {/* Email info */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">Email address</p>
              <div className="flex items-center gap-3 bg-zinc-50 border border-zinc-100 rounded-lg px-4 py-3">
                <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-zinc-400 flex-shrink-0">
                  <rect width="20" height="16" x="2" y="4" rx="2" />
                  <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                </svg>
                <span className="text-base font-light text-zinc-700">{user.email}</span>
              </div>
            </div>

            {/* Action cards */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-3">Account settings</p>
              <div className="space-y-3">
                <Link href="/account/change-email" className="group flex items-center justify-between bg-white border border-gray-100 rounded-lg shadow-sm px-5 py-4 hover:border-emerald-200 hover:shadow transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
                      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-emerald-600">
                        <rect width="20" height="16" x="2" y="4" rx="2" />
                        <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-base font-medium text-zinc-900">Change email</p>
                      <p className="text-sm font-light text-zinc-500">Update your email address</p>
                    </div>
                  </div>
                  <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-zinc-300 group-hover:text-emerald-400 transition-colors flex-shrink-0">
                    <path d="M7.5 5l5 5-5 5" />
                  </svg>
                </Link>

                <Link href="/account/change-password" className="group flex items-center justify-between bg-white border border-gray-100 rounded-lg shadow-sm px-5 py-4 hover:border-emerald-200 hover:shadow transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-9 h-9 bg-emerald-50 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:bg-emerald-100 transition-colors">
                      <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-emerald-600">
                        <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                        <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-base font-medium text-zinc-900">Change password</p>
                      <p className="text-sm font-light text-zinc-500">Update your password</p>
                    </div>
                  </div>
                  <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-zinc-300 group-hover:text-emerald-400 transition-colors flex-shrink-0">
                    <path d="M7.5 5l5 5-5 5" />
                  </svg>
                </Link>
              </div>
            </div>
          </div>
        )}

        {/* ── Orders ── */}
        {section === 'orders' && (
          <div>
            {ordersLoading ? (
              <div className="flex items-center justify-center py-24">
                <div className="w-6 h-6 border-2 border-zinc-200 border-t-zinc-900 rounded-full animate-spin" />
              </div>

            ) : selectedOrder ? (
              /* ── Order detail ── */
              <div>
                <button
                  type="button"
                  onClick={() => setSelectedOrder(null)}
                  className="inline-flex items-center gap-2 text-sm font-light text-zinc-400 hover:text-zinc-700 transition-colors mb-8 group"
                >
                  <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 transition-transform group-hover:-translate-x-0.5">
                    <path d="M12.5 5L7.5 10l5 5" />
                  </svg>
                  Back to orders
                </button>

                {/* Order header */}
                <div className="bg-white border border-gray-100 rounded-lg shadow-sm p-6 mb-4">
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-widest text-zinc-400 mb-1">
                        Order #{selectedOrder.id.slice(-8).toUpperCase()}
                      </p>
                      <p className="text-sm font-light text-zinc-500">
                        {new Date(selectedOrder.created_at).toLocaleDateString('en-GB', {
                          day: 'numeric', month: 'long', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <StatusBadge status={selectedOrder.status} />
                      <span className="text-xl font-semibold text-zinc-900">
                        {formatMoney(selectedOrder.total_price)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Order items */}
                <div className="space-y-3 mb-6">
                  {selectedOrder.order_items?.map((item) => (
                    <div key={item.id} className="bg-white border border-gray-100 rounded-lg shadow-sm p-4 flex items-center gap-4">
                      <div className="w-16 h-16 bg-zinc-50 border border-zinc-100 rounded-lg overflow-hidden flex-shrink-0">
                        {item.variant_new?.image_url ? (
                          <Image
                            width={64}
                            height={64}
                            src={item.variant_new.image_url}
                            alt={item.product_new?.name ?? ''}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="w-6 h-6 text-zinc-300">
                              <rect width="18" height="18" x="3" y="3" rx="2" />
                              <circle cx="9" cy="9" r="2" />
                              <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                            </svg>
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-base font-medium text-zinc-900 mb-1 truncate">
                          {item.product_new?.name ?? '—'}
                        </p>
                        <div className="flex flex-wrap gap-x-3 gap-y-0.5 text-sm font-light text-zinc-500">
                          {item.variant_new?.color && <span>{item.variant_new.color}</span>}
                          {item.size && <span>{item.size}</span>}
                          <span>Qty {item.quantity}</span>
                        </div>
                      </div>
                      <p className="text-base font-semibold text-zinc-900 flex-shrink-0">
                        {formatMoney(item.price_at_purchase * item.quantity)}
                      </p>
                    </div>
                  ))}
                </div>

                {/* Reorder */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleReorder(selectedOrder)}
                    disabled={reorderLoading}
                    className="flex items-center gap-2 bg-emerald-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {reorderLoading ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Adding&hellip;
                      </>
                    ) : (
                      'Reorder all items'
                    )}
                  </button>
                </div>
              </div>

            ) : orders.length === 0 ? (
              /* ── Empty state ── */
              <div className="text-center py-24">
                <div className="w-12 h-12 bg-zinc-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-zinc-400">
                    <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
                    <line x1="3" x2="21" y1="6" y2="6" />
                    <path d="M16 10a4 4 0 0 1-8 0" />
                  </svg>
                </div>
                <p className="text-base text-zinc-500 font-light mb-1">No orders yet</p>
                <p className="text-sm text-zinc-400 font-light mb-6">Your completed orders will appear here</p>
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 bg-emerald-600 text-white px-5 py-2.5 rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors"
                >
                  Browse products
                </Link>
              </div>

            ) : (
              /* ── Order list ── */
              <div className="space-y-3">
                {orders.map((order) => (
                  <button
                    key={order.id}
                    type="button"
                    onClick={() => setSelectedOrder(order)}
                    className="w-full text-left bg-white border border-gray-100 rounded-lg shadow-sm px-5 py-4 hover:border-emerald-200 hover:shadow transition-all group"
                  >
                    <div className="flex items-center justify-between gap-4">
                      <div className="min-w-0">
                        <div className="flex items-center gap-3 mb-1 flex-wrap">
                          <p className="text-base font-medium text-zinc-900 group-hover:text-emerald-700 transition-colors">
                            Order #{order.id.slice(-8).toUpperCase()}
                          </p>
                          <StatusBadge status={order.status} />
                        </div>
                        <p className="text-sm font-light text-zinc-400">
                          {new Date(order.created_at).toLocaleDateString('en-GB', {
                            day: 'numeric', month: 'short', year: 'numeric',
                          })}
                          {' · '}
                          {order.order_items?.length ?? 0} item{order.order_items?.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <span className="text-base font-semibold text-zinc-900">
                          {formatMoney(order.total_price)}
                        </span>
                        <svg aria-hidden="true" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4 text-zinc-300 group-hover:text-emerald-400 transition-colors">
                          <path d="M7.5 5l5 5-5 5" />
                        </svg>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
