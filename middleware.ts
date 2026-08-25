import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Public paths that don't require auth
const PUBLIC_PATHS = [
  '/wavecore-erp/auth/login',
  '/wavecore-erp/auth/signup',
  '/wavecore-erp/auth/forgot-password',
  '/wavecore-erp/auth/logout',
  '/api/wavecore/auth/login',
  '/api/wavecore/auth/signup',
  '/api/wavecore/auth/forgot-password',
  '/api/wavecore/auth/session',
  '/api/wavecore/auth/reset-password',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Allow API routes for auth
  if (pathname.startsWith('/api/wavecore/auth/')) {
    return NextResponse.next()
  }
  
  // Allow public auth pages
  if (PUBLIC_PATHS.includes(pathname)) {
    return NextResponse.next()
  }
  
  // Protect ALL /wavecore-erp routes (except auth pages)
  if (pathname.startsWith('/wavecore-erp')) {
    const sessionCookie = request.cookies.get('wavecore_session')
    
    if (!sessionCookie || !sessionCookie.value || sessionCookie.value === '') {
      const loginUrl = new URL('/wavecore-erp/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
  }
  
  // Protect marketplace private pages
  if (pathname.startsWith('/marketplace/inbox') || 
      pathname.startsWith('/marketplace/saved') || 
      pathname.startsWith('/marketplace/sell')) {
    const sessionCookie = request.cookies.get('wavecore_session')
    
    if (!sessionCookie || !sessionCookie.value || sessionCookie.value === '') {
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