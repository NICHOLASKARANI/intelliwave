// CSRF Token Protection
import { NextRequest, NextResponse } from 'next/server'
import { getSessionFromRequest } from '@/lib/wavecore/auth'

export function generateCSRFToken(): string {
  const crypto = require('crypto')
  return crypto.randomBytes(32).toString('hex')
}

export function validateCSRFToken(request: NextRequest): boolean {
  const token = request.headers.get('x-csrf-token')
  const cookie = request.cookies.get('csrf_token')
  
  if (!token || !cookie) return false
  return token === cookie.value
}

export async function requireCSRF(request: NextRequest): Promise<boolean> {
  const session = await getSessionFromRequest(request)
  if (!session) return false
  
  // Only require CSRF for mutating methods
  const method = request.method.toUpperCase()
  if (['GET', 'HEAD', 'OPTIONS'].includes(method)) return true
  
  return validateCSRFToken(request)
}