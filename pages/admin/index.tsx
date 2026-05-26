import { useCallback, useEffect, useState } from 'react'
import Spinner from '@/components/ui/Spinner'
import Toast from '@/components/ui/Toast'
import { formatMoney } from '@/lib/format/money'
import { authFetch } from '@/lib/api/authFetch'

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

  const fetchMetrics = useCallback(async () => {
    setLoading(true)
    try {
      const response = await authFetch('/api/admin/metrics')
      if (!response.ok) throw new Error('Failed to fetch metrics')
      const data = await response.json()
      setMetrics(data)
    } catch {
      setToast({ message: 'Failed to load dashboard data', type: 'error' })
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchMetrics()
  }, [fetchMetrics])

  // Export helpers
  const exportTable = async (table: string) => {
    try {
      const response = await authFetch(`/api/admin/${table}`)
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
      const response = await authFetch(`/api/admin/${table}/import`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) throw new Error('Import failed')

      await fetchMetrics()
      setToast({ message: 'Import successful', type: 'success' })
    } catch {
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-0.5 bg-emerald-500" />
              <div className="p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 1 0-7.5 0v4.5m11.356-1.993 1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 0 1-1.12-1.243l1.264-12A1.125 1.125 0 0 1 5.513 7.5h12.974c.576 0 1.059.435 1.119 1.007Z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-zinc-500">Total Orders</span>
                </div>
                <div className="text-3xl font-semibold text-zinc-900 tabular-nums">{metrics.totalOrders}</div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-0.5 bg-emerald-500" />
              <div className="p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-zinc-500">Total Users</span>
                </div>
                <div className="text-3xl font-semibold text-zinc-900 tabular-nums">{metrics.totalUsers}</div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-0.5 bg-emerald-500" />
              <div className="p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 0 1 6 3.75h2.25A2.25 2.25 0 0 1 10.5 6v2.25a2.25 2.25 0 0 1-2.25 2.25H6a2.25 2.25 0 0 1-2.25-2.25V6ZM3.75 15.75A2.25 2.25 0 0 1 6 13.5h2.25a2.25 2.25 0 0 1 2.25 2.25V18a2.25 2.25 0 0 1-2.25 2.25H6A2.25 2.25 0 0 1 3.75 18v-2.25ZM13.5 6a2.25 2.25 0 0 1 2.25-2.25H18A2.25 2.25 0 0 1 20.25 6v2.25A2.25 2.25 0 0 1 18 10.5h-2.25a2.25 2.25 0 0 1-2.25-2.25V6ZM13.5 15.75a2.25 2.25 0 0 1 2.25-2.25H18a2.25 2.25 0 0 1 2.25 2.25V18A2.25 2.25 0 0 1 18 20.25h-2.25A2.25 2.25 0 0 1 13.5 18v-2.25Z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-zinc-500">Total Products</span>
                </div>
                <div className="text-3xl font-semibold text-zinc-900 tabular-nums">{metrics.totalProducts}</div>
              </div>
            </div>
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="h-0.5 bg-emerald-500" />
              <div className="p-6">
                <div className="flex items-center gap-2.5 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0 1 15.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 0 1 3 6h-.75m0 0v-.375c0-.621.504-1.125 1.125-1.125H20.25M2.25 6v9m18-10.5v.75c0 .414.336.75.75.75h.75m-1.5-1.5h.375c.621 0 1.125.504 1.125 1.125v9.75c0 .621-.504 1.125-1.125 1.125h-.375m1.5-1.5H21a.75.75 0 0 0-.75.75v.75m0 0H3.75m0 0h-.375a1.125 1.125 0 0 1-1.125-1.125V15m1.5 1.5v-.75A.75.75 0 0 0 3 15h-.75M15 10.5a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm3 0h.008v.008H18V10.5Zm-12 0h.008v.008H6V10.5Z" />
                    </svg>
                  </div>
                  <span className="text-sm font-medium text-zinc-500">Total Revenue</span>
                </div>
                <div className="text-3xl font-semibold text-zinc-900 tabular-nums">
                  {formatMoney(metrics.totalRevenue)}
                </div>
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
                  type="button"
                  onClick={() => exportTable('orders')}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-light"
                >
                  Export Orders CSV
                </button>
                <button
                  type="button"
                  onClick={() => exportTable('users')}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-light"
                >
                  Export Users CSV
                </button>
                <button
                  type="button"
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
