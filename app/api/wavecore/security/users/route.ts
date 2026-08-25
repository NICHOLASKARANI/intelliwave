export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function GET(req: NextRequest) {
  try {
    const result = await pool.query(
      `SELECT id, name, email, "createdAt", 0 as "riskScore" FROM "User" ORDER BY "createdAt" DESC LIMIT 200`
    )

    return NextResponse.json({ users: result.rows })
  } catch (error) {
    console.error('Security users error:', error)
    return NextResponse.json({ users: [] })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ error: 'User ID required' }, { status: 400 })
    }

    // Delete user's related data first
    await pool.query(`DELETE FROM "Account" WHERE "userId" = $1`, [id])
    await pool.query(`DELETE FROM "Session" WHERE "userId" = $1`, [id])
    await pool.query(`DELETE FROM "SecuritySession" WHERE "userId" = $1`, [id])
    await pool.query(`DELETE FROM "MarketplaceListing" WHERE "sellerId" = $1`, [id])
    await pool.query(`DELETE FROM "MarketplaceConversation" WHERE "buyerId" = $1 OR "sellerId" = $1`, [id])
    await pool.query(`DELETE FROM "MarketplaceMessage" WHERE "senderId" = $1 OR "receiverId" = $1`, [id])
    await pool.query(`DELETE FROM "MarketplaceSaved" WHERE "userId" = $1`, [id])
    await pool.query(`DELETE FROM "AuditLog" WHERE "userId" = $1`, [id])
    
    // Finally delete the user
    const result = await pool.query(`DELETE FROM "User" WHERE id = $1 RETURNING id, email`, [id])

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ success: true, deletedUser: result.rows[0] })
  } catch (error) {
    console.error('Delete user error:', error)
    return NextResponse.json({ error: 'Failed to delete user: ' + (error as Error).message }, { status: 500 })
  }
}