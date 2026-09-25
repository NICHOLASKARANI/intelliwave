export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

const VALID_PERMISSIONS = ['VIEW', 'EDIT', 'DOWNLOAD', 'FULL']

// GET: List shares for a document
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_READ')
    if (guard.deny) return guard.response!

    const orgId = session.organizationId
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')

    let sql = `SELECT * FROM "DocumentShare" WHERE "organizationId" = $1`
    const params: any[] = [orgId]
    if (documentId) { sql += ` AND "documentId" = $2`; params.push(documentId) }
    sql += ` ORDER BY "createdAt" DESC LIMIT 500`

    const res = await pool.query(sql, params)
    return NextResponse.json({ shares: res.rows })
  } catch (error) {
    console.error('Shares GET error:', error)
    return NextResponse.json({ shares: [], error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

// POST: Create share (link or user-based)
export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const orgId = session.organizationId
    const body = await request.json()
    if (!body.documentId) return NextResponse.json({ error: 'documentId required' }, { status: 400 })

    // Verify document belongs to this org
    const docRes = await pool.query(
      `SELECT id, name FROM "Document" WHERE id = $1 AND "organizationId" = $2`,
      [body.documentId, orgId]
    )
    if (docRes.rows.length === 0) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    const permission = VALID_PERMISSIONS.includes(body.permission) ? body.permission : 'VIEW'
    const crypto = require('crypto')
    const id = crypto.randomUUID()

    // Generate share token for link-based sharing
    const shareToken = body.createLink !== false ? crypto.randomBytes(16).toString('hex') : null

    const result = await pool.query(
      `INSERT INTO "DocumentShare"
        (id, "documentId", "sharedWithUserId", "sharedWithEmail", permission, "shareToken", "expiresAt",
         "isActive", "organizationId", "sharedBy", "sharedByName", "createdAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,true,$8,$9,$10,NOW())
       RETURNING *`,
      [
        id,
        body.documentId,
        body.sharedWithUserId || null,
        body.sharedWithEmail || null,
        permission,
        shareToken,
        body.expiresAt || null,
        orgId,
        session.userId,
        session.name || 'User',
      ]
    )

    // Log activity
    await pool.query(
      `INSERT INTO "DocumentActivity" (id, "documentId", action, "userId", "userName", details, "organizationId", "createdAt")
       VALUES ($1,$2,'SHARED',$3,$4,$5,$6,NOW())`,
      [
        crypto.randomUUID(),
        body.documentId,
        session.userId,
        session.name || 'User',
        JSON.stringify({ permission, sharedWithEmail: body.sharedWithEmail || null, hasLink: !!shareToken }),
        orgId,
      ]
    ).catch(() => {})

    return NextResponse.json({
      share: result.rows[0],
      shareUrl: shareToken ? '/shared/' + shareToken : null,
    }, { status: 201 })
  } catch (error) {
    console.error('Shares POST error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

// PATCH: Update share (permission, expiry, active)
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const orgId = session.organizationId
    const body = await request.json()
    if (!body.id) return NextResponse.json({ error: 'Share id required' }, { status: 400 })

    const sets: string[] = []
    const values: any[] = []
    let i = 1

    for (const k of ['permission', 'sharedWithEmail', 'sharedWithUserId']) {
      if (body[k] !== undefined) { sets.push(`"${k}" = $${i++}`); values.push(body[k] || null) }
    }
    if (body.expiresAt !== undefined) { sets.push(`"expiresAt" = $${i++}`); values.push(body.expiresAt || null) }
    if (body.isActive !== undefined) { sets.push(`"isActive" = $${i++}`); values.push(Boolean(body.isActive)) }

    if (sets.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    values.push(body.id, orgId)

    const result = await pool.query(
      `UPDATE "DocumentShare" SET ${sets.join(', ')}
       WHERE id = $${i++} AND "organizationId" = $${i}
       RETURNING *`,
      values
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ share: result.rows[0] })
  } catch (error) {
    console.error('Shares PATCH error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

// DELETE: Revoke share
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const orgId = session.organizationId
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    const result = await pool.query(
      `DELETE FROM "DocumentShare" WHERE id = $1 AND "organizationId" = $2`,
      [id, orgId]
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Shares DELETE error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}