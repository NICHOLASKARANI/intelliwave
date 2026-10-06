export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

/**
 * GET /api/wavecore/crm/team
 *
 * Returns the users a CRM record can be assigned to: every auth User
 * who is a member of the caller's organization. Read-only, tenant-scoped.
 *
 * Uses the Organization.members relation (User[] @relation("OrganizationMembers")).
 */
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const orgId = session.organizationId

    // _OrganizationMembers is the join table Prisma creates for the
    // implicit many-to-many relation "OrganizationMembers".
    // The exact table name is Prisma-generated; fall back to a UNION
    // query on ownerId in case the join table doesn't exist yet.
    let rows: any[] = []
    try {
      const r = await pool.query(
        `SELECT u.id, u.name, u.email, u.role
         FROM "User" u
         JOIN "_OrganizationMembers" m ON m."B" = u.id
         WHERE m."A" = $1 AND u."isActive" = TRUE
         ORDER BY u.name ASC NULLS LAST, u.email ASC`,
        [orgId]
      )
      rows = r.rows
    } catch {
      // Fallback: owner only (older installs without the join table)
      const r = await pool.query(
        `SELECT u.id, u.name, u.email, u.role
         FROM "User" u
         JOIN "Organization" o ON o."ownerId" = u.id
         WHERE o.id = $1 AND u."isActive" = TRUE
         ORDER BY u.name ASC NULLS LAST, u.email ASC`,
        [orgId]
      )
      rows = r.rows
    }

    const members = rows.map((u: any) => ({
      id: u.id,
      name: u.name || (u.email || '').split('@')[0] || 'Unnamed',
      email: u.email,
      role: u.role,
    }))

    return NextResponse.json({ members })
  } catch (error) {
    console.error('[crm/team]', error)
    return NextResponse.json({ members: [], error: 'Failed to load team' }, { status: 500 })
  }
}
