export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { platform: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const state = searchParams.get('state')
    const error = searchParams.get('error')
    const { platform } = params

    if (error) {
      return NextResponse.redirect(
        new URL(`/wavecore-erp/social-media?error=${encodeURIComponent(error)}`, request.url)
      )
    }

    if (!code || !state) {
      return NextResponse.redirect(
        new URL('/wavecore-erp/social-media?error=Invalid+callback', request.url)
      )
    }

    // Validate state
    const stateResult = await pool.query(
      `SELECT * FROM "SocialOAuthState" WHERE state = $1 AND platform = $2 AND "expiresAt" > NOW()`,
      [state, platform]
    )

    if (stateResult.rows.length === 0) {
      return NextResponse.redirect(
        new URL('/wavecore-erp/social-media?error=Invalid+state', request.url)
      )
    }

    const oauthState = stateResult.rows[0]

    // Exchange code for token
    const clientId = process.env[`${platform.toUpperCase()}_CLIENT_ID`]
    const clientSecret = process.env[`${platform.toUpperCase()}_CLIENT_SECRET`]
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/wavecore/social-media/oauth/callback/${platform}`

    if (!clientId || !clientSecret) {
      return NextResponse.redirect(
        new URL('/wavecore-erp/social-media?error=Credentials+not+configured', request.url)
      )
    }

    // Exchange authorization code
    let tokenResponse
    if (platform === 'facebook' || platform === 'instagram') {
      tokenResponse = await fetch(
        `https://graph.facebook.com/v21.0/oauth/access_token?client_id=${clientId}&client_secret=${clientSecret}&redirect_uri=${encodeURIComponent(redirectUri)}&code=${code}`
      )
    } else if (platform === 'tiktok') {
      tokenResponse = await fetch('https://open.tiktokapis.com/v2/oauth/token/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_key: clientId,
          client_secret: clientSecret,
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri
        })
      })
    } else if (platform === 'x') {
      const basic = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')
      tokenResponse = await fetch('https://api.x.com/2/oauth2/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${basic}`
        },
        body: new URLSearchParams({
          code,
          grant_type: 'authorization_code',
          redirect_uri: redirectUri
        })
      })
    } else {
      return NextResponse.redirect(
        new URL('/wavecore-erp/social-media?error=Unsupported+platform', request.url)
      )
    }

    const tokenData = await tokenResponse.json()

    if (!tokenData.access_token) {
      console.error('Token exchange failed:', tokenData)
      return NextResponse.redirect(
        new URL('/wavecore-erp/social-media?error=Token+exchange+failed', request.url)
      )
    }

    // Store integration
    const crypto = require('crypto')
    const integrationId = crypto.randomUUID()

    await pool.query(
      `INSERT INTO "SocialIntegration" (
        id, "organizationId", platform, "accessToken", "refreshToken",
        "tokenExpiresAt", status, "connectedAt", "lastCheckedAt", "createdAt", "updatedAt"
       ) VALUES ($1, $2, $3, $4, $5, $6, 'CONNECTED', NOW(), NOW(), NOW(), NOW())
       ON CONFLICT ("organizationId", platform) 
       DO UPDATE SET 
         "accessToken" = $4,
         "refreshToken" = $5,
         "tokenExpiresAt" = $6,
         status = 'CONNECTED',
         "updatedAt" = NOW(),
         "lastCheckedAt" = NOW()`,
      [
        integrationId,
        oauthState.organizationId,
        platform,
        tokenData.access_token,
        tokenData.refresh_token || null,
        tokenData.expires_in ? new Date(Date.now() + tokenData.expires_in * 1000) : null
      ]
    )

    // Delete used state
    await pool.query(`DELETE FROM "SocialOAuthState" WHERE state = $1`, [state])

    // Redirect with success
    return NextResponse.redirect(
      new URL(`/wavecore-erp/social-media?connected=${platform}`, request.url)
    )
  } catch (error) {
    console.error('OAuth callback error:', error)
    return NextResponse.redirect(
      new URL('/wavecore-erp/social-media?error=Callback+failed', request.url)
    )
  }
}