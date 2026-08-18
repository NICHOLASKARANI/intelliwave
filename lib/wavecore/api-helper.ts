import { NextResponse } from 'next/server'

export function cachedResponse(data: any, maxAge: number = 30) {
  const response = NextResponse.json(data)
  response.headers.set('Cache-Control', `public, max-age=${maxAge}, stale-while-revalidate=60`)
  return response
}