import crypto from 'crypto'
import { pool } from '../db'

export const OTP_TTL_MINUTES = 10
export const OTP_MAX_ATTEMPTS = 5
export const OTP_RESEND_COOLDOWN_SECONDS = 60
export const OTP_REQUEST_RATE_LIMIT = 5
export const OTP_RATE_LIMIT_WINDOW_MINUTES = 60

/**
 * Cryptographically secure 6-digit OTP (000000–999999).
 * Uses crypto.randomInt (CSPRNG) — never Math.random().
 */
export function generateOtp(): string {
  return crypto.randomInt(100000, 1000000).toString()
}

/**
 * SHA-256 hash of the OTP. We never store plaintext OTPs.
 */
export function hashOtp(otp: string): string {
  return crypto.createHash('sha256').update(otp).digest('hex')
}

/**
 * Mask email / phone for UI display, e.g. "ni****@gmail.com" or "+254•••493".
 */
export function maskDestination(channel: 'email' | 'sms', destination: string): string {
  if (!destination) return ''
  if (channel === 'email') {
    const [local, domain] = destination.split('@')
    if (!domain) return destination
    const visible = local.slice(0, 2)
    return `${visible}${'*'.repeat(Math.max(2, local.length - 2))}@${domain}`
  }
  const digits = destination.replace(/\D/g, '')
  return digits.length >= 5 ? `+${digits.slice(0, 3)}•••${digits.slice(-3)}` : destination
}

/**
 * Audit log writer — never throws.
 */
export async function logAuthEvent(
  userId: string | null,
  event: string,
  ipAddress: string | null,
  userAgent: string | null,
  metadata?: Record<string, any>
): Promise<void> {
  try {
    const crypto = require('crypto')
    await pool.query(
      `INSERT INTO "AuthAuditLog" (id, "userId", event, "ipAddress", "userAgent", metadata, "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [crypto.randomUUID(), userId, event, ipAddress, userAgent, metadata ? JSON.stringify(metadata) : null]
    )
  } catch (err) {
    console.error('Audit log write failed:', err)
  }
}

/**
 * Delivery layer: send OTP via email/SMS provider if configured, otherwise log to console.
 * Because providers are optional, we do NOT return the OTP to the caller.
 */
export async function deliverOtp(
  channel: 'email' | 'sms',
  destination: string,
  otp: string,
  userName: string
): Promise<{ delivered: boolean; reason: string }> {
  const message =
    channel === 'email'
      ? `Hi ${userName},\n\nYour WaveCore ERP verification code is: ${otp}\n\nThis code expires in ${OTP_TTL_MINUTES} minutes. If you did not request this, ignore this email.`
      : `Your WaveCore verification code is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes.`

  if (channel === 'email') {
    const hasSMTP = !!(process.env.SMTP_HOST || process.env.SMTP_USER)

    if (hasSMTP) {
      try {
        const { sendEmail } = await import('../email')
        const html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; max-width: 560px; margin: 0 auto; padding: 24px; background: #ffffff;">
            <div style="text-align: center; padding-bottom: 24px; border-bottom: 2px solid #f59e0b; margin-bottom: 32px;">
              <h1 style="margin: 0; color: #f59e0b; font-size: 24px; font-weight: 800;">IntelliWavve</h1>
              <p style="margin: 4px 0 0 0; color: #6b7280; font-size: 12px;">WaveCore ERP</p>
            </div>
            <h2 style="color: #111827; font-size: 20px; margin: 0 0 8px 0;">Password Reset Verification</h2>
            <p style="color: #374151; line-height: 1.6;">Hi ${userName},</p>
            <p style="color: #374151; line-height: 1.6;">Use the code below to reset your WaveCore password. This code expires in <strong>${OTP_TTL_MINUTES} minutes</strong>.</p>
            <div style="background: #f3f4f6; border-left: 4px solid #f59e0b; border-radius: 8px; padding: 24px; text-align: center; margin: 24px 0;">
              <p style="margin: 0; color: #6b7280; font-size: 11px; text-transform: uppercase; letter-spacing: 1px; font-weight: 700;">Your verification code</p>
              <p style="margin: 8px 0 0 0; color: #111827; font-family: monospace; font-size: 36px; font-weight: 800; letter-spacing: 8px;">${otp}</p>
            </div>
            <p style="color: #6b7280; font-size: 13px; line-height: 1.6;">If you did not request this code, you can safely ignore this email.</p>
            <div style="margin-top: 32px; padding-top: 24px; border-top: 1px solid #e5e7eb; text-align: center; color: #9ca3af; font-size: 11px;">
              IntelliWavve WaveCore ERP<br>
              Questions? Contact support@intelliwavve.com
            </div>
          </div>
        `
        const ok = await sendEmail({
          to: destination,
          subject: 'Your WaveCore password reset code',
          text: message,
          html,
        })
        if (ok) return { delivered: true, reason: 'sent via SMTP' }
        return { delivered: false, reason: 'SMTP send failed' }
      } catch (err: any) {
        console.error('[OTP] SMTP send failed:', err?.message)
      }
    }

    const resendKey = process.env.RESEND_API_KEY
    if (resendKey) {
      try {
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${resendKey}` },
          body: JSON.stringify({
            from: process.env.RESEND_FROM_EMAIL || 'WaveCore <noreply@intelliwavve.com>',
            to: [destination],
            subject: 'Your WaveCore password reset code',
            text: message,
          }),
        })
        if (res.ok) return { delivered: true, reason: 'sent via Resend' }
      } catch (e) {
        console.error('[OTP] Resend failed:', e)
      }
    }

    console.log(`[OTP][email:dev] to=${destination} otp=${otp}`)
    return { delivered: false, reason: 'No email provider configured. Configure SMTP_HOST/SMTP_USER/SMTP_PASS.' }
  }

  if (channel === 'sms') {
    const key = process.env.AT_API_KEY
    const user = process.env.AT_USERNAME
    if (!key || !user) {
      console.log(`[OTP][sms:dev] to=${destination} otp=${otp}`)
      return { delivered: false, reason: 'SMS provider not configured' }
    }
    try {
      const params = new URLSearchParams()
      params.append('username', user)
      params.append('to', destination)
      params.append('message', message)
      if (process.env.AT_SENDER_ID) params.append('from', process.env.AT_SENDER_ID)
      const res = await fetch('https://api.africastalking.com/version1/messaging', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded', apiKey: key, Accept: 'application/json' },
        body: params.toString(),
      })
      if (res.ok) return { delivered: true, reason: 'sent via SMS' }
      return { delivered: false, reason: 'SMS send failed' }
    } catch (e) {
      console.error('[OTP] SMS send failed:', e)
      return { delivered: false, reason: 'SMS service unavailable' }
    }
  }

  return { delivered: false, reason: 'Unknown channel' }
}