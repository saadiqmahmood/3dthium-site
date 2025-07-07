import { useEffect, useState, useCallback } from 'react'
import Image from 'next/image'
import { ProductVariant } from '@/types'
import { useSupabase } from '@/context/SupabaseContext'

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
  id: string;
  user_id?: string;
  guest_email?: string;
  total_price: number;
  status: string;
  created_at: string;
  user_email?: string | null;
  // Shipping fields
  shipping_name?: string;
  shipping_address?: string;
  shipping_city?: string;
  shipping_postcode?: string;
  shipping_country?: string;
  shipping_phone?: string;
  shipping_method?: string;
  shipping_rate_id?: string;
  shipping_cost?: number;
  tracking_number?: string;
  tracking_url?: string;
  shipped_at?: string;
  shipping_label_url?: string;
}

type OrderItem = {
  id: string;
  quantity: number;
  size: string;
  price_at_purchase: number;
  products?: { id: string; title: string };
  product_variants?: { id: string; color: string; image_url: string };
  variant_id?: string;
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
  const ORDERS_PER_PAGE = 10
  const [selectedOrders, setSelectedOrders] = useState<string[]>([])
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null)
  const [orderDetails, setOrderDetails] = useState<(Order & { order_items?: OrderItem[] }) | null>(null)
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false)
  const [orderStatusInput, setOrderStatusInput] = useState('')
  const [editableOrderItems, setEditableOrderItems] = useState<OrderItem[]>([])
  const [variantsByProduct, setVariantsByProduct] = useState<Record<string, ProductVariant[]>>({})
  const { client: supabaseClient } = useSupabase()

  // --- Fetch Orders ---
  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true)
    const { data } = await supabaseClient
      .from('orders')
      .select('id, user_id, guest_email, total_price, status, created_at, shipping_method, shipping_cost, tracking_number')
      .order('created_at', { ascending: false })
    let usersMap: Record<string, string> = {}
    if (data && data.length > 0) {
      const userIds = Array.from(new Set(data.map((o: Order) => o.user_id).filter(Boolean)))
      if (userIds.length > 0) {
        const { data: usersData } = await supabaseClient
          .from('users')
          .select('id, email')
          .in('id', userIds)
        usersMap = Object.fromEntries((usersData || []).map((u: { id: string; email: string }) => [u.id, u.email]))
      }
    }
    setOrders((data || []).map((o: Order) => ({ ...o, user_email: o.user_id ? usersMap[o.user_id] : null })))
    setOrdersLoading(false)
  }, [supabaseClient])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  // --- Filtered Orders & Pagination ---
  const filteredOrders = orders.filter(o => {
    const matchesSearch = (
      o.user_email?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.guest_email?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.id?.toLowerCase().includes(orderSearch.toLowerCase()) ||
      o.status?.toLowerCase().includes(orderSearch.toLowerCase())
    )
    const matchesStatus = filterStatus ? o.status === filterStatus : true
    const matchesDateFrom = filterDateFrom ? new Date(o.created_at) >= new Date(filterDateFrom) : true
    const matchesDateTo = filterDateTo ? new Date(o.created_at) <= new Date(filterDateTo) : true
    const matchesPriceMin = filterPriceMin ? Number(o.total_price) >= Number(filterPriceMin) : true
    const matchesPriceMax = filterPriceMax ? Number(o.total_price) <= Number(filterPriceMax) : true
    return matchesSearch && matchesStatus && matchesDateFrom && matchesDateTo && matchesPriceMin && matchesPriceMax
  })
  const totalPages = Math.ceil(filteredOrders.length / ORDERS_PER_PAGE)
  const paginatedOrders = filteredOrders.slice((currentPage - 1) * ORDERS_PER_PAGE, currentPage * ORDERS_PER_PAGE)

  // --- Bulk Select ---
  const allSelected = paginatedOrders.length > 0 && paginatedOrders.every(o => selectedOrders.includes(o.id))
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedOrders(selectedOrders.filter(id => !paginatedOrders.some(o => o.id === id)))
    } else {
      setSelectedOrders([...new Set([...selectedOrders, ...paginatedOrders.map(o => o.id)])])
    }
  }
  const toggleSelectOrder = (id: string) => {
    setSelectedOrders(selectedOrders.includes(id) ? selectedOrders.filter(i => i !== id) : [...selectedOrders, id])
  }
  const handleBulkDelete = async () => {
    for (const id of selectedOrders) {
      await supabaseClient.from('orders').delete().eq('id', id)
    }
    setOrders(orders => orders.filter(o => !selectedOrders.includes(o.id)))
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
      const { data } = await supabaseClient
        .from('orders')
        .select(`id, user_id, guest_email, total_price, status, created_at, shipping_name, shipping_address, shipping_city, shipping_postcode, shipping_country, shipping_phone, shipping_method, shipping_rate_id, shipping_cost, tracking_number, tracking_url, shipped_at, shipping_label_url, order_items(id, quantity, size, price_at_purchase, products(title, id), product_variants(id, color, image_url))`)
        .eq('id', selectedOrder.id)
        .single()
      if (data) {
        const mappedData = {
          ...data,
          order_items: data.order_items ? data.order_items.map((item: {
            id: string;
            quantity: number;
            size: string;
            price_at_purchase: number;
            products?: { id: string; title: string } | { id: string; title: string }[];
            product_variants?: { id: string; color: string; image_url: string } | { id: string; color: string; image_url: string }[];
          }) => ({
            id: item.id,
            quantity: item.quantity,
            size: item.size,
            price_at_purchase: item.price_at_purchase,
            products: item.products && !Array.isArray(item.products) ? { id: item.products.id, title: item.products.title } : undefined,
            product_variants: item.product_variants && !Array.isArray(item.product_variants) ? { id: item.product_variants.id, color: item.product_variants.color, image_url: item.product_variants.image_url } : undefined,
            variant_id: item.product_variants && !Array.isArray(item.product_variants) ? item.product_variants.id : undefined,
          })) as OrderItem[] : undefined
        }
        setOrderDetails(mappedData as (Order & { order_items?: OrderItem[] }))
        setOrderStatusInput(data?.status || '')
      }
      setOrderDetailsLoading(false)
    }
    fetchOrderDetails()
  }, [selectedOrder, supabaseClient])

  // --- Editable Order Items ---
  useEffect(() => {
    if (!orderDetails?.order_items) return
    const fetchVariants = async () => {
      const productIds: string[] = Array.from(new Set((orderDetails.order_items ?? []).map((item: OrderItem) => String(item.products?.id)).filter(Boolean)))
      const variantsMap: Record<string, ProductVariant[]> = {}
      for (const productId of productIds) {
        const { data: variants } = await supabaseClient.from('product_variants').select('*').eq('product_id', productId)
        variantsMap[productId] = variants || []
      }
      setVariantsByProduct(variantsMap)
    }
    fetchVariants()
    setEditableOrderItems((orderDetails.order_items ?? []).map((item: OrderItem) => ({
      ...item,
      variant_id: item.product_variants?.id,
      product_variants: item.product_variants,
      size: item.size,
      quantity: item.quantity
    })))
  }, [orderDetails, supabaseClient])

  const handleOrderItemChange = (idx: number, field: keyof OrderItem, value: string | number | undefined) => {
    setEditableOrderItems(items => items.map((item, i) => i === idx ? { ...item, [field]: value } : item))
  }

  const handleSaveOrderItems = async () => {
    let newTotal = 0
    for (const item of editableOrderItems) {
      const variant = (variantsByProduct[String(item.products?.id)] || []).find((v: ProductVariant) => v.id === item.variant_id)
      const price = variant ? Number(variant.price) : Number(item.price_at_purchase)
      newTotal += price * item.quantity
      await supabaseClient.from('order_items').update({
        variant_id: item.variant_id,
        size: item.size,
        quantity: item.quantity,
        price_at_purchase: price
      }).eq('id', item.id)
    }
    if (selectedOrder) {
      await supabaseClient.from('orders').update({ total_price: newTotal }).eq('id', selectedOrder.id)
      const { data } = await supabaseClient
        .from('orders')
        .select(`id, user_id, guest_email, total_price, status, created_at, order_items(id, quantity, size, price_at_purchase, products(title, id), product_variants(id, color, image_url))`)
        .eq('id', selectedOrder.id)
        .single()
      if (data) {
        const mappedData = {
          ...data,
          order_items: data.order_items ? data.order_items.map((item: {
            id: string;
            quantity: number;
            size: string;
            price_at_purchase: number;
            products?: { id: string; title: string } | { id: string; title: string }[];
            product_variants?: { id: string; color: string; image_url: string } | { id: string; color: string; image_url: string }[];
          }) => ({
            id: item.id,
            quantity: item.quantity,
            size: item.size,
            price_at_purchase: item.price_at_purchase,
            products: item.products && !Array.isArray(item.products) ? { id: item.products.id, title: item.products.title } : undefined,
            product_variants: item.product_variants && !Array.isArray(item.product_variants) ? { id: item.product_variants.id, color: item.product_variants.color, image_url: item.product_variants.image_url } : undefined,
            variant_id: item.product_variants && !Array.isArray(item.product_variants) ? item.product_variants.id : undefined,
          })) as OrderItem[] : undefined
        }
        setOrderDetails(mappedData as (Order & { order_items?: OrderItem[] }))
      }
    }
    await fetchOrders()
    setSelectedOrder(null)
  }

  // --- Order Status Update ---
  const handleUpdateOrderStatus = async () => {
    if (!orderDetails) return
    const { error } = await supabaseClient
      .from('orders')
      .update({ status: orderStatusInput })
      .eq('id', orderDetails.id)
    if (!error) {
      setOrderDetails((od: (Order & { order_items?: OrderItem[] }) | null) => od ? { ...od, status: orderStatusInput } : null)
      setOrders(orders => orders.map(o => o.id === orderDetails.id ? { ...o, status: orderStatusInput } : o))
      setSelectedOrder((so: Order | null) => so ? { ...so, status: orderStatusInput } : so)
      setSelectedOrder(null)
    }
  }

  // --- Delete Order from Modal ---
  const handleDeleteOrderFromModal = async () => {
    if (!orderDetails) return
    await supabaseClient
      .from('orders')
      .delete()
      .eq('id', orderDetails.id)
    setOrders(orders => orders.filter(o => o.id !== orderDetails.id))
    setSelectedOrder(null)
    setOrderDetails(null)
    setSelectedOrder(null)
  }

  // --- Render ---
  return (
    <div className="w-full mx-auto bg-white p-16">
      <h2 className="text-2xl font-bold mb-6 text-stone-800">Orders</h2>
      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-2 items-center">
        <input type="text" placeholder="Search..." value={orderSearch} onChange={e => setOrderSearch(e.target.value)} className="border rounded px-3 py-2 w-48 text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-200" />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="border rounded px-3 py-2 text-stone-800">
          <option value="">All Statuses</option>
          {ORDER_STATUSES.map(s => <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}</option>)}
        </select>
        <input type="date" value={filterDateFrom} onChange={e => setFilterDateFrom(e.target.value)} className="border rounded px-3 py-2 text-stone-800" />
        <input type="date" value={filterDateTo} onChange={e => setFilterDateTo(e.target.value)} className="border rounded px-3 py-2 text-stone-800" />
        <input type="number" placeholder="Min £" value={filterPriceMin} onChange={e => setFilterPriceMin(e.target.value)} className="border rounded px-3 py-2 w-24 text-stone-800" />
        <input type="number" placeholder="Max £" value={filterPriceMax} onChange={e => setFilterPriceMax(e.target.value)} className="border rounded px-3 py-2 w-24 text-stone-800" />
        <button onClick={() => { setFilterStatus(''); setFilterDateFrom(''); setFilterDateTo(''); setFilterPriceMin(''); setFilterPriceMax(''); }} className="text-sm text-gray-500 underline ml-2">Clear Filters</button>
      </div>
      {/* Bulk actions */}
      <div className="mb-2 flex items-center gap-2">
        <input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="accent-blue-200 w-5 h-3 rounded" />
        <span className="text-sm text-stone-800">Select All</span>
        {selectedOrders.length > 0 && (
          <span
            onClick={handleBulkDelete}
            className="ml-4 text-red-700 font-semibold hover:underline cursor-pointer select-none text-sm"
          >
            Delete Selected
          </span>
        )}
        <span className="ml-auto text-sm text-gray-500">{filteredOrders.length} order{filteredOrders.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 py-3"><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="accent-blue-200 w-5 h-3 rounded" /></th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Order ID</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">User/Guest Email</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Total</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Shipping</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Created</th>
              <th className="px-4 py-3 text-center font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {ordersLoading ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-500">Loading orders...</td></tr>
            ) : paginatedOrders.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-500">No orders found.</td></tr>
            ) : paginatedOrders.map(order => (
              <tr key={order.id} className="border-b hover:bg-gray-50">
                <td className="px-2 py-3"><input type="checkbox" checked={selectedOrders.includes(order.id)} onChange={() => toggleSelectOrder(order.id)} className="accent-blue-200 w-5 h-3 rounded" /></td>
                <td className="px-4 py-3 font-mono text-gray-900">{order.id.slice(-8)}</td>
                <td className="px-4 py-3 text-gray-800">{order.user_email || order.guest_email || <span className="text-gray-400 italic">Unknown</span>}</td>
                <td className="px-4 py-3 text-gray-800">£{Number(order.total_price).toFixed(2)}</td>
                <td className="px-4 py-3 text-gray-800">
                  {order.shipping_method ? (
                    <div className="text-xs">
                      <div className="font-medium">{order.shipping_method}</div>
                      {order.shipping_cost && <div className="text-gray-500">£{order.shipping_cost.toFixed(2)}</div>}
                      {order.tracking_number && (
                        <div className="text-blue-600 cursor-pointer hover:underline">
                          Track: {order.tracking_number.slice(-8)}
                        </div>
                      )}
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">No shipping</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${order.status === 'processing' ? 'bg-green-100 text-green-800' : order.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : order.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{order.status}</span>
                </td>
                <td className="px-4 py-3 text-gray-700">{new Date(order.created_at).toLocaleString()}</td>
                <td className="px-4 py-3 text-center">
                  <div className="flex gap-2 justify-center">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-stone-800 border border-stone-300 px-3 py-1 rounded hover:bg-stone-100 transition"
                    >
                      View Details
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Pagination */}
      <div className="flex justify-between items-center mt-4">
        <button disabled={currentPage === 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50">Previous</button>
        <span className="text-sm text-stone-800">Page {currentPage} of {totalPages}</span>
        <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} className="px-3 py-1 rounded bg-gray-200 text-gray-700 disabled:opacity-50">Next</button>
      </div>
      {/* Order details modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
          onClick={() => setSelectedOrder(null)}
        >
          <div
            className="bg-white rounded-xl shadow-lg p-8 max-w-3xl w-full border border-stone-200 max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-lg font-bold mb-4 text-stone-800">Order Details</h3>
            {orderDetailsLoading ? (
              <div className="text-center py-8 text-gray-500">Loading...</div>
            ) : orderDetails ? (
              <>
                <div className="mb-2 text-gray-700">
                  <span className="font-semibold">Order ID:</span> <span className="font-mono text-gray-900">{orderDetails.id}</span>
                </div>
                <div className="mb-2 text-gray-700">
                  <span className="font-semibold">User/Guest Email:</span> {orderDetails.user_id ? orders.find(o => o.id === orderDetails.id)?.user_email : orderDetails.guest_email || <span className="text-gray-400 italic">Unknown</span>}
                </div>
                <div className="mb-2 text-gray-700">
                  <span className="font-semibold">Total:</span> £{Number(orderDetails.total_price).toFixed(2)}
                </div>
                <div className="mb-2 text-gray-700">
                  <span className="font-semibold">Status:</span> <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${orderDetails.status === 'processing' ? 'bg-green-100 text-green-800' : orderDetails.status === 'pending' ? 'bg-yellow-100 text-yellow-800' : orderDetails.status === 'cancelled' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'}`}>{orderDetails.status}</span>
                </div>
                <div className="mb-2 text-gray-700">
                  <span className="font-semibold">Created:</span> {new Date(orderDetails.created_at).toLocaleString()}
                </div>
                
                {/* Shipping Information */}
                {(orderDetails.shipping_name || orderDetails.shipping_address) && (
                  <div className="mb-4 p-4 bg-blue-50 rounded-lg">
                    <h4 className="font-semibold text-gray-800 mb-2">Shipping Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                      {orderDetails.shipping_name && (
                        <div className="text-gray-700">
                          <span className="font-medium">Name:</span> {orderDetails.shipping_name}
                        </div>
                      )}
                      {orderDetails.shipping_address && (
                        <div className="text-gray-700">
                          <span className="font-medium">Address:</span> {orderDetails.shipping_address}
                        </div>
                      )}
                      {orderDetails.shipping_city && (
                        <div className="text-gray-700">
                          <span className="font-medium">City:</span> {orderDetails.shipping_city}
                        </div>
                      )}
                      {orderDetails.shipping_postcode && (
                        <div className="text-gray-700">
                          <span className="font-medium">Postcode:</span> {orderDetails.shipping_postcode}
                        </div>
                      )}
                      {orderDetails.shipping_phone && (
                        <div className="text-gray-700">
                          <span className="font-medium">Phone:</span> {orderDetails.shipping_phone}
                        </div>
                      )}
                      {orderDetails.shipping_method && (
                        <div className="text-gray-700">
                          <span className="font-medium">Method:</span> {orderDetails.shipping_method}
                        </div>
                      )}
                      {orderDetails.shipping_cost && (
                        <div className="text-gray-700">
                          <span className="font-medium">Cost:</span> £{orderDetails.shipping_cost.toFixed(2)}
                        </div>
                      )}
                      {orderDetails.tracking_number && (
                        <div className="text-gray-700">
                          <span className="font-medium">Tracking:</span> 
                          {orderDetails.tracking_url ? (
                            <a href={orderDetails.tracking_url} target="_blank" rel="noopener noreferrer" className="ml-1 text-blue-600 hover:underline">
                              {orderDetails.tracking_number}
                            </a>
                          ) : (
                            <span className="ml-1">{orderDetails.tracking_number}</span>
                          )}
                        </div>
                      )}
                      {orderDetails.shipped_at && (
                        <div className="text-gray-700">
                          <span className="font-medium">Shipped:</span> {new Date(orderDetails.shipped_at).toLocaleString()}
                        </div>
                      )}
                    </div>
                    {orderDetails.shipping_label_url && (
                      <div className="mt-2">
                        <a 
                          href={orderDetails.shipping_label_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
                        >
                          View Shipping Label
                        </a>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="mb-4">
                  <span className="font-semibold text-gray-800">Items:</span>
                  <div className="mt-4 flex flex-col gap-6">
                    {editableOrderItems.length === 0 && <div className="text-gray-500">No items</div>}
                    {editableOrderItems.map((item, idx) => (
                      <div key={item.id} className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg">
                        <Image src={item.product_variants?.image_url || '/no-image.png'} alt={item.products?.title || ''} width={56} height={56} className="object-cover rounded" />
                        <div className="flex-1 flex flex-col gap-2">
                          <div className="font-medium text-gray-900">{item.products?.title}</div>
                          <div className="text-sm text-gray-500">Color:
                            <span className="ml-2 font-semibold text-gray-800">
                              {(variantsByProduct[String(item.products?.id)] || []).find(v => v.id === item.variant_id)?.color || item.product_variants?.color || ''}
                            </span>
                            <select
                              value={item.variant_id}
                              onChange={e => handleOrderItemChange(idx, 'variant_id', e.target.value)}
                              className="ml-2 border rounded px-2 py-1 text-stone-800"
                            >
                              {(variantsByProduct[String(item.products?.id)] || []).map(variant => (
                                <option key={variant.id} value={variant.id}>{variant.color}</option>
                              ))}
                            </select>
                          </div>
                          <div className="text-sm text-gray-500">Size:
                            <select
                              value={item.size}
                              onChange={e => handleOrderItemChange(idx, 'size', e.target.value)}
                              className="ml-2 border rounded px-2 py-1 text-stone-800"
                            >
                              {SIZES.map(size => (
                                <option key={size} value={size}>{size}</option>
                              ))}
                            </select>
                          </div>
                          <div className="text-sm text-gray-500">Qty:
                            <input
                              type="number"
                              min={1}
                              value={item.quantity}
                              onChange={e => handleOrderItemChange(idx, 'quantity', Number(e.target.value))}
                              className="ml-2 border rounded px-2 py-1 w-16 text-stone-800"
                            />
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-gray-900">£{(item.price_at_purchase * item.quantity).toFixed(2)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={handleSaveOrderItems}
                    className="mt-4 text-stone-800 border border-stone-300 px-3 py-1 rounded hover:bg-stone-100 transition"
                  >
                    Save Items
                  </button>
                </div>
                <div className="flex flex-col gap-2 mt-4">
                  <label className="block text-sm font-medium text-stone-800 mb-1">Status</label>
                  <select
                    value={orderStatusInput}
                    onChange={e => setOrderStatusInput(e.target.value)}
                    className="border rounded px-3 py-2 w-48 text-stone-800 focus:outline-none focus:ring-2 focus:ring-blue-200"
                  >
                    {ORDER_STATUSES.map(status => (
                      <option key={status} value={status} className="text-stone-800">
                        {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
                      </option>
                    ))}
                  </select>
                  <div className="flex justify-center gap-6 items-center mt-2">
                    <button
                      onClick={handleUpdateOrderStatus}
                      className="text-stone-800 border border-stone-300 px-3 py-1 rounded hover:bg-stone-100 transition"
                    >Update</button>
                    <button
                      onClick={handleDeleteOrderFromModal}
                      className="text-red-700 border border-stone-300 px-3 py-1 rounded hover:bg-stone-100 transition"
                    >Delete</button>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="mt-2 text-stone-800 border border-stone-300 px-3 py-1 rounded hover:bg-stone-100 transition"
                  >Close</button>
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-gray-500">Order not found.</div>
            )}
          </div>
        </div>
      )}
    </div>
  )
} 