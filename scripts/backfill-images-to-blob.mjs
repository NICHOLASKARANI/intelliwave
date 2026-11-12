#!/usr/bin/env node
// Backfill base64 images in MarketplaceListing → Vercel Blob URLs
//
// Usage:
//   node scripts/backfill-images-to-blob.mjs --dry-run      # preview only
//   node scripts/backfill-images-to-blob.mjs                 # run for real
//   node scripts/backfill-images-to-blob.mjs --limit=10      # limit batch size
//
// Requirements:
//   - .env with DATABASE_URL
//   - .env with BLOB_READ_WRITE_TOKEN (from Vercel Blob dashboard)
//
// Safe: skips already-migrated images, batches, logs to stdout

import { readFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { dirname } from 'node:path'

const __dirname = dirname(fileURLToPath(import.meta.url))
const projectRoot = resolve(__dirname, '..')

// ---------- Load env ----------
function loadEnv() {
  const candidates = ['.env', '.env.local']
  const out = {}
  for (const f of candidates) {
    try {
      const raw = readFileSync(resolve(projectRoot, f), 'utf8')
      for (const line of raw.split(/\r?\n/)) {
        const m = line.match(/^([A-Z0-9_]+)\s*=\s*(.*)$/i)
        if (m) out[m[1]] = m[2].replace(/^["']|["']$/g, '')
      }
    } catch {}
  }
  return out
}
const env = { ...loadEnv(), ...process.env }

if (!env.DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in .env')
  process.exit(1)
}
if (!env.BLOB_READ_WRITE_TOKEN) {
  console.error('❌ BLOB_READ_WRITE_TOKEN not found')
  console.error('   Add it to .env (get it from Vercel → Storage → Blob)')
  process.exit(1)
}

// ---------- Parse args ----------
const args = process.argv.slice(2)
const dryRun = args.includes('--dry-run')
const limitArg = args.find(a => a.startsWith('--limit='))
const limit = limitArg ? parseInt(limitArg.split('=')[1], 10) : 20

// ---------- Import dependencies (dynamic after env loaded) ----------
const pg = (await import('pg')).default
const { put } = await import('@vercel/blob')
const crypto = (await import('node:crypto')).default

const pool = new pg.Pool({
  connectionString: env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
})

// ---------- Helpers ----------
function slugify(s) {
  return (s || 'item')
    .toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50) || 'item'
}

function parseDataUrl(dataUrl) {
  const m = dataUrl.match(/^data:([^;]+);base64,(.+)$/)
  if (!m) return null
  return { mime: m[1], buffer: Buffer.from(m[2], 'base64') }
}

// ---------- Main ----------
async function main() {
  console.log(`\n🎬 Backfill images to Blob`)
  console.log(`   Mode:   ${dryRun ? 'DRY RUN (no changes)' : 'REAL RUN'}`)
  console.log(`   Batch:  ${limit} listings per run\n`)

  // Find listings with base64 images
  const findRes = await pool.query(
    `SELECT id, title, images
     FROM "MarketplaceListing"
     WHERE images::text LIKE '%data:image%'
     ORDER BY id ASC
     LIMIT $1`,
    [limit]
  )

  const listings = findRes.rows
  console.log(`Found ${listings.length} listing(s) with base64 images\n`)

  if (listings.length === 0) {
    console.log('✅ Nothing to migrate. Exiting.')
    await pool.end()
    return
  }

  let totalImages = 0
  let migratedImages = 0
  let failedImages = 0
  let listingsUpdated = 0

  for (const listing of listings) {
    const images = listing.images || []
    console.log(`\n📦 Listing ${listing.id}: "${listing.title}" (${images.length} image(s))`)

    const newImages = []
    let listingChanged = false

    for (let i = 0; i < images.length; i++) {
      const img = images[i]
      totalImages++

      // Already a URL → keep
      if (!img || !img.startsWith('data:image')) {
        newImages.push(img)
        continue
      }

      const parsed = parseDataUrl(img)
      if (!parsed) {
        console.log(`   ⚠️  Image ${i+1}: could not parse data URL — keeping as-is`)
        newImages.push(img)
        failedImages++
        continue
      }

      const sizeKB = Math.round(parsed.buffer.length / 1024)
      const ext = parsed.mime.split('/')[1] || 'jpg'
      const slug = slugify(listing.title)
      const hash = crypto.randomBytes(4).toString('hex')
      const filename = `marketplace/backfill-${slug}-${hash}.${ext}`

      if (dryRun) {
        console.log(`   🔍 Would upload image ${i+1} (${sizeKB} KB) → ${filename}`)
        newImages.push(`[DRY RUN: ${filename}]`)
        migratedImages++
        listingChanged = true
        continue
      }

      try {
        const blob = await put(filename, parsed.buffer, {
          access: 'public',
          contentType: parsed.mime,
          addRandomSuffix: false,
        })
        console.log(`   ✅ Image ${i+1}: ${sizeKB} KB → ${blob.url}`)
        newImages.push(blob.url)
        migratedImages++
        listingChanged = true
      } catch (e) {
        console.log(`   ❌ Image ${i+1}: upload failed — ${e.message}`)
        newImages.push(img)
        failedImages++
      }
    }

    if (listingChanged && !dryRun) {
      try {
        await pool.query(
          `UPDATE "MarketplaceListing" SET images = $1, "updatedAt" = NOW() WHERE id = $2`,
          [newImages, listing.id]
        )
        console.log(`   💾 Updated listing ${listing.id} in DB`)
        listingsUpdated++
      } catch (e) {
        console.log(`   ❌ DB update failed for ${listing.id}: ${e.message}`)
      }
    } else if (listingChanged && dryRun) {
      listingsUpdated++
    }
  }

  // Summary
  console.log(`\n${'='.repeat(60)}`)
  console.log(`📊 Summary`)
  console.log(`${'='.repeat(60)}`)
  console.log(`  Total images seen:      ${totalImages}`)
  console.log(`  Migrated:               ${migratedImages}`)
  console.log(`  Failed:                 ${failedImages}`)
  console.log(`  Listings updated:       ${listingsUpdated}`)
  console.log(`  Mode:                   ${dryRun ? 'DRY RUN (no changes made)' : 'REAL'}`)
  if (dryRun) {
    console.log(`\n  💡 Run without --dry-run to actually migrate.`)
  } else if (listings.length >= limit) {
    console.log(`\n  💡 ${limit} was the batch limit. There may be more listings.`)
    console.log(`     Run again to process the next batch.`)
  }

  await pool.end()
}

main().catch(e => {
  console.error('❌ Fatal error:', e)
  process.exit(1)
})