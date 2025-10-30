import { type NextRequest, NextResponse } from 'next/server'
import { createServerSupabase } from './utils/supabase/server'

export async function middleware(req: NextRequest) {
  console.log('🔄 [Middleware] Processing request:', req.url)

  const res = NextResponse.next()
  const supabase = createServerSupabase(req)

  // Refresh session if expired - required for Server Components
  console.log('🔄 [Middleware] Getting session...')
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession()

  if (error) {
    console.error('❌ [Middleware] Error getting session:', error)
  } else {
    console.log('📋 [Middleware] Session status:', {
      hasSession: !!session,
      userId: session?.user?.id,
      email: session?.user?.email,
    })
  }

  // Let Supabase handle its own session management
  // Don't manually set cookies as it can cause conflicts

  return res
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
