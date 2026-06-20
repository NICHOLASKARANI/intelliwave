import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbxvIYFqlCzYukJrFgqAfJK46Ejis78JD_m1CW482zfS4pG_qvQj1qi2URBE5h-eVqlJ0A/exec'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, message } = body

    // Validate required fields
    if (!name || !email || !message) {
      return NextResponse.json(
        { success: false, error: 'All fields are required.' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      )
    }

    // Send to Google Sheets
    const response = await fetch(GOOGLE_SHEETS_URL, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        name: name.trim(),
        email: email.trim(),
        message: message.trim(),
      }),
    })

    const data = await response.json()

    if (!response.ok || !data.success) {
      console.error('Google Sheets error:', data)
      throw new Error(data.error || 'Failed to submit to Google Sheets')
    }

    return NextResponse.json({
      success: true,
      message: 'Thank you! Your message has been received. We will get back to you within 24 hours.',
    })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to send message. Please try again or WhatsApp us at +254 714 694 493.' 
      },
      { status: 500 }
    )
  }
}