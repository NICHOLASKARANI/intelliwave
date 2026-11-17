export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

interface FolderNode {
  id: string
  name: string
  parentFolderId: string | null
  color: string
  icon: string
  sortOrder: number
  documentCount: number
  children: FolderNode[]
}

// Build a tree from a flat list
function buildTree(flat: any[]): FolderNode[] {
  const map: Record<string, FolderNode> = {}
  const roots: FolderNode[] = []

  for (const f of flat) {
    map[f.id] = {
      id: f.id,
      name: f.name,
      parentFolderId: f.parentFolderId,
      color: f.color || '#6366f1',
      icon: f.icon || 'folder',
      sortOrder: Number(f.sortOrder || 0),
      documentCount: Number(f.documentCount || 0),
      children: [],
    }
  }

  for (const f of flat) {
    const node = map[f.id]
    if (f.parentFolderId && map[f.parentFolderId]) {
      map[f.parentFolderId].children.push(node)
    } else {
      roots.push(node)
    }
  }

  // Sort each level
  const sortRec = (nodes: FolderNode[]) => {
    nodes.sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
    for (const n of nodes) sortRec(n.children)
  }
  sortRec(roots)

  return roots
}

// GET: Flat list or tree
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_READ')
    if (guard.deny) return guard.response!

    const orgId = session.organizationId
    const { searchParams } = new URL(request.url)
    const mode = searchParams.get('mode') || 'tree' // 'tree' | 'flat'

    // Folders with document counts
    const foldersRes = await pool.query(
      `SELECT f.*,
              (SELECT COUNT(*) FROM "Document" d WHERE d."folderId" = f.id AND d."organizationId" = f."organizationId" AND d."isArchived" = false) AS "documentCount"
       FROM "DocumentFolder" f
       WHERE f."organizationId" = $1
       ORDER BY f."sortOrder" ASC, f.name ASC`,
      [orgId]
    )

    if (mode === 'flat') {
      return NextResponse.json({ folders: foldersRes.rows })
    }

    const tree = buildTree(foldersRes.rows)
    return NextResponse.json({ tree, totalFolders: foldersRes.rows.length })
  } catch (error) {
    console.error('Folders GET error:', error)
    return NextResponse.json({ tree: [], folders: [], totalFolders: 0, error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}

// POST: Create folder
export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const body = await request.json()
    if (!body.name || !body.name.trim()) return NextResponse.json({ error: 'Folder name required' }, { status: 400 })

    // Prevent parent folder cycles (simple check: parent must exist and be in same org)
    if (body.parentFolderId) {
      const parent = await pool.query(
        `SELECT id FROM "DocumentFolder" WHERE id = $1 AND "organizationId" = $2`,
        [body.parentFolderId, session.organizationId]
      )
      if (parent.rows.length === 0) return NextResponse.json({ error: 'Parent folder not found' }, { status: 404 })
    }

    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const result = await pool.query(
      `INSERT INTO "DocumentFolder"
        (id, name, "parentFolderId", color, icon, "sortOrder", "organizationId", "createdBy", "createdAt", "updatedAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW(),NOW())
       RETURNING *`,
      [
        id,
        body.name.trim(),
        body.parentFolderId || null,
        body.color || '#6366f1',
        body.icon || 'folder',
        Number(body.sortOrder || 0),
        session.organizationId,
        session.userId,
      ]
    )

    return NextResponse.json({ folder: result.rows[0] }, { status: 201 })
  } catch (error) {
    console.error('Folders POST error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}