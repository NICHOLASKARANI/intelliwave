export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

const attendanceSchema = z.object({
  employeeId: z.string(),
  date: z.string(),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  status: z.string().default('PRESENT'),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()

    const { searchParams } = new URL(request.url)
    const date = searchParams.get('date')

    let query = `
      SELECT a.*, e."firstName", e."lastName"
      FROM "Attendance" a
      JOIN "Employee" e ON e.id = a."employeeId"
      WHERE a."organizationId" = $1
    `
    const params: any[] = [session.organizationId]

    if (date) {
      params.push(new Date(date))
      query += ` AND a.date = $${params.length}`
    }

    query += ' ORDER BY a.date DESC LIMIT 100'

    const result = await pool.query(query, params)

    return NextResponse.json({ attendance: result.rows })
  } catch (error) {
    console.error('Attendance GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant()

    const body = await request.json()
    const validated = attendanceSchema.parse(body)

    // Verify employee belongs to tenant
    const emp = await pool.query(
      'SELECT id FROM "Employee" WHERE id = $1 AND "organizationId" = $2',
      [validated.employeeId, session.organizationId]
    )
    if (emp.rows.length === 0) {
      return NextResponse.json({ error: 'Employee not found' }, { status: 404 })
    }

    const result = await pool.query(
      `INSERT INTO "Attendance" (id, date, "checkIn", "checkOut", status, notes, "employeeId", "organizationId", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
       RETURNING id`,
      [
        new Date(validated.date),
        validated.checkIn ? new Date(validated.checkIn) : null,
        validated.checkOut ? new Date(validated.checkOut) : null,
        validated.status,
        validated.notes || null,
        validated.employeeId,
        session.organizationId,
      ]
    )

    return NextResponse.json({ success: true, attendanceId: result.rows[0].id }, { status: 201 })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validation failed' }, { status: 422 })
    }
    console.error('Attendance POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}