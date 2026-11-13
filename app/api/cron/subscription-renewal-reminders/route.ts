export const dynamic = 'force-dynamic'
export const maxDuration = 60

import { NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { sendEmail } from '@/lib/wavecore/email'

/**
 * Subscription Renewal Reminder Cron — runs daily at 00:00 UTC
 *
 * For every ACTIVE subscription:
 *   1. If endDate in 7, 3, or 1 days → send reminder email + bell notification
 *   2. If endDate already past → mark EXPIRED + send final email
 *
 * Dedup: we track sent reminders in the last 24 hours via a query on Notification table.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const startTime = Date.now()
  let sent7Day = 0
  let sent3Day = 0
  let sent1Day = 0
  let expiredNotices = 0
  let markedExpired = 0
  let failed = 0

  try {
    // ─── PART 1: Mark EXPIRED subscriptions ───
    const expiredRes = await pool.query(
      `SELECT s.id, s."userId", s."organizationId", s."endDate", s.plan, u.name, u.email, o.name AS "orgName"
       FROM "Subscription" s
       JOIN "User" u ON u.id = s."userId"
       JOIN "Organization" o ON o.id = s."organizationId"
       WHERE s.status = 'ACTIVE'
         AND s."endDate" IS NOT NULL
         AND s."endDate" < NOW()
         AND s."mpesaReceipt" IS NOT NULL`
    )

    for (const row of expiredRes.rows) {
      try {
        await pool.query(
          `UPDATE "Subscription" SET status = 'EXPIRED', "updatedAt" = NOW() WHERE id = $1`,
          [row.id]
        )

        if (row.email) {
          await sendEmail({
            to: row.email,
            subject: 'Your WaveCore subscription has expired',
            text: `Hi ${row.name || 'there'},\n\nYour WaveCore ERP subscription for ${row.orgName} expired on ${new Date(row.endDate).toLocaleDateString('en-KE')}.\n\nYour data is safe and preserved. Renew now to restore access:\nhttps://www.intelliwavve.com/wavecore-erp/subscription\n\nQuestions? Reply to this email or contact support@intelliwavve.com.`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
                <h1 style="color: #ef4444; font-size: 22px;">Subscription Expired</h1>
                <p>Hi ${row.name || 'there'},</p>
                <p>Your WaveCore ERP subscription for <strong>${row.orgName}</strong> expired on <strong>${new Date(row.endDate).toLocaleDateString('en-KE')}</strong>.</p>
                <p>Your data is safe and preserved. Renew now to restore access.</p>
                <p style="text-align: center; margin: 32px 0;">
                  <a href="https://www.intelliwavve.com/wavecore-erp/subscription" style="display: inline-block; padding: 14px 32px; background: #f59e0b; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Renew Subscription</a>
                </p>
                <p style="color: #6b7280; font-size: 12px;">Questions? Contact support@intelliwavve.com.</p>
              </div>
            `,
            userId: row.userId,
            organizationId: row.organizationId,
          }).catch(() => {})
        }

        // Bell notification
        await pool.query(
          `INSERT INTO "Notification" (id, "userId", "organizationId", type, title, content, "isRead", "createdAt")
           VALUES (gen_random_uuid()::text, $1, $2, 'SYSTEM', 'Subscription expired', 'Your WaveCore subscription has expired. Click to renew.', false, NOW())`,
          [row.userId, row.organizationId]
        ).catch(() => {})

        expiredNotices++
        markedExpired++
      } catch (err: any) {
        console.error(`[renewal-reminders] Expire fail for sub ${row.id}:`, err?.message)
        failed++
      }
    }

    // ─── PART 2: Send reminders at 7, 3, 1 days ───
    const upcomingRes = await pool.query(
      `SELECT
         s.id, s."userId", s."organizationId", s."endDate", s.plan, s.amount,
         u.name, u.email, o.name AS "orgName",
         EXTRACT(DAY FROM (s."endDate" - NOW()))::int AS days_left
       FROM "Subscription" s
       JOIN "User" u ON u.id = s."userId"
       JOIN "Organization" o ON o.id = s."organizationId"
       WHERE s.status = 'ACTIVE'
         AND s."endDate" IS NOT NULL
         AND s."endDate" > NOW()
         AND s."endDate" <= NOW() + INTERVAL '8 days'
         AND s."mpesaReceipt" IS NOT NULL`
    )

    for (const row of upcomingRes.rows) {
      const daysLeft = Number(row.days_left)
      // Only fire at 7, 3, 1 (with 1-day tolerance)
      let threshold: number | null = null
      if (daysLeft === 7 || daysLeft === 6) threshold = 7
      else if (daysLeft === 3 || daysLeft === 2) threshold = 3
      else if (daysLeft === 1 || daysLeft === 0) threshold = 1
      if (!threshold) continue

      // Dedup: check if we already sent this threshold's email in last 20 hours
      const dedupRes = await pool.query(
        `SELECT id FROM "Notification"
         WHERE "userId" = $1
           AND title LIKE $2
           AND "createdAt" > NOW() - INTERVAL '20 hours'
         LIMIT 1`,
        [row.userId, `Subscription expires in ${threshold} day%`]
      )
      if (dedupRes.rows.length > 0) continue

      try {
        await sendEmail({
          to: row.email,
          subject: `Your WaveCore subscription expires in ${threshold} day${threshold > 1 ? 's' : ''}`,
          text: `Hi ${row.name || 'there'},\n\nYour WaveCore ERP subscription for ${row.orgName} expires in ${threshold} day${threshold > 1 ? 's' : ''} on ${new Date(row.endDate).toLocaleDateString('en-KE')}.\n\nRenew now to keep your access uninterrupted:\nhttps://www.intelliwavve.com/wavecore-erp/subscription\n\nYour data will be preserved if you lapse, but access will be blocked until renewal.\n\nQuestions? Contact support@intelliwavve.com.`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px;">
              <div style="background: #fef3c7; border-left: 4px solid #f59e0b; padding: 16px; border-radius: 8px; margin-bottom: 24px;">
                <p style="margin: 0; font-size: 14px; font-weight: bold; color: #92400e;">⏰ Action needed</p>
              </div>
              <h1 style="color: #111827; font-size: 22px;">Your subscription expires in ${threshold} day${threshold > 1 ? 's' : ''}</h1>
              <p>Hi ${row.name || 'there'},</p>
              <p>Your WaveCore ERP subscription for <strong>${row.orgName}</strong> expires on <strong>${new Date(row.endDate).toLocaleDateString('en-KE')}</strong>.</p>
              <p>Renew now to keep your access uninterrupted. Your data will be preserved, but access will be blocked until renewal.</p>
              <p style="text-align: center; margin: 32px 0;">
                <a href="https://www.intelliwavve.com/wavecore-erp/subscription" style="display: inline-block; padding: 14px 32px; background: #f59e0b; color: white; text-decoration: none; border-radius: 8px; font-weight: bold;">Renew Now</a>
              </p>
              <p style="color: #6b7280; font-size: 12px;">Questions? Contact support@intelliwavve.com.</p>
            </div>
          `,
          userId: row.userId,
          organizationId: row.organizationId,
        }).catch(() => {})

        // Bell notification (used for dedup)
        await pool.query(
          `INSERT INTO "Notification" (id, "userId", "organizationId", type, title, content, "isRead", "createdAt")
           VALUES (gen_random_uuid()::text, $1, $2, 'SYSTEM', $3, 'Click to renew your WaveCore subscription', false, NOW())`,
          [row.userId, row.organizationId, `Subscription expires in ${threshold} day${threshold > 1 ? 's' : ''}`]
        ).catch(() => {})

        if (threshold === 7) sent7Day++
        else if (threshold === 3) sent3Day++
        else sent1Day++
      } catch (err: any) {
        console.error(`[renewal-reminders] Reminder fail for sub ${row.id}:`, err?.message)
        failed++
      }
    }

    const duration = Date.now() - startTime
    return NextResponse.json({
      success: true,
      reminders: { day7: sent7Day, day3: sent3Day, day1: sent1Day },
      expired: { marked: markedExpired, notified: expiredNotices },
      failed,
      durationMs: duration,
      timestamp: new Date().toISOString(),
    })
  } catch (error: any) {
    console.error('[renewal-reminders] Fatal:', error?.message)
    return NextResponse.json({
      success: false,
      error: error?.message || 'Failed',
      partial: { reminders: { day7: sent7Day, day3: sent3Day, day1: sent1Day }, expired: markedExpired },
    }, { status: 500 })
  }
}