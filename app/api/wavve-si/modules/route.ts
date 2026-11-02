import { NextRequest, NextResponse } from 'next/server'
import { WAVVE_SI_SYSTEMS } from '@/lib/wavve-si/modules'

export const dynamic = 'force-dynamic'

// Returns the modules a tenant can access, based on their subscription status.
// Tier -> entitled systems mapping:
// - TRIAL / ACTIVE (Monthly / 3-Month / 6-Month / 1-Year): all 100 systems
// - EXPIRED / PAST_DUE / null (not subscribed): core tier only (view-only preview)
// - Not authenticated: 401

export async function GET(req: NextRequest) {
  try {
    // Reuse the existing WaveCoreERP session endpoint via internal fetch
    const sessionRes = await fetch(new URL('/api/wavecore/auth/session', req.url), {
      headers: { cookie: req.headers.get('cookie') ?? '' },
      cache: 'no-store',
    })
    const session = await sessionRes.json()

    if (!session.authenticated) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const status = session.subscriptionStatus as string | null
    const subscribed = !!session.subscribed

    // Determine allowed tiers based on subscription
    let allowedTiers: string[] = []
    if (subscribed) {
      allowedTiers = ['core', 'expansion', 'specialist', 'advanced']
    } else if (status === 'TRIAL') {
      allowedTiers = ['core']
    } else {
      // Not subscribed — preview only
      allowedTiers = ['core']
    }

    const modules = WAVVE_SI_SYSTEMS.map(sys => ({
      id: sys.id,
      slug: sys.slug,
      name: sys.name,
      shortName: sys.shortName,
      description: sys.description,
      tier: sys.tier,
      category: sys.category,
      href: `/wavve-si/modules/${sys.slug}`,
      accessible: subscribed && allowedTiers.includes(sys.tier),
      preview: !subscribed && allowedTiers.includes(sys.tier),
    }))

    const accessibleCount = modules.filter(m => m.accessible).length

    return NextResponse.json({
      subscribed,
      subscriptionStatus: status,
      subscriptionEndDate: session.subscriptionEndDate,
      daysLeft: session.daysLeft,
      organization: session.organization,
      user: session.user,
      allowedTiers,
      accessibleCount,
      totalCount: modules.length,
      modules,
    })
  } catch (err: any) {
    console.error('[wavve-si/modules] error:', err?.message)
    return NextResponse.json({ error: 'Failed to load modules' }, { status: 500 })
  }
}