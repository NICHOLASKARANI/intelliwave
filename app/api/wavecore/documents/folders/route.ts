import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT f.*, 
        (SELECT COUNT(*)::int FROM "Document" d WHERE d."folderId" = f.id AND d."isTrashed" = false) as "documentCount"
       FROM "DocumentFolder" f
       WHERE f."organizationId" = $1
       ORDER BY f.name`,
      [session.organizationId]
    )

    return NextResponse.json({ folders: result.rows })
  } catch (err) {
    console.error('[folders GET]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await req.json()
    const { name, parentId, color } = body

    if (!name || name.trim().length < 1) {
      return NextResponse.json({ error: 'Folder name required' }, { status: 400 })
    }

    const crypto = require('crypto')
    const id = crypto.randomUUID()

    // Build path
    let path = name.trim()
    if (parentId) {
      const parentRes = await pool.query(
        `SELECT path FROM "DocumentFolder" WHERE id = $1 AND "organizationId" = $2 LIMIT 1`,
        [parentId, session.organizationId]
      )
      if (parentRes.rowCount! > 0) {
        path = (parentRes.rows[0].path || '') + '/' + name.trim()
      }
    }

    await pool.query(
      `INSERT INTO "DocumentFolder"
        (id, "organizationId", "parentId", name, color, path, "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW())`,
      [id, session.organizationId, parentId || null, name.trim(), color || null, path]
    )

    const result = await pool.query(`SELECT * FROM "DocumentFolder" WHERE id = $1`, [id])
    return NextResponse.json({ folder: result.rows[0] }, { status: 201 })
  } catch (err) {
    console.error('[folders POST]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const url = new URL(req.url)
    const id = url.searchParams.get('id')
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 })

    // Move documents in folder to root (folderId = null)
    await pool.query(
      `UPDATE "Document" SET "folderId" = null WHERE "folderId" = $1 AND "organizationId" = $2`,
      [id, session.organizationId]
    )

    // Delete folder
    await pool.query(
      `DELETE FROM "DocumentFolder" WHERE id = $1 AND "organizationId" = $2`,
      [id, session.organizationId]
    )

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[folders DELETE]', err)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}