export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

// GET: Webhook verification (Facebook/Instagram)
export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  const { searchParams } = new URL(request.url)
  const mode = searchParams.get('hub.mode')
  const token = searchParams.get('hub.verify_token')
  const challenge = searchParams.get('hub.challenge')
  const { platform } = params

  const verifyToken = process.env[`${platform.toUpperCase()}_WEBHOOK_VERIFY_TOKEN`] || 'intelliwavve-webhook'

  if (mode === 'subscribe' && token === verifyToken) {
    return new NextResponse(challenge || '', { status: 200 })
  }

  return NextResponse.json({ error: 'Verification failed' }, { status: 403 })
}

// POST: Receive webhook events
export async function POST(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const { platform } = params
    const body = await request.json()

    // Verify signature for security
    const signature = request.headers.get('x-hub-signature-256')
    // In production, verify HMAC signature here

    // Store webhook event
    const crypto = require('crypto')
    const id = crypto.randomUUID()

    const payload = body

    // Extract organizationId from payload or mapping
    // For now, store with platform
    await pool.query(
      `INSERT INTO "SocialWebhookEvent" (id, platform, "eventType", payload, "createdAt")
       VALUES ($1, $2, $3, $4, NOW())`,
      [id, platform, body.object || 'unknown', JSON.stringify(payload)]
    )

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 })
  }
}