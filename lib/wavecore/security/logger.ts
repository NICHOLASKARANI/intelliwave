// Security Event Logger
import { pool } from '@/lib/wavecore/db'

export interface SecurityEvent {
  category: string
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  action: string
  userId?: string
  organizationId?: string
  ip?: string
  userAgent?: string
  endpoint?: string
  method?: string
  riskScore?: number
  details?: string
}

export async function logSecurityEvent(event: SecurityEvent) {
  try {
    const crypto = require('crypto')
    const id = crypto.randomUUID()
    
    await pool.query(
      `INSERT INTO "SecurityEvent" (id, category, severity, action, "userId", "organizationId", ip, "userAgent", endpoint, method, "riskScore", details, "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, NOW())`,
      [
        id,
        event.category,
        event.severity,
        event.action,
        event.userId || null,
        event.organizationId || null,
        event.ip || null,
        event.userAgent || null,
        event.endpoint || null,
        event.method || null,
        event.riskScore || 0,
        event.details || null
      ]
    )
  } catch (error) {
    console.error('Failed to log security event:', error)
  }
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) return forwarded.split(',')[0].trim()
  return request.headers.get('x-real-ip') || 'unknown'
}

export function getCorrelationId(request: Request): string {
  return request.headers.get('x-request-id') || 
         request.headers.get('x-correlation-id') || 
         `req-${Date.now()}-${Math.random().toString(36).substring(7)}`
}