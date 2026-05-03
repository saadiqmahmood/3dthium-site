import { useEffect, useState } from 'react'
import Spinner from '@/components/ui/Spinner'
import Toast from '@/components/ui/Toast'
import { formatMoney } from '@/lib/format/money'

type Order = {
  id: string
  total_price: number
  created_at: string
}

type User = {
  id: string
  email: string
  created_at: string
}

type Metrics = {
  totalOrders: number
  totalUsers: number
  totalRevenue: number
  recentOrders: Order[]
  recentUsers: User[]
  totalProducts: number
}

export default function AdminDashboard() {
  const [metrics, setMetrics] = useState<Metrics>({
    totalOrders: 0,
    totalUsers: 0,
    totalRevenue: 0,
    recentOrders: [],
    recentUsers: [],
    totalProducts: 0,
  })
  const [loading, setLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)

  useEffect(() => {
    const fetchMetrics = async () => {
      setLoading(true)
      try {
        console.log('🔍 [AdminDashboard] Fetching metrics from API...')
        const response = await fetch('/api/admin/metrics')

        if (!response.ok) {
          console.error('❌ [AdminDashboard] Error fetching metrics:', response.status)
          throw new Error('Failed to fetch metrics')
        }

        const data = await response.json()
        console.log('✅ [AdminDashboard] Metrics fetched successfully:', data)
        setMetrics(data)
      } catch (error) {
        console.error('❌ [AdminDashboard] Error:', error)
        setToast({ message: 'Failed to load dashboard data', type: 'error' })
      } finally {
        setLoading(false)
      }
    }
    fetchMetrics()
  }, [])

  // Export helpers
  const exportTable = async (table: string) => {
    try {
      const response = await fetch(`/api/admin/${table}`)
      if (!response.ok) throw new Error('Export failed')

      const data = await response.json()
      if (!data || data.length === 0) {
        setToast({ message: 'No data to export', type: 'error' })
        return
      }

      const csv = [
        Object.keys(data[0] || {}).join(','),
        ...(data as Record<string, string | number | boolean>[]).map((row) =>
          Object.values(row)
            .map((v) => `"${String(v).replace(/"/g, '""')}"`)
            .join(',')
        ),
      ]
      const blob = new Blob([csv.join('\n')], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${table}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('❌ [AdminDashboard] Export error:', error)
      setToast({ message: 'Export failed', type: 'error' })
    }
  }

  // Import helpers
  const importTable = async (table: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const [header, ...rows] = text.split('\n')
      const keys = header.split(',')
      const data = rows.filter(Boolean).map((row: string) => {
        const values = row.split(',').map((v) => v.replace(/^"|"$/g, '').replace(/""/g, '"'))
        return Object.fromEntries(keys.map((k: string, i: number) => [k, values[i]]))
      })

      // Use API route for import
      const response = await fetch(`/api/admin/${table}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Import failed')

      window.location.reload()
    } catch (error) {
      console.error('❌ [AdminDashboard] Import error:', error)
      setToast({ message: 'Import failed', type: 'error' })
    }
  }

  return (
    <div className="w-full mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-light text-zinc-900 mb-2">Dashboard</h1>
        <p className="text-sm text-zinc-600 font-light">Overview of your store performance</p>
      </div>

      {loading ? (
        <Spinner label="Loading metrics..." />
      ) : (
        <>
          {/* Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="text-2xl font-light text-zinc-400 mb-1">Total Orders</div>
              <div className="text-4xl font-light text-zinc-900">{metrics.totalOrders}</div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="text-2xl font-light text-zinc-400 mb-1">Total Users</div>
              <div className="text-4xl font-light text-zinc-900">{metrics.totalUsers}</div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="text-2xl font-light text-zinc-400 mb-1">Total Products</div>
              <div className="text-4xl font-light text-zinc-900">{metrics.totalProducts}</div>
            </div>
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <div className="text-2xl font-light text-zinc-400 mb-1">Total Revenue</div>
              <div className="text-4xl font-light text-zinc-900">
                {formatMoney(metrics.totalRevenue)}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-light text-zinc-900 mb-4">Recent Orders</h3>
              {metrics.recentOrders.length === 0 ? (
                <p className="text-sm text-zinc-500 font-light py-4">No recent orders</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {metrics.recentOrders.map((o: Order) => (
                    <li key={o.id} className="py-3 flex items-center justify-between text-sm">
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-zinc-900 text-xs">{o.id.slice(-8)}</span>
                        <span className="text-zinc-600 font-light">
                          {new Date(o.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <span className="text-zinc-900 font-medium">
                        {formatMoney(o.total_price)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
              <h3 className="text-lg font-light text-zinc-900 mb-4">Recent Users</h3>
              {metrics.recentUsers.length === 0 ? (
                <p className="text-sm text-zinc-500 font-light py-4">No recent users</p>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {metrics.recentUsers.map((u: User) => (
                    <li key={u.id} className="py-3 flex items-center justify-between text-sm">
                      <span className="text-zinc-900 font-light">{u.email}</span>
                      <span className="text-zinc-600 font-light text-xs">
                        {new Date(u.created_at).toLocaleDateString()}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {/* Data Management */}
          <div className="bg-white rounded-lg p-6 shadow-sm border border-gray-100">
            <h3 className="text-lg font-light text-zinc-900 mb-6">Data Management</h3>

            {/* Export Section */}
            <div className="mb-6 pb-6 border-b border-gray-100">
              <h4 className="text-sm font-medium text-zinc-700 mb-3">Export Data</h4>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => exportTable('orders')}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-light"
                >
                  Export Orders CSV
                </button>
                <button
                  onClick={() => exportTable('users')}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-light"
                >
                  Export Users CSV
                </button>
                <button
                  onClick={() => exportTable('products')}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-light"
                >
                  Export Products CSV
                </button>
              </div>
            </div>

            {/* Import Section */}
            <div>
              <h4 className="text-sm font-medium text-zinc-700 mb-3">Import Data</h4>
              <div className="flex flex-wrap gap-4 items-center">
                <label className="flex flex-col gap-1 text-sm text-zinc-700 font-light">
                  Import Orders CSV
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => importTable('orders', e)}
                    className="block text-sm text-zinc-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-light file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-zinc-700 font-light">
                  Import Users CSV
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => importTable('users', e)}
                    className="block text-sm text-zinc-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-light file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                  />
                </label>
                <label className="flex flex-col gap-1 text-sm text-zinc-700 font-light">
                  Import Products CSV
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => importTable('products', e)}
                    className="block text-sm text-zinc-600 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-light file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                  />
                </label>
              </div>
            </div>
          </div>
        </>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}
