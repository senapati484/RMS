import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyToken } from '@/lib/auth'

const PUBLIC_PATHS = ['/login', '/register', '/api/auth/login', '/api/auth/register', '/']

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

// Allow public paths & static assets (images, favicons, next assets)
  if (
    PUBLIC_PATHS.some((p) => pathname === p) ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon') ||
    /\.(png|jpg|jpeg|svg|webp|ico|json|pdf)$/i.test(pathname)
  ) {
    return NextResponse.next()
  }

  const token = request.cookies.get('auth-token')?.value

  // Not logged in
  if (!token) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  const payload = await verifyToken(token)
  if (!payload) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }
    return NextResponse.redirect(new URL('/login', request.url))
  }

  // Admin-only routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/api/admin')) {
    if (payload.role !== 'ADMIN' && payload.role !== 'STAFF') {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
      }
      return NextResponse.redirect(new URL('/portal/dashboard', request.url))
    }
  }

  // Portal user trying to access admin API
  if (pathname.startsWith('/api/admin') && payload.role === 'PORTAL_USER') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Add user info to headers for downstream API routes
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-user-id', payload.userId)
  requestHeaders.set('x-user-role', payload.role)
  requestHeaders.set('x-user-email', payload.email)

  return NextResponse.next({ request: { headers: requestHeaders } })
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|public/).*)'],
}
