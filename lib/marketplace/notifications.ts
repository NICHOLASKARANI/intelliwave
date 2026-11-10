// ═══════════════════════════════════════════════════════════════════════════
// MARKETPLACE NOTIFICATIONS HELPER
// Multi-tenant safe: notifications created for specific users only
// ═══════════════════════════════════════════════════════════════════════════

import { pool } from '@/lib/wavecore/db'

export type NotificationType =
  | 'new_follower'
  | 'new_order'
  | 'new_comment'
  | 'new_review'
  | 'order_status'

interface CreateNotificationParams {
  userId: string          // Recipient
  type: NotificationType
  title: string
  body: string
  link?: string          // Optional deep link (e.g., "/marketplace/orders/123")
  actorId?: string       // Who triggered it (optional)
  metadata?: Record<string, any>
}

/**
 * Create a notification for a specific user.
 * Silently fails if the recipient doesn't exist (safety).
 */
export async function createNotification(params: CreateNotificationParams): Promise<boolean> {
  const { userId, type, title, body, link, actorId, metadata } = params

  try {
    // Verify recipient exists (safety — don't notify ghosts)
    const userRes = await pool.query('SELECT id FROM "User" WHERE id = $1 LIMIT 1', [userId])
    if (userRes.rows.length === 0) {
      console.warn('[notifications] Skipping — user not found:', userId)
      return false
    }

    // Don't notify yourself (e.g., you comment on your own listing)
    if (actorId && actorId === userId) {
      return false
    }

    const crypto = require('crypto')
    const id = crypto.randomUUID()

    // Deep links and metadata are appended to content if provided
    // (schema doesn't have separate columns)
    let finalContent = body
    if (link) {
      finalContent = body + ' · ' + link
    }

    await pool.query(
      `INSERT INTO "Notification" 
       (id, "userId", "organizationId", type, title, content, "isRead", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, false, NOW())`,
      [
        id,
        userId,
        null,  // organizationId (nullable)
        type,
        title,
        finalContent,
      ]
    )

    return true
  } catch (error: any) {
    // Never throw — notifications should never break the main flow
    console.error('[notifications] Failed to create:', error?.message)
    return false
  }
}

/**
 * Notify seller about a new follower
 */
export async function notifyNewFollower(sellerId: string, followerId: string, followerName: string): Promise<void> {
  await createNotification({
    userId: sellerId,
    type: 'new_follower',
    title: '👤 New Follower',
    body: `${followerName} started following your store`,
    link: '/wavecore-erp/marketplace/seller/followers',
    actorId: followerId,
    metadata: { followerId, followerName },
  })
}

/**
 * Notify seller about a new order
 */
export async function notifyNewOrder(params: {
  sellerId: string
  buyerId: string
  buyerName: string
  orderId: string
  orderNumber: string
  itemTitle: string
  amount: number
}): Promise<void> {
  await createNotification({
    userId: params.sellerId,
    type: 'new_order',
    title: '🛒 New Order Received',
    body: `${params.buyerName} ordered "${params.itemTitle}" (Order ${params.orderNumber}) — KSh ${params.amount.toLocaleString()}`,
    link: '/wavecore-erp/marketplace/orders/' + params.orderId,
    actorId: params.buyerId,
    metadata: { orderId: params.orderId, orderNumber: params.orderNumber, amount: params.amount },
  })
}

/**
 * Notify listing owner about a new comment
 */
export async function notifyNewComment(params: {
  listingOwnerId: string
  commenterId: string
  commenterName: string
  listingId: number
  listingTitle: string
  commentPreview: string
}): Promise<void> {
  const preview = params.commentPreview.length > 100 
    ? params.commentPreview.slice(0, 100) + '...' 
    : params.commentPreview

  await createNotification({
    userId: params.listingOwnerId,
    type: 'new_comment',
    title: '💬 New Comment',
    body: `${params.commenterName} commented on "${params.listingTitle}": "${preview}"`,
    link: '/wavecore-erp/marketplace/listing/' + params.listingId,
    actorId: params.commenterId,
    metadata: { listingId: params.listingId, listingTitle: params.listingTitle },
  })
}

/**
 * Notify seller about a new review
 */
export async function notifyNewReview(params: {
  sellerId: string
  reviewerId: string
  reviewerName: string
  listingId: number
  rating: number
  reviewTitle?: string
}): Promise<void> {
  const stars = '⭐'.repeat(Math.max(1, Math.min(5, params.rating)))

  await createNotification({
    userId: params.sellerId,
    type: 'new_review',
    title: '⭐ New Review',
    body: `${params.reviewerName} left ${stars} (${params.rating}/5)${params.reviewTitle ? ': "' + params.reviewTitle + '"' : ''}`,
    link: '/wavecore-erp/marketplace/listing/' + params.listingId,
    actorId: params.reviewerId,
    metadata: { listingId: params.listingId, rating: params.rating },
  })
}

/**
 * Notify buyer about order status change
 */
export async function notifyOrderStatus(params: {
  buyerId: string
  orderId: string
  orderNumber: string
  newStatus: string
  updatedBy: string
}): Promise<void> {
  const statusMessages: Record<string, string> = {
    CONFIRMED: 'Your order has been confirmed by the seller',
    SHIPPED: 'Your order has been shipped',
    DELIVERED: 'Your order has been delivered',
    CANCELLED: 'Your order has been cancelled',
  }

  const message = statusMessages[params.newStatus] || `Order status changed to ${params.newStatus}`

  await createNotification({
    userId: params.buyerId,
    type: 'order_status',
    title: '📦 Order Update',
    body: `${message} (Order ${params.orderNumber})`,
    link: '/wavecore-erp/marketplace/orders/' + params.orderId,
    actorId: params.updatedBy,
    metadata: { orderId: params.orderId, orderNumber: params.orderNumber, status: params.newStatus },
  })
}