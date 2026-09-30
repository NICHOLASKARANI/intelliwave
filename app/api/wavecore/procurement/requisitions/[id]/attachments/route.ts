export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement, logProcurementEvent, procurementHandler } from '@/lib/wavecore/procurement-guard'

const MAX_BYTES = 5 * 1024 * 1024  // 5 MB
const ALLOWED_CATEGORIES = ['QUOTATION', 'SPECIFICATION', 'COMPLIANCE', 'OTHER']

/**
 * GET /api/wavecore/procurement/requisitions/[id]/attachments
 * Returns metadata only (not the base64 payload).
 */
export const GET = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'READ')
  const reqId = ctx.params.id

  const r = await pool.query(
    `SELECT id, "fileName", "fileSize", "mimeType", category, notes,
            "uploadedBy", "uploadedByName", "createdAt"
     FROM "RequisitionAttachment"
     WHERE "requisitionId" = $1 AND "organizationId" = $2
     ORDER BY "createdAt" DESC`,
    [reqId, g.organizationId]
  )

  return NextResponse.json({ attachments: r.rows })
})

/**
 * POST /api/wavecore/procurement/requisitions/[id]/attachments
 * Body (JSON):
 *   {
 *     fileName*: string,
 *     fileSize*: number,        (client-reported)
 *     mimeType?: string,
 *     category?: string,
 *     notes?: string,
 *     fileData*: string         (base64 — required)
 *   }
 */
export const POST = procurementHandler(async (request: NextRequest, ctx: { params: { id: string } }) => {
  const g = await assertProcurement(request, 'WRITE')
  const reqId = ctx.params.id

  // Verify requisition belongs to org
  const owner = await pool.query(
    `SELECT id, "requisitionNumber" FROM "PurchaseRequisition"
     WHERE id = $1 AND "organizationId" = $2`,
    [reqId, g.organizationId]
  )
  if (owner.rowCount === 0) {
    return NextResponse.json({ error: 'Requisition not found' }, { status: 404 })
  }
  const req = owner.rows[0]

  let body: any
  try { body = await request.json() } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }

  const fileName = String(body?.fileName || '').trim()
  if (!fileName) return NextResponse.json({ error: 'fileName required' }, { status: 400 })

  const fileData = String(body?.fileData || '')
  if (!fileData) return NextResponse.json({ error: 'fileData (base64) required' }, { status: 400 })

  // Estimate byte size from base64 length
  const estimatedBytes = Math.floor((fileData.length * 3) / 4)
  if (estimatedBytes > MAX_BYTES) {
    return NextResponse.json({ error: 'File too large (max 5 MB)' }, { status: 413 })
  }

  const category = ALLOWED_CATEGORIES.includes(String(body?.category || '').toUpperCase())
    ? String(body.category).toUpperCase()
    : 'OTHER'

  const crypto = require('crypto')
  const id = crypto.randomUUID()

  const ins = await pool.query(
    `INSERT INTO "RequisitionAttachment"
       (id, "organizationId", "requisitionId", "fileName", "fileSize",
        "mimeType", category, notes, "fileData",
        "uploadedBy", "uploadedByName", "createdAt", "updatedAt")
     VALUES ($1,$2,$3,$4,$5,
             $6,$7,$8,$9,
             $10,$11,NOW(),NOW())
     RETURNING id, "fileName", "fileSize", "mimeType", category, notes,
               "uploadedBy", "uploadedByName", "createdAt"`,
    [
      id, g.organizationId, reqId, fileName, estimatedBytes,
      body?.mimeType || null, category, body?.notes || null, fileData,
      g.userId, g.userName,
    ]
  )

  await logProcurementEvent(pool, {
    organizationId: g.organizationId,
    eventType: 'REQUISITION_ATTACHMENT_ADDED',
    entityType: 'PurchaseRequisition',
    entityId: reqId,
    actorId: g.userId,
    actorName: g.userName,
    summary: 'Attached ' + fileName + ' to ' + req.requisitionNumber,
    metadata: { fileName, fileSize: estimatedBytes, category },
  })

  return NextResponse.json({ attachment: ins.rows[0] }, { status: 201 })
})