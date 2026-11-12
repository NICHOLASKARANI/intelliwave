import { pool } from '@/lib/wavecore/db'
import { createNotification } from './notifications'

/**
 * Fires price-drop notifications for all active alerts on a listing.
 * Call after MarketplaceListing.price changes.
 * Idempotent within a 24h window (lastNotifiedAt dedup).
 * Multi-tenant safe: each alert's userId is globally unique.
 */
export async function notifyPriceDrop(listingId: number, newPrice: number): Promise<void> {
  try {
    const alerts = await pool.query(
      `SELECT id, "userId", "targetPrice", "lastNotifiedAt"
       FROM "WishlistPriceAlert"
       WHERE "listingId" = $1
         AND "isActive" = true
         AND "targetPrice" >= $2
         AND ("lastNotifiedAt" IS NULL OR "lastNotifiedAt" < NOW() - INTERVAL '24 hours')`,
      [listingId, newPrice]
    )

    if (alerts.rows.length === 0) return

    const listing = await pool.query(
      `SELECT title FROM "MarketplaceListing" WHERE id = $1`,
      [listingId]
    )
    const title = listing.rows[0]?.title || 'an item you saved'

    for (const alert of alerts.rows) {
      await createNotification({
        userId: alert.userId,
        type: 'price_alert',
        title: '💰 Price drop on your wishlist',
        body: `"${title}" dropped to KES ${Number(newPrice).toLocaleString()} (your target: KES ${Number(alert.targetPrice).toLocaleString()})`,
        link: `/marketplace/listing/${listingId}`,
      }).catch(() => {})

      await pool.query(
        `UPDATE "WishlistPriceAlert" SET "lastNotifiedAt" = NOW() WHERE id = $1`,
        [alert.id]
      ).catch(() => {})
    }
  } catch (err: any) {
    console.error('[notifyPriceDrop] failed:', err?.message)
  }
}

/**
 * Fires back-in-stock notifications for all users who saved a listing
 * where stock just went from 0 → >0.
 * Call after MarketplaceListing.stock changes.
 * Multi-tenant safe: saved items are per-user.
 */
export async function notifyBackInStock(listingId: number): Promise<void> {
  try {
    const savers = await pool.query(
      `SELECT DISTINCT "userId" FROM "MarketplaceSaved" WHERE "listingId" = $1`,
      [listingId]
    )
    if (savers.rows.length === 0) return

    const listing = await pool.query(
      `SELECT title FROM "MarketplaceListing" WHERE id = $1`,
      [listingId]
    )
    const title = listing.rows[0]?.title || 'an item you saved'

    for (const row of savers.rows) {
      await createNotification({
        userId: row.userId,
        type: 'stock_alert',
        title: '📦 Back in stock',
        body: `"${title}" is available again`,
        link: `/marketplace/listing/${listingId}`,
      }).catch(() => {})
    }
  } catch (err: any) {
    console.error('[notifyBackInStock] failed:', err?.message)
  }
}

/**
 * Generates a URL-safe slug from a collection name.
 * Appends 4-char hash for uniqueness.
 */
export function generateWishlistSlug(name: string): string {
  const crypto = require('crypto')
  const base = (name || 'wishlist')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 40) || 'wishlist'
  const hash = crypto.randomBytes(3).toString('hex')
  return `${base}-${hash}`
}