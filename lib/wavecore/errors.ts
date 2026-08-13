import { NextResponse } from 'next/server'

export function apiError(status: number, message: string, details?: any) {
  return NextResponse.json(
    { error: message, ...(details ? { details } : {}) },
    { status }
  )
}

export const Errors = {
  unauthorized: () => apiError(401, 'Authentication required'),
  forbidden: () => apiError(403, 'Insufficient permissions'),
  notFound: () => apiError(404, 'Resource not found'),
  validation: (details?: any) => apiError(422, 'Validation failed', details),
  conflict: (message: string) => apiError(409, message),
  rateLimited: (retryAfterSeconds: number) => 
    NextResponse.json(
      { error: 'Too many requests. Try again later.' },
      { 
        status: 429,
        headers: { 'Retry-After': retryAfterSeconds.toString() }
      }
    ),
  internal: () => apiError(500, 'Internal server error'),
}