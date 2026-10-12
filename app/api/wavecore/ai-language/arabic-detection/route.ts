export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'
import { checkCsrf } from '@/lib/wavecore/csrf'
import { translate } from '@vitalets/google-translate-api'

// ============================================================
// Supported languages — Google Translate codes that actually work today.
// If a language isn't listed here, we do NOT accept it — no fake
// translations. See the roadmap note in the UI for languages we're
// working to support (Kikuyu, Luo, Kamba, Kalenjin, Burji, etc.)
// ============================================================
const SUPPORTED_LANGUAGES: Record<string, { name: string; rtl: boolean }> = {
  ar: { name: 'Arabic (MSA)', rtl: true },
  so: { name: 'Somali', rtl: false },
  om: { name: 'Oromo', rtl: false },
  am: { name: 'Amharic', rtl: false },
  sw: { name: 'Swahili', rtl: false },
}

// Arabic dialect detection markers (kept from the original, unchanged)
const ARABIC_DIALECT_MARKERS: Record<string, RegExp> = {
  'Egyptian Arabic': /عايز|عاوز|إزيك|عامل ايه|أيه/i,
  'Gulf Arabic': /شلونك|وش|زين|خوش|شنو/i,
  'Levantine Arabic': /كيفك|شو|هلق|كتير|منيح/i,
  'Maghrebi Arabic': /واش|بزاف|دابا|نحب/i,
}

// ============================================================
// Arabic script density — how much of the input is Arabic Unicode
// ============================================================
function arabicScriptDensity(text: string): number {
  if (!text) return 0
  const stripped = text.replace(/[\s\d\p{P}\p{S}]/gu, '')
  if (stripped.length === 0) return 0
  const arabicChars = (stripped.match(/[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF]/g) || []).length
  return arabicChars / stripped.length
}

function matchDialectMarkers(text: string): { dialect: string; hits: number } {
  let best: { dialect: string; hits: number } = { dialect: 'Modern Standard Arabic', hits: 0 }
  for (const [dialect, pattern] of Object.entries(ARABIC_DIALECT_MARKERS)) {
    const hits = (text.match(new RegExp(pattern.source, 'gi')) || []).length
    if (hits > best.hits) best = { dialect, hits }
  }
  return best
}

// ============================================================
// Real confidence — computed from:
//   - script density (30% weight)
//   - dialect marker hits (20% weight, capped)
//   - translation success (50% weight)
// No more Math.random()
// ============================================================
function computeConfidence(opts: {
  isArabic: boolean
  scriptDensity: number
  dialectHits: number
  translationSuccess: boolean
}): number {
  if (opts.isArabic) {
    // Arabic input: how much we trust our detection
    const scriptScore = Math.min(opts.scriptDensity * 1.0, 1) * 0.30
    const dialectScore = Math.min(opts.dialectHits / 5, 1) * 0.20
    const translationScore = (opts.translationSuccess ? 1 : 0.4) * 0.50
    return Math.round((scriptScore + dialectScore + translationScore) * 100) / 100
  }
  // Non-Arabic: confidence is a mix of "not Arabic" certainty + translation success
  const notArabicScore = (1 - opts.scriptDensity) * 0.5
  const translationScore = (opts.translationSuccess ? 1 : 0.4) * 0.5
  return Math.round((notArabicScore + translationScore) * 100) / 100
}

// ============================================================
// Bootstrap: ensure language column exists on ArabicDetection
// ============================================================
let _schemaEnsured = false
async function ensureDetectionSchema(): Promise<void> {
  if (_schemaEnsured) return
  await pool.query(`ALTER TABLE "ArabicDetection" ADD COLUMN IF NOT EXISTS language TEXT DEFAULT 'ar'`).catch(() => {})
  _schemaEnsured = true
}

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const csrf = checkCsrf(request)
    if (!csrf.allow) return csrf.response!

    await ensureDetectionSchema()

    const body = await request.json()
    const inputText = String(body.text || '')
    const sourceLanguage = String(body.language || 'ar')

    if (!inputText.trim()) {
      return NextResponse.json({ error: 'Please enter text to translate' }, { status: 400 })
    }

    const langConfig = SUPPORTED_LANGUAGES[sourceLanguage]
    if (!langConfig) {
      return NextResponse.json(
        { error: 'Unsupported source language' },
        { status: 400 }
      )
    }

    const density = arabicScriptDensity(inputText)
    const isArabic = sourceLanguage === 'ar' && density > 0.3

    const dialectInfo = isArabic
      ? matchDialectMarkers(inputText)
      : { dialect: '—', hits: 0 }

    // Real translation via Google Translate
    let translatedText = ''
    let translationSuccess = false

    try {
      const result = await translate(inputText, { from: sourceLanguage, to: 'en' })
      translatedText = result.text || ''
      translationSuccess = translatedText.trim().length > 0
    } catch (translateError) {
      console.error('[detection translate]', (translateError as Error).message)
      translatedText = 'Translation service temporarily unavailable'
      translationSuccess = false
    }

    const confidence = computeConfidence({
      isArabic,
      scriptDensity: density,
      dialectHits: dialectInfo.hits,
      translationSuccess,
    })

    const result = {
      detectedText: inputText,
      translatedText,
      isArabic,
      language: sourceLanguage,
      languageName: langConfig.name,
      confidence,
      dialect: isArabic ? dialectInfo.dialect : '—',
      scriptType: langConfig.rtl ? 'Arabic Script' : 'Latin Script',
      translationSuccess,
      timestamp: new Date().toISOString(),
    }

    const crypto = require('crypto')
    const id = crypto.randomUUID()
    try {
      await pool.query(
        `INSERT INTO "ArabicDetection" (id, "detectedText", "translatedText", "isArabic", dialect, confidence, language, "organizationId", "createdAt")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
        [
          id,
          inputText,
          translatedText,
          isArabic,
          result.dialect,
          confidence,
          sourceLanguage,
          session.organizationId,
        ]
      )
    } catch (dbError) {
      console.error('[detection insert]', (dbError as Error).message)
      // Non-fatal — return the result even if save failed
    }

    return NextResponse.json({ success: true, result })
  } catch (error) {
    console.error('Language detection error:', error)
    return NextResponse.json({ error: 'Detection failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const result = await pool.query(
      `SELECT id, "detectedText", "translatedText", "isArabic", dialect, confidence, language, "createdAt"
       FROM "ArabicDetection" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC LIMIT 50`,
      [session.organizationId]
    )
    return NextResponse.json({ detections: result.rows, languages: SUPPORTED_LANGUAGES })
  } catch {
    return NextResponse.json({ detections: [], languages: SUPPORTED_LANGUAGES })
  }
}

// Expose the language list to the client for the dropdown
export async function OPTIONS() {
  return NextResponse.json({ languages: SUPPORTED_LANGUAGES })
}