import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import Toast from '@/components/ui/Toast'
import { formatMoney } from '@/lib/format/money'
import type { ProductVariant } from '@/types'

const ORDER_STATUSES = [
  'pending',
  'processing',
  'printing',
  'quality_check',
  'packaging',
  'shipped',
  'delivered',
  'cancelled',
  'refunded',
]

const SIZES = ['150mm', '180mm', '210mm', '240mm']

type Order = {
  id: string
  user_id?: string
  guest_email?: string
  total_price: number
  status: string
  created_at: string
  user_email?: string | null
  // Shipping fields
  shipping_name?: string
  shipping_address?: string
  shipping_city?: string
  shipping_postcode?: string
  shipping_country?: string
  shipping_phone?: string
  shipping_method?: string
  shipping_rate_id?: string
  shipping_cost?: number
  tracking_number?: string
  tracking_url?: string
  shipped_at?: string
  shipping_label_url?: string
}

type OrderItem = {
  id: string
  quantity: number
  size: string | null
  price_at_purchase: number
  products?: { id: string; title: string }
  product_variants?: { id: string; color: string; image_url: string }
  variant_id?: string
  variant_new?: {
    size?: string | null
    color?: string | null
    material?: string | null
    image_url?: string | null
  }
  product_new?: { id: string; name: string } | null
}

