import { createServerClient } from '@supabase/ssr'
import type { NextRequest, NextResponse } from 'next/server'

export function createServerSupabase(req: NextRequest, res?: NextResponse) {
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL as string,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
    {
      cookies: {
        get: (name: string) => req.cookies.get(name)?.value ?? '',
        // biome-ignore lint/suspicious/noExplicitAny: Supabase SSR cookie options type
        set: (name: string, value: string, options: any) => {
          if (res) {
            res.cookies.set(name, value, options)
          }
        },
        // biome-ignore lint/suspicious/noExplicitAny: Supabase SSR cookie options type
        remove: (name: string, _options: any) => {
          if (res) {
            res.cookies.delete(name)
          }
        },
      },
    }
  )
}
