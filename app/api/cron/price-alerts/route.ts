export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { createNotification } from '@/lib/marketplace/notifications'

/**
 * Price Alerts Cron — runs every 6 hours
 *
 * For every active WishlistPriceAlert:
 *   - If listing.currentPrice <= alert.targetPrice
 *   - AND lastNotifiedAt is NULL or > 24 hours ago
 *   - → fire notification to user (bell)
 *   - → update lastNotifiedAt = NOW()
 *
 * Idempotent within 24h window (dedup via lastNotifiedAt).
 * Multi-tenant safe: each alert's userId is unique; each listing is globally unique.
 */
export async function GET(req: Request) {
  // Auth: Vercel cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startedAt = Date.now()
  let checked = 0
  let notified = 0
  let skipped = 0
  let failed = 0

  try {
    // Find all alerts that need evaluation (isActive + not recently notified)
    const alertsRes = await pool.query(
      `SELECT
         a.id,
         a."userId",
         a."listingId",
         a."targetPrice",
         a."originalPrice",
         l.price AS "currentPrice",
         l.title,
         l.status AS "listingStatus"
       FROM "WishlistPriceAlert" a
       JOIN "MarketplaceListing" l ON l.id = a."listingId"
       WHERE a."isActive" = true
         AND (a."lastNotifiedAt" IS NULL OR a."lastNotifiedAt" < NOW() - INTERVAL '24 hours')
         AND l.status = 'ACTIVE'
         AND l.price <= a."targetPrice"`
    )

    const alerts = alertsRes.rows

    for (const alert of alerts) {
      checked++

      try {
        // Fire notification
        await createNotification({
          userId: alert.userId,
          type: 'price_alert',
          title: '💰 Price drop alert',
          body: `"${alert.title}" dropped to KES ${Number(alert.currentPrice).toLocaleString()} — below your target of KES ${Number(alert.targetPrice).toLocaleString()}`,
          link: `/marketplace/listing/${alert.listingId}`,
        })

        // Update lastNotifiedAt (dedup window)
        await pool.query(
          `UPDATE "WishlistPriceAlert"
           SET "lastNotifiedAt" = NOW(), "originalPrice" = $1
           WHERE id = $2`,
          [Number(alert.currentPrice), alert.id]
        )

        notified++
      } catch (err: any) {
        console.error(`[price-alerts] Alert ${alert.id} failed:`, err?.message)
        failed++
      }
    }

    // Also disable alerts for listings that went inactive / deleted
    const cleanedRes = await pool.query(
      `UPDATE "WishlistPriceAlert"
       SET "isActive" = false
       WHERE "isActive" = true
         AND "listingId" NOT IN (SELECT id FROM "MarketplaceListing" WHERE status = 'ACTIVE')`
    )
    skipped = cleanedRes.rowCount || 0

    const duration = Date.now() - startedAt
    console.log(`[price-alerts] Checked ${checked} · Notified ${notified} · Cleaned ${skipped} · Failed ${failed} (${duration}ms)`)

    return NextResponse.json({
      success: true,
      checked,
      notified,
      cleaned: skipped,
      failed,
      durationMs: duration,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[price-alerts] Fatal:', error?.message)
    return NextResponse.json({
      success: false,
      error: error?.message || 'Failed',
      checked,
      notified,
      durationMs: Date.now() - startedAt,
    }, { status: 500 })
  }
}