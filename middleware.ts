import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_AUTH_PATHS = [
  '/wavecore-erp/auth/login',
  '/wavecore-erp/auth/signup',
  '/wavecore-erp/auth/forgot-password',
  '/wavecore-erp/auth/logout',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  if (pathname.startsWith('/api/')) return NextResponse.next()

  if (PUBLIC_AUTH_PATHS.includes(pathname)) return NextResponse.next()

  if (pathname.startsWith('/wavecore-erp')) {
    if (pathname.startsWith('/wavecore-erp/subscription')) return NextResponse.next()

    const sessionCookie = request.cookies.get('wavecore_session')
    if (!sessionCookie || !sessionCookie.value) {
      const loginUrl = new URL('/wavecore-erp/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  if (
    pathname.startsWith('/marketplace/inbox') ||
    pathname.startsWith('/marketplace/saved') ||
    pathname.startsWith('/marketplace/sell')
  ) {
    const sessionCookie = request.cookies.get('wavecore_session')
    if (!sessionCookie || !sessionCookie.value) {
      const loginUrl = new URL('/wavecore-erp/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/wavecore-erp/:path*',
    '/marketplace/inbox/:path*',
    '/marketplace/saved/:path*',
    '/marketplace/sell/:path*',
  ],
}