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
 * Referral + product + region capture — additive, does not affect auth.
 * Sets 30-day cookies so referrals survive navigation and delay before payment.
 */
function applyReferralTracking(request: NextRequest, response: NextResponse): void {
  const url = new URL(request.url)
  const exec = url.searchParams.get('exec') || url.searchParams.get('ref')
  const product = url.searchParams.get('product')
  const redirect = url.searchParams.get('redirect')
  const thirtyDays = 60 * 60 * 24 * 30

  if (exec && exec.length >= 3 && exec.length <= 64) {
    response.cookies.set('iw_exec', exec, { maxAge: thirtyDays, path: '/', sameSite: 'lax' })
  }
  if (product && ['wavvemarket', 'wavecore-erp', 'wavve-si'].includes(product)) {
    response.cookies.set('iw_product', product, { maxAge: thirtyDays, path: '/', sameSite: 'lax' })
  }
  if (redirect && redirect.startsWith('/') && !redirect.startsWith('//')) {
    response.cookies.set('iw_redirect', redirect, { maxAge: 3600, path: '/', sameSite: 'lax' })
  }
  const country = request.headers.get('x-vercel-ip-country') || ''
  if (country.length === 2) {
    response.cookies.set('iw_country', country, { maxAge: thirtyDays, path: '/', sameSite: 'lax' })
  }
}

function getRoleFromCookie(request: NextRequest): string | null {
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
  loginUrl.searchParams.set('returnTo', pathname)
  const res = NextResponse.redirect(loginUrl)
  applyReferralTracking(request, res)
  return res
}

function redirectToDashboard(request: NextRequest, reason: string) {
  const url = new URL('/wavecore-erp', request.url)
  url.searchParams.set('denied', reason)
  const res = NextResponse.redirect(url)
  applyReferralTracking(request, res)
  return res
}

function nextWithReferral(request: NextRequest): NextResponse {
  const res = NextResponse.next()
  applyReferralTracking(request, res)
  return res
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // API routes handle their own auth — bypass
  if (pathname.startsWith('/api/')) {
    return nextWithReferral(request)
  }

  // Public auth pages
  if (PUBLIC_AUTH_PATHS.includes(pathname)) {
    return nextWithReferral(request)
  }

  // ============ HR SPECIFIC GATE ============
  const isHRPath = HR_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
  if (isHRPath) {
    if (!hasSession(request)) {
      return redirectToLogin(request, pathname)
    }
    const role = getRoleFromCookie(request)
    if (role && !HR_ALLOWED_ROLES.includes(role)) {
      return redirectToDashboard(request, 'hr-role-required')
    }
    return nextWithReferral(request)
  }

  // ============ GENERIC ERP GATE ============
  if (pathname.startsWith('/wavecore-erp')) {
    if (pathname.startsWith('/wavecore-erp/subscription')) {
      return nextWithReferral(request)
    }
    if (pathname.startsWith('/wavecore-erp/billing')) {
      return nextWithReferral(request)
    }

    if (!hasSession(request)) {
      return redirectToLogin(request, pathname)
    }

    const subscribed = request.cookies.get('wavecore_subscribed')?.value
    if (subscribed === 'false') {
      const subUrl = new URL('/wavecore-erp/subscription', request.url)
      subUrl.searchParams.set('returnTo', pathname)
      const res = NextResponse.redirect(subUrl)
      applyReferralTracking(request, res)
      return res
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
    const subscribed = request.cookies.get('wavecore_subscribed')?.value
    if (subscribed === 'false') {
      const subUrl = new URL('/wavecore-erp/subscription', request.url)
      subUrl.searchParams.set('returnTo', pathname)
      const res = NextResponse.redirect(subUrl)
      applyReferralTracking(request, res)
      return res
    }
  }

  return nextWithReferral(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - Static assets (svg, png, jpg, jpeg, gif, webp)
     * This ensures referral tracking works on EVERY page, including the homepage.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)).*)',
  ],
}