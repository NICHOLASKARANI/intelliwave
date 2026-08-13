export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant()

    return NextResponse.json({
      workflows: [],
      stats: {
        total: 0,
        active: 0,
        paused: 0,
        failed: 0,
        executionsToday: 0,
        successRate: 0,
      },
    })
  } catch (error) {
    console.error('Automation GET error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant()

    const body = await request.json()
    const { name, description, trigger, steps } = body

    if (!name) {
      return NextResponse.json({ error: 'Workflow name is required' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      workflow: {
        id: crypto.randomUUID(),
        name,
        description,
        trigger,
        status: 'draft',
        steps: steps || [],
        createdAt: new Date().toISOString(),
      },
    }, { status: 201 })
  } catch (error) {
    console.error('Automation POST error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}