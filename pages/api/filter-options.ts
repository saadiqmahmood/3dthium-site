import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAnon } from '@/lib/supabase/anon'

const supabase = getSupabaseAnon()

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end()
  }

  const [groupsResult, colorsResult, heightsResult, roomsResult] = await Promise.all([
    supabase.from('color_groups').select('id, name, sort_order').order('sort_order'),
    supabase
      .from('color_options')
      .select('id, group_id, name, hex_color, sort_order')
      .order('sort_order'),
    supabase.from('height_options').select('id, label, sort_order').order('sort_order'),
    supabase.from('room_options').select('id, name, sort_order').order('sort_order'),
  ])

  res.setHeader('Cache-Control', 'public, s-maxage=120, stale-while-revalidate=600')
  return res.status(200).json({
    colorGroups: groupsResult.data ?? [],
    colors: colorsResult.data ?? [],
    heights: heightsResult.data ?? [],
    rooms: roomsResult.data ?? [],
  })
}
