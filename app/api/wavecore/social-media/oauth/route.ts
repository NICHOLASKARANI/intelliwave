export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'
import { PLATFORM_CAPABILITIES } from '@/lib/wavecore/social-capabilities'

const OAUTH_CONFIGS: Record<string, { authUrl: string; scope: string }> = {
  facebook: {
    authUrl: 'https://www.facebook.com/v21.0/dialog/oauth',
    scope: 'pages_manage_posts,pages_read_engagement,pages_show_list,instagram_basic,instagram_content_publish'
  },
  instagram: {
    authUrl: 'https://www.facebook.com/v21.0/dialog/oauth',
    scope: 'instagram_basic,instagram_content_publish'
  },
  tiktok: {
    authUrl: 'https://www.tiktok.com/v2/auth/authorize',
    scope: 'user.info.basic,video.publish'
  },
  x: {
    authUrl: 'https://x.com/i/oauth2/authorize',
    scope: 'tweet.read,tweet.write,users.read'
  }
}

export async function POST(request: NextRequest, { params }: { params: { platform: string } }) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { platform } = params
    const config = OAUTH_CONFIGS[platform]
    const capabilities = PLATFORM_CAPABILITIES[platform as keyof typeof PLATFORM_CAPABILITIES]

    if (!config || !capabilities) {
      return NextResponse.json({ error: 'Unsupported platform' }, { status: 400 })
    }

    if (!capabilities.oauth) {
      return NextResponse.json({ 
        error: 'OAuth not supported for this platform',
        requirement: 'WhatsApp requires Business API setup'
      }, { status: 400 })
    }

    const clientId = process.env[`${platform.toUpperCase()}_CLIENT_ID`]
    const redirectUri = `${process.env.NEXTAUTH_URL}/api/wavecore/social-media/oauth/callback/${platform}`
    const state = require('crypto').randomBytes(32).toString('hex')

    // Store state for validation
    await pool.query(
      `INSERT INTO "SocialOAuthState" (id, state, platform, "organizationId", "createdAt", "expiresAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, NOW(), NOW() + INTERVAL '10 minutes')`,
      [state, platform, session.organizationId]
    )

    const authUrl = `${config.authUrl}?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${state}&scope=${config.scope}&response_type=code`

    return NextResponse.json({ 
      success: true, 
      authUrl,
      platform,
      capabilities: {
        oauth: capabilities.oauth,
        publish: capabilities.publish,
        scheduling: capabilities.scheduling,
        webhooks: capabilities.webhooks,
        analytics: capabilities.analytics,
        contentTypes: capabilities.contentTypes,
        requiredPermissions: capabilities.requiredPermissions
      }
    })
  } catch (error) {
    return NextResponse.json({ error: 'OAuth initiation failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    return NextResponse.json({
      platforms: Object.entries(PLATFORM_CAPABILITIES).map(([name, caps]) => ({
        platform: name,
        ...caps,
        clientIdConfigured: !!process.env[`${name.toUpperCase()}_CLIENT_ID`]
      }))
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch platforms' }, { status: 500 })
  }
}