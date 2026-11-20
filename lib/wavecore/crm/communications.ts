/**
 * WaveCore CRM — Communication logging.
 *
 * No external APIs. No Africa's Talking, no SMTP sends.
 * This module just records that outreach happened, so the CRM
 * has full visibility into who contacted whom and when.
 *
 * The actual sending always happens in the user's own app:
 *  - WhatsApp → wa.me redirect
 *  - Email    → mailto: redirect
 *  - Call     → tel: redirect
 *  - SMS      → user types on their own phone
 *
 * This table becomes the CRM's memory of every touchpoint.
 */
import { pool } from '@/lib/wavecore/db'

export type CommChannel = 'WHATSAPP' | 'EMAIL' | 'SMS' | 'CALL' | 'MEETING' | 'NOTE'
export type CommDirection = 'OUTBOUND' | 'INBOUND'
export type CommStatus = 'LOGGED' | 'SENT' | 'FAILED' | 'RECEIVED'

export interface LogCommunicationArgs {
  organizationId: string
  userId?: string | null
  customerId?: string | null
  contactId?: string | null
  leadId?: string | null
  opportunityId?: string | null
  channel: CommChannel
  direction: CommDirection
  subject?: string | null
  body?: string | null
  status?: CommStatus
  contactName?: string | null
}

export async function logCommunication(args: LogCommunicationArgs): Promise<string | null> {
  try {
    const res = await pool.query(
      `INSERT INTO "CommunicationLog"
         (id, "organizationId", "customerId", "contactId", "leadId", "opportunityId",
          "userId", channel, direction, subject, body, status, "contactName",
          "sentAt", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5,
               $6, $7, $8, $9, $10, $11, $12, NOW(), NOW(), NOW())
       RETURNING id`,
      [
        args.organizationId,
        args.customerId || null,
        args.contactId || null,
        args.leadId || null,
        args.opportunityId || null,
        args.userId || null,
        args.channel,
        args.direction,
        args.subject || null,
        args.body || null,
        args.status || 'LOGGED',
        args.contactName || null,
      ]
    )
    return res.rows[0]?.id || null
  } catch (e) {
    console.error('[logCommunication]', e)
    return null
  }
}