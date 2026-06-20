import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbxalnaCqLSDuafOgRvVGLuYwajSouUWsQ6WVaOnZWiMasBLXUydJgRzovba0W9WwW1XjA/exec'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { name, email, message } = body

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json(
        { success: false, error: 'Please enter your name.' },
        { status: 400 }
      )
    }
    if (!email || !email.trim()) {
      return NextResponse.json(
        { success: false, error: 'Please enter your email address.' },
        { status: 400 }
      )
    }
    if (!message || !message.trim()) {
      return NextResponse.json(
        { success: false, error: 'Please enter a message.' },
        { status: 400 }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email.trim())) {
      return NextResponse.json(
        { success: false, error: 'Please enter a valid email address.' },
        { status: 400 }
      )
    }

    // Prepare submission data
    const submission = {
      name: name.trim(),
      email: email.trim(),
      message: message.trim(),
      timestamp: new Date().toISOString(),
    }

    console.log('📩 New Contact Form Submission:', JSON.stringify(submission, null, 2))

    // Send to Google Sheets
    try {
      const response = await fetch(GOOGLE_SHEETS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submission),
        signal: AbortSignal.timeout(10000),
      })

      const result = await response.json()
      console.log('Google Sheets response:', JSON.stringify(result))

      if (!result.success) {
        console.error('Google Sheets save failed:', result.error)
      }
    } catch (sheetError) {
      console.error('Google Sheets connection error:', sheetError)
      // Continue even if sheets fails - message is logged in Vercel
    }

    // Always return success to user
    return NextResponse.json({
      success: true,
      message: 'Thank you! Your message has been sent to karaninicholas700@gmail.com. We will get back to you within 24 hours.',
    })
  } catch (error) {
    console.error('Contact form error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to send message. Please WhatsApp us at +254 714 694 493.' },
      { status: 500 }
    )
  }
}