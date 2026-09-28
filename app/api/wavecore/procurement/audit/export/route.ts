export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { assertProcurement } from '@/lib/wavecore/procurement-guard'

function escCsv(v: any): string {
  if (v === null || v === undefined) return ''
  const s = String(v)
  if (/[",\n\r]/.test(s)) return '"' + s.replace(/"/g, '""') + '"'
  return s
}

/**
 * GET /api/wavecore/procurement/audit/export
 * Same filters as /audit. Returns CSV. Caps at 10,000 rows.
 */
export async function GET(request: NextRequest) {
  try {
    const g = await assertProcurement(request, 'EXPORT')
    const { searchParams } = new URL(request.url)

    const q = (searchParams.get('q') || '').trim()
    const eventType = searchParams.get('eventType')
    const entityType = searchParams.get('entityType')
    const entityId = searchParams.get('entityId')
    const actorId = searchParams.get('actorId')
    const fromDate = searchParams.get('fromDate')
    const toDate = searchParams.get('toDate')

    const where: string[] = ['"organizationId" = $1']
    const params: any[] = [g.organizationId]

    if (q) {
      params.push('%' + q + '%')
      const n = params.length
      where.push('(summary ILIKE $' + n + ' OR "actorName" ILIKE $' + n + ' OR "eventType" ILIKE $' + n + ')')
    }
    if (eventType) {
      const types = String(eventType).split(',').map(s => s.trim().toUpperCase()).filter(Boolean)
      if (types.length > 0) {
        params.push(types)
        where.push('"eventType" = ANY($' + params.length + '::text[])')
      }
    }
    if (entityType) { params.push(entityType); where.push('"entityType" = $' + params.length) }
    if (entityId) { params.push(entityId); where.push('"entityId" = $' + params.length) }
    if (actorId) { params.push(actorId); where.push('"actorId" = $' + params.length) }
    if (fromDate) { params.push(fromDate); where.push('"createdAt" >= $' + params.length + '::timestamp') }
    if (toDate) { params.push(toDate); where.push('"createdAt" <= ($' + params.length + '::timestamp + interval \'1 day\')') }

    const whereSQL = where.join(' AND ')

    const r = await pool.query(
      `SELECT "createdAt", "eventType", "entityType", "entityId",
              "actorId", "actorName", summary, metadata
       FROM "ProcurementEvent"
       WHERE ${whereSQL}
       ORDER BY "createdAt" DESC
       LIMIT 10000`,
      params
    )

    const header = ['Timestamp','EventType','EntityType','EntityId','ActorId','ActorName','Summary','Metadata'].join(',')
    const rows = r.rows.map((x: any) => [
      escCsv(new Date(x.createdAt).toISOString()),
      escCsv(x.eventType),
      escCsv(x.entityType),
      escCsv(x.entityId),
      escCsv(x.actorId),
      escCsv(x.actorName),
      escCsv(x.summary),
      escCsv(x.metadata ? JSON.stringify(x.metadata) : ''),
    ].join(',')).join('\n')

    const csv = header + '\n' + rows + '\n'
    const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)

    return new NextResponse(csv, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="procurement-audit-${stamp}.csv"`,
        'Cache-Control': 'no-store',
      },
    })
  } catch (err) {
    if (err && (err as any).response) return (err as any).response
    console.error('[audit-export]', err)
    return NextResponse.json({ error: 'Export failed' }, { status: 500 })
  }
}