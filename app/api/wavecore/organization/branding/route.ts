export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { checkCsrf } from '@/lib/wavecore/csrf'

// GET — return current org's branding (logo data URL + company name)
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const r = await pool.query(
      'SELECT name, logo FROM "Organization" WHERE id = $1 LIMIT 1',
      [session.organizationId]
    )
    if (r.rowCount === 0) {
      return NextResponse.json({ companyName: '', logo: null })
    }
    return NextResponse.json({
      companyName: r.rows[0].name || '',
      logo: r.rows[0].logo || null,
    })
  } catch (error) {
    console.error('[branding GET]', error)
    return NextResponse.json({ companyName: '', logo: null, error: 'Failed to load branding' }, { status: 500 })
  }
}

// PUT — save branding. Body: { companyName?: string, logo?: string | null }
// logo should be a data URL: "data:image/png;base64,..." (or null to clear)
export async function PUT(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const csrf = checkCsrf(request)
    if (!csrf.allow) return csrf.response!

    const body = await request.json()

    // Guardrails: logo must be a data URL and reasonably sized (< 500KB base64 → ~375KB image)
    let logo: string | null = null
    if (body.logo !== undefined && body.logo !== null) {
      const raw = String(body.logo)
      if (raw.length > 700_000) {
        return NextResponse.json({ error: 'Logo too large (max ~500KB)' }, { status: 400 })
      }
      if (!/^data:image\/(png|jpe?g|svg\+xml|webp|gif);base64,/.test(raw)) {
        return NextResponse.json({ error: 'Logo must be a base64 data URL (png/jpg/svg/webp/gif)' }, { status: 400 })
      }
      logo = raw
    } else if (body.logo === null) {
      logo = null
    }

    const companyName = body.companyName !== undefined
      ? String(body.companyName).trim().slice(0, 120)
      : undefined

    // Build update dynamically — only fields provided
    const sets: string[] = []
    const values: any[] = []
    let i = 1
    if (companyName !== undefined) { sets.push(`name = $${i++}`); values.push(companyName || 'Organization') }
    if (logo !== undefined) { sets.push(`logo = $${i++}`); values.push(logo) }
    if (sets.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    sets.push(`"updatedAt" = NOW()`)
    values.push(session.organizationId)

    const result = await pool.query(
      `UPDATE "Organization" SET ${sets.join(', ')} WHERE id = $${i} RETURNING name, logo`,
      values
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Organization not found' }, { status: 404 })

    return NextResponse.json({
      companyName: result.rows[0].name,
      logo: result.rows[0].logo,
    })
  } catch (error) {
    console.error('[branding PUT]', error)
    return NextResponse.json({ error: 'Failed to save branding: ' + (error as Error).message }, { status: 500 })
  }
}