import { pool } from './db'

export async function checkSubscription(organizationId: string): Promise<boolean> {
  try {
    const result = await pool.query(
      `SELECT status, "expiresAt" FROM "Subscription"
       WHERE "organizationId" = $1 AND status = 'ACTIVE'
       ORDER BY "createdAt" DESC LIMIT 1`,
      [organizationId]
    )

    if (result.rows.length === 0) return false

    const sub = result.rows[0]
    const isActive = sub.status === 'ACTIVE' && new Date(sub.expiresAt) > new Date()

    if (!isActive) {
      // Mark as expired if past date
      if (new Date(sub.expiresAt) <= new Date()) {
        await pool.query(
          `UPDATE "Subscription" SET status = 'EXPIRED' WHERE id = $1`,
          [sub.id]
        )
      }
      return false
    }

    return true
  } catch (error) {
    console.error('Subscription check error:', error)
    return false
  }
}

export function getSubscriptionAmount(): number {
  return 500 // KSH
}

export function getSubscriptionCurrency(): string {
  return 'KES'
}