export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT * FROM "Activity" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, session.organizationId]
    )

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Activity not found' }, { status: 404 })
    }

    const activity = result.rows[0]

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Activity - ${activity.subject || activity.type}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #2563eb; padding-bottom: 20px; }
          .company { font-size: 24px; font-weight: bold; color: #2563eb; }
          .card { background: #f9fafb; border-radius: 15px; padding: 30px; }
          .field { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
          .label { font-weight: bold; color: #6b7280; }
          .value { font-weight: bold; color: #111827; }
          .footer { margin-top: 40px; text-align: center; font-size: 12px; color: #6b7280; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="company">IntelliWavve</div>
          <div style="font-size: 14px; color: #6b7280;">Activity Record</div>
        </div>

        <div class="card">
          <h2 style="text-align: center; color: #2563eb;">${activity.subject || activity.type}</h2>
          
          <div class="field">
            <span class="label">Type</span>
            <span class="value">${activity.type || 'N/A'}</span>
          </div>
          <div class="field">
            <span class="label">Description</span>
            <span class="value">${activity.description || 'N/A'}</span>
          </div>
          <div class="field">
            <span class="label">Priority</span>
            <span class="value">${activity.priority || 'N/A'}</span>
          </div>
          <div class="field">
            <span class="label">Created</span>
            <span class="value">${new Date(activity.createdAt).toLocaleDateString('en-KE')}</span>
          </div>
        </div>

        <div class="footer">
          This is a system-generated activity record from IntelliWavve ERP.<br>
          Generated: ${new Date().toLocaleString('en-KE')}
        </div>

        <script>window.print();</script>
      </body>
      </html>
    `

    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Content-Disposition': `inline; filename="activity-${activity.subject || activity.id.substring(0, 8)}.html"`
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'PDF failed' }, { status: 500 })
  }
}