export default function AdminOrdersPage() {
  // --- State ---
  const [orders, setOrders] = useState<Order[]>([])
  const [ordersLoading, setOrdersLoading] = useState(false)
  const [orderSearch, setOrderSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDateFrom, setFilterDateFrom] = useState('')
  const [filterDateTo, setFilterDateTo] = useState('')
  const [filterPriceMin, setFilterPriceMin] = useState('')
  const [filterPriceMax, setFilterPriceMax] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const ORDERS_PER_PAGE = 10
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderDetails, setOrderDetails] = useState<(Order & { order_items?: OrderItem[] }) | null>(
    null
  )
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false)
  const [orderStatusInput, setOrderStatusInput] = useState('')
  const [editableOrderItems, setEditableOrderItems] = useState<OrderItem[]>([])
  const [variantsByProduct, setVariantsByProduct] = useState<Record<string, ProductVariant[]>>({})

  // --- Fetch Orders ---
  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true)
    try {
      console.log('🔍 [AdminOrders] Fetching orders from API...')
      const response = await fetch('/api/admin/orders')

      if (!response.ok) {
        console.error('❌ [AdminOrders] Error fetching orders:', response.status)
        throw new Error('Failed to fetch orders')
      }

      const data = await response.json()
      console.log('✅ [AdminOrders] Orders fetched successfully:', data?.length || 0)

      // Fetch user emails for orders with user_id
      let usersMap: Record<string, string> = {}
      if (data && data.length > 0) {
        const userIds = Array.from(new Set(data.map((o: Order) => o.user_id).filter(Boolean)))
        if (userIds.length > 0) {
          console.log('🔍 [AdminOrders] Fetching user emails for:', userIds.length, 'users')
          const usersResponse = await fetch('/api/admin/users')
          if (usersResponse.ok) {
            const usersData = await usersResponse.json()
            usersMap = Object.fromEntries(
              (usersData || []).map((u: { id: string; email: string }) => [u.id, u.email])
            )
          }
        }
      }

      setOrders(
        (data || []).map((o: Order) => ({
          ...o,
          user_email: o.user_id ? usersMap[o.user_id] : null,
        }))
      )
    } catch (error) {
      console.error('❌ [AdminOrders] Error:', error)
      setToast({ message: 'Failed to load orders', type: 'error' })
    } finally {
      setOrdersLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // --- Filtered Orders & Pagination ---
  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.user_email?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.guest_email?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.id?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.status?.toLowerCase().includes(orderSearch.toLowerCase())
    const matchesStatus = filterStatus ? o.status === filterStatus : true
    const matchesDateFrom = filterDateFrom
      ? new Date(o.created_at) >= new Date(filterDateFrom)
      : true
    const matchesDateTo = filterDateTo ? new Date(o.created_at) <= new Date(filterDateTo) : true
    const matchesPriceMin = filterPriceMin ? Number(o.total_price) >= Number(filterPriceMin) : true
    const matchesPriceMax = filterPriceMax ? Number(o.total_price) <= Number(filterPriceMax) : true
    return (
      matchesSearch &&
      matchesStatus &&
      matchesDateFrom &&
      matchesDateTo &&
      matchesPriceMin &&
      matchesPriceMax
    )
  })
  const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE)
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * ORDERS_PER_PAGE,
    currentPage * ORDERS_PER_PAGE
  )

  // --- Bulk Select ---
  const allSelected =
    paginatedOrders.length > 0 && paginatedOrders.every((o) => selectedOrders.includes(o.id))
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedOrders(selectedOrders.filter((id) => !paginatedOrders.some((o) => o.id === id)))
    } else {
      setSelectedOrders([...new Set([...selectedOrders, ...paginatedOrders.map((o) => o.id)])])
    }
  }
  const toggleSelectOrder = (id: string) => {
    setSelectedOrders(
      selectedOrders.includes(id) ? selectedOrders.filter((i) => i !== id) : [...selectedOrders, id]
    )
  }
  const handleBulkDelete = async () => {
    for (const id of selectedOrders) {
      await fetch(`/api/admin/orders/${id}`, { method: 'DELETE' })
    }
    setOrders((orders) => orders.filter((o) => !selectedOrders.includes(o.id)))
    setSelectedOrders([])
  }

  // --- Order Details Modal ---
  useEffect(() => {
    if (!selectedOrder) {
      setOrderDetails(null)
      setOrderDetailsLoading(false)
      return
    }
    setOrderDetailsLoading(true)
    const fetchOrderDetails = async () => {
      const response = await fetch(`/api/admin/orders/${selectedOrder.id}`)
      if (response.ok) {
        const data = await response.json()
        const mappedData = {
          ...data,
          order_items: data.order_items
            ? (data.order_items.map(
                (item: {
                  id: string
                  quantity: number
                  size: string | null
                  price_at_purchase: number
                  variant_id?: string
                  variant_new?: {
                    size?: string | null
                    color?: string | null
                    material?: string | null
                    image_url?: string | null
                  }
                  product_new?: { id: string; name: string } | null
                  products?: { id: string; title: string } | { id: string; title: string }[]
                  product_variants?:
                    | { id: string; color: string; image_url: string }
                    | { id: string; color: string; image_url: string }[]
                }) => ({
                  id: item.id,
                  quantity: item.quantity,
                  size: item.size,
                  price_at_purchase: item.price_at_purchase,
                  variant_id: item.variant_id,
                  variant_new: item.variant_new,
                  product_new: item.product_new,
                  products:
                    item.products && !Array.isArray(item.products)
                      ? { id: item.products.id, title: item.products.title }
                      : undefined,
                  product_variants:
                    item.product_variants && !Array.isArray(item.product_variants)
                      ? {
                          id: item.product_variants.id,
                          color: item.product_variants.color,
                          image_url: item.product_variants.image_url,
                        }
                      : undefined,
                })
              ) as OrderItem[])
            : undefined,
        }
        setOrderDetails(mappedData as Order & { order_items?: OrderItem[] })
        setOrderStatusInput(data?.status || '')
      }
      setOrderDetailsLoading(false)
    }
    fetchOrderDetails()
  }, [selectedOrder])

  // --- Editable Order Items ---
  useEffect(() => {
    if (!orderDetails?.order_items) return
    const fetchVariants = async () => {
      const productIds: string[] = Array.from(
        new Set(
          (orderDetails.order_items ?? [])
            .map((item: OrderItem) => String(item.products?.id))
            .filter(Boolean)
        )
      )
      const variantsMap: Record<string, ProductVariant[]> = {}
      for (const productId of productIds) {
        const response = await fetch(`/api/admin/product-variants/${productId}`)
        if (response.ok) {
          const variants = await response.json()
          variantsMap[productId] = variants || []
        }
      }
      setVariantsByProduct(variantsMap)
    }
    fetchVariants()
    setEditableOrderItems(
      (orderDetails.order_items ?? []).map((item: OrderItem) => ({
        ...item,
        variant_id: item.product_variants?.id,
        product_variants: item.product_variants,
        size: item.size,
        quantity: item.quantity,
      }))
    )
  }, [orderDetails])

  const handleOrderItemChange = (
    idx: number,
    field: keyof OrderItem,
    value: string | number | undefined
  ) => {
    setEditableOrderItems((items) =>
      items.map((item, i) => (i === idx ? { ...item, [field]: value } : item))
    )
  }

  const handleSaveOrderItems = async () => {
    let newTotal = 0
    for (const item of editableOrderItems) {
      const variant = (variantsByProduct[String(item.products?.id)] || []).find(
        (v: ProductVariant) => v.id === item.variant_id
      )
      const price = variant ? Number(variant.price) : Number(item.price_at_purchase)
      newTotal += price * item.quantity
      await fetch(`/api/admin/order-items/${item.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variant_id: item.variant_id,
          size: item.size,
          quantity: item.quantity,
          price_at_purchase: price,
        }),
      })
    }
    if (selectedOrder) {
      await fetch(`/api/admin/orders/${selectedOrder.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ total_price: newTotal }),
      })
      const response = await fetch(`/api/admin/orders/${selectedOrder.id}`)
      if (response.ok) {
        const data = await response.json()
        const mappedData = {
          ...data,
          order_items: data.order_items
            ? (data.order_items.map(
                (item: {
                  id: string
                  quantity: number
                  size: string | null
                  price_at_purchase: number
                  variant_id?: string
                  variant_new?: {
                    size?: string | null
                    color?: string | null
                    material?: string | null
                    image_url?: string | null
                  }
                  product_new?: { id: string; name: string } | null
                  products?: { id: string; title: string } | { id: string; title: string }[]
                  product_variants?:
                    | { id: string; color: string; image_url: string }
                    | { id: string; color: string; image_url: string }[]
                }) => ({
                  id: item.id,
                  quantity: item.quantity,
                  size: item.size,
                  price_at_purchase: item.price_at_purchase,
                  variant_id: item.variant_id,
                  variant_new: item.variant_new,
                  product_new: item.product_new,
                  products:
                    item.products && !Array.isArray(item.products)
                      ? { id: item.products.id, title: item.products.title }
                      : undefined,
                  product_variants:
                    item.product_variants && !Array.isArray(item.product_variants)
                      ? {
                          id: item.product_variants.id,
                          color: item.product_variants.color,
                          image_url: item.product_variants.image_url,
                        }
                      : undefined,
                })
              ) as OrderItem[])
            : undefined,
        }
        setOrderDetails(mappedData as Order & { order_items?: OrderItem[] })
      }
    }
    await fetchOrders()
    setSelectedOrder(null)
  }

  // --- Order Status Update ---
  const handleUpdateOrderStatus = async () => {
    if (!orderDetails) return
    const response = await fetch(`/api/admin/orders/${orderDetails.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: orderStatusInput }),
    })
    if (response.ok) {
      setOrderDetails((od: (Order & { order_items?: OrderItem[] }) | null) =>
        od ? { ...od, status: orderStatusInput } : null
      )
      setOrders((orders) =>
        orders.map((o) => (o.id === orderDetails.id ? { ...o, status: orderStatusInput } : o))
      )
      setSelectedOrder((so: Order | null) => (so ? { ...so, status: orderStatusInput } : so))
      setSelectedOrder(null)
    }
  }

  // --- Delete Order from Modal ---
  const handleDeleteOrderFromModal = async () => {
    if (!orderDetails) return
    const response = await fetch(`/api/admin/orders/${orderDetails.id}`, { method: 'DELETE' })
    if (response.ok) {
      setOrders((orders) => orders.filter((o) => o.id !== orderDetails.id))
      setSelectedOrder(null)
      setOrderDetails(null)
      setSelectedOrder(null)
    }
  }

  // --- Render ---
  return (
    <div className="w-full mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-light text-zinc-900 mb-2">Orders</h1>
        <p className="text-sm text-zinc-600 font-light">Manage and track customer orders</p>
      </div>
      {/* Filters */}
      <div className="mb-6 flex flex-wrap gap-3 items-center bg-white p-4 rounded-lg shadow-sm border border-gray-100">
        <input
          type="text"
          placeholder="Search..."
          value={orderSearch}
          onChange={(e) => setOrderSearch(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2 w-48 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-sm font-light"
        />
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-sm font-light"
        >
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}
            </option>
          ))}
        </select>
        <input
          type="date"
          value={filterDateFrom}
          onChange={(e) => setFilterDateFrom(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-sm font-light"
        />
        <input
          type="date"
          value={filterDateTo}
          onChange={(e) => setFilterDateTo(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-sm font-light"
        />
        <input
          type="number"
          placeholder="Min £"
          value={filterPriceMin}
          onChange={(e) => setFilterPriceMin(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2 w-24 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-sm font-light"
        />
        <input
          type="number"
          placeholder="Max £"
          value={filterPriceMax}
          onChange={(e) => setFilterPriceMax(e.target.value)}
          className="border border-gray-200 rounded-lg px-4 py-2 w-24 text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-sm font-light"
        />
        <button
          type="button"
          onClick={() => {
            setFilterStatus('')
            setFilterDateFrom('')
            setFilterDateTo('')
            setFilterPriceMin('')
            setFilterPriceMax('')
          }}
          className="text-sm text-zinc-600 hover:text-zinc-900 font-light ml-auto"
        >
          Clear Filters
        </button>
      </div>
      {/* Bulk actions */}
      {selectedOrders.length > 0 && (
        <div className="mb-6 bg-emerald-50 border border-emerald-200 rounded-lg p-4 flex items-center justify-between">
          <span className="text-sm text-emerald-900 font-light">
            {selectedOrders.length} order{selectedOrders.length !== 1 ? 's' : ''} selected
          </span>
          <button
            type="button"
            onClick={handleBulkDelete}
            className="px-4 py-1.5 bg-red-600 text-white rounded-lg text-sm hover:bg-red-700 transition-colors font-light"
          >
            Delete Selected
          </button>
        </div>
      )}

      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            checked={allSelected}
            onChange={toggleSelectAll}
            className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded"
          />
          <span className="text-sm text-zinc-700 font-light">Select All</span>
        </div>
        <span className="text-sm text-zinc-600 font-light">
          {filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}
        </span>
      </div>
      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white shadow-sm">
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-4 py-3 w-12">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded"
                />
              </th>
              <th className="px-4 py-3 text-left font-light text-zinc-700">Order ID</th>
              <th className="px-4 py-3 text-left font-light text-zinc-700">User/Guest Email</th>
              <th className="px-4 py-3 text-left font-light text-zinc-700">Total</th>
              <th className="px-4 py-3 text-left font-light text-zinc-700">Shipping</th>
              <th className="px-4 py-3 text-left font-light text-zinc-700">Status</th>
              <th className="px-4 py-3 text-left font-light text-zinc-700">Created</th>
              <th className="px-4 py-3 text-center font-light text-zinc-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ordersLoading ? (
              <tr>
                <td colSpan={8} className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                  <p className="text-zinc-600 mt-2 font-light">Loading orders...</p>
                </td>
              </tr>
            ) : paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan={8} className="text-center py-12 text-zinc-500 font-light">
                  No orders found.
                </td>
              </tr>
            ) : (
              paginatedOrders.map((order) => (
                <tr
                  key={order.id}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order.id)}
                      onChange={() => toggleSelectOrder(order.id)}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded"
                    />
                  </td>
                  <td className="px-4 py-3 font-mono text-zinc-900 text-xs font-light">
                    {order.id.slice(-8)}
                  </td>
                  <td className="px-4 py-3 text-zinc-900 font-light">
                    {order.user_email || order.guest_email || (
                      <span className="text-zinc-400 italic">Unknown</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-900 font-light">
                    {formatMoney(order.total_price)}
                  </td>
                  <td className="px-4 py-3 text-zinc-700 font-light">
                    {order.shipping_method ? (
                      <div className="text-xs">
                        <div className="font-light">{order.shipping_method}</div>
                        {order.shipping_cost && (
                          <div className="text-zinc-500 font-light">
                            {formatMoney(order.shipping_cost)}
                          </div>
                        )}
                        {order.tracking_number && (
                          <div className="text-emerald-600 cursor-pointer hover:text-emerald-700 font-light">
                            Track: {order.tracking_number.slice(-8)}
                          </div>
                        )}
                      </div>
                    ) : (
                      <span className="text-zinc-400 text-xs font-light">No shipping</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-light ${
                        order.status === 'processing'
                          ? 'bg-emerald-50 text-emerald-700'
                          : order.status === 'pending'
                            ? 'bg-yellow-50 text-yellow-700'
                            : order.status === 'cancelled'
                              ? 'bg-red-50 text-red-700'
                              : 'bg-gray-100 text-zinc-700'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-600 text-xs font-light">
                    {new Date(order.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(order)}
                      className="text-emerald-600 hover:text-emerald-700 border border-emerald-300 px-3 py-1 rounded-lg hover:bg-emerald-50 transition-colors text-xs font-light"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-between items-center mt-6">
          <button
            type="button"
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors font-light text-sm"
          >
            Previous
          </button>
          <span className="text-sm text-zinc-600 font-light">
            Page {currentPage} of {totalPages}
          </span>
          <button
            type="button"
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-zinc-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors font-light text-sm"
          >
            Next
          </button>
        </div>
      )}
      {/* Order details modal */}
      {selectedOrder && (
        // biome-ignore lint/a11y/noStaticElementInteractions: Modal backdrop dismiss on click
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSelectedOrder(null)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') setSelectedOrder(null)
          }}
        >
          {/* biome-ignore lint/a11y/noStaticElementInteractions: Modal content stop propagation */}
          <div
            className="bg-white rounded-xl shadow-lg p-8 max-w-3xl w-full border border-gray-200 max-h-[80vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
            onKeyDown={(e) => e.stopPropagation()}
          >
            <h3 className="text-xl font-light mb-6 text-zinc-900">Order Details</h3>
            {orderDetailsLoading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
                <p className="text-zinc-600 mt-2 font-light">Loading...</p>
              </div>
            ) : orderDetails ? (
              <>
                <div className="mb-3 text-zinc-700 font-light">
                  <span className="font-medium">Order ID:</span>{' '}
                  <span className="font-mono text-zinc-900 text-sm">{orderDetails.id}</span>
                </div>
                <div className="mb-3 text-zinc-700 font-light">
                  <span className="font-medium">User/Guest Email:</span>{' '}
                  {orderDetails.user_id
                    ? orders.find((o) => o.id === orderDetails.id)?.user_email
                    : orderDetails.guest_email || (
                        <span className="text-zinc-400 italic">Unknown</span>
                      )}
                </div>
                <div className="mb-3 text-zinc-700 font-light">
                  <span className="font-medium">Total:</span>{' '}
                  <span className="font-light text-zinc-900">
                    {formatMoney(orderDetails.total_price)}
                  </span>
                </div>
                <div className="mb-3 text-zinc-700 font-light">
                  <span className="font-medium">Status:</span>{' '}
                  <span
                    className={`inline-block px-2 py-1 rounded-full text-xs font-light ${
                      orderDetails.status === 'processing'
                        ? 'bg-emerald-50 text-emerald-700'
                        : orderDetails.status === 'pending'
                          ? 'bg-yellow-50 text-yellow-700'
                          : orderDetails.status === 'cancelled'
                            ? 'bg-red-50 text-red-700'
                            : 'bg-gray-100 text-zinc-700'
                    }`}
                  >
                    {orderDetails.status}
                  </span>
                </div>
                <div className="mb-4 text-zinc-700 font-light">
                  <span className="font-medium">Created:</span>{' '}
                  {new Date(orderDetails.created_at).toLocaleString()}
                </div>

                {/* Shipping Information */}
                {(orderDetails.shipping_name || orderDetails.shipping_address) && (
                  <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                    <h4 className="font-light text-zinc-900 mb-3">Shipping Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                      {orderDetails.shipping_name && (
                        <div className="text-zinc-700 font-light">
                          <span className="font-medium">Name:</span> {orderDetails.shipping_name}
                        </div>
                      )}
                      {orderDetails.shipping_address && (
                        <div className="text-zinc-700 font-light">
                          <span className="font-medium">Address:</span>{' '}
                          {orderDetails.shipping_address}
                        </div>
                      )}
                      {orderDetails.shipping_city && (
                        <div className="text-zinc-700 font-light">
                          <span className="font-medium">City:</span> {orderDetails.shipping_city}
                        </div>
                      )}
                      {orderDetails.shipping_postcode && (
                        <div className="text-zinc-700 font-light">
                          <span className="font-medium">Postcode:</span>{' '}
                          {orderDetails.shipping_postcode}
                        </div>
                      )}
                      {orderDetails.shipping_phone && (
                        <div className="text-zinc-700 font-light">
                          <span className="font-medium">Phone:</span> {orderDetails.shipping_phone}
                        </div>
                      )}
                      {orderDetails.shipping_method && (
                        <div className="text-zinc-700 font-light">
                          <span className="font-medium">Method:</span>{' '}
                          {orderDetails.shipping_method}
                        </div>
                      )}
                      {orderDetails.shipping_cost && (
                        <div className="text-zinc-700 font-light">
                          <span className="font-medium">Cost:</span>{' '}
                          {formatMoney(orderDetails.shipping_cost)}
                        </div>
                      )}
                      {orderDetails.tracking_number && (
                        <div className="text-zinc-700 font-light">
                          <span className="font-medium">Tracking:</span>{' '}
                          {orderDetails.tracking_url ? (
                            <a
                              href={orderDetails.tracking_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-emerald-600 hover:text-emerald-700 font-light"
                            >
                              {orderDetails.tracking_number}
                            </a>
                          ) : (
                            <span>{orderDetails.tracking_number}</span>
                          )}
                        </div>
                      )}
                      {orderDetails.shipped_at && (
                        <div className="text-zinc-700 font-light">
                          <span className="font-medium">Shipped:</span>{' '}
                          {new Date(orderDetails.shipped_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                    {orderDetails.shipping_label_url && (
                      <div className="mt-3">
                        <a
                          href={orderDetails.shipping_label_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-light"
                        >
                          View Shipping Label
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <div className="mb-6">
                  <h4 className="text-lg font-light text-zinc-900 mb-4">
                    Order Items ({editableOrderItems.length})
                  </h4>
                  <div className="space-y-4">
                    {editableOrderItems.length === 0 ? (
                      <div className="text-center py-8 text-zinc-500 bg-gray-50 rounded-lg font-light">
                        No items in this order
                      </div>
                    ) : (
                      editableOrderItems.map((item, idx) => {
                        const productName =
                          item.product_new?.name || item.products?.title || 'Product'
                        const imageUrl =
                          item.variant_new?.image_url ||
                          item.product_variants?.image_url ||
                          '/no-image.png'
                        const color =
                          item.variant_new?.color || item.product_variants?.color || null
                        const size =
                          ('size' in (item.variant_new || {}) ? item.variant_new?.size : null) ||
                          item.size ||
                          null
                        const material =
                          ('material' in (item.variant_new || {})
                            ? item.variant_new?.material
                            : null) || null

                        return (
                          <div
                            key={item.id}
                            className="flex flex-col sm:flex-row gap-4 p-5 bg-gradient-to-r from-gray-50 to-white rounded-xl border border-gray-200 shadow-sm"
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
                              <h5 className="text-base font-light text-zinc-900 mb-3">
                                {productName}
                              </h5>

                              {/* Variant Details - Beautiful Badges */}
                              <div className="flex flex-wrap gap-2 mb-4">
                                {color && (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-light bg-blue-50 text-blue-700 border border-blue-200">
                                    <svg
                                      aria-hidden="true"
                                      focusable="false"
                                      className="w-4 h-4 mr-1.5"
                                      fill="currentColor"
                                      viewBox="0 0 20 20"
                                    >
                                      <path
                                        fillRule="evenodd"
                                        d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
                                        clipRule="evenodd"
                                      />
                                    </svg>
                                    Color: {color}
                                  </span>
                                )}
                                {size && (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-light bg-purple-50 text-purple-700 border border-purple-200">
                                    <svg
                                      aria-hidden="true"
                                      focusable="false"
                                      className="w-4 h-4 mr-1.5"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4"
                                      />
                                    </svg>
                                    Size: {size}
                                  </span>
                                )}
                                {material && (
                                  <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-light bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <svg
                                      aria-hidden="true"
                                      focusable="false"
                                      className="w-4 h-4 mr-1.5"
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
                                    Material: {material}
                                  </span>
                                )}
                              </div>

                              {/* Editable Fields */}
                              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                                <div>
                                  <label
                                    htmlFor={`item-size-${idx}`}
                                    className="block text-xs font-light text-zinc-700 mb-2"
                                  >
                                    Size
                                  </label>
                                  <select
                                    id={`item-size-${idx}`}
                                    value={item.size || ''}
                                    onChange={(e) =>
                                      handleOrderItemChange(idx, 'size', e.target.value)
                                    }
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 font-light"
                                  >
                                    {SIZES.map((s) => (
                                      <option key={s} value={s}>
                                        {s}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label
                                    htmlFor={`item-qty-${idx}`}
                                    className="block text-xs font-light text-zinc-700 mb-2"
                                  >
                                    Quantity
                                  </label>
                                  <input
                                    id={`item-qty-${idx}`}
                                    type="number"
                                    min={1}
                                    value={item.quantity}
                                    onChange={(e) =>
                                      handleOrderItemChange(idx, 'quantity', Number(e.target.value))
                                    }
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 font-light"
                                  />
                                </div>
                                <div>
                                  <label
                                    htmlFor={`item-variant-${idx}`}
                                    className="block text-xs font-light text-zinc-700 mb-2"
                                  >
                                    Variant
                                  </label>
                                  <select
                                    id={`item-variant-${idx}`}
                                    value={item.variant_id || ''}
                                    onChange={(e) =>
                                      handleOrderItemChange(idx, 'variant_id', e.target.value)
                                    }
                                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 font-light"
                                  >
                                    {(variantsByProduct[String(item.products?.id)] || []).map(
                                      (variant) => (
                                        <option key={variant.id} value={variant.id}>
                                          {variant.color || 'Default'}
                                        </option>
                                      )
                                    )}
                                  </select>
                                </div>
                              </div>
                            </div>

                            {/* Price */}
                            <div className="flex-shrink-0 text-right">
                              <p className="text-xl font-light text-zinc-900">
                                {formatMoney(item.price_at_purchase * item.quantity)}
                              </p>
                              <p className="text-xs text-zinc-500 mt-1 font-light">
                                {item.quantity} × {formatMoney(item.price_at_purchase)}
                              </p>
                            </div>
                          </div>
                        )
                      })
                    )}
                  </div>
                  {editableOrderItems.length > 0 && (
                    <button
                      type="button"
                      onClick={handleSaveOrderItems}
                      className="mt-6 w-full sm:w-auto px-6 py-3 bg-emerald-600 text-white font-light rounded-lg hover:bg-emerald-700 transition-colors"
                    >
                      Save Changes
                    </button>
                  )}
                </div>
                <div className="flex flex-col gap-4 mt-6 pt-6 border-t border-gray-100">
                  <div>
                    <label
                      htmlFor="order-status-select"
                      className="block text-sm font-light text-zinc-700 mb-2"
                    >
                      Status
                    </label>
                    {/* biome-ignore lint/correctness/useUniqueElementIds: Single modal instance */}
                    <select
                      id="order-status-select"
                      value={orderStatusInput}
                      onChange={(e) => setOrderStatusInput(e.target.value)}
                      className="border border-gray-200 rounded-lg px-4 py-2 w-full text-zinc-900 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 text-sm font-light"
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handleUpdateOrderStatus}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-light text-sm"
                    >
                      Update Status
                    </button>
                    <button
                      type="button"
                      onClick={handleDeleteOrderFromModal}
                      className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-light text-sm"
                    >
                      Delete Order
                    </button>
                    <button
                      type="button"
                      onClick={() => setSelectedOrder(null)}
                      className="ml-auto px-4 py-2 bg-white border border-gray-200 text-zinc-700 rounded-lg hover:bg-gray-50 transition-colors font-light text-sm"
                    >
                      Close
                    </button>
                  </div>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-zinc-500 font-light">Order not found.</div>
            )}
          </div>
        </div>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
