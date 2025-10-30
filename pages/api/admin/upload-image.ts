import formidable from 'formidable'
import { promises as fs } from 'fs'
import type { NextApiRequest, NextApiResponse } from 'next'
import { getSupabaseAdmin } from '@/lib/supabaseClient'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const form = formidable({
      uploadDir: '/tmp',
      keepExtensions: true,
    })

    const [fields, files] = await form.parse(req)

    const file = files.file?.[0]
    const path = fields.path?.[0]

    if (!file || !path) {
      return res.status(400).json({ message: 'File and path are required' })
    }

    const supabase = getSupabaseAdmin()

    // Read the file
    const fileBuffer = await fs.readFile(file.filepath)

    // Upload file to Supabase storage
    const { data, error } = await supabase.storage.from('products').upload(path, fileBuffer, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.mimetype || 'image/jpeg',
    })

    if (error) {
      console.error('Storage upload error:', error)
      return res.status(500).json({ message: `Upload failed: ${error.message}` })
    }

    // Clean up temp file
    await fs.unlink(file.filepath)

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('products').getPublicUrl(path)

    return res.status(200).json({
      success: true,
      url: publicUrl,
      path: data.path,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return res.status(500).json({ message: 'Internal server error' })
  }
}
