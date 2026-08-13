export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    const dbResult = await pool.query('SELECT 1 as healthy')

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      services: {
        database: dbResult.rows.length > 0 ? 'online' : 'error',
        api: 'online',
      },
    })
  } catch (error) {
    return NextResponse.json({
      status: 'degraded',
      timestamp: new Date().toISOString(),
      services: {
        database: 'offline',
        api: 'online',
      },
    }, { status: 503 })
  }
}