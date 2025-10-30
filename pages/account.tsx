import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useSupabase } from '@/context/SupabaseContext'

// Define types for order and order item
interface Product {
  title: string
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
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [section, setSection] = useState<'profile' | 'orders'>('profile')
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [reorderLoading, setReorderLoading] = useState(false)

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
    // eslint-disable-next-line
  }, [user, section, supabaseContext])

  const fetchOrders = async () => {
    if (!supabaseContext) {
      console.error('❌ [AccountPage] Supabase client not available')
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
        return
      }

      if (!userRecord) {
        console.error('❌ [AccountPage] User record not found for:', user.id)
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
              title
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
        return
      }

      console.log('✅ [AccountPage] Orders fetched successfully:', ordersData?.length || 0)

      // Transform ordersData to match Order type
      type SupabaseOrderItem = {
        id: string
        quantity: number
        size: string
        price_at_purchase: number
        products?: { title?: string } | { title?: string }[]
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
                let productObj: { title: string } = { title: '' }
                if (item.products) {
                  if (Array.isArray(item.products)) {
                    productObj = {
                      title:
                        typeof item.products[0]?.title === 'string' ? item.products[0].title : '',
                    }
                  } else {
                    productObj = {
                      title: typeof item.products.title === 'string' ? item.products.title : '',
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
        product: { title: item.products?.title },
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
    return <p className="text-center py-20 text-gray-600">Loading account...</p>
  }

  return (
    <div className="flex min-h-screen bg-gray-50 pt-20">
      {/* Sidebar overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-30 bg-black/40 md:hidden"
          style={{ pointerEvents: 'auto' }}
          onClick={() => setSidebarOpen(false)}
        />
      )}
      {/* Sidebar */}
      <aside
        className={`fixed z-40 top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white shadow-lg transform transition-transform duration-200 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:w-64 md:block`}
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between px-6 py-4 border-b">
            <span className="text-xl font-bold text-stone-800">My Account</span>
            <button
              className="md:hidden text-2xl text-stone-800"
              onClick={() => setSidebarOpen(false)}
            >
              &times;
            </button>
          </div>
          <nav className="flex-1 px-6 py-4 space-y-2">
            <button
              onClick={() => {
                setSection('profile')
                setSidebarOpen(false)
                setSelectedOrder(null)
              }}
              className={`block w-full text-left px-4 py-2 rounded ${section === 'profile' ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-gray-100 text-gray-700'}`}
            >
              Profile
            </button>
            <button
              onClick={() => {
                setSection('orders')
                setSidebarOpen(false)
                setSelectedOrder(null)
              }}
              className={`block w-full text-left px-4 py-2 rounded ${section === 'orders' ? 'bg-blue-100 text-blue-700 font-semibold' : 'hover:bg-gray-100 text-gray-700'}`}
            >
              Orders
            </button>
          </nav>
          <div className="px-6 py-4">
            <button
              onClick={signOut}
              className="w-full bg-stone-800 text-white py-2 rounded hover:bg-stone-700 transition"
            >
              Sign Out
            </button>
          </div>
        </div>
      </aside>
      {/* Main content */}
      <main className="flex-1 pl-0 md:pl-64">
        {/* Mobile nav toggle */}
        <div className="md:hidden flex items-center justify-between px-4 py-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="flex items-center gap-2 text-2xl text-blue-600 md:hidden"
          >
            <span className="text-sm font-semibold text-stone-800">My Account</span>
            <span className="inline-block align-middle text-stone-800 text-sm">&#8594;</span>
          </button>
          <span className="text-lg font-bold text-stone-800">Dashboard</span>
        </div>
        <div className="flex-1 p-4 md:p-10">
          {section === 'profile' && (
            <div className="max-w-lg mx-auto bg-white rounded-xl shadow p-8">
              <h2 className="text-2xl font-bold mb-6 text-stone-800">Profile</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email:</label>
                <p className="text-base text-stone-800 bg-transparent">{user.email}</p>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">Change Email</label>
                <Link href="/account/change-email">
                  <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition mb-2">
                    Change Email
                  </button>
                </Link>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Change Password
                </label>
                <Link href="/account/change-password">
                  <button className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition mb-2">
                    Change Password
                  </button>
                </Link>
              </div>
            </div>
          )}
          {section === 'orders' && (
            <div className="max-w-4xl mx-auto">
              <h2 className="text-2xl font-bold mb-6 text-stone-800">My Orders</h2>
              {ordersLoading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading orders...</p>
                </div>
              ) : selectedOrder ? (
                <div className="bg-white rounded-xl shadow-sm border p-6">
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="mb-4 text-blue-600 hover:underline"
                  >
                    &larr; Back to Orders
                  </button>
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Order #{selectedOrder.id.slice(-8)}
                      </h3>
                      <p className="text-sm text-gray-500">
                        {new Date(selectedOrder.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${selectedOrder.status === 'paid' ? 'bg-green-100 text-green-800' : selectedOrder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}
                      >
                        {selectedOrder.status.charAt(0).toUpperCase() +
                          selectedOrder.status.slice(1)}
                      </span>
                      <p className="text-lg font-bold text-blue-600 mt-1">
                        £{selectedOrder.total_price.toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    {selectedOrder.order_items?.map((item: OrderItem) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                      >
                        <Image
                          width={60}
                          height={60}
                          src={item.product_variants?.image_url || ''}
                          alt={item.products?.title || ''}
                          className="w-15 h-15 object-cover rounded"
                        />
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900">{item.products?.title}</h4>
                          <p className="text-sm text-gray-500">
                            Color: {item.product_variants?.color}
                          </p>
                          <p className="text-sm text-gray-500">Size: {item.size}</p>
                          <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-gray-900">
                            £{(item.price_at_purchase * item.quantity).toFixed(2)}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-8 flex justify-end">
                    <button
                      onClick={() => handleReorder(selectedOrder)}
                      disabled={reorderLoading}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition disabled:bg-blue-400 disabled:cursor-not-allowed"
                    >
                      {reorderLoading ? 'Adding to Cart...' : 'Reorder'}
                    </button>
                  </div>
                </div>
              ) : orders.length === 0 ? (
                <div className="text-center py-12">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-gray-400"
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No orders yet</h3>
                  <p className="text-gray-600 mb-6">Start shopping to see your orders here</p>
                  <button
                    onClick={() => router.push('/products')}
                    className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
                  >
                    Browse Products
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <div
                      key={order.id}
                      className="bg-white rounded-xl shadow-sm border p-6 cursor-pointer hover:shadow-md transition"
                      onClick={() => setSelectedOrder(order)}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-lg font-semibold text-gray-900">
                            Order #{order.id.slice(-8)}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {new Date(order.created_at).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${order.status === 'paid' ? 'bg-green-100 text-green-800' : order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-gray-100 text-gray-800'}`}
                          >
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                          <p className="text-lg font-bold text-blue-600 mt-1">
                            £{order.total_price.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      <div className="space-y-4">
                        {order.order_items?.map((item: OrderItem) => (
                          <div
                            key={item.id}
                            className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg"
                          >
                            <Image
                              width={60}
                              height={60}
                              src={item.product_variants?.image_url || ''}
                              alt={item.products?.title || ''}
                              className="w-15 h-15 object-cover rounded"
                            />
                            <div className="flex-1">
                              <h4 className="font-medium text-gray-900">{item.products?.title}</h4>
                              <p className="text-sm text-gray-500">
                                Color: {item.product_variants?.color}
                              </p>
                              <p className="text-sm text-gray-500">Size: {item.size}</p>
                              <p className="text-sm text-gray-500">Qty: {item.quantity}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">
                                £{(item.price_at_purchase * item.quantity).toFixed(2)}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
