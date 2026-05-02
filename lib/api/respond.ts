import type { NextApiResponse } from 'next'

export function ok<T>(res: NextApiResponse, data: T, status = 200) {
  return res.status(status).json({ data })
}

export function err(res: NextApiResponse, message: string, status = 400, details?: unknown) {
  const body: { error: { message: string; details?: unknown } } = {
    error: { message },
  }
  if (details !== undefined) body.error.details = details
  return res.status(status).json(body)
}
