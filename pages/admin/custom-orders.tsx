import { useCallback, useEffect, useState } from 'react'
import Toast from '@/components/ui/Toast'
import CustomOrderModal, { type CustomOrder } from '@/components/admin/CustomOrderModal'
import { authFetch } from '@/lib/api/authFetch'

const STATUS_STYLES: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  completed: 'bg-emerald-50 text-emerald-700',
  in_progress: 'bg-blue-50 text-blue-700',
  cancelled: 'bg-red-50 text-red-700',
}

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
}

export default function AdminCustomOrdersPage() {
  const [orders, setOrders] = useState<CustomOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrders, setSelectedOrders] = useState<number[]>([])
  const [selectedOrder, setSelectedOrder] = useState<CustomOrder | null>(null)
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchOrders = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const response = await authFetch('/api/admin/custom-orders')
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch custom orders' }))
        throw new Error(errorData.error || 'Failed to fetch custom orders')
      }
      const data = await response.json()
      if (!Array.isArray(data)) {
        setOrders([])
        setError('Invalid data format received')
      } else {
        setOrders(data)
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to load custom orders'
      setError(msg)
      setToast({ message: msg, type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchOrders()
  }, [fetchOrders])

  const allSelected = orders.length > 0 && orders.every((o) => selectedOrders.includes(o.id))
  const toggleSelectAll = () => {
    setSelectedOrders(allSelected ? [] : orders.map((o) => o.id))
  }
  const toggleSelectOrder = (id: number) => {
    setSelectedOrders(
      selectedOrders.includes(id) ? selectedOrders.filter((i) => i !== id) : [...selectedOrders, id]
    )
  }

  const handleBulkDelete = async () => {
    try {
      for (const id of selectedOrders) {
        const response = await authFetch(`/api/admin/custom-orders/${id}`, { method: 'DELETE' })
        if (!response.ok) throw new Error(`Failed to delete order ${id}`)
      }
      setOrders((prev) => prev.filter((o) => !selectedOrders.includes(o.id)))
      setSelectedOrders([])
      setToast({ message: 'Orders deleted successfully', type: 'success' })
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed to delete custom orders'
      setToast({ message: msg, type: 'error' })
    }
  }

  const handleUpdated = (id: number, status: string, admin_notes: string) => {
    setOrders((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status, admin_notes } : o))
    )
    setToast({ message: 'Order updated', type: 'success' })
  }

  return (
    <div className="w-full mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-light text-zinc-900 mb-2">Custom Orders</h1>
        <p className="text-sm text-zinc-600 font-light">Manage custom order requests</p>
      </div>

      {toast && (
        <Toast message={toast.message} type={toast.type || 'success'} onClose={() => setToast(null)} />
      )}

      {error && !loading && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-light">{error}</p>
          <button
            type="button"
            onClick={() => fetchOrders()}
            className="mt-2 text-red-600 hover:text-red-700 underline text-sm font-light"
          >
            Retry
          </button>
        </div>
      )}

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
          {orders.length} order{orders.length !== 1 ? 's' : ''}
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
              <th className="px-4 py-3 text-left font-light text-zinc-700">Name</th>
              <th className="px-4 py-3 text-left font-light text-zinc-700">Email</th>
              <th className="px-4 py-3 text-left font-light text-zinc-700">Material</th>
              <th className="px-4 py-3 text-left font-light text-zinc-700">Dimensions (mm)</th>
              <th className="px-4 py-3 text-left font-light text-zinc-700">Description</th>
              <th className="px-4 py-3 text-left font-light text-zinc-700">Status</th>
              <th className="px-4 py-3 text-left font-light text-zinc-700">Submitted</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
                  <p className="text-zinc-600 mt-2 font-light">Loading orders...</p>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={9} className="text-center py-12 text-zinc-500 font-light">
                  No custom orders found.
                </td>
              </tr>
            ) : (
              orders.map((order) => (
                <tr
                  key={order.id}
                  onClick={() => setSelectedOrder(order)}
                  className="border-b border-gray-100 hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  <td
                    className="px-4 py-3"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <input
                      type="checkbox"
                      checked={selectedOrders.includes(order.id)}
                      onChange={() => toggleSelectOrder(order.id)}
                      className="w-4 h-4 text-emerald-600 focus:ring-emerald-500 rounded"
                    />
                  </td>
                  <td className="px-4 py-3 font-light text-zinc-900">{order.name}</td>
                  <td className="px-4 py-3 text-zinc-600 font-light">{order.email}</td>
                  <td className="px-4 py-3 text-zinc-700 font-light">{order.material}</td>
                  <td className="px-4 py-3 text-zinc-700 font-light">
                    {order.width ?? '–'} × {order.height ?? '–'} × {order.depth ?? '–'}
                  </td>
                  <td
                    className="px-4 py-3 max-w-xs truncate text-zinc-700 font-light"
                    title={order.description}
                  >
                    {order.description}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-light ${
                        STATUS_STYLES[order.status] ?? 'bg-gray-100 text-zinc-800'
                      }`}
                    >
                      {STATUS_LABELS[order.status] ?? order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-600 font-light">
                    {new Date(order.created_at).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-center" onClick={(e) => e.stopPropagation()}>
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

      {selectedOrder && (
        <CustomOrderModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdated={handleUpdated}
        />
      )}
    </div>
  )
}
