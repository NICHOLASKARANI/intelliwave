import { NextRequest, NextResponse } from 'next/server'

const GOOGLE_SHEETS_URL = 'https://script.google.com/macros/s/AKfycbxArgpN-mFbXavj3ckjr68qaVagR7HvMjdSIcBK6kvkdMdpv3Cc5AowmhIs7f-r7tPbWA/exec'

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

    console.log('Sending to Google Sheets:', { name: name.trim(), email: email.trim(), message: message.trim() })

    // Send to Google Sheets with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000)

    try {
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
        signal: controller.signal,
      })

      clearTimeout(timeoutId)

      const responseData = await response.json()
      console.log('Google Sheets response:', responseData)

      if (responseData.success) {
        return NextResponse.json({
          success: true,
          message: 'Thank you! Your message has been sent successfully. We will get back to you within 24 hours.',
        })
      } else {
        console.error('Google Sheets error:', responseData.error)
        // Still return success to user
        return NextResponse.json({
          success: true,
          message: 'Thank you! Your message has been received. We will get back to you within 24 hours.',
        })
      }
    } catch (fetchError) {
      clearTimeout(timeoutId)
      console.error('Google Sheets fetch error:', fetchError)
      
      // Still return success - the message is logged server-side
      return NextResponse.json({
        success: true,
        message: 'Thank you! Your message has been received. We will get back to you within 24 hours.',
      })
    }
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