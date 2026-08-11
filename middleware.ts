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

  // Allow static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/favicon') ||
    pathname.match(/\.(ico|png|jpg|jpeg|svg|css|js)$/)
  ) {
    return NextResponse.next()
  }

  // Only protect WaveCore ERP routes
  if (pathname.startsWith('/wavecore-erp') || pathname.startsWith('/api/wavecore')) {
    const sessionToken = request.cookies.get(SESSION_COOKIE)?.value

    if (!sessionToken) {
      const loginUrl = new URL('/wavecore-erp/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/wavecore-erp/:path*', '/api/wavecore/:path*'],
}