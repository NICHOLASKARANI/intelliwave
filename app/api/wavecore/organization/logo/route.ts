export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// GET /api/wavecore/organization/logo
// Serves the current tenant's uploaded logo as a real image.
// Falls back to /images/Wavecore.jpeg (default) when no logo is set.
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.redirect(new URL('/images/Wavecore.jpeg', request.url))

    const r = await pool.query(
      'SELECT logo FROM "Organization" WHERE id = $1 LIMIT 1',
      [session.organizationId]
    )

    const logo: string | null = r.rows[0]?.logo || null

    if (!logo || !logo.startsWith('data:image/')) {
      // No custom logo — redirect to the default brand image
      return NextResponse.redirect(new URL('/images/Wavecore.jpeg', request.url))
    }

    // logo is a data URL like: data:image/png;base64,AAAA...
    const m = logo.match(/^data:(image\/[a-zA-Z+.-]+);base64,(.+)$/)
    if (!m) {
      return NextResponse.redirect(new URL('/images/Wavecore.jpeg', request.url))
    }

    const mimeType = m[1]
    const base64 = m[2]
    const buffer = Buffer.from(base64, 'base64')

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': mimeType,
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Content-Length': String(buffer.length),
      },
    })
  } catch (error) {
    console.error('[organization logo GET]', error)
    return NextResponse.redirect(new URL('/images/Wavecore.jpeg', request.url))
  }
}