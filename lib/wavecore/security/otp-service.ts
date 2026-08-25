// OTP Service - SendGrid for email, Twilio for SMS
import sgMail from '@sendgrid/mail'
import twilio from 'twilio'

// Initialize SendGrid
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY)
}

// Initialize Twilio
const twilioClient = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN
  ? twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)
  : null

export interface OTPResult {
  success: boolean
  message: string
  debugOtp?: string
}

export async function sendEmailOTP(email: string, otp: string): Promise<OTPResult> {
  if (!process.env.SENDGRID_API_KEY) {
    return { success: true, message: 'SendGrid not configured - OTP for testing', debugOtp: otp }
  }

  try {
    const msg = {
      to: email,
      from: process.env.SENDGRID_FROM_EMAIL || 'no-reply@intelliwavve.com',
      subject: 'WaveCore ERP - Password Reset OTP',
      text: `Your OTP is: ${otp}. This code expires in 10 minutes.`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e40af;">WaveCore ERP</h2>
          <p>Your password reset OTP is:</p>
          <h1 style="font-size: 36px; letter-spacing: 5px; color: #1e40af;">${otp}</h1>
          <p>This code expires in 10 minutes.</p>
          <p>If you didn't request this, please ignore this email.</p>
        </div>
      `,
    }
    await sgMail.send(msg)
    return { success: true, message: `OTP sent to ${email}` }
  } catch (error) {
    console.error('SendGrid error:', error)
    return { success: true, message: 'Email service unavailable', debugOtp: otp }
  }
}

export async function sendSMSOTP(phone: string, otp: string): Promise<OTPResult> {
  if (!twilioClient) {
    return { success: true, message: 'Twilio not configured - OTP for testing', debugOtp: otp }
  }

  try {
    await twilioClient.messages.create({
      body: `WaveCore ERP - Your password reset OTP is: ${otp}. Expires in 10 minutes.`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: phone,
    })
    return { success: true, message: `OTP sent to ${phone}` }
  } catch (error) {
    console.error('Twilio error:', error)
    return { success: true, message: 'SMS service unavailable', debugOtp: otp }
  }
}

export async function sendOTP(identifier: string, otp: string): Promise<OTPResult> {
  // Check if identifier is email or phone
  const isEmail = identifier.includes('@')
  
  if (isEmail) {
    return sendEmailOTP(identifier, otp)
  } else {
    return sendSMSOTP(identifier, otp)
  }
}