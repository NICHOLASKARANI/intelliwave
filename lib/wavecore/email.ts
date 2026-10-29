import nodemailer from 'nodemailer'
import { pool } from '@/lib/wavecore/db'

interface EmailPayload {
  to: string
  subject: string
  text: string
  html: string
  userId?: string
  organizationId?: string
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendEmail(payload: EmailPayload): Promise<boolean> {
  try {
    // 1. Save to DB Notification
    await pool.query(
      `INSERT INTO "Notification" (id, "userId", "organizationId", type, title, content, "isRead", "createdAt")
       VALUES (gen_random_uuid()::text, $1, $2, 'EMAIL', $3, $4, false, NOW())`,
      [payload.userId || null, payload.organizationId || null, payload.subject, payload.text]
    )

    // 2. Send actual SMTP email
    if (process.env.SMTP_USER && process.env.SMTP_PASS) {
      await transporter.sendMail({
        from: `"IntelliWavve" <${process.env.SMTP_USER}>`,
        to: payload.to,
        subject: payload.subject,
        text: payload.text,
        html: payload.html,
      })
    }

    return true
  } catch (error) {
    console.error('Email send error:', error)
    return false
  }
}
export const EmailTemplates = {
  welcome: (name: string, orgName: string) => ({
    subject: `Welcome to WaveCore ERP, ${name}!`,
    text: `Welcome ${name}! Your organization ${orgName} has been created. Your 30-day free trial has started.`,
    html: `<h1>Welcome to WaveCore ERP!</h1><p>Hi ${name},</p><p>Your organization <strong>${orgName}</strong> is ready.</p><p>Your <strong>30-day free trial</strong> has started.</p><p>After your trial, it's KSh 500/month.</p>`,
  }),

  passwordReset: (name: string, resetUrl: string) => ({
    subject: 'Reset your WaveCore password',
    text: `Click this link to reset your password: ${resetUrl}`,
    html: `<p>Hi ${name},</p><p>Click <a href="${resetUrl}">here</a> to reset your password.</p><p>This link expires in 1 hour.</p>`,
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

  trialEnding: (orgName: string, daysLeft: number) => ({
    subject: `Your WaveCore trial ends in ${daysLeft} days`,
    text: `${orgName}: Your free trial ends in ${daysLeft} days. Subscribe to continue using WaveCore ERP.`,
    html: `<p>${orgName}: Your free trial ends in <strong>${daysLeft} days</strong>.</p><p>Subscribe to continue using WaveCore ERP. KSh 500/month.</p>`,
  }),
}