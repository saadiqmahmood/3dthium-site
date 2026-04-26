import { log } from '../../../lib/log'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '../../../lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    log.debug('[API/admin/metrics] Fetching admin metrics...')
    const supabaseAdmin = getSupabaseAdmin()

    // Fetch all metrics in parallel
    const [
      { count: orderCount, data: orders },
      { count: userCount, data: users },
      { data: products },
    ] = await Promise.all([
      supabaseAdmin
        .from('orders')
        .select('id, total_price, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(5),
      supabaseAdmin
        .from('users')
        .select('id, email, created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .limit(5),
      supabaseAdmin.from('products').select('id'),
    ])

    // Calculate total revenue from recent orders
    const totalRevenue = (orders || []).reduce((sum, o) => sum + (o.total_price || 0), 0)

    const metrics = {
      totalOrders: orderCount || 0,
      totalUsers: userCount || 0,
      totalRevenue,
      recentOrders: orders || [],
      recentUsers: users || [],
      totalProducts: (products || []).length,
    }

    log.debug('[API/admin/metrics] Metrics fetched successfully')
    res.status(200).json(metrics)
  } catch (error) {
    log.error('[API/admin/metrics] Error fetching metrics:', error)
    res.status(500).json({ error: 'Failed to fetch metrics' })
  }
}
