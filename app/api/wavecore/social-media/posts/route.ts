export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'

const CONTENT_TEMPLATES = {
  real_estate: [
    'New listing alert! Beautiful {rooms} bedroom home in {location}. Contact us today!',
    'Just sold! Another happy client found their dream home. Ready to sell yours?',
    'Price drop! Stunning property now at {price}. Schedule a viewing!',
    'Hot deal: Prime commercial space available in {location}. Limited time!',
  ],
  healthcare: [
    'Health tip of the day: Stay hydrated! Drink 8 glasses of water daily.',
    'Preventive care is the best care. Book your checkup today!',
    'New service available: {service}. Visit our clinic for consultation.',
    'Your health is our priority. Open 24/7 for emergencies.',
  ],
  legal: [
    'Legal tip: Always read contracts before signing. We can help!',
    'Free consultation available for {service}. Contact our office.',
    'Know your rights! Visit our website for legal resources.',
    'Experienced attorneys ready to help with your case.',
  ],
  retail: [
    'Flash sale! Up to 50% off selected items. Limited stock!',
    'New arrivals just landed! Visit our store today.',
    'Customer favorites back in stock. Get yours before they sell out!',
    'Special offer: Buy one get one free on {product}.',
  ],
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { industry, platform } = body

    const templates = CONTENT_TEMPLATES[industry] || CONTENT_TEMPLATES.retail
    const content = templates[Math.floor(Math.random() * templates.length)]

    const post = {
      content,
      platform: platform || 'instagram',
      hashtags: ['#ai', '#automation', '#business', '#growth', '#wavecore'],
      scheduledFor: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      status: 'SCHEDULED'
    }

    return NextResponse.json({ success: true, post })
  } catch (error) {
    return NextResponse.json({ error: 'Content generation failed' }, { status: 500 })
  }
}