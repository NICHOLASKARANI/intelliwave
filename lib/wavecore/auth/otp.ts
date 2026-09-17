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
      ? `Your WaveCore ERP verification code is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes. If you did not request this, ignore this message.`
      : `Your WaveCore verification code is ${otp}. It expires in ${OTP_TTL_MINUTES} minutes.`

  if (channel === 'email') {
    const key = process.env.RESEND_API_KEY
    if (!key) {
      // No provider configured — log to server console only (never to client)
      console.log(`[OTP][email:dev] to=${destination} otp=${otp}`)
      return { delivered: false, reason: 'Email provider not configured; OTP logged server-side only.' }
    }
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || 'WaveCore <noreply@intelliwavve.com>',
          to: [destination],
          subject: 'WaveCore ERP — Password Reset Code',
          text: message,
        }),
      })
      if (res.ok) return { delivered: true, reason: 'sent' }
      const err = await res.text()
      console.error('Resend error:', err)
      return { delivered: false, reason: 'Email send failed' }
    } catch (e) {
      console.error('Email send exception:', e)
      return { delivered: false, reason: 'Email service unavailable' }
    }
  }

  if (channel === 'sms') {
    const key = process.env.AT_API_KEY
    const user = process.env.AT_USERNAME
    if (!key || !user) {
      console.log(`[OTP][sms:dev] to=${destination} otp=${otp}`)
      return { delivered: false, reason: 'SMS provider not configured; OTP logged server-side only.' }
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
      if (res.ok) return { delivered: true, reason: 'sent' }
      return { delivered: false, reason: 'SMS send failed' }
    } catch (e) {
      console.error('SMS send exception:', e)
      return { delivered: false, reason: 'SMS service unavailable' }
    }
  }

  return { delivered: false, reason: 'Unknown channel' }
}