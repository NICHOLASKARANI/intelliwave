// Main Security Middleware
import { NextRequest, NextResponse } from 'next/server'
import { rateLimit } from './rate-limiter'
import { applySecurityHeaders } from './headers'
import { logSecurityEvent, getClientIP, getCorrelationId } from './logger'

export async function securityMiddleware(request: NextRequest): Promise<NextResponse | null> {
  const ip = getClientIP(request)
  const correlationId = getCorrelationId(request)
  const endpoint = request.nextUrl.pathname
  const method = request.method

  // Set correlation ID
  const response = NextResponse.next()
  response.headers.set('X-Request-ID', correlationId)
  response.headers.set('X-Correlation-ID', correlationId)

  // Apply security headers
  applySecurityHeaders(response)

  // Rate limiting
  const rateLimitKey = `${ip}:${endpoint}`
  const limit = rateLimit(rateLimitKey, {
    maxRequests: method === 'POST' ? 50 : 100,
    windowMs: 60000 // 1 minute
  })

  if (!limit.allowed) {
    await logSecurityEvent({
      category: 'RATE_LIMIT',
      severity: 'MEDIUM',
      action: 'RATE_LIMIT_EXCEEDED',
      ip,
      endpoint,
      method,
      riskScore: 50,
      details: `Rate limit exceeded for ${ip} on ${endpoint}`
    })

    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(limit.retryAfter) } }
    )
  }

  // Block suspicious patterns
  const userAgent = request.headers.get('user-agent') || ''
  if (userAgent.includes('sqlmap') || userAgent.includes('nikto') || userAgent.includes('nmap')) {
    await logSecurityEvent({
      category: 'ATTACK_TOOL',
      severity: 'CRITICAL',
      action: 'ATTACK_TOOL_DETECTED',
      ip,
      userAgent,
      endpoint,
      method,
      riskScore: 95,
      details: `Attack tool detected: ${userAgent}`
    })

    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return response
}