import { pool } from '@/lib/wavecore/db'
import { createNotification } from './notifications'

export async function requestReview(params: {
  buyerId: string
  listingId: number
  listingTitle: string
  sellerName?: string
}): Promise<void> {
  try {
    const existing = await pool.query(
      `SELECT 1 FROM "MarketplaceReview" WHERE "listingId" = $1 AND "reviewerId" = $2 LIMIT 1`,
      [params.listingId, params.buyerId]
    )
    if (existing.rows.length > 0) return

    await createNotification({
      userId: params.buyerId,
      type: 'new_review',
      title: 'How was your purchase?',
      body: `Leave a review for "${params.listingTitle}" to help other buyers`,
      link: `/marketplace/listing/${params.listingId}#reviews`,
    })
  } catch (err: any) {
    console.error('[requestReview] failed:', err?.message)
  }
}

export async function requestReviewsForOrder(orderId: string): Promise<void> {
  try {
    const res = await pool.query(
      `SELECT
         o."buyerId",
         oi."listingId",
         COALESCE(oi.title, ml.title, 'item') AS "listingTitle"
       FROM "MarketplaceOrder" o
       JOIN "MarketplaceOrderItem" oi ON oi."orderId" = o.id
       LEFT JOIN "MarketplaceListing" ml ON ml.id = oi."listingId"
       WHERE o.id = $1 AND oi."listingId" IS NOT NULL`,
      [orderId]
    )
    for (const row of res.rows) {
      await requestReview({
        buyerId: row.buyerId,
        listingId: row.listingId,
        listingTitle: row.listingTitle,
      })
    }
  } catch (err: any) {
    console.error('[requestReviewsForOrder] failed:', err?.message)
  }
}