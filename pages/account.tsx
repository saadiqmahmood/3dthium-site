import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import Toast from '@/components/ui/Toast'
import { useAuth } from '@/context/AuthContext'
import { useSupabase } from '@/context/SupabaseContext'
import { formatMoney } from '@/lib/format/money'

// Define types for order and order item
interface Product {
  name: string
}
interface ProductVariant {
  color: string
  image_url: string
}
interface OrderItem {
  id: string
  quantity: number
  size: string
  price_at_purchase: number
  products?: Product
  product_variants?: ProductVariant
}
interface Order {
  id: string
  total_price: number
  status: string
  created_at: string
  order_items: OrderItem[]
}

export default function AccountPage() {
  const { user, loading, signOut } = useAuth()
  const router = useRouter()
  const supabaseContext = useSupabase()
  const [section, setSection] = useState<'profile' | 'orders'>('profile')
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [reorderLoading, setReorderLoading] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    console.log('📄 [AccountPage] Component mounted, checking auth state:', {
      hasUser: !!user,
      loading,
      pathname: router.pathname,
    })

    if (!loading && !user) {
      console.log('🚫 [AccountPage] No user, redirecting to auth')
      router.push('/auth')
    }
  }, [user, loading, router])

  // biome-ignore lint/correctness/useExhaustiveDependencies: fetchOrders is a stable async fetcher defined below
  useEffect(() => {
    if (!supabaseContext) return

    console.log('📄 [AccountPage] User or section changed:', {
      hasUser: !!user,
      section,
      userId: user?.id,
    })

    if (user && section === 'orders') {
      console.log('📄 [AccountPage] Fetching orders for user:', user.id)
      fetchOrders()
    }
  }, [user, section, supabaseContext])

  const fetchOrders = async () => {
    if (!supabaseContext) {
      setToast({ message: 'Unable to connect. Please refresh the page.', type: 'error' })
      return
    }
    const { client: supabaseClient } = supabaseContext

    console.log('🔄 [AccountPage] Starting fetchOrders...')
    setOrdersLoading(true)
    try {
      if (!user) {
        console.error('❌ [AccountPage] No authenticated user for fetchOrders')
        return
      }

      console.log('🔍 [AccountPage] Looking up user record for:', user.id)
      // Look up user record
      const { data: userRecord, error: userError } = await supabaseClient
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (userError) {
        console.error('❌ [AccountPage] Error looking up user record:', userError)
        setToast({ message: 'Failed to load your orders', type: 'error' })
        return
      }

      if (!userRecord) {
        setToast({ message: 'Account not found. Please contact support.', type: 'error' })
        return
      }

      console.log('✅ [AccountPage] User record found:', userRecord.id)

      // Fetch orders
      console.log('🔄 [AccountPage] Fetching orders for user record:', userRecord.id)
      const { data: ordersData, error: ordersError } = await supabaseClient
        .from('orders')
        .select(`
          id,
          total_price,
          status,
          created_at,
          order_items (
            id,
            quantity,
            size,
            price_at_purchase,
            products (
              name
            ),
            product_variants (
              color,
              image_url
            )
          )
        `)
        .eq('user_id', userRecord.id)
        .order('created_at', { ascending: false })

      if (ordersError) {
        console.error('❌ [AccountPage] Error fetching orders:', ordersError)
        setToast({ message: 'Failed to load your orders', type: 'error' })
        return
      }

      console.log('✅ [AccountPage] Orders fetched successfully:', ordersData?.length || 0)

      // Transform ordersData to match Order type
      type SupabaseOrderItem = {
        id: string
        quantity: number
        size: string
        price_at_purchase: number
        products?: { name?: string } | { name?: string }[]
        product_variants?:
          | { color?: string; image_url?: string }
          | { color?: string; image_url?: string }[]
      }
      type SupabaseOrder = {
        id: string
        total_price: number
        status: string
        created_at: string
        order_items: SupabaseOrderItem[]
      }
      const transformed: Order[] = (ordersData || []).map((order: SupabaseOrder) => {
        return {
          id: String(order.id),
          total_price: Number(order.total_price),
          status: String(order.status),
          created_at: String(order.created_at),
          order_items: Array.isArray(order.order_items)
            ? order.order_items.map((item: SupabaseOrderItem) => {
                // Handle both array and object for products
                let productObj: { name: string } = { name: '' }
                if (item.products) {
                  if (Array.isArray(item.products)) {
                    productObj = {
                      name:
                        typeof item.products[0]?.name === 'string' ? item.products[0].name : '',
                    }
                  } else {
                    productObj = {
                      name: typeof item.products.name === 'string' ? item.products.name : '',
                    }
                  }
                }
                // Handle both array and object for product_variants
                let variantObj: { color: string; image_url: string } = { color: '', image_url: '' }
                if (item.product_variants) {
                  if (Array.isArray(item.product_variants)) {
                    variantObj = {
                      color:
                        typeof item.product_variants[0]?.color === 'string'
                          ? item.product_variants[0].color
                          : '',
                      image_url:
                        typeof item.product_variants[0]?.image_url === 'string'
                          ? item.product_variants[0].image_url
                          : '',
                    }
                  } else {
                    variantObj = {
                      color:
                        typeof item.product_variants.color === 'string'
                          ? item.product_variants.color
                          : '',
                      image_url:
                        typeof item.product_variants.image_url === 'string'
                          ? item.product_variants.image_url
                          : '',
                    }
                  }
                }
                return {
                  id: String(item.id),
                  quantity: Number(item.quantity),
                  size: String(item.size),
                  price_at_purchase: Number(item.price_at_purchase),
                  products: productObj,
                  product_variants: variantObj,
                }
              })
            : [],
        }
      })
      setOrders(transformed)
    } catch {
      setOrders([])
    } finally {
      setOrdersLoading(false)
    }
  }

  const handleReorder = async (order: Order) => {
    setReorderLoading(true)
    try {
      const cart = order.order_items.map((item: OrderItem) => ({
        product: { name: item.products?.name },
        variant: {
          color: item.product_variants?.color,
          image_url: item.product_variants?.image_url,
          price: item.price_at_purchase,
        },
        size: item.size,
        quantity: item.quantity,
      }))
      localStorage.setItem('cart', JSON.stringify(cart))
      router.push('/cart')
    } finally {
      setReorderLoading(false)
    }
  }

  if (loading || !user) {
    return <p className="text-center py-20 text-zinc-400">Loading account...</p>
  }

  return (
    <div className="min-h-screen bg-white pt-20">
      <div className="max-w-7xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-12">
          <h1 className="text-4xl font-light text-zinc-900 mb-3">My Account</h1>
          <p className="text-zinc-600 font-light">Manage your profile and orders</p>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap gap-3 mb-8 border-b border-gray-200 pb-4">
          <button
            type="button"
            onClick={() => {
              setSection('profile')
              setSelectedOrder(null)
            }}
            className={`px-6 py-3 rounded-lg font-light transition-all ${
              section === 'profile'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 text-zinc-700 border border-gray-200 hover:border-gray-300 hover:text-zinc-900'
            }`}
          >
            <svg
              aria-hidden="true"
              focusable="false"
              className="w-5 h-5 inline mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
              />
            </svg>
            Profile
          </button>
          <button
            type="button"
            onClick={() => {
              setSection('orders')
              setSelectedOrder(null)
            }}
            className={`px-6 py-3 rounded-lg font-light transition-all ${
              section === 'orders'
                ? 'bg-emerald-500 text-white'
                : 'bg-gray-100 text-zinc-700 border border-gray-200 hover:border-gray-300 hover:text-zinc-900'
            }`}
          >
            <svg
              aria-hidden="true"
              focusable="false"
              className="w-5 h-5 inline mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            Orders
          </button>
          <button
            type="button"
            onClick={signOut}
            className="ml-auto px-6 py-3 rounded-lg font-light bg-gray-100 text-zinc-700 border border-gray-200 hover:border-red-300 hover:text-red-600 transition-all"
          >
            <svg
              aria-hidden="true"
              focusable="false"
              className="w-5 h-5 inline mr-2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
              />
            </svg>
            Sign Out
          </button>
        </div>

        {/* Content */}
        <div className="min-h-[60vh]">
          {section === 'profile' && (
            <div className="max-w-2xl">
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8 mb-6">
                <h2 className="text-2xl font-light text-zinc-900 mb-6 flex items-center gap-3">
                  <svg
                    aria-hidden="true"
                    focusable="false"
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  Profile Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <p className="block text-base font-light text-zinc-400 mb-2">Email Address</p>
                    <p className="text-lg text-zinc-900 font-light bg-white border border-gray-200 rounded-lg px-4 py-3">
                      {user.email}
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <Link href="/account/change-email" className="block">
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 hover:border-emerald-500/50 transition-all group cursor-pointer">
                    <div className="flex items-start gap-4">
                      <div className="bg-emerald-500/10 p-3 rounded-lg group-hover:bg-emerald-500/20 transition">
                        <svg
                          aria-hidden="true"
                          focusable="false"
                          className="w-6 h-6 text-emerald-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-zinc-900 mb-1">Change Email</h3>
                        <p className="text-base text-zinc-600 font-light">
                          Update your email address
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>

                <Link href="/account/change-password" className="block">
                  <div className="bg-gray-50 border border-gray-200 rounded-2xl p-6 hover:border-emerald-500/50 transition-all group cursor-pointer">
                    <div className="flex items-start gap-4">
                      <div className="bg-emerald-500/10 p-3 rounded-lg group-hover:bg-emerald-500/20 transition">
                        <svg
                          aria-hidden="true"
                          focusable="false"
                          className="w-6 h-6 text-emerald-400"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                          />
                        </svg>
                      </div>
                      <div>
                        <h3 className="text-lg font-medium text-zinc-900 mb-1">Change Password</h3>
                        <p className="text-base text-zinc-600 font-light">Update your password</p>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            </div>
          )}
          {section === 'orders' && (
            <div>
              {ordersLoading ? (
                <div className="text-center py-20">
                  <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent mx-auto"></div>
                  <p className="mt-4 text-zinc-600 font-light">Loading orders...</p>
                </div>
              ) : selectedOrder ? (
                <div className="bg-gray-50 border border-gray-200 rounded-2xl p-8">
                  <button
                    type="button"
                    onClick={() => setSelectedOrder(null)}
                    className="mb-6 text-emerald-400 hover:text-emerald-300 font-light flex items-center gap-2 transition"
                  >
                    <svg
                      aria-hidden="true"
                      focusable="false"
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15 19l-7-7 7-7"
                      />
                    </svg>
                    Back to Orders
                  </button>
                  <div className="flex flex-wrap justify-between items-start gap-4 mb-6 pb-6 border-b border-gray-200">
                    <div>
                      <h3 className="text-2xl font-light text-zinc-900 mb-2">
                        Order #{selectedOrder.id.slice(-8)}
                      </h3>
                      <p className="text-base text-zinc-600 font-light">
                        {new Date(selectedOrder.created_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex px-3 py-1.5 text-sm font-medium rounded-lg ${
                          selectedOrder.status === 'paid'
                            ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                            : selectedOrder.status === 'pending'
                              ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                              : 'bg-gray-200 text-zinc-600 border border-gray-300'
                        }`}
                      >
                        {selectedOrder.status.charAt(0).toUpperCase() +
                          selectedOrder.status.slice(1)}
                      </span>
                      <p className="text-2xl font-semibold text-zinc-900 mt-2">
                        {formatMoney(selectedOrder.total_price)}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-3 mb-8">
                    {selectedOrder.order_items?.map((item: OrderItem) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-5 bg-gray-50 border border-gray-200 rounded-xl hover:border-gray-300 transition"
                      >
                        <div className="flex-shrink-0 w-20 h-20 bg-gray-100 rounded-lg overflow-hidden border border-gray-200">
                          <Image
                            width={80}
                            height={80}
                            src={item.product_variants?.image_url || ''}
                            alt={item.products?.name || ''}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-zinc-900 mb-2">{item.products?.name}</h4>
                          <div className="flex flex-wrap gap-3 text-base text-zinc-600 font-light">
                            <span>Color: {item.product_variants?.color}</span>
                            <span>•</span>
                            <span>Size: {item.size}</span>
                            <span>•</span>
                            <span>Qty: {item.quantity}</span>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-semibold text-zinc-900 text-lg">
                            {formatMoney(item.price_at_purchase * item.quantity)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={() => handleReorder(selectedOrder)}
                      disabled={reorderLoading}
                      className="bg-zinc-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-zinc-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {reorderLoading ? 'Adding to Cart...' : 'Reorder All Items'}
                    </button>
                  </div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-20 bg-gray-50 border border-gray-200 rounded-2xl">
                  <div className="w-20 h-20 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-6">
                    <svg
                      aria-hidden="true"
                      focusable="false"
                      className="w-10 h-10 text-zinc-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-light text-zinc-900 mb-2">No orders yet</h3>
                  <p className="text-zinc-600 font-light mb-8">
                    Start shopping to see your orders here
                  </p>
                  <button
                    type="button"
                    onClick={() => router.push('/products')}
                    className="bg-zinc-900 text-white px-8 py-3 rounded-lg font-medium hover:bg-zinc-800 transition-colors"
                  >
                    Browse Products
                  </button>
                </div>
              ) : (
                <div className="grid gap-4">
                  {orders.map((order) => (
                    <button
                      key={order.id}
                      type="button"
                      className="w-full text-left bg-gray-50 border border-gray-200 rounded-2xl p-6 cursor-pointer hover:border-gray-300 transition-all group"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div className="flex flex-wrap justify-between items-start gap-4 mb-4">
                        <div>
                          <h3 className="text-lg font-medium text-zinc-900 mb-1 group-hover:text-emerald-600 transition">
                            Order #{order.id.slice(-8)}
                          </h3>
                          <p className="text-base text-zinc-600 font-light">
                            {new Date(order.created_at).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <span
                            className={`inline-flex px-3 py-1.5 text-sm font-medium rounded-lg ${
                              order.status === 'paid'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : order.status === 'pending'
                                  ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                                  : 'bg-gray-200 text-zinc-600 border border-gray-300'
                            }`}
                          >
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                          <p className="text-xl font-semibold text-zinc-900">
                            {formatMoney(order.total_price)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-base text-zinc-600 font-light">
                        <svg
                          aria-hidden="true"
                          focusable="false"
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                          />
                        </svg>
                        {order.order_items?.length || 0} item
                        {order.order_items?.length !== 1 ? 's' : ''}
                        <span className="mx-2">•</span>
                        <span className="text-emerald-600 group-hover:text-emerald-700 transition">
                          View details →
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
