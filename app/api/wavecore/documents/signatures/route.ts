export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

// GET: List signatures (optionally for a document)
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_READ')
    if (guard.deny) return guard.response!

    const orgId = session.organizationId
    const { searchParams } = new URL(request.url)
    const documentId = searchParams.get('documentId')
    const status = searchParams.get('status')

    let sql = `SELECT * FROM "DocumentSignature" WHERE "organizationId" = $1`
    const params: any[] = [orgId]
    let idx = 2
    if (documentId) { sql += ` AND "documentId" = $${idx++}`; params.push(documentId) }
    if (status && status !== 'ALL') { sql += ` AND status = $${idx++}`; params.push(status) }
    sql += ` ORDER BY "requestedAt" DESC LIMIT 500`

    const res = await pool.query(sql, params)
    return NextResponse.json({ signatures: res.rows })
  } catch (error) {
    console.error('Signatures GET error:', error)
    return NextResponse.json({ signatures: [], error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

// POST: Request a signature
export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const orgId = session.organizationId
    const body = await request.json()
    if (!body.documentId) return NextResponse.json({ error: 'documentId required' }, { status: 400 })
    if (!body.signerEmail && !body.signerId) return NextResponse.json({ error: 'signerEmail or signerId required' }, { status: 400 })

    // Verify document belongs to this org
    const docRes = await pool.query(
      `SELECT id FROM "Document" WHERE id = $1 AND "organizationId" = $2`,
      [body.documentId, orgId]
    )
    if (docRes.rows.length === 0) return NextResponse.json({ error: 'Document not found' }, { status: 404 })

    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await pool.query(
      `INSERT INTO "DocumentSignature"
        (id, "documentId", "signerId", "signerName", "signerEmail", status,
         "requestedBy", "requestedAt", "organizationId", "createdAt")
       VALUES ($1,$2,$3,$4,$5,'PENDING',$6,NOW(),$7,NOW())
       RETURNING *`,
      [
        id, body.documentId,
        body.signerId || null,
        body.signerName || null,
        body.signerEmail || null,
        session.userId,
        orgId,
      ]
    )

    // Log activity
    await pool.query(
      `INSERT INTO "DocumentActivity" (id, "documentId", action, "userId", "userName", details, "organizationId", "createdAt")
       VALUES ($1,$2,'SIGNATURE_REQUESTED',$3,$4,$5,$6,NOW())`,
      [
        crypto.randomUUID(), body.documentId, session.userId, session.name || 'User',
        JSON.stringify({ signerEmail: body.signerEmail }), orgId,
      ]
    ).catch(() => {})

    return NextResponse.json({ signature: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Signatures POST error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

// PATCH: Sign / decline
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const orgId = session.organizationId
    const body = await request.json()
    if (!body.id) return NextResponse.json({ error: 'id required' }, { status: 400 })
    if (!body.action || !['SIGN', 'DECLINE'].includes(body.action)) {
      return NextResponse.json({ error: 'action must be SIGN or DECLINE' }, { status: 400 })
    }

    const sets: string[] = []
    const values: any[] = []
    let i = 1

    if (body.action === 'SIGN') {
      sets.push(`status = 'SIGNED'`)
      sets.push(`"signedAt" = NOW()`)
      sets.push(`"signatureData" = $${i++}`)
      values.push(body.signatureData || '')
    } else {
      sets.push(`status = 'DECLINED'`)
      sets.push(`"declineReason" = $${i++}`)
      values.push(body.declineReason || 'No reason given')
    }

    values.push(body.id, orgId)
    const result = await pool.query(
      `UPDATE "DocumentSignature" SET ${sets.join(', ')}
       WHERE id = $${i++} AND "organizationId" = $${i}
       RETURNING *`,
      values
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const crypto = require('crypto')
    await pool.query(
      `INSERT INTO "DocumentActivity" (id, "documentId", action, "userId", "userName", "organizationId", "createdAt")
       VALUES ($1,$2,$3,$4,$5,$6,NOW())`,
      [
        crypto.randomUUID(), result.rows[0].documentId,
        body.action === 'SIGN' ? 'SIGNED' : 'SIGNATURE_DECLINED',
        session.userId, session.name || 'User', orgId,
      ]
    ).catch(() => {})

    return NextResponse.json({ signature: result.rows[0] })
  } catch (error) {
    console.error('Signatures PATCH error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

// DELETE: Cancel a pending signature request
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
      `DELETE FROM "DocumentSignature" WHERE id = $1 AND "organizationId" = $2`,
      [id, orgId]
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Signatures DELETE error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}