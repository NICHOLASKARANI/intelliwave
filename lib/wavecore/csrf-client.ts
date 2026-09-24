// CSRF-aware fetch helper + auth-aware mutation helper.
// Reads `wavecore_csrf` cookie and includes it as X-CSRF-Token header on mutations.
// Also detects 401 → signals caller to redirect to login.

export function getCsrfToken(): string {
  if (typeof document === 'undefined') return ''
  const match = document.cookie.match(/(?:^|;\s*)wavecore_csrf=([^;]+)/)
  return match ? decodeURIComponent(match[1]) : ''
}

export function hasSession(): boolean {
  if (typeof document === 'undefined') return false
  // wavecore_session is httpOnly — we can't read it, but presence of CSRF cookie means user logged in
  return !!getCsrfToken()
}

export interface AuthedFetchResult {
  ok: boolean
  status: number
  data: any
  needsLogin: boolean
}

/**
 * Fetch with automatic CSRF header on mutations + 401 detection.
 * If the response is 401, returns { needsLogin: true } so callers can redirect.
 */
export async function authedFetch(url: string, options: RequestInit = {}): Promise<AuthedFetchResult> {
  const method = (options.method || 'GET').toUpperCase()
  const isMutation = ['POST', 'PATCH', 'PUT', 'DELETE'].includes(method)

  const headers: Record<string, string> = {
    ...((options.headers as Record<string, string>) || {}),
  }

  if (isMutation) {
    headers['X-CSRF-Token'] = getCsrfToken()
  }
  if (options.body && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json'
  }

  try {
    const res = await fetch(url, { ...options, headers, credentials: 'same-origin' })
    const needsLogin = res.status === 401

    let data: any = null
    try { data = await res.json() } catch {}

    return { ok: res.ok, status: res.status, data, needsLogin }
  } catch (err) {
    return { ok: false, status: 0, data: { error: 'Network error' }, needsLogin: false }
  }
}

/**
 * If needsLogin → redirect to login with current path preserved.
 */
export function redirectToLogin(currentPath?: string): void {
  if (typeof window === 'undefined') return
  const redirect = currentPath || window.location.pathname + window.location.search
  window.location.href = '/wavecore-erp/auth/login?redirect=' + encodeURIComponent(redirect)
}