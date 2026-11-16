import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT * FROM "Document" WHERE id = $1 AND "organizationId" = $2 LIMIT 1`,
      [params.id, session.organizationId]
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    // Version history
    const versionsRes = await pool.query(
      `SELECT id, "versionNumber", "fileName", "fileSize", "fileUrl", "uploadedByName", notes, "createdAt"
       FROM "DocumentVersion" WHERE "documentId" = $1 ORDER BY "versionNumber" DESC LIMIT 20`,
      [params.id]
    )

    return NextResponse.json({
      document: result.rows[0],
      versions: versionsRes.rows,
    })
  } catch (err) {
    console.error('[document GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const allowed = ['folderId', 'category', 'tags', 'description', 'isStarred', 'isArchived', 'isTrashed']
    const sets: string[] = []
    const values: any[] = []
    let i = 1

    for (const f of allowed) {
      if (body[f] !== undefined) {
        sets.push(`"${f}" = $${i++}`)
        values.push(body[f])
      }
    }

    if (sets.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    sets.push(`"updatedAt" = NOW()`)
    values.push(params.id)
    values.push(session.organizationId)

    const result = await pool.query(
      `UPDATE "Document" SET ${sets.join(', ')} 
       WHERE id = $${i} AND "organizationId" = $${i + 1} RETURNING *`,
      values
    )

    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ document: result.rows[0] })
  } catch (err) {
    console.error('[document PATCH]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    // Soft delete by default; hard delete only if ?hard=true
    const url = new URL(req.url)
    const hard = url.searchParams.get('hard') === 'true'

    if (hard) {
      await pool.query(
        `DELETE FROM "Document" WHERE id = $1 AND "organizationId" = $2`,
        [params.id, session.organizationId]
      )
    } else {
      await pool.query(
        `UPDATE "Document" SET "isTrashed" = true, "updatedAt" = NOW() 
         WHERE id = $1 AND "organizationId" = $2`,
        [params.id, session.organizationId]
      )
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[document DELETE]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}