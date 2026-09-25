export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

// GET single folder + its documents
export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_READ')
    if (guard.deny) return guard.response!

    const orgId = session.organizationId

    const folderRes = await pool.query(
      `SELECT * FROM "DocumentFolder" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, orgId]
    )
    if (folderRes.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const docs = await pool.query(
      `SELECT * FROM "Document" WHERE "folderId" = $1 AND "organizationId" = $2 AND "isArchived" = false ORDER BY "createdAt" DESC LIMIT 500`,
      [params.id, orgId]
    )

    const children = await pool.query(
      `SELECT id, name, color, icon FROM "DocumentFolder" WHERE "parentFolderId" = $1 AND "organizationId" = $2 ORDER BY "sortOrder" ASC, name ASC`,
      [params.id, orgId]
    )

    return NextResponse.json({
      folder: folderRes.rows[0],
      documents: docs.rows,
      children: children.rows,
    })
  } catch (error) {
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

// PATCH: Update folder
export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const orgId = session.organizationId
    const body = await request.json()

    // Prevent parent cycle: cannot be its own parent or descendant
    if (body.parentFolderId) {
      if (body.parentFolderId === params.id) {
        return NextResponse.json({ error: 'Cannot be its own parent' }, { status: 400 })
      }
      // Walk up from proposed parent — if we reach this folder, it's a cycle
      let cursor: string | null = body.parentFolderId
      let steps = 0
      while (cursor && steps < 50) {
        const row = await pool.query(
          `SELECT "parentFolderId" FROM "DocumentFolder" WHERE id = $1 AND "organizationId" = $2`,
          [cursor, orgId]
        )
        if (row.rows.length === 0) break
        cursor = row.rows[0].parentFolderId
        if (cursor === params.id) {
          return NextResponse.json({ error: 'Would create a cycle' }, { status: 400 })
        }
        steps++
      }
    }

    const sets: string[] = []
    const values: any[] = []
    let i = 1

    for (const k of ['name', 'parentFolderId', 'color', 'icon']) {
      if (body[k] !== undefined) {
        sets.push(`"${k}" = $${i++}`)
        values.push(body[k] || null)
      }
    }
    if (body.sortOrder !== undefined) { sets.push(`"sortOrder" = $${i++}`); values.push(Number(body.sortOrder || 0)) }
    if (body.isShared !== undefined) { sets.push(`"isShared" = $${i++}`); values.push(Boolean(body.isShared)) }

    if (sets.length === 0) return NextResponse.json({ error: 'Nothing to update' }, { status: 400 })
    sets.push(`"updatedAt" = NOW()`)
    values.push(params.id, orgId)

    const result = await pool.query(
      `UPDATE "DocumentFolder" SET ${sets.join(', ')}
       WHERE id = $${i++} AND "organizationId" = $${i}
       RETURNING *`,
      values
    )
    if (result.rowCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
    return NextResponse.json({ folder: result.rows[0] })
  } catch (error) {
    console.error('Folder PATCH error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

// DELETE: Cascade — deletes subfolders; move docs up to parent or delete
export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const orgId = session.organizationId
    const { searchParams } = new URL(request.url)
    const deleteDocs = searchParams.get('deleteDocs') === 'true'

    // Get folder to find its parent
    const folderRes = await pool.query(
      `SELECT * FROM "DocumentFolder" WHERE id = $1 AND "organizationId" = $2`,
      [params.id, orgId]
    )
    if (folderRes.rows.length === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })

    const parentId = folderRes.rows[0].parentFolderId

    // Recursively collect all descendant folder IDs
    const allIds: string[] = [params.id]
    let level = [params.id]
    let guardSteps = 0

    while (level.length > 0 && guardSteps < 20) {
      const children = await pool.query(
        `SELECT id FROM "DocumentFolder" WHERE "parentFolderId" = ANY($1) AND "organizationId" = $2`,
        [level, orgId]
      )
      const childIds = children.rows.map((r: any) => r.id)
      if (childIds.length === 0) break
      allIds.push(...childIds)
      level = childIds
      guardSteps++
    }

    if (deleteDocs) {
      // Delete documents in these folders
      await pool.query(
        `DELETE FROM "Document" WHERE "folderId" = ANY($1) AND "organizationId" = $2`,
        [allIds, orgId]
      )
    } else {
      // Move documents up to parent
      await pool.query(
        `UPDATE "Document" SET "folderId" = $1, "updatedAt" = NOW()
         WHERE "folderId" = ANY($2) AND "organizationId" = $3`,
        [parentId, allIds, orgId]
      )
    }

    // Delete all folders
    await pool.query(
      `DELETE FROM "DocumentFolder" WHERE id = ANY($1) AND "organizationId" = $2`,
      [allIds, orgId]
    )

    return NextResponse.json({
      success: true,
      deletedFolders: allIds.length,
      documentsAction: deleteDocs ? 'DELETED' : 'MOVED_TO_PARENT',
    })
  } catch (error) {
    console.error('Folder DELETE error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}