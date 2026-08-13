import { Pool } from 'pg'

interface WebhookEvent {
  organizationId: string
  event: string
  payload: any
}

let webhookPool: Pool | null = null

function getPool(): Pool {
  if (!webhookPool) {
    webhookPool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
      max: 3,
    })
  }
  return webhookPool
}

// Send webhook to all registered endpoints for an organization
export async function triggerWebhook(event: WebhookEvent): Promise<void> {
  try {
    const pool = getPool()

    // Get active webhooks for this organization and event
    const webhooks = await pool.query(
      `SELECT id, url, secret, events
       FROM "Webhook"
       WHERE "organizationId" = $1 AND "isActive" = true`,
      [event.organizationId]
    )

    for (const webhook of webhooks.rows) {
      const events = webhook.events || []
      if (events.includes('*') || events.includes(event.event)) {
        // Fire webhook async
        sendWebhookRequest(webhook.url, webhook.secret, event.event, event.payload)
          .catch(err => console.error(`Webhook ${webhook.id} failed:`, err.message))
      }
    }
  } catch (error) {
    console.error('Webhook trigger error:', error)
  }
}

async function sendWebhookRequest(url: string, secret: string, event: string, payload: any): Promise<void> {
  const signature = await generateSignature(secret, payload)

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-WaveCore-Event': event,
      'X-WaveCore-Signature': signature,
      'X-WaveCore-Timestamp': Date.now().toString(),
    },
    body: JSON.stringify({ event, payload, timestamp: new Date().toISOString() }),
  })

  if (!response.ok) {
    throw new Error(`Webhook returned ${response.status}`)
  }
}

async function generateSignature(secret: string, payload: any): Promise<string> {
  const crypto = await import('crypto')
  const body = JSON.stringify(payload)
  return crypto.createHmac('sha256', secret).update(body).digest('hex')
}