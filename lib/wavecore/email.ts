import { Pool } from 'pg'

// Email provider abstraction - replace with SendGrid, Resend, or SMTP in production
// For now, store notifications in DB and log to console

interface EmailPayload {
  to: string
  subject: string
  html: string
  text: string
  organizationId?: string
  userId?: string
}

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  try {
    // Log the email (replace with actual email provider integration)
    console.log(`[EMAIL] To: ${payload.to}, Subject: ${payload.subject}`)

    // Store in database for audit trail
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.DATABASE_URL?.includes('neon.tech') ? { rejectUnauthorized: false } : undefined,
    })

    await pool.query(
      `INSERT INTO "Notification" (
        id, "userId", "organizationId", type, title, content, "isRead", "createdAt"
      ) VALUES (
        gen_random_uuid()::text, $1, $2, 'EMAIL', $3, $4, false, NOW()
      )`,
      [payload.userId || null, payload.organizationId || null, payload.subject, payload.text]
    )

    await pool.end()
    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}

// Email templates
export const EmailTemplates = {
  welcome: (name: string, orgName: string) => ({
    subject: `Welcome to WaveCore ERP, ${name}!`,
    text: `Welcome ${name}! Your organization ${orgName} has been created. Your 30-day free trial has started.`,
    html: `<h1>Welcome to WaveCore ERP!</h1><p>Hi ${name},</p><p>Your organization <strong>${orgName}</strong> is ready.</p><p>Your 30-day free trial has started.</p>`,
  }),

  passwordReset: (name: string, token: string) => ({
    subject: 'Reset your WaveCore password',
    text: `Click this link to reset your password: ${process.env.NEXTAUTH_URL || 'https://www.intelliwavve.com'}/wavecore-erp/auth/reset-password?token=${token}`,
    html: `<p>Click <a href="${process.env.NEXTAUTH_URL || 'https://www.intelliwavve.com'}/wavecore-erp/auth/reset-password?token=${token}">here</a> to reset your password.</p>`,
  }),

  invoiceCreated: (customerName: string, invoiceNumber: string, amount: number) => ({
    subject: `Invoice ${invoiceNumber} created`,
    text: `Invoice ${invoiceNumber} for ${customerName} has been created. Amount: KSh ${amount}`,
    html: `<p>Invoice <strong>${invoiceNumber}</strong> for ${customerName} has been created.</p><p>Amount: <strong>KSh ${amount}</strong></p>`,
  }),

  paymentReceived: (customerName: string, amount: number) => ({
    subject: `Payment received from ${customerName}`,
    text: `Payment of KSh ${amount} received from ${customerName}.`,
    html: `<p>Payment of <strong>KSh ${amount}</strong> received from ${customerName}.</p>`,
  }),

  subscriptionTrialEnding: (orgName: string, daysLeft: number) => ({
    subject: `Your WaveCore trial ends in ${daysLeft} days`,
    text: `${orgName}: Your free trial ends in ${daysLeft} days. Subscribe to continue using WaveCore ERP.`,
    html: `<p>${orgName}: Your free trial ends in <strong>${daysLeft} days</strong>.</p><p>Subscribe to continue using WaveCore ERP. KSh 500/month.</p>`,
  }),
}