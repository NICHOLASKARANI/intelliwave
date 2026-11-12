export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { put } from '@vercel/blob'
import { requireTenant } from '@/lib/wavecore/auth'
import crypto from 'crypto'

const MAX_SIZE = 10 * 1024 * 1024  // 10 MB
const ALLOWED_TYPES = [
  'image/jpeg', 'image/png', 'image/webp', 'image/gif',
  'application/pdf', 'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'text/plain', 'text/csv'
]

function slugify(input: string): string {
  return (input || 'item')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')          // remove accents
    .replace(/[^a-z0-9\s-]/g, '')              // keep a-z 0-9 space dash
    .trim()
    .replace(/\s+/g, '-')                       // spaces -> dashes
    .replace(/-+/g, '-')                        // collapse dashes
    .slice(0, 60) || 'item'
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await req.formData()
    const file = formData.get('file') as File | null
    const slugHint = (formData.get('slug') as string) || (formData.get('title') as string) || ''

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ error: 'Only images (JPG, PNG, WebP, GIF) and documents (PDF, DOC, DOCX, TXT, CSV) allowed' }, { status: 400 })
    }
    if (file.size > MAX_SIZE) {
      return NextResponse.json({ error: 'Max 10 MB per image' }, { status: 400 })
    }

    // Build a professional-looking filename:
    //   marketplace/<slug>-<short-hash>.<ext>
    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '')
    const slug = slugify(slugHint)
    const shortHash = crypto.randomBytes(4).toString('hex')   // 8 chars, collision-resistant
    const filename = `marketplace/${slug}-${shortHash}.${ext}`

    const blob = await put(filename, file, {
      access: 'public',
      contentType: file.type,
      addRandomSuffix: false,   // we already made the name unique
    })

    return NextResponse.json({
      success: true,
      url: blob.url,
      pathname: blob.pathname,
      size: file.size,
      contentType: file.type,
    }, { status: 201 })
  } catch (error: any) {
    console.error('Marketplace upload error:', error?.message)
    return NextResponse.json({ error: 'Upload failed: ' + (error?.message || 'unknown') }, { status: 500 })
  }
}