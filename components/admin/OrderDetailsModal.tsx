import Image from 'next/image'
import { useEffect, useState } from 'react'
import { formatMoney } from '@/lib/format/money'
import type { ProductVariant } from '@/types'
import { authFetch } from '@/lib/api/authFetch'

export const ORDER_STATUSES = [
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

export type Order = {
  id: string
  user_id?: string
  guest_email?: string
  total_price: number
  status: string
  created_at: string
  user_email?: string | null
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

export type OrderItem = {
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

type RawOrderItem = {
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
}

function mapOrderItem(item: RawOrderItem): OrderItem {
  return {
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
  }
}

interface Props {
  order: Order
  orders: Order[]
  onClose: () => void
  onStatusUpdated: (orderId: string, newStatus: string) => void
  onDeleted: (orderId: string) => void
  onItemsSaved: () => void
  setToast: (t: { message: string; type: 'success' | 'error' } | null) => void
}

export function OrderDetailsModal({
  order,
  orders,
  onClose,
  onStatusUpdated,
  onDeleted,
  onItemsSaved,
  setToast,
}: Props) {
  const [orderDetails, setOrderDetails] = useState<(Order & { order_items?: OrderItem[] }) | null>(
    null
  )
  const [orderDetailsLoading, setOrderDetailsLoading] = useState(false)
  const [editableOrderItems, setEditableOrderItems] = useState<OrderItem[]>([])
  const [variantsByProduct, setVariantsByProduct] = useState<Record<string, ProductVariant[]>>({})
  const [orderStatusInput, setOrderStatusInput] = useState('')

  // Fetch order details when the selected order changes
  useEffect(() => {
    setOrderDetailsLoading(true)
    const load = async () => {
      const res = await authFetch(`/api/admin/orders/${order.id}`)
      if (res.ok) {
        const data = await res.json()
        const mapped = {
          ...data,
          order_items: data.order_items
            ? (data.order_items.map(mapOrderItem) as OrderItem[])
            : undefined,
        }
        setOrderDetails(mapped)
        setOrderStatusInput(data?.status || '')
      }
      setOrderDetailsLoading(false)
    }
    load()
  }, [order.id])

  // Build editable item list + fetch variants when details arrive
  useEffect(() => {
    if (!orderDetails?.order_items) return
    const fetchVariants = async () => {
      const productIds: string[] = Array.from(
        new Set(
          (orderDetails.order_items ?? [])
            .map((item: OrderItem) => item.product_new?.id || item.products?.id)
            .filter(Boolean) as string[]
        )
      )
      const variantsMap: Record<string, ProductVariant[]> = {}
      for (const productId of productIds) {
        const res = await authFetch(`/api/admin/product-variants/${productId}`)
        if (res.ok) {
          const variants = await res.json()
          variantsMap[productId] = variants || []
        }
      }
      setVariantsByProduct(variantsMap)
    }
    fetchVariants()
    setEditableOrderItems(
      (orderDetails.order_items ?? []).map((item: OrderItem) => ({
        ...item,
        variant_id: item.variant_id,
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
      await authFetch(`/api/admin/order-items/${item.id}`, {
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
    await authFetch(`/api/admin/orders/${order.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ total_price: newTotal }),
    })
    setToast({ message: 'Order items saved', type: 'success' })
    onItemsSaved()
    onClose()
  }

  const handleUpdateOrderStatus = async () => {
    if (!orderDetails) return
    const res = await authFetch(`/api/admin/orders/${orderDetails.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: orderStatusInput }),
    })
    if (res.ok) {
      onStatusUpdated(orderDetails.id, orderStatusInput)
      setToast({ message: 'Status updated', type: 'success' })
      onClose()
    }
  }

  const handleDeleteOrder = async () => {
    if (!orderDetails) return
    const res = await authFetch(`/api/admin/orders/${orderDetails.id}`, { method: 'DELETE' })
    if (res.ok) {
      onDeleted(orderDetails.id)
      onClose()
    }
  }

  const orderEmail = orderDetails?.user_id
    ? orders.find((o) => o.id === orderDetails.id)?.user_email
    : orderDetails?.guest_email

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Modal backdrop dismiss on click
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose()
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
            <p className="text-zinc-600 mt-2 font-light">Loading...</p>
          </div>
        ) : orderDetails ? (
          <>
            <div className="mb-3 text-zinc-700 font-light">
              <span className="font-medium">Order ID:</span>{' '}
              <span className="font-mono text-zinc-900 text-sm">{orderDetails.id}</span>
            </div>
            <div className="mb-3 text-zinc-700 font-light">
              <span className="font-medium">Email:</span>{' '}
              {orderEmail || <span className="text-zinc-400 italic">Unknown</span>}
            </div>
            <div className="mb-3 text-zinc-700 font-light">
              <span className="font-medium">Total:</span> {formatMoney(orderDetails.total_price)}
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
                      <span className="font-medium">Address:</span> {orderDetails.shipping_address}
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
                      <span className="font-medium">Method:</span> {orderDetails.shipping_method}
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

            {/* Order Items */}
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
                    const productName = item.product_new?.name || item.products?.title || 'Product'
                    const imageUrl =
                      item.variant_new?.image_url ||
                      item.product_variants?.image_url ||
                      '/no-image.png'
                    const color = item.variant_new?.color || item.product_variants?.color || null
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
                        <div className="relative flex-shrink-0 w-full sm:w-24 h-24 bg-gray-100 rounded-lg overflow-hidden">
                          <Image
                            src={imageUrl}
                            alt={productName}
                            fill
                            className="object-cover"
                            sizes="(max-width: 640px) 100vw, 96px"
                          />
                        </div>

                        <div className="flex-1 min-w-0">
                          <h5 className="text-base font-light text-zinc-900 mb-3">{productName}</h5>

                          <div className="flex flex-wrap gap-2 mb-4">
                            {color && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-light bg-blue-50 text-blue-700 border border-blue-200">
                                Color: {color}
                              </span>
                            )}
                            {size && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-light bg-purple-50 text-purple-700 border border-purple-200">
                                Size: {size}
                              </span>
                            )}
                            {material && (
                              <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-light bg-emerald-50 text-emerald-700 border border-emerald-200">
                                Material: {material}
                              </span>
                            )}
                          </div>

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
                                onChange={(e) => handleOrderItemChange(idx, 'size', e.target.value)}
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

            {/* Status + actions */}
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
                  onClick={handleDeleteOrder}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-light text-sm"
                >
                  Delete Order
                </button>
                <button
                  type="button"
                  onClick={onClose}
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
  )
}
