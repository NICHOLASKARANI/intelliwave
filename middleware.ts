import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const PUBLIC_AUTH_PATHS = [
  '/wavecore-erp/auth/login',
  '/wavecore-erp/auth/signup',
  '/wavecore-erp/auth/forgot-password',
  '/wavecore-erp/auth/logout',
]

// Roles allowed to view any HR page (frontend gate — API enforces the fine-grained checks)
const HR_ALLOWED_ROLES = ['OWNER', 'TENANT_ADMIN', 'HR_MANAGER', 'HR_VIEWER']

// Paths that require HR role (frontend gate)
const HR_PATHS = [
  '/wavecore-erp/hr',
]

/**
 * Decode session role from the wavecore_session cookie without a DB hit.
 * The actual session is validated inside the API. This middleware ONLY
 * decides whether to render the shell. It NEVER trusts the cookie for data.
 * Note: role is embedded in the cached session on first page load; we
 * fall back to a lightweight role marker cookie set by the login route.
 */
function getRoleFromCookie(request: NextRequest): string | null {
  // Primary source: explicit role cookie set on login
  const roleCookie = request.cookies.get('wavecore_role')?.value
  if (roleCookie) return roleCookie
  return null
}

function hasSession(request: NextRequest): boolean {
  const c = request.cookies.get('wavecore_session')
  return !!(c && c.value && c.value.length > 10)
}

function redirectToLogin(request: NextRequest, pathname: string) {
  const loginUrl = new URL('/wavecore-erp/auth/login', request.url)
  loginUrl.searchParams.set('redirect', pathname)
  return NextResponse.redirect(loginUrl)
}

function redirectToDashboard(request: NextRequest, reason: string) {
  const url = new URL('/wavecore-erp', request.url)
  url.searchParams.set('denied', reason)
  return NextResponse.redirect(url)
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // API routes handle their own auth — bypass
  if (pathname.startsWith('/api/')) return NextResponse.next()

  // Public auth pages
  if (PUBLIC_AUTH_PATHS.includes(pathname)) return NextResponse.next()

  // ============ HR SPECIFIC GATE ============
  const isHRPath = HR_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (isHRPath) {
    if (!hasSession(request)) {
      return redirectToLogin(request, pathname)
    }
    const role = getRoleFromCookie(request)
    // If role cookie missing (older session) — allow shell render,
    // API will 401/403 as appropriate. This preserves back-compat.
    if (role && !HR_ALLOWED_ROLES.includes(role)) {
      return redirectToDashboard(request, 'hr-role-required')
    }
    return NextResponse.next()
  }

  // ============ GENERIC ERP GATE ============
  if (pathname.startsWith('/wavecore-erp')) {
    if (pathname.startsWith('/wavecore-erp/subscription')) return NextResponse.next()
    if (!hasSession(request)) {
      return redirectToLogin(request, pathname)
    }
  }

  // ============ MARKETPLACE GATE ============
  if (
    pathname.startsWith('/marketplace/inbox') ||
    pathname.startsWith('/marketplace/saved') ||
    pathname.startsWith('/marketplace/sell')
  ) {
    if (!hasSession(request)) {
      return redirectToLogin(request, pathname)
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