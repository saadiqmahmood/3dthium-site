import { asc } from 'drizzle-orm'
import type { NextApiRequest, NextApiResponse } from 'next'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import { colorGroups, colorOptions, db, heightOptions, roomOptions } from '@/lib/db'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  if (req.method !== 'GET') {
    res.setHeader('Allow', ['GET'])
    return res.status(405).end()
  }

  const [groups, colors, heights, rooms] = await Promise.all([
    db.select().from(colorGroups).orderBy(asc(colorGroups.sortOrder), asc(colorGroups.createdAt)),
    db
      .select()
      .from(colorOptions)
      .orderBy(asc(colorOptions.sortOrder), asc(colorOptions.createdAt)),
    db
      .select()
      .from(heightOptions)
      .orderBy(asc(heightOptions.sortOrder), asc(heightOptions.createdAt)),
    db.select().from(roomOptions).orderBy(asc(roomOptions.sortOrder), asc(roomOptions.createdAt)),
  ])

  return res.status(200).json({ colorGroups: groups, colors, heights, rooms })
}
