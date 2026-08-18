import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// IMPORTANT: No redirects here!
// Pages and APIs handle their own authentication
// This prevents infinite redirect loops

export function middleware(request: NextRequest) {
  // Allow ALL requests to pass through
  // Auth is handled at the page/API level
  return NextResponse.next()
}

export const config = {
  matcher: [], // Don't intercept any routes
}