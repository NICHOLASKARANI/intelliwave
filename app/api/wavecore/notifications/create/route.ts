export const dynamic = 'force-dynamic'
import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { createNotification, type NotificationCategory } from '@/lib/wavecore/notifications'
import { z } from 'zod'

const schema = z.object({
  type: z.string().min(1),
  category: z.enum(['approval','invoice_overdue','payment_received','low_stock','subscription','system']),
  title: z.string().min(1),
  content: z.string().optional(),
  link: z.string().optional(),
  userId: z.string().optional(),
  emailTo: z.string().email().optional(),
  emailSubject: z.string().optional(),
  emailHtml: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const v = schema.parse(body)

    const id = await createNotification({
      userId: v.userId || session.userId,
      organizationId: session.organizationId,
      type: v.type,
      category: v.category as NotificationCategory,
      title: v.title,
      content: v.content,
      link: v.link,
      emailTo: v.emailTo,
      emailSubject: v.emailSubject,
      emailHtml: v.emailHtml,
    })

    return NextResponse.json({ success: true, id })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid payload', details: error.errors }, { status: 422 })
    }
    console.error('[notifications/create] error:', error)
    return NextResponse.json({ error: 'Create failed' }, { status: 500 })
  }
}