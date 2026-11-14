import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function GET() {
  const checks: Record<string, string> = {}
  let overallOk = true

  try {
    const { PrismaClient } = await import('@prisma/client')
    const prisma = new PrismaClient()
    await prisma.$queryRawUnsafe('SELECT 1')
    await prisma.$disconnect()
    checks.database = 'connected'
  } catch (e) {
    checks.database = 'error'
    overallOk = false
  }

  return NextResponse.json(
    {
      ok: overallOk,
      service: 'intelliwavve-web',
      time: new Date().toISOString(),
      checks,
    },
    { status: overallOk ? 200 : 503 }
  )
}