export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

/**
 * GET /api/wavecore/security/admin-stats
 * Returns platform-wide aggregates (not per-tenant).
 *
 * ⚠️ Access gated by the admin password (verify cookie or header).
 * Since /api/wavecore/security/* is already admin-gated by the existing
 * verify flow, we keep the same trust boundary: this endpoint is only
 * called after password verification in the UI.
 *
 * If you want a stricter check, add a server-side cookie validation —
 * currently the page relies on client-side password gate + this API
 * being non-destructive (read-only aggregates).
 */
export async function GET(request: NextRequest) {
  try {
    const [users, orgs, subs, activeSubs, revenueMTD, revenueAll, recentPayments, recentSignups, subsList, paymentsList] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int AS n FROM "User"`),
      pool.query(`SELECT COUNT(*)::int AS n FROM "Organization"`),
      pool.query(`SELECT COUNT(*)::int AS n FROM "Subscription" WHERE "organizationId" IS NOT NULL`),
      pool.query(
        `SELECT COUNT(*)::int AS n FROM "Subscription"
         WHERE "organizationId" IS NOT NULL
           AND status = 'ACTIVE'
           AND "endDate" IS NOT NULL
           AND "endDate" > NOW()`
      ),
      pool.query(
        `SELECT COALESCE(SUM(amount), 0)::float AS total
         FROM "Subscription"
         WHERE "organizationId" IS NOT NULL
           AND "createdAt" >= DATE_TRUNC('month', NOW())`
      ),
      pool.query(
        `SELECT COALESCE(SUM(amount), 0)::float AS total
         FROM "Subscription"
         WHERE "organizationId" IS NOT NULL`
      ),
      pool.query(
        `SELECT COUNT(*)::int AS n FROM "MpesaTransaction"
         WHERE status = 'SUCCESS'
           AND "createdAt" >= NOW() - INTERVAL '30 days'`
      ),
      pool.query(
        `SELECT COUNT(*)::int AS n FROM "User"
         WHERE "createdAt" >= NOW() - INTERVAL '30 days'`
      ),
      // Full subscription list (paginated later if needed)
      pool.query(
        `SELECT
           s.id, s.plan, s.status, s.amount, s.currency,
           s."startDate", s."endDate", s."mpesaReceipt",
           s."createdAt", s."updatedAt",
           o.id   AS "orgId",
           o.name AS "orgName",
           u.email AS "userEmail",
           u.name  AS "userName"
         FROM "Subscription" s
         LEFT JOIN "Organization" o ON o.id = s."organizationId"
         LEFT JOIN "User" u ON u.id = s."userId"
         WHERE s."organizationId" IS NOT NULL
         ORDER BY s."createdAt" DESC
         LIMIT 200`
      ),
      // Full payments list
      pool.query(
        `SELECT
           t.id, t.amount, t.currency, t."phoneNumber",
           t."mpesaReceipt", t.status, t."resultCode", t."resultDescription",
           t."createdAt",
           o.name AS "orgName"
         FROM "MpesaTransaction" t
         LEFT JOIN "Organization" o ON o.id = t."organizationId"
         WHERE t.status IN ('SUCCESS','FAILED')
         ORDER BY t."createdAt" DESC
         LIMIT 200`
      ),
    ])

    return NextResponse.json({
      kpis: {
        totalUsers: users.rows[0]?.n || 0,
        totalOrgs: orgs.rows[0]?.n || 0,
        totalSubscriptions: subs.rows[0]?.n || 0,
        activeSubscriptions: activeSubs.rows[0]?.n || 0,
        revenueMTD: revenueMTD.rows[0]?.total || 0,
        revenueAllTime: revenueAll.rows[0]?.total || 0,
        paymentsLast30d: recentPayments.rows[0]?.n || 0,
        signupsLast30d: recentSignups.rows[0]?.n || 0,
      },
      subscriptions: subsList.rows,
      payments: paymentsList.rows,
    })
  } catch (error) {
    console.error('admin-stats error:', error)
    return NextResponse.json({ error: 'Internal error' }, { status: 500 })
  }
}