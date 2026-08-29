export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

const HUGGINGFACE_API_KEY = process.env.HUGGINGFACE_API_KEY || ''

// AI Account Categorization
async function aiCategorizeAccount(accountName: string) {
  if (!HUGGINGFACE_API_KEY) return null
  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/models/facebook/bart-large-mnli',
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${HUGGINGFACE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          inputs: accountName,
          parameters: { candidate_labels: ['Asset', 'Liability', 'Equity', 'Revenue', 'Expense'] }
        })
      }
    )
    const data = await response.json()
    if (data.labels && data.scores) {
      return data.labels[0]
    }
    return null
  } catch {
    return null
  }
}

// GET: List all accounts
export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT * FROM "ChartOfAccount" WHERE "organizationId" = $1 ORDER BY code ASC`,
      [session.organizationId]
    )

    // Calculate totals
    const totals = {
      assets: result.rows.filter(r => r.type === 'Asset').reduce((sum, r) => sum + parseFloat(r.balance || 0), 0),
      liabilities: result.rows.filter(r => r.type === 'Liability').reduce((sum, r) => sum + parseFloat(r.balance || 0), 0),
      equity: result.rows.filter(r => r.type === 'Equity').reduce((sum, r) => sum + parseFloat(r.balance || 0), 0),
      totalAccounts: result.rows.length
    }

    return NextResponse.json({ accounts: result.rows, totals })
  } catch (error) {
    return NextResponse.json({ accounts: [], totals: {} })
  }
}

// POST: Create account with AI categorization
export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const crypto = require('crypto')
    const id = crypto.randomUUID()

    // AI categorize if no type provided
    let type = body.type
    let aiCategorized = false
    if (!type) {
      type = await aiCategorizeAccount(body.name) || 'Asset'
      aiCategorized = true
    }

    const result = await pool.query(
      `INSERT INTO "ChartOfAccount" (id, code, name, type, balance, "organizationId", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW(), NOW()) RETURNING *`,
      [id, body.code, body.name, type, body.balance || 0, session.organizationId]
    )

    return NextResponse.json({ account: result.rows[0], aiCategorized }, { status: 201 })
  } catch (error) {
    return NextResponse.json({ error: 'Create failed' }, { status: 500 })
  }
}

// PUT: Update account
export async function PUT(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const result = await pool.query(
      `UPDATE "ChartOfAccount" SET name = $1, type = $2, "updatedAt" = NOW() WHERE id = $3 AND "organizationId" = $4 RETURNING *`,
      [body.name, body.type, body.id, session.organizationId]
    )
    return NextResponse.json({ account: result.rows[0] })
  } catch (error) {
    return NextResponse.json({ error: 'Update failed' }, { status: 500 })
  }
}

// DELETE: Delete account
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    await pool.query(`DELETE FROM "ChartOfAccount" WHERE id = $1 AND "organizationId" = $2`, [id, session.organizationId])
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 })
  }
}