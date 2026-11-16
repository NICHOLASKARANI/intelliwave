import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const docRes = await pool.query(
      `SELECT id FROM "Document" WHERE id = $1 AND "organizationId" = $2 LIMIT 1`,
      [params.id, session.organizationId]
    )
    if (docRes.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const result = await pool.query(
      `SELECT * FROM "DocumentVersion" WHERE "documentId" = $1 ORDER BY "versionNumber" DESC`,
      [params.id]
    )
    return NextResponse.json({ versions: result.rows })
  } catch (err) {
    console.error('[versions GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const docRes = await pool.query(
      `SELECT id, "fileName", version FROM "Document" WHERE id = $1 AND "organizationId" = $2 LIMIT 1`,
      [params.id, session.organizationId]
    )
    if (docRes.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const body = await req.json()
    const { fileName, fileSize, fileUrl, blobKey, notes } = body

    if (!fileName || !fileUrl) {
      return NextResponse.json({ error: 'fileName and fileUrl required' }, { status: 400 })
    }

    const newVersionNumber = (docRes.rows[0].version || 1) + 1
    const crypto = require('crypto')
    const versionId = crypto.randomUUID()

    // Insert version
    await pool.query(
      `INSERT INTO "DocumentVersion"
        (id, "documentId", "versionNumber", "fileName", "fileSize", "fileUrl", "blobKey",
         "uploadedById", "uploadedByName", notes, "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, NOW())`,
      [versionId, params.id, newVersionNumber, fileName, Number(fileSize) || 0, fileUrl, blobKey || null,
       session.userId, session.name || 'User', notes || null]
    )

    // Update parent document
    await pool.query(
      `UPDATE "Document"
       SET "fileName" = $1, "fileUrl" = $2, "blobKey" = $3, "fileSize" = $4,
           version = $5, "updatedAt" = NOW()
       WHERE id = $6`,
      [fileName, fileUrl, blobKey || null, Number(fileSize) || 0, newVersionNumber, params.id]
    )

    return NextResponse.json({ ok: true, versionNumber: newVersionNumber }, { status: 201 })
  } catch (err) {
    console.error('[versions POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}