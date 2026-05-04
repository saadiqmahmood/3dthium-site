import { useCallback, useEffect, useState } from 'react'
import { ORDER_STATUSES, type Order, OrderDetailsModal } from '@/components/admin/OrderDetailsModal'
import Toast from '@/components/ui/Toast'
import { formatMoney } from '@/lib/format/money'

export default function AdminOrdersPage() {
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

  // --- Fetch Orders ---
  const fetchOrders = useCallback(async () => {
    setOrdersLoading(true)
    try {
      const response = await fetch('/api/admin/orders')
      if (!response.ok) throw new Error('Failed to fetch orders')
      const data = await response.json()

      let usersMap: Record<string, string> = {}
      if (data?.length > 0) {
        const userIds = Array.from(new Set(data.map((o: Order) => o.user_id).filter(Boolean)))
        if (userIds.length > 0) {
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
    } catch {
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
    setOrders((prev) => prev.filter((o) => !selectedOrders.includes(o.id)))
    setSelectedOrders([])
  }

  // --- Modal callbacks ---
  const handleStatusUpdated = (orderId: string, newStatus: string) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)))
  }
  const handleDeleted = (orderId: string) => {
    setOrders((prev) => prev.filter((o) => o.id !== orderId))
    setSelectedOrder(null)
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
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-600 mx-auto" />
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

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          orders={orders}
          onClose={() => setSelectedOrder(null)}
          onStatusUpdated={handleStatusUpdated}
          onDeleted={handleDeleted}
          onItemsSaved={fetchOrders}
          setToast={setToast}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
