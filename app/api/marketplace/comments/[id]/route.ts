export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

// DELETE: Soft delete a comment (only owner can delete their own)
export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await requireTenant(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const commentId = params.id

    // Verify comment exists and belongs to user
    const commentRes = await pool.query(
      'SELECT id, "userId" FROM "MarketplaceComment" WHERE id = $1 AND "isDeleted" = false',
      [commentId]
    )
    if (commentRes.rows.length === 0) {
      return NextResponse.json({ error: 'Comment not found' }, { status: 404 })
    }
    if (commentRes.rows[0].userId !== session.userId) {
      return NextResponse.json({ error: 'You can only delete your own comments' }, { status: 403 })
    }

    // Soft delete
    await pool.query(
      'UPDATE "MarketplaceComment" SET "isDeleted" = true, "updatedAt" = NOW() WHERE id = $1',
      [commentId]
    )

    return NextResponse.json({ success: true, message: 'Comment deleted' })
  } catch (error: any) {
    console.error('Comment DELETE error:', error?.message)
    return NextResponse.json({ error: 'Failed to delete comment' }, { status: 500 })
  }
}