import { useEffect, useState } from 'react'

type Order = {
  id: string;
  total_price: number;
  created_at: string;
};

type User = {
  id: string;
  email: string;
  created_at: string;
};

type Metrics = {
  totalOrders: number;
  totalUsers: number;
  totalRevenue: number;
  recentOrders: Order[];
  recentUsers: User[];
  totalProducts: number;
};

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
        alert('Failed to load dashboard data')
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
        alert('No data to export')
        return
      }
      
      const csv = [
        Object.keys(data[0] || {}).join(','),
        ...((data as Record<string, string | number | boolean>[]).map((row) =>
          Object.values(row).map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')
        )),
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
      alert('Export failed')
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
        body: JSON.stringify(data)
      })
      
      if (!response.ok) throw new Error('Import failed')
      
      alert('Import complete!')
      // Refresh metrics
      window.location.reload()
    } catch (error) {
      console.error('❌ [AdminDashboard] Import error:', error)
      alert('Import failed')
    }
  }

  return (
    <div className="w-full mx-auto bg-white p-8 pt-12 max-w-5xl">
      <h2 className="text-2xl font-bold mb-6 text-stone-800">Admin Dashboard</h2>
      {loading ? <div className="text-center py-8 text-gray-500">Loading...</div> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-50 rounded-lg p-6 shadow flex flex-col items-center">
            <div className="text-3xl font-bold text-blue-600">{metrics.totalOrders}</div>
            <div className="text-stone-800 mt-2">Total Orders</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-6 shadow flex flex-col items-center">
            <div className="text-3xl font-bold text-blue-600">{metrics.totalUsers}</div>
            <div className="text-stone-800 mt-2">Total Users</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-6 shadow flex flex-col items-center">
            <div className="text-3xl font-bold text-blue-600">{metrics.totalProducts}</div>
            <div className="text-stone-800 mt-2">Total Products</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-6 shadow flex flex-col items-center">
            <div className="text-3xl font-bold text-blue-600">£{metrics.totalRevenue.toFixed(2)}</div>
            <div className="text-stone-800 mt-2">Total Revenue</div>
          </div>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div className="bg-white rounded-lg p-6 shadow">
          <div className="font-semibold text-stone-800 mb-2">Recent Orders</div>
          <ul className="divide-y divide-gray-200">
            {metrics.recentOrders.length === 0 && <li className="text-gray-500 py-2">No recent orders</li>}
            {metrics.recentOrders.map((o: Order) => (
              <li key={o.id} className="py-2 flex justify-between text-sm">
                <span className="font-mono text-stone-800">{o.id.slice(-8)}</span>
                <span className="text-gray-700">£{Number(o.total_price).toFixed(2)}</span>
                <span className="text-gray-500">{new Date(o.created_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="bg-white rounded-lg p-6 shadow">
          <div className="font-semibold text-stone-800 mb-2">Recent Users</div>
          <ul className="divide-y divide-gray-200">
            {metrics.recentUsers.length === 0 && <li className="text-gray-500 py-2">No recent users</li>}
            {metrics.recentUsers.map((u: User) => (
              <li key={u.id} className="py-2 flex justify-between text-sm">
                <span className="font-mono text-stone-800">{u.email}</span>
                <span className="text-gray-500">{new Date(u.created_at).toLocaleDateString()}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="bg-white rounded-lg p-6 shadow mb-8">
        <div className="font-semibold text-stone-800 mb-4">Export Data</div>
        <div className="flex flex-wrap gap-4">
          <button onClick={() => exportTable('orders')} className="text-stone-800 border border-stone-300 px-3 py-1 rounded hover:bg-stone-100 transition">Export Orders CSV</button>
          <button onClick={() => exportTable('users')} className="text-stone-800 border border-stone-300 px-3 py-1 rounded hover:bg-stone-100 transition">Export Users CSV</button>
          <button onClick={() => exportTable('products')} className="text-stone-800 border border-stone-300 px-3 py-1 rounded hover:bg-stone-100 transition">Export Products CSV</button>
        </div>
      </div>
      <div className="bg-white rounded-lg p-6 shadow">
        <div className="font-semibold text-stone-800 mb-4">Import Data</div>
        <div className="flex flex-wrap gap-4 items-center">
          <label className="text-stone-800">Import Orders CSV
            <input type="file" accept=".csv" onChange={e => importTable('orders', e)} className="block mt-1" />
          </label>
          <label className="text-stone-800">Import Users CSV
            <input type="file" accept=".csv" onChange={e => importTable('users', e)} className="block mt-1" />
          </label>
          <label className="text-stone-800">Import Products CSV
            <input type="file" accept=".csv" onChange={e => importTable('products', e)} className="block mt-1" />
          </label>
        </div>
      </div>
    </div>
  )
} 