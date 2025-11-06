import Image from 'next/image'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useSupabase } from '@/context/SupabaseContext'

interface Product {
  title?: string
  name?: string
}

interface ProductVariant {
  color?: string
  image_url?: string
}

interface ProductVariantNew {
  size?: string | null
  color?: string | null
  material?: string | null
  image_url?: string | null
}

interface OrderItem {
  id: string
  quantity: number
  size?: string | null
  price_at_purchase: number
  products?: Product
  product_variants?: ProductVariant
  variant_new?: ProductVariantNew
  product_new?: Product | null
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
  const supabaseContext = useSupabase()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)

  const fetchOrders = useCallback(async () => {
    if (!supabaseContext) {
      console.error('Supabase client not available')
      return
    }
    const { client: supabase } = supabaseContext

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
            variant_id,
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

      // Enrich order items with product_variants_new data if available
      const enrichedOrders = await Promise.all(
        (ordersData || []).map(async (order: unknown) => {
          const o = order as Record<string, unknown>
          const items = (Array.isArray(o.order_items) ? o.order_items : []) as Array<{
            variant_id?: string
            [key: string]: unknown
          }>

          const enrichedItems = await Promise.all(
            items.map(async (item) => {
              if (!item.variant_id) return item

              // Try fetching from product_variants_new
              const { data: newVariant } = await supabase
                .from('product_variants_new')
                .select('id, size, color, material, image_url')
                .eq('id', item.variant_id)
                .single()

              if (newVariant) {
                return {
                  ...item,
                  variant_new: {
                    size: newVariant.size,
                    color: newVariant.color,
                    material: newVariant.material,
                    image_url: newVariant.image_url,
                  },
                }
              }

              return item
            })
          )

          return {
            id: o.id as string,
            total_price: o.total_price as number,
            status: o.status as string,
            created_at: o.created_at as string,
            order_items: enrichedItems.map((item: unknown) => {
              const i = item as Record<string, unknown>
              return {
                id: i.id as string,
                quantity: i.quantity as number,
                size: i.size as string | null,
                price_at_purchase: i.price_at_purchase as number,
                products: i.products
                  ? Array.isArray(i.products)
                    ? (i.products[0] as Product)
                    : (i.products as Product)
                  : undefined,
                product_variants: i.product_variants
                  ? Array.isArray(i.product_variants)
                    ? (i.product_variants[0] as ProductVariant)
                    : (i.product_variants as ProductVariant)
                  : undefined,
                variant_new: i.variant_new as ProductVariantNew | undefined,
              }
            }),
          }
        })
      )

      setOrders(enrichedOrders)
    } catch (error) {
      console.error('Error fetching orders:', error)
      setOrders([])
    } finally {
      setLoading(false)
    }
  }, [user, supabaseContext])

  useEffect(() => {
    if (authLoading) return
    if (!supabaseContext) return

    if (!user) {
      router.push('/auth')
      return
    }

    fetchOrders()
  }, [user, authLoading, router, fetchOrders, supabaseContext])

  if (!supabaseContext) {
    return <div className="p-8">Error: Supabase client not available</div>
  }

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
      case 'processing':
      case 'shipped':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      case 'cancelled':
      case 'refunded':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  const getStatusBadge = (status: string) => {
    const colors = getStatusColor(status)
    return (
      <span
        className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${colors}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
      </span>
    )
  }

  if (authLoading) {
    return (
      <div className="max-w-6xl mx-auto py-20 px-6 text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return null // Will redirect to auth
  }

  return (
    <div className="max-w-6xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-stone-900 mb-3">My Orders</h1>
        <p className="text-lg text-gray-600">View your order history and track your purchases</p>
      </div>

      {loading ? (
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg
              className="w-10 h-10 text-blue-600"
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
          <h3 className="text-2xl font-semibold text-gray-900 mb-2">No orders yet</h3>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Start shopping to see your orders here. Browse our collection of 3D printed products!
          </p>
          <button
            type="button"
            onClick={() => router.push('/products')}
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
              />
            </svg>
            Browse Products
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.map((order) => (
            <div
              key={order.id}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300"
            >
              {/* Order Header */}
              <div className="bg-gradient-to-r from-gray-50 to-white px-6 py-5 border-b border-gray-100">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-bold text-gray-900">
                        Order #{order.id.slice(-8)}
                      </h3>
                      {getStatusBadge(order.status)}
                    </div>
                    <p className="text-sm text-gray-500">
                      <svg
                        className="w-4 h-4 inline mr-1"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-blue-600">
                      £{order.total_price.toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Total Amount</p>
                  </div>
                </div>
              </div>

              {/* Order Items */}
              <div className="px-6 py-6">
                <h4 className="text-sm font-semibold text-gray-700 mb-4 uppercase tracking-wide">
                  Order Items ({order.order_items?.length || 0})
                </h4>
                <div className="space-y-4">
                  {order.order_items?.map((item) => {
                    const variantNew = item.variant_new
                    const productVariants = item.product_variants
                    const productName =
                      item.product_new?.name ||
                      item.products?.title ||
                      item.products?.name ||
                      'Product'
                    const imageUrl =
                      variantNew?.image_url || productVariants?.image_url || '/placeholder.png'
                    const color = variantNew?.color || productVariants?.color
                    const size = variantNew?.size || item.size
                    const material = variantNew?.material

                    return (
                      <div
                        key={item.id}
                        className="flex flex-col sm:flex-row gap-4 p-5 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-100 hover:border-blue-200 transition-all duration-200"
                      >
                        {/* Product Image */}
                        <div className="relative flex-shrink-0 w-full sm:w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                          <Image
                            src={imageUrl}
                            alt={productName}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, 96px"
                          />
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <h5 className="text-lg font-semibold text-gray-900 mb-2 truncate">
                            {productName}
                          </h5>
                          <div className="flex flex-wrap gap-3 mb-3">
                            {color && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600 font-medium">Color:</span>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                                  {color}
                                </span>
                              </div>
                            )}
                            {size && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600 font-medium">Size:</span>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                                  {size}
                                </span>
                              </div>
                            )}
                            {material && (
                              <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-600 font-medium">Material:</span>
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-green-50 text-green-700 border border-green-200">
                                  {material}
                                </span>
                              </div>
                            )}
                          </div>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <span className="font-medium">Quantity: {item.quantity}</span>
                            <span>×</span>
                            <span className="font-medium">
                              £{item.price_at_purchase.toFixed(2)}
                            </span>
                          </div>
                        </div>

                        {/* Price */}
                        <div className="flex-shrink-0 text-right">
                          <p className="text-xl font-bold text-gray-900">
                            £{(item.price_at_purchase * item.quantity).toFixed(2)}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {item.quantity} × £{item.price_at_purchase.toFixed(2)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
