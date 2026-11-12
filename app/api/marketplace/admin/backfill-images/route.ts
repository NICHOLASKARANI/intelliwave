export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { put } from '@vercel/blob'
import crypto from 'crypto'

function slugify(s: string) {
  return (s || 'item')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50) || 'item'
}

function parseDataUrl(dataUrl: string): { mime: string, buffer: Buffer } | null {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!m) return null
  return { mime: m[1], buffer: Buffer.from(m[2], 'base64') }
}

// POST: migrate up to `batchSize` listings from base64 to Blob URLs
// Body: { password, batchSize? }
export async function POST(req: NextRequest) {
  try {
    const adminPassword = process.env.MARKETPLACE_ADMIN_PASSWORD
    if (!adminPassword) {
      return NextResponse.json({ error: 'Admin gate not configured' }, { status: 500 })
    }

    const body = await req.json().catch(() => ({}))
    if (body.password !== adminPassword) {
      return NextResponse.json({ error: 'Access denied' }, { status: 401 })
    }

    const batchSize = Math.min(50, Math.max(1, parseInt(body.batchSize || '10', 10)))

    // Find next batch
    const findRes = await pool.query(
      `SELECT id, title, images
       FROM "MarketplaceListing"
       WHERE images::text LIKE '%data:image%'
       ORDER BY id ASC
       LIMIT $1`,
      [batchSize]
    )

    if (findRes.rows.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'No more listings to migrate',
        processed: 0,
        migrated: 0,
        failed: 0,
      })
    }

    let migrated = 0
    let failed = 0
    let updatedListings = 0

    for (const listing of findRes.rows) {
      const images = listing.images || []
      const newImages: string[] = []
      let changed = false

      for (const img of images) {
        if (!img || !img.startsWith('data:image')) {
          newImages.push(img)
          continue
        }

        const parsed = parseDataUrl(img)
        if (!parsed) { failed++; newImages.push(img); continue }

        const ext = parsed.mime.split('/')[1] || 'jpg'
        const slug = slugify(listing.title)
        const hash = crypto.randomBytes(4).toString('hex')
        const filename = `marketplace/backfill-${slug}-${hash}.${ext}`

        try {
          const blob = await put(filename, parsed.buffer, {
            access: 'public',
            contentType: parsed.mime,
            addRandomSuffix: false,
          })
          newImages.push(blob.url)
          migrated++
          changed = true
        } catch (e: any) {
          console.error('Upload failed:', e?.message)
          failed++
          newImages.push(img)
        }
      }

      if (changed) {
        await pool.query(
          `UPDATE "MarketplaceListing" SET images = $1, "updatedAt" = NOW() WHERE id = $2`,
          [newImages, listing.id]
        )
        updatedListings++
      }
    }

    // Get remaining count
    const remainingRes = await pool.query(
      `SELECT COUNT(*)::int AS count FROM "MarketplaceListing" WHERE images::text LIKE '%data:image%'`
    )
    const remaining = remainingRes.rows[0]?.count || 0

    return NextResponse.json({
      success: true,
      processed: findRes.rows.length,
      migrated,
      failed,
      updatedListings,
      remaining,
    })
  } catch (error: any) {
    console.error('Backfill images error:', error?.message)
    return NextResponse.json({ error: 'Failed: ' + (error?.message || 'unknown') }, { status: 500 })
  }
}

// GET: check how many listings still have base64
export async function GET(req: NextRequest) {
  try {
    const adminPassword = process.env.MARKETPLACE_ADMIN_PASSWORD
    if (!adminPassword) {
      return NextResponse.json({ error: 'Admin gate not configured' }, { status: 500 })
    }
    const { searchParams } = new URL(req.url)
    const headerPwd = req.headers.get('x-admin-password')
    const queryPwd = searchParams.get('password')
    if ((headerPwd || queryPwd) !== adminPassword) {
      return NextResponse.json({ error: 'Access denied' }, { status: 401 })
    }

    const res = await pool.query(
      `SELECT
         COUNT(*) FILTER (WHERE images::text LIKE '%data:image%')::int AS base64_listings,
         COUNT(*)::int AS total_listings,
         COALESCE(SUM(array_length(images, 1)) FILTER (WHERE images::text LIKE '%data:image%'), 0)::int AS base64_image_count
       FROM "MarketplaceListing"
       WHERE array_length(images, 1) > 0`
    )

    return NextResponse.json(res.rows[0])
  } catch (error: any) {
    console.error('Backfill images GET error:', error?.message)
    return NextResponse.json({ error: 'Failed' }, { status: 500 })
  }
}