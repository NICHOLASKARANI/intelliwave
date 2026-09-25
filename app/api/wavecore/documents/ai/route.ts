export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'
import { pool } from '@/lib/wavecore/db'

// Simple heuristic summarizer that doesn't need external LLM.
// Extracts top sentences ranked by word frequency + position.
function extractiveSummarize(text: string, maxSentences = 5): string {
  const sentences = text.replace(/\s+/g, ' ').match(/[^.!?]+[.!?]+/g) || [text]
  if (sentences.length <= maxSentences) return sentences.join(' ').trim()

  // Build frequency map (excluding stop words)
  const stop = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','should','could','may','might','must','can','this','that','these','those','i','you','he','she','it','we','they'])
  const freq: Record<string, number> = {}
  for (const w of text.toLowerCase().match(/\b[a-z]{3,}\b/g) || []) {
    if (!stop.has(w)) freq[w] = (freq[w] || 0) + 1
  }
  const maxFreq = Math.max(1, ...Object.values(freq))

  // Score each sentence
  const scored = sentences.map((s, i) => {
    const words = s.toLowerCase().match(/\b[a-z]{3,}\b/g) || []
    const score = words.reduce((sum: number, w: string) => sum + (freq[w] || 0) / maxFreq, 0) / Math.max(1, words.length)
    const positionBoost = 1 - i / sentences.length
    return { sentence: s.trim(), score: score * 0.7 + positionBoost * 0.3, index: i }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, maxSentences)
    .sort((a, b) => a.index - b.index)
    .map(s => s.sentence)
    .join(' ')
    .trim()
}

// Heuristic language detector — counts common-word signatures per language
function detectLanguage(text: string): string {
  const t = text.toLowerCase().slice(0, 2000)
  const patterns: Record<string, RegExp> = {
    en: /\b(the|and|you|that|have|with|this|from|they)\b/g,
    sw: /\b(na|kwa|hii|wa|ya|ni|kama|lakini|sana)\b/g,
    fr: /\b(le|la|les|des|une|est|que|pour|dans|avec)\b/g,
    es: /\b(el|la|los|las|de|que|por|con|para|como)\b/g,
    de: /\b(der|die|das|und|ist|nicht|mit|für|von|den)\b/g,
    ar: /[\u0600-\u06FF]/g,
    zh: /[\u4e00-\u9fff]/g,
  }
  const scores: Record<string, number> = {}
  for (const [lang, rx] of Object.entries(patterns)) {
    const m = t.match(rx)
    scores[lang] = m ? m.length : 0
  }
  const best = Object.entries(scores).sort((a, b) => b[1] - a[1])[0]
  return best && best[1] > 0 ? best[0] : 'en'
}

export async function POST(request: NextRequest) {
  const startedAt = Date.now()
  const crypto = require('crypto')
  const jobId = crypto.randomUUID()

  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(request, 'HR_WRITE')
    if (guard.deny) return guard.response!

    const body = await request.json()
    const action = String(body.action || '').toUpperCase()

    if (!body.text && !body.documentId) {
      return NextResponse.json({ error: 'text or documentId required' }, { status: 400 })
    }

    let text = body.text || ''
    if (!text && body.documentId) {
      const docRes = await pool.query(
        `SELECT "textContent", name FROM "Document" WHERE id = $1 AND "organizationId" = $2`,
        [body.documentId, session.organizationId]
      )
      if (docRes.rows.length > 0) text = docRes.rows[0].textContent || ''
    }

    if (!text.trim()) return NextResponse.json({ error: 'No text available. Run OCR first.' }, { status: 400 })

    let result: any = {}

    if (action === 'SUMMARIZE') {
      const summary = extractiveSummarize(text, Number(body.maxSentences || 5))
      result = { summary, originalLength: text.length, summaryLength: summary.length }
    } else if (action === 'DETECT_LANGUAGE') {
      const lang = detectLanguage(text)
      result = { language: lang, sample: text.slice(0, 200) }
    } else if (action === 'KEYWORDS') {
      const stop = new Set(['the','a','an','and','or','but','in','on','at','to','for','of','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','should','could','may','might','must','can','this','that','these','those'])
      const freq: Record<string, number> = {}
      for (const w of text.toLowerCase().match(/\b[a-z]{4,}\b/g) || []) {
        if (!stop.has(w)) freq[w] = (freq[w] || 0) + 1
      }
      const keywords = Object.entries(freq).sort((a, b) => b[1] - a[1]).slice(0, Number(body.limit || 15)).map(([word, count]) => ({ word, count }))
      result = { keywords }
    } else if (action === 'STATISTICS') {
      const words = (text.match(/\b\w+\b/g) || []).length
      const sentences = (text.match(/[.!?]+/g) || []).length
      const paragraphs = text.split(/\n\s*\n/).length
      const readMinutes = Math.max(1, Math.ceil(words / 220))
      result = { words, sentences, paragraphs, characters: text.length, readingMinutes: readMinutes }
    } else {
      return NextResponse.json({
        error: 'Unknown action',
        supportedActions: ['SUMMARIZE', 'DETECT_LANGUAGE', 'KEYWORDS', 'STATISTICS'],
        note: 'Advanced AI (LLM-based translate, rewrite) requires external provider — coming soon.',
      }, { status: 400 })
    }

    const elapsed = Date.now() - startedAt
    await pool.query(
      `INSERT INTO "PDFJob"
        (id, tool, "inputSize", "outputSize", status, "processingMs", options, "organizationId", "userId", "createdAt", "completedAt")
       VALUES ($1,$2,$3,$4,'COMPLETED',$5,$6,$7,$8,NOW(),NOW())`,
      [jobId, 'AI_' + action, text.length, JSON.stringify(result).length, elapsed, JSON.stringify({ action }), session.organizationId, session.userId]
    ).catch(() => {})

    return NextResponse.json({ success: true, jobId, action, ...result, processingMs: elapsed })
  } catch (error) {
    console.error('AI Tools error:', error)
    return NextResponse.json({ error: 'AI tool failed: ' + (error as Error).message }, { status: 500 })
  }
}