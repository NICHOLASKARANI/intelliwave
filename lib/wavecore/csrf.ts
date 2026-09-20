// ============================================================
// WaveCore CSRF Protection
// Double-submit cookie pattern.
// - Login sets a `wavecore_csrf` cookie (httpOnly=false, sameSite=lax)
// - Frontend reads it and sends as `X-CSRF-Token` header on mutations
// - Server compares header vs cookie — must match
// Soft-launch: LOGS mismatches, does NOT block (flip ENFORCE to true).
// ============================================================

import { NextResponse } from 'next/server'

// ============ CONFIG ============
const ENFORCE = true // soft launch — flip after observation
const CSRF_COOKIE = 'wavecore_csrf'
const CSRF_HEADER = 'x-csrf-token'
// ================================

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS'])

function parseCookies(cookieHeader: string): Record<string, string> {
  const out: Record<string, string> = {}
  if (!cookieHeader) return out
  cookieHeader.split(';').forEach(pair => {
    const [k, ...rest] = pair.trim().split('=')
    if (k) out[k] = decodeURIComponent(rest.join('='))
  })
  return out
}

export interface CsrfResult {
  allow: boolean
  response?: NextResponse
  reason?: string
}

/**
 * Validate CSRF on mutations (POST/PATCH/PUT/DELETE).
 * Skips safe methods (GET/HEAD/OPTIONS).
 * Skips if no session cookie is present (login/signup flows).
 */
export function checkCsrf(request: Request): CsrfResult {
  const method = (request.method || 'GET').toUpperCase()

  // Safe methods pass
  if (SAFE_METHODS.has(method)) {
    return { allow: true, reason: 'safe-method' }
  }

  const cookieHeader = request.headers.get('cookie') || ''
  const cookies = parseCookies(cookieHeader)

  // If no session cookie → not an authed request → skip CSRF (auth layer handles it)
  if (!cookies['wavecore_session']) {
    return { allow: true, reason: 'no-session' }
  }

  const cookieToken = cookies[CSRF_COOKIE] || ''
  const headerToken = request.headers.get(CSRF_HEADER) || ''

  // No CSRF cookie yet (older session) → soft-allow, log for observation
  if (!cookieToken) {
    console.warn('[CSRF-SOFT] Session present but no CSRF cookie (legacy session?)')
    return { allow: true, reason: 'no-cookie-yet' }
  }

  // Token mismatch → the attack case
  if (cookieToken !== headerToken) {
    if (ENFORCE) {
      return {
        allow: false,
        response: NextResponse.json(
          {
            error: 'CSRF validation failed',
            hint: 'Missing or invalid X-CSRF-Token header. Refresh the page and try again.',
          },
          { status: 403 }
        ),
        reason: 'mismatch',
      }
    }
    // Soft launch: log and allow
    console.warn(`[CSRF-SOFT-DENY] ${method} mismatch: cookie=${cookieToken.slice(0, 8)}… header=${headerToken.slice(0, 8)}…`)
    return { allow: true, reason: 'mismatch-soft' }
  }

  return { allow: true, reason: 'match' }
}

export function getCsrfEnforce(): boolean {
  return ENFORCE
}

export function getCsrfCookieName(): string {
  return CSRF_COOKIE
}

export function getCsrfHeaderName(): string {
  return CSRF_HEADER
}