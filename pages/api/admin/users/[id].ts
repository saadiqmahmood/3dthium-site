import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '../../../../lib/supabaseClient'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query

  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'Invalid user ID' })
  }

  const supabaseAdmin = getSupabaseAdmin()

  try {
    switch (req.method) {
      case 'PUT': {
        console.log('🔍 [API/admin/users/[id]] Updating user:', id)
        const { error: updateError } = await supabaseAdmin
          .from('users')
          .update(req.body)
          .eq('id', id)

        if (updateError) {
          console.error('❌ [API/admin/users/[id]] Error updating user:', updateError)
          return res.status(500).json({ error: 'Failed to update user' })
        }

        console.log('✅ [API/admin/users/[id]] User updated successfully')
        res.status(200).json({ success: true })
        break
      }

      case 'DELETE': {
        console.log('🔍 [API/admin/users/[id]] Deleting user:', id)
        const { error: deleteError } = await supabaseAdmin.from('users').delete().eq('id', id)

        if (deleteError) {
          console.error('❌ [API/admin/users/[id]] Error deleting user:', deleteError)
          return res.status(500).json({ error: 'Failed to delete user' })
        }

        console.log('✅ [API/admin/users/[id]] User deleted successfully')
        res.status(200).json({ success: true })
        break
      }

      default:
        res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('❌ [API/admin/users/[id]] Error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}
