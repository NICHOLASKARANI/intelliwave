import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Protected routes that require authentication
const PROTECTED_PATHS = [
  '/wavecore-erp',
  '/wavecore-erp/finance',
  '/wavecore-erp/crm',
  '/wavecore-erp/store',
  '/wavecore-erp/inventory',
  '/wavecore-erp/manufacturing',
  '/wavecore-erp/hr',
  '/wavecore-erp/projects',
  '/wavecore-erp/helpdesk',
  '/wavecore-erp/documents',
  '/wavecore-erp/analytics',
  '/wavecore-erp/ai',
  '/wavecore-erp/automation',
  '/wavecore-erp/procurement',
  '/wavecore-erp/settings',
]

// Public paths that don't require auth
const PUBLIC_PATHS = [
  '/wavecore-erp/auth/login',
  '/wavecore-erp/auth/signup',
  '/wavecore-erp/auth/forgot-password',
]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  
  // Check if path is protected
  const isProtected = PROTECTED_PATHS.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  )
  
  // Check if path is public
  const isPublic = PUBLIC_PATHS.some(path => 
    pathname === path || pathname.startsWith(path + '/')
  )
  
  if (isProtected && !isPublic) {
    // Check for session cookie
    const sessionCookie = request.cookies.get('wavecore_session')
    
    if (!sessionCookie || !sessionCookie.value) {
      // No session - redirect to login
      const loginUrl = new URL('/wavecore-erp/auth/login', request.url)
      loginUrl.searchParams.set('redirect', pathname)
      return NextResponse.redirect(loginUrl)
    }
    
    // Check if session is expired (basic check - cookie expiry)
    if (sessionCookie.value === '') {
      const loginUrl = new URL('/wavecore-erp/auth/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: [
    '/wavecore-erp/:path*',
    '/wavecore-erp',
  ],
}