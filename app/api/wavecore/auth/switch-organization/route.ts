export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { pool } from '@/lib/wavecore/db'
import { getSession } from '@/lib/wavecore/auth'
import { cookies } from 'next/headers'
import crypto from 'crypto'

const switchSchema = z.object({
  organizationId: z.string().min(1),
})

export async function POST(request: NextRequest) {
  const client = await pool.connect()
  try {
    const session = await getSession()
    if (!session) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    const body = await request.json()
    const validated = switchSchema.parse(body)

    // Verify user is a member of the target organization
    const membership = await client.query(
      `SELECT o.id, o.name, o."isActive"
       FROM "_OrganizationMembers" om
       JOIN "Organization" o ON o.id = om."A"
       WHERE om."B" = $1 AND o.id = $2`,
      [session.userId, validated.organizationId]
    )

    if (membership.rows.length === 0) {
      return NextResponse.json({ error: 'Not a member of this organization' }, { status: 404 })
    }

    if (!membership.rows[0].isActive) {
      return NextResponse.json({ error: 'Organization is suspended' }, { status: 403 })
    }

    // Create new session with new org context
    const newToken = crypto.randomBytes(64).toString('hex')
    await client.query(
      `INSERT INTO "Session" (id, "sessionToken", "userId", expires)
       VALUES (gen_random_uuid()::text, $1, $2, $3)`,
      [newToken, session.userId, new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)]
    )

    // Delete old session
    const cookieStore = cookies()
    const oldToken = cookieStore.get('wavecore_session')?.value
    if (oldToken) {
      await client.query('DELETE FROM "Session" WHERE "sessionToken" = $1', [oldToken])
    }

    const response = NextResponse.json({
      success: true,
      organization: { id: membership.rows[0].id, name: membership.rows[0].name },
    })

    response.cookies.set('wavecore_session', newToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    })

    return response
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid organization' }, { status: 422 })
    }
    console.error('Switch org error:', error)
    return NextResponse.json({ error: 'Unable to switch organization' }, { status: 500 })
  } finally {
    client.release()
  }
}