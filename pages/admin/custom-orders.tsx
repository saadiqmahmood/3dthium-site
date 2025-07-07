import { useEffect, useState } from 'react'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
  pending: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-green-100 text-green-800',
  in_progress: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800',
}

export default function AdminCustomOrdersPage() {
  const [orders, setOrders] = useState<CustomOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedOrders, setSelectedOrders] = useState<number[]>([])

  useEffect(() => {
    const fetchOrders = async () => {
      setLoading(true)
      const { data } = await supabase
        .from('custom_orders')
        .select('*')
        .order('created_at', { ascending: false })
      setOrders(data || [])
      setLoading(false)
    }
    fetchOrders()
  }, [])

  // Bulk select logic
  const allSelected = orders.length > 0 && orders.every(o => selectedOrders.includes(o.id))
  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedOrders([])
    } else {
      setSelectedOrders(orders.map(o => o.id))
    }
  }
  const toggleSelectOrder = (id: number) => {
    setSelectedOrders(selectedOrders.includes(id) ? selectedOrders.filter(i => i !== id) : [...selectedOrders, id])
  }
  const handleBulkDelete = async () => {
    for (const id of selectedOrders) {
      await supabase.from('custom_orders').delete().eq('id', id)
    }
    setOrders(orders => orders.filter(o => !selectedOrders.includes(o.id)))
    setSelectedOrders([])
  }

  return (
    <div className="w-full mx-auto bg-white p-16">
      <h2 className="text-2xl font-bold mb-6 text-stone-800">Custom Orders</h2>
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
        <span className="ml-auto text-sm text-gray-500">{orders.length} order{orders.length !== 1 ? 's' : ''}</span>
      </div>
      <div className="overflow-x-auto rounded-lg border">
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-2 py-3"><input type="checkbox" checked={allSelected} onChange={toggleSelectAll} className="accent-blue-200 w-5 h-3 rounded" /></th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Name</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Email</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Material</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Dimensions (mm)</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Description</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">File</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Status</th>
              <th className="px-4 py-3 text-left font-semibold text-gray-700">Submitted</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={9} className="text-center py-8 text-gray-500">Loading...</td></tr>
            ) : orders.length === 0 ? (
              <tr><td colSpan={9} className="text-center py-8 text-gray-500">No custom orders found.</td></tr>
            ) : orders.map(order => (
              <tr key={order.id} className="border-b hover:bg-gray-50">
                <td className="px-2 py-3"><input type="checkbox" checked={selectedOrders.includes(order.id)} onChange={() => toggleSelectOrder(order.id)} className="accent-blue-200 w-5 h-3 rounded" /></td>
                <td className="px-4 py-3 font-medium text-stone-800">{order.name}</td>
                <td className="px-4 py-3 text-blue-700 underline"><a href={`mailto:${order.email}`}>{order.email}</a></td>
                <td className="px-4 py-3 text-stone-800">{order.material}</td>
                <td className="px-4 py-3 text-stone-800">{order.width || '-'} × {order.height || '-'} × {order.depth || '-'}</td>
                <td className="px-4 py-3 max-w-xs truncate text-stone-800" title={order.description}>{order.description}</td>
                <td className="px-4 py-3 text-stone-800">
                  <a href={order.file_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">Download</a>
                </td>
                <td className="px-4 py-3">
                  <span className={`inline-block px-2 py-1 rounded text-xs font-semibold ${STATUS_COLORS[order.status] || 'bg-gray-100 text-gray-800'}`}>{order.status}</span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{new Date(order.created_at).toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
} 