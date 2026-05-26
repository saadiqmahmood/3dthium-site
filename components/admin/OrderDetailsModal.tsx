import Image from 'next/image'
import { useEffect, useRef, useState } from 'react'
import { X } from 'lucide-react'
import { formatMoney } from '@/lib/format/money'
import type { ProductVariant } from '@/types'
import { authFetch } from '@/lib/api/authFetch'

export const ORDER_STATUSES = [
  'pending',
  'printing',
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
  deleted_at?: string | null
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
  const [visible, setVisible] = useState(false)
  const overlayRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    requestAnimationFrame(() => setVisible(true))
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 250)
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === overlayRef.current) handleClose()
  }

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
    handleClose()
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
      handleClose()
    }
  }

  const handleDeleteOrder = async () => {
    if (!orderDetails) return
    const res = await authFetch(`/api/admin/orders/${orderDetails.id}`, { method: 'DELETE' })
    if (res.ok) {
      onDeleted(orderDetails.id)
      handleClose()
    }
  }

  const orderEmail = orderDetails?.user_id
    ? orders.find((o) => o.id === orderDetails.id)?.user_email
    : orderDetails?.guest_email

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: slide-over backdrop dismiss
    <div
      ref={overlayRef}
      onClick={handleOverlayClick}
      className={`fixed inset-0 z-50 flex justify-end transition-colors duration-250 ${visible ? 'bg-black/40' : 'bg-transparent'}`}
    >
      {/* biome-ignore lint/a11y/noStaticElementInteractions: stop propagation */}
      <div
        className={`relative w-full max-w-2xl bg-white h-full shadow-2xl flex flex-col transition-transform duration-250 ${visible ? 'translate-x-0' : 'translate-x-full'}`}
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-100 flex-shrink-0">
          <div>
            <p className="text-xs text-zinc-400 font-light mb-0.5">Order</p>
            <h2 className="text-lg font-light text-zinc-900 font-mono">{order.id.slice(-12)}</h2>
          </div>
          <div className="flex items-center gap-3">
            {orderDetails && (
              <span
                className={`text-xs px-2.5 py-1 rounded-full border font-light ${
                  orderDetails.status === 'pending'
                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    : orderDetails.status === 'cancelled'
                      ? 'bg-red-50 text-red-700 border-red-200'
                      : orderDetails.status === 'delivered'
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-gray-100 text-zinc-700 border-gray-200'
                }`}
              >
                {orderDetails.status}
              </span>
            )}
            <button
              type="button"
              onClick={handleClose}
              className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {orderDetailsLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600" />
              <p className="text-zinc-500 mt-3 font-light text-sm">Loading order...</p>
            </div>
          ) : orderDetails ? (
            <>
              {/* Summary */}
              <section>
                <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">Summary</h3>
                <div className="bg-zinc-50 rounded-xl p-4 space-y-2.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 font-light">Email</span>
                    <span className="text-zinc-900 font-light">
                      {orderEmail || <span className="text-zinc-400 italic">Unknown</span>}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 font-light">Total</span>
                    <span className="text-zinc-900 font-light">{formatMoney(orderDetails.total_price)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-zinc-500 font-light">Placed</span>
                    <span className="text-zinc-900 font-light">{new Date(orderDetails.created_at).toLocaleString()}</span>
                  </div>
                </div>
              </section>

              {/* Shipping */}
              {(orderDetails.shipping_name || orderDetails.shipping_address) && (
                <section>
                  <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">Shipping</h3>
                  <div className="bg-zinc-50 rounded-xl p-4 space-y-2.5 text-sm">
                    {orderDetails.shipping_name && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-light">Name</span>
                        <span className="text-zinc-900 font-light">{orderDetails.shipping_name}</span>
                      </div>
                    )}
                    {orderDetails.shipping_address && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-light">Address</span>
                        <span className="text-zinc-900 font-light text-right max-w-xs">{orderDetails.shipping_address}{orderDetails.shipping_city ? `, ${orderDetails.shipping_city}` : ''}{orderDetails.shipping_postcode ? ` ${orderDetails.shipping_postcode}` : ''}</span>
                      </div>
                    )}
                    {orderDetails.shipping_phone && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-light">Phone</span>
                        <span className="text-zinc-900 font-light">{orderDetails.shipping_phone}</span>
                      </div>
                    )}
                    {orderDetails.shipping_method && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-light">Method</span>
                        <span className="text-zinc-900 font-light">{orderDetails.shipping_method}{orderDetails.shipping_cost ? ` · ${formatMoney(orderDetails.shipping_cost)}` : ''}</span>
                      </div>
                    )}
                    {orderDetails.tracking_number && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-light">Tracking</span>
                        {orderDetails.tracking_url ? (
                          <a href={orderDetails.tracking_url} target="_blank" rel="noopener noreferrer" className="text-emerald-600 hover:text-emerald-700 font-light">
                            {orderDetails.tracking_number}
                          </a>
                        ) : (
                          <span className="text-zinc-900 font-light">{orderDetails.tracking_number}</span>
                        )}
                      </div>
                    )}
                    {orderDetails.shipped_at && (
                      <div className="flex justify-between">
                        <span className="text-zinc-500 font-light">Shipped</span>
                        <span className="text-zinc-900 font-light">{new Date(orderDetails.shipped_at).toLocaleString()}</span>
                      </div>
                    )}
                  </div>
                  {orderDetails.shipping_label_url && (
                    <a
                      href={orderDetails.shipping_label_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block px-4 py-2 bg-zinc-900 text-white text-sm font-light rounded-xl hover:bg-zinc-700 transition-colors"
                    >
                      View Shipping Label
                    </a>
                  )}
                </section>
              )}

              {/* Order Items */}
              <section>
                <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">
                  Items ({editableOrderItems.length})
                </h3>
                <div className="space-y-3">
                  {editableOrderItems.length === 0 ? (
                    <div className="text-center py-8 text-zinc-500 bg-zinc-50 rounded-xl font-light text-sm">
                      No items in this order
                    </div>
                  ) : (
                    editableOrderItems.map((item, idx) => {
                      const productName = item.product_new?.name || item.products?.title || 'Product'
                      const imageUrl = item.variant_new?.image_url || item.product_variants?.image_url || '/no-image.png'
                      const color = item.variant_new?.color || item.product_variants?.color || null
                      const size = ('size' in (item.variant_new || {}) ? item.variant_new?.size : null) || item.size || null
                      const material = ('material' in (item.variant_new || {}) ? item.variant_new?.material : null) || null

                      return (
                        <div key={item.id} className="flex gap-3 p-4 bg-zinc-50 rounded-xl border border-zinc-100">
                          <div className="relative flex-shrink-0 w-16 h-16 bg-gray-100 rounded-lg overflow-hidden">
                            <Image src={imageUrl} alt={productName} fill className="object-cover" sizes="64px" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-light text-zinc-900 mb-1">{productName}</p>
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {color && <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-light">Color: {color}</span>}
                              {size && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 border border-purple-200 font-light">Size: {size}</span>}
                              {material && <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 font-light">Material: {material}</span>}
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                              <div>
                                <label htmlFor={`item-size-${idx}`} className="block text-xs text-zinc-500 font-light mb-1">Size</label>
                                <select
                                  id={`item-size-${idx}`}
                                  value={item.size || ''}
                                  onChange={(e) => handleOrderItemChange(idx, 'size', e.target.value)}
                                  className="w-full border border-zinc-200 rounded-lg px-2 py-1.5 text-xs text-zinc-900 font-light focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                >
                                  {SIZES.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                              </div>
                              <div>
                                <label htmlFor={`item-qty-${idx}`} className="block text-xs text-zinc-500 font-light mb-1">Qty</label>
                                <input
                                  id={`item-qty-${idx}`}
                                  type="number"
                                  min={1}
                                  value={item.quantity}
                                  onChange={(e) => handleOrderItemChange(idx, 'quantity', Number(e.target.value))}
                                  className="w-full border border-zinc-200 rounded-lg px-2 py-1.5 text-xs text-zinc-900 font-light focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                />
                              </div>
                              <div>
                                <label htmlFor={`item-variant-${idx}`} className="block text-xs text-zinc-500 font-light mb-1">Variant</label>
                                <select
                                  id={`item-variant-${idx}`}
                                  value={item.variant_id || ''}
                                  onChange={(e) => handleOrderItemChange(idx, 'variant_id', e.target.value)}
                                  className="w-full border border-zinc-200 rounded-lg px-2 py-1.5 text-xs text-zinc-900 font-light focus:outline-none focus:ring-2 focus:ring-emerald-200"
                                >
                                  {(variantsByProduct[String(item.products?.id)] || []).map((v) => (
                                    <option key={v.id} value={v.id}>{v.color || 'Default'}</option>
                                  ))}
                                </select>
                              </div>
                            </div>
                          </div>
                          <div className="flex-shrink-0 text-right">
                            <p className="text-sm font-light text-zinc-900">{formatMoney(item.price_at_purchase * item.quantity)}</p>
                            <p className="text-xs text-zinc-400 font-light">{item.quantity} × {formatMoney(item.price_at_purchase)}</p>
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
                    className="mt-4 px-5 py-2 bg-emerald-600 text-white text-sm font-light rounded-xl hover:bg-emerald-700 transition-colors"
                  >
                    Save Item Changes
                  </button>
                )}
              </section>

              {/* Status */}
              <section>
                <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-3">Update Status</h3>
                {/* biome-ignore lint/correctness/useUniqueElementIds: Single modal instance */}
                <select
                  id="order-status-select"
                  value={orderStatusInput}
                  onChange={(e) => setOrderStatusInput(e.target.value)}
                  className="w-full border border-zinc-200 rounded-xl px-3 py-2 text-sm text-zinc-900 font-light focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 bg-white"
                >
                  {ORDER_STATUSES.map((s) => (
                    <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}</option>
                  ))}
                </select>
              </section>
            </>
          ) : (
            <div className="text-center py-16 text-zinc-500 font-light">Order not found.</div>
          )}
        </div>

        {/* Footer */}
        {orderDetails && (
          <div className="px-6 py-4 border-t border-zinc-100 flex items-center justify-between flex-shrink-0">
            <button
              type="button"
              onClick={handleDeleteOrder}
              className="px-4 py-2 text-sm text-red-600 font-light border border-red-200 rounded-xl hover:bg-red-50 transition-colors"
            >
              Delete Order
            </button>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 text-sm text-zinc-600 font-light hover:text-zinc-900 transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleUpdateOrderStatus}
                className="px-5 py-2 bg-emerald-600 text-white text-sm font-light rounded-xl hover:bg-emerald-700 transition-colors"
              >
                Update Status
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
