import { createClient } from '@supabase/supabase-js'
import type { NextApiRequest, NextApiResponse } from 'next'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const { name, email, phone, material, address, width, height, depth, description, file_url } =
    req.body

  if (!name || !email || !material || !address || !description || !file_url) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const { error } = await supabase.from('custom_orders').insert([
    {
      name,
      email,
      phone,
      material,
      address,
      width: width ? Number(width) : null,
      height: height ? Number(height) : null,
      depth: depth ? Number(depth) : null,
      description,
      file_url,
      status: 'pending',
    },
  ])

  if (error) {
    return res.status(500).json({ error: error.message })
  }

  return res.status(200).json({ success: true })
}
