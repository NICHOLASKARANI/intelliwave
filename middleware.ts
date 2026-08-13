import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_PATHS = [
  '/wavecore-erp/auth/login',
  '/wavecore-erp/auth/signup',
  '/wavecore-erp/auth/forgot-password',
  '/api/wavecore/auth/login',
  '/api/wavecore/auth/signup',
  '/api/wavecore/auth/forgot-password',
]

const SESSION_COOKIE = 'wavecore_session'

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Allow public paths
  if (PUBLIC_PATHS.some(path => pathname.startsWith(path))) {
    return NextResponse.next()
  }

  // Allow static files
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)
  ) {
    return NextResponse.next()
  }

  // Protect WaveCore ERP routes
  if (pathname.startsWith('/wavecore-erp') || pathname.startsWith('/api/wavecore')) {
    const sessionToken = request.cookies.get(SESSION_COOKIE)?.value

    if (!sessionToken) {
      const loginUrl = new URL('/wavecore-erp/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  // Add security headers
  const response = NextResponse.next()
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
}

export const config = {
  matcher: ['/wavecore-erp/:path*', '/api/wavecore/:path*'],
}