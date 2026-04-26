import { log } from '../../../../lib/log'
import { requireAdmin } from '@/lib/auth/requireAdmin'
import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '../../../../lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const admin = await requireAdmin(req, res)
  if (!admin) return

  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid user ID' })
  }

  const supabaseAdmin = getSupabaseAdmin()

  try {
    switch (req.method) {
      case 'PUT': {
        log.debug('[API/admin/users/[id]] Updating user:', id)
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update(req.body)
          .eq('id', id)

        if (updateError) {
          log.error('[API/admin/users/[id]] Error updating user:', updateError)
          return res.status(500).json({ error: 'Failed to update user' })
        }

        log.debug('[API/admin/users/[id]] User updated successfully')
        res.status(200).json({ success: true })
        break
      }

      case 'DELETE': {
        log.debug('[API/admin/users/[id]] Deleting user:', id)
        const { error: deleteError } = await supabaseAdmin.from('users').delete().eq('id', id)

        if (deleteError) {
          log.error('[API/admin/users/[id]] Error deleting user:', deleteError)
          return res.status(500).json({ error: 'Failed to delete user' })
        }

        log.debug('[API/admin/users/[id]] User deleted successfully')
        res.status(200).json({ success: true })
        break
      }

      default:
        res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    log.error('[API/admin/users/[id]] Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
