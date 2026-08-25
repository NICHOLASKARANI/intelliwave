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

    // Delete related data - use safe approach with try/catch for each
    const tables = [
      { table: 'Account', column: 'userId' },
      { table: 'Session', column: 'userId' },
      { table: 'SecuritySession', column: 'userId' },
      { table: 'MarketplaceListing', column: 'sellerId' },
      { table: 'MarketplaceConversation', column: 'buyerId' },
      { table: 'MarketplaceConversation', column: 'sellerId' },
      { table: 'MarketplaceMessage', column: 'senderId' },
      { table: 'MarketplaceSaved', column: 'userId' },
      { table: 'AuditLog', column: 'userId' },
      { table: 'Subscription', column: 'userId' },
      { table: 'UserProfile', column: 'userId' },
    ]

    for (const item of tables) {
      try {
        await pool.query(`DELETE FROM "${item.table}" WHERE "${item.column}" = $1`, [id])
      } catch (err) {
        // Skip if table or column doesn't exist
        console.log(`Skipping ${item.table}.${item.column}: ${(err as Error).message}`)
      }
    }
    
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