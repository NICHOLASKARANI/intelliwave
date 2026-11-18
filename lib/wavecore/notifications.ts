/**
 * lib/wavecore/notifications.ts
 *
 * Programmatic notification helper + preference enforcement.
 * Writes to the "Notification" table, respects "NotificationPreference"
 * per-user-per-category toggles for inApp and email channels.
 *
 * Usage:
 *   await createNotification({
 *     organizationId, userId,
 *     category: 'approval',
 *     type: 'APPROVAL_PENDING',
 *     title: 'Approval required',
 *     content: 'Invoice INV-123 needs your approval',
 *     link: '/wavecore-erp/finance/approvals',
 *   })
 */

import { pool } from '@/lib/wavecore/db'
import { sendEmail } from '@/lib/wavecore/email'

export type NotificationCategory =
  | 'approval'
  | 'invoice_overdue'
  | 'payment_received'
  | 'low_stock'
  | 'subscription'
  | 'system'

export interface CreateNotificationInput {
  organizationId: string
  userId: string
  category: NotificationCategory
  type: string
  title: string
  content?: string
  link?: string
  emailTo?: string
  emailSubject?: string
  emailHtml?: string
}

/**
 * Returns { inApp, email } for the given user/category.
 * Missing preference row = both channels enabled (safe default).
 */
export async function getNotificationPreference(
  userId: string,
  organizationId: string,
  category: NotificationCategory
): Promise<{ inApp: boolean; email: boolean }> {
  try {
    const result = await pool.query(
      `SELECT "inApp", "email" FROM "NotificationPreference"
       WHERE "userId" = $1 AND "organizationId" = $2 AND "category" = $3 LIMIT 1`,
      [userId, organizationId, category]
    )
    if (!result.rowCount || result.rowCount === 0) {
      return { inApp: true, email: true }
    }
    return { inApp: result.rows[0].inApp, email: result.rows[0].email }
  } catch (error) {
    console.error('[getNotificationPreference]', error)
    return { inApp: true, email: true }
  }
}

/**
 * Creates a notification respecting the user's category preferences.
 * - inApp:  inserts a row into "Notification"
 * - email:  delegates to sendEmail() (which also inserts an EMAIL-typed row)
 * Returns { id } of the in-app notification, or null if neither channel is enabled.
 */
export async function createNotification(
  input: CreateNotificationInput
): Promise<{ id: string } | null> {
  try {
    const pref = await getNotificationPreference(input.userId, input.organizationId, input.category)

    let notificationId: string | null = null
    if (pref.inApp) {
      const result = await pool.query(
        `INSERT INTO "Notification"
           (id, "userId", "organizationId", type, title, content, "isRead", link, "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, false, $6, NOW())
         RETURNING id`,
        [
          input.userId,
          input.organizationId,
          input.type,
          input.title,
          input.content || null,
          input.link || null,
        ]
      )
      notificationId = result.rows[0]?.id || null
    }

    if (pref.email && input.emailTo) {
      await sendEmail({
        to: input.emailTo,
        subject: input.emailSubject || input.title,
        text: input.content || input.title,
        html: input.emailHtml || `<p>${input.content || input.title}</p>`,
        userId: input.userId,
        organizationId: input.organizationId,
      })
    }

    return notificationId ? { id: notificationId } : null
  } catch (error) {
    console.error('[createNotification]', error)
    return null
  }
}

/**
 * Idempotent: ensures every category has a preference row for this user.
 * Called when a user opens the preferences page so they always see 6 toggles.
 */
export async function ensurePreferenceRows(userId: string, organizationId: string): Promise<void> {
  const categories: NotificationCategory[] = [
    'approval',
    'invoice_overdue',
    'payment_received',
    'low_stock',
    'subscription',
    'system',
  ]
  for (const cat of categories) {
    try {
      await pool.query(
        `INSERT INTO "NotificationPreference" ("userId", "organizationId", "category", "inApp", "email")
         VALUES ($1, $2, $3, true, true)
         ON CONFLICT ("userId", "organizationId", "category") DO NOTHING`,
        [userId, organizationId, cat]
      )
    } catch (error) {
      console.error('[ensurePreferenceRows]', cat, error)
    }
  }
}