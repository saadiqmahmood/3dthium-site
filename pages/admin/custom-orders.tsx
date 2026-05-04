import { useEffect, useState } from 'react'
import Toast from '@/components/ui/Toast'

type CustomOrder = {
  id: number
  name: string
  email: string
  phone: string | null
  material: string
  address: string
  width: number | null
  height: number | null
  depth: number | null
  description: string
  file_url: string
  status: string
  created_at: string
}

const STATUS_COLORS: Record<string, string> = {
  pending: 'bg-yellow-50 text-yellow-700',
  completed: 'bg-emerald-50 text-emerald-700',
  in_progress: 'bg-blue-50 text-blue-700',
  cancelled: 'bg-red-50 text-red-700',
}

export default function AdminCustomOrdersPage() {
  const [orders, setOrders] = useState<CustomOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrders, setSelectedOrders] = useState<number[]>([])
  const [toast, setToast] = useState<{ message: string; type?: 'success' | 'error' } | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)
      setError(null)
      try {
        console.log('🔍 [AdminCustomOrders] Fetching custom orders from API...')
        const response = await fetch('/api/admin/custom-orders')

        if (!response.ok) {
          console.error('❌ [AdminCustomOrders] Error fetching custom orders:', response.status)
          const errorData = await response
            .json()
            .catch(() => ({ error: 'Failed to fetch custom orders' }))
          throw new Error(errorData.error || 'Failed to fetch custom orders')
        }

        const data = await response.json()
        console.log('✅ [AdminCustomOrders] Custom orders fetched successfully:', data?.length || 0)

        if (!Array.isArray(data)) {
          console.warn('⚠️ [AdminCustomOrders] API returned non-array data:', data)
          setOrders([])
          setError('Invalid data format received')
          setToast({ message: 'Invalid data format received', type: 'error' })
        } else {
          setOrders(data || [])
        }
      } catch (error) {
        console.error('❌ [AdminCustomOrders] Error:', error)
        const errorMessage = error instanceof Error ? error.message : 'Failed to load custom orders'
        setError(errorMessage)
        setToast({ message: errorMessage, type: 'error' })
      } finally {
        setLoading(false)
      }
    }
    fetchOrders()
  }, [])

  // Bulk select logic
  const allSelected = orders.length > 0 && orders.every((o) => selectedOrders.includes(o.id))
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedOrders([])
    } else {
      setSelectedOrders(orders.map((o) => o.id))
    }
  }
  const toggleSelectOrder = (id: number) => {
    setSelectedOrders(
      selectedOrders.includes(id) ? selectedOrders.filter((i) => i !== id) : [...selectedOrders, id]
    )
  }
  const handleBulkDelete = async () => {
    try {
      for (const id of selectedOrders) {
        const response = await fetch(`/api/admin/custom-orders/${id}`, { method: 'DELETE' })
        if (!response.ok) {
          throw new Error(`Failed to delete order ${id}`)
        }
      }
      setOrders((orders) => orders.filter((o) => !selectedOrders.includes(o.id)))
      setSelectedOrders([])
      setToast({ message: 'Orders deleted successfully', type: 'success' })
    } catch (error) {
      console.error('❌ [AdminCustomOrders] Bulk delete error:', error)
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete custom orders'
      setToast({ message: errorMessage, type: 'error' })
    }
  }

  return (
    <div className="w-full mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-light text-zinc-900 mb-2">Custom Orders</h1>
        <p className="text-sm text-zinc-600 font-light">Manage custom order requests</p>
      </div>

      {/* Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type || 'success'}
          onClose={() => setToast(null)}
        />
      )}

      {/* Error State */}
      {error && !loading && (
        <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 font-light">{error}</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-2 text-red-600 hover:text-red-700 underline text-sm font-light"
          >
            Retry
          </button>
        </div>
      )}

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
              <th className="px-4 py-3 text-left font-light text-zinc-700">File</th>
              <th className="px-4 py-3 text-left font-light text-zinc-700">Status</th>
              <th className="px-4 py-3 text-left font-light text-zinc-700">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto"></div>
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
                  <td className="px-4 py-3 font-light text-zinc-900">{order.name}</td>
                  <td className="px-4 py-3">
                    <a
                      href={`mailto:${order.email}`}
                      className="text-emerald-600 hover:text-emerald-700 font-light"
                    >
                      {order.email}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-zinc-700 font-light">{order.material}</td>
                  <td className="px-4 py-3 text-zinc-700 font-light">
                    {order.width || '-'} × {order.height || '-'} × {order.depth || '-'}
                  </td>
                  <td
                    className="px-4 py-3 max-w-xs truncate text-zinc-700 font-light"
                    title={order.description}
                  >
                    {order.description}
                  </td>
                  <td className="px-4 py-3">
                    <a
                      href={order.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:text-emerald-700 font-light"
                    >
                      Download
                    </a>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-light ${
                        STATUS_COLORS[order.status] || 'bg-gray-100 text-zinc-800'
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-zinc-600 font-light">
                    {new Date(order.created_at).toLocaleString()}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
