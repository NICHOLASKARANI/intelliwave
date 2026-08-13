export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { saveUploadedFile, isAllowedFile } from '@/lib/wavecore/uploads'
import { pool } from '@/lib/wavecore/db'

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant()

    const formData = await request.formData()
    const file = formData.get('file') as File
    const category = formData.get('category') as string || 'documents'
    const projectId = formData.get('projectId') as string || null

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file
    const check = isAllowedFile(file)
    if (!check.allowed) {
      return NextResponse.json({ error: check.error }, { status: 400 })
    }

    // Save file
    const uploadResult = await saveUploadedFile(file, session.organizationId, category)

    if (!uploadResult.success) {
      return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
    }

    // If projectId provided, verify it belongs to tenant
    if (projectId) {
      const project = await pool.query(
        'SELECT id FROM "Project" WHERE id = $1 AND "organizationId" = $2',
        [projectId, session.organizationId]
      )
      if (project.rows.length === 0) {
        return NextResponse.json({ error: 'Project not found' }, { status: 404 })
      }
    }

    // Save file record to database
    const result = await pool.query(
      `INSERT INTO "ProjectFile" (id, name, url, type, size, "projectId", "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW())
       RETURNING id, name, url, type, size`,
      [uploadResult.fileName, uploadResult.url, file.type, uploadResult.fileSize, projectId]
    )

    return NextResponse.json({
      success: true,
      file: result.rows[0],
    }, { status: 201 })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 })
  }
}