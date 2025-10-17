import Image from 'next/image'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useSupabase } from '@/context/SupabaseContext'

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

export default function OrdersPage() {
  const { user, loading: authLoading } = useAuth()
  const router = useRouter()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const { client: supabase } = useSupabase()

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true)
      if (!user) {
        console.error('No authenticated user')
        return
      }
      // First, look up the user record in the users table
      const { data: userRecord, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('auth_user_id', user.id)
        .single()

      if (userError) {
        console.error('Error looking up user record:', userError)
        return
      }

      if (!userRecord) {
        console.error('User record not found')
        return
      }

      // Now fetch orders using the correct user_id
      const { data: ordersData, error: ordersError } = await supabase
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
        console.error('Error fetching orders:', ordersError)
        return
      }

      const transformed: Order[] = (ordersData || []).map((order: unknown) => {
        const o = order as Record<string, unknown>
        return {
          id: o.id as string,
          total_price: o.total_price as number,
          status: o.status as string,
          created_at: o.created_at as string,
          order_items: (Array.isArray(o.order_items) ? o.order_items : []).map((item: unknown) => {
            const i = item as Record<string, unknown>
            return {
              id: i.id as string,
              quantity: i.quantity as number,
              size: i.size as string,
              price_at_purchase: i.price_at_purchase as number,
              products: i.products
                ? { title: (i.products as Record<string, unknown>).title as string }
                : undefined,
              product_variants: i.product_variants
                ? {
                    color: (i.product_variants as Record<string, unknown>).color as string,
                    image_url: (i.product_variants as Record<string, unknown>).image_url as string,
                  }
                : undefined,
            }
          }),
        }
      })
      setOrders(transformed)
    } catch (error) {
      console.error('Error fetching orders:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [user, supabase])

  useEffect(() => {
    if (authLoading) return

    if (!user) {
      router.push('/auth')
      return
    }

    fetchOrders()
  }, [user, authLoading, router, fetchOrders])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-GB', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-800'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800'
      case 'cancelled':
        return 'bg-red-100 text-red-800'
      default:
        return 'bg-gray-100 text-gray-800'
    }
  }

  if (authLoading) {
    return (
      <div className="max-w-4xl mx-auto py-20 px-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to auth
  }

  return (
    <div className="max-w-4xl mx-auto py-20 px-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-stone-800 mb-2">My Orders</h1>
        <p className="text-gray-600">View your order history and track your purchases</p>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
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
            <div key={order.id} className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Order #{order.id.slice(-8)}
                  </h3>
                  <p className="text-sm text-gray-500">{formatDate(order.created_at)}</p>
                </div>
                <div className="text-right">
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(order.status)}`}
                  >
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                  <p className="text-lg font-bold text-blue-600 mt-1">
                    £{order.total_price.toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {order.order_items?.map((item) => (
                  <div key={item.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-lg">
                    <Image
                      width={60}
                      height={60}
                      src={item.product_variants?.image_url || '/public/assets/placeholder.png'}
                      alt={item.products?.title || 'Product image'}
                      className="w-15 h-15 object-cover rounded"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{item.products?.title}</h4>
                      <p className="text-sm text-gray-500">Color: {item.product_variants?.color}</p>
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
  )
}
