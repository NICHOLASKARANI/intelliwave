export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'

interface ProductResult {
  id: number
  title: string
  price: number
  images: string[]
  location: string | null
  condition: string | null
  averageRating?: number | null
}

interface ParsedIntent {
  query: string
  category?: string
  minPrice?: number
  maxPrice?: number
  sort?: string
  wantsComparison?: boolean
  originalQuery: string
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Electronics': ['electronics', 'laptop', 'computer', 'tablet', 'tv', 'camera', 'monitor', 'keyboard', 'mouse', 'headphones', 'speaker', 'gaming', 'console', 'playstation', 'xbox'],
  'Mobile Phones': ['phone', 'mobile', 'smartphone', 'iphone', 'android', 'samsung', 'tecno', 'infinix', 'oppo', 'xiaomi'],
  'Furniture': ['furniture', 'couch', 'sofa', 'chair', 'table', 'desk', 'bed', 'mattress', 'wardrobe', 'cabinet'],
  'Vehicles': ['car', 'vehicle', 'motorbike', 'motorcycle', 'truck', 'bus', 'van', 'suv', 'toyota', 'nissan', 'subaru'],
  'Fashion': ['fashion', 'shirt', 'dress', 'shoe', 'shoes', 'sneaker', 'jacket', 'pants', 'jeans', 'hat', 'bag', 'watches', 'watch'],
  'Property': ['property', 'house', 'apartment', 'rent', 'land', 'plot', 'home'],
  'Home': ['home', 'kitchen', 'appliance', 'fridge', 'microwave', 'cooker', 'utensils'],
  'Sports': ['sport', 'football', 'basketball', 'gym', 'fitness', 'bicycle', 'bike', 'tennis'],
}

function parseIntent(message: string): ParsedIntent {
  const lower = message.toLowerCase()
  const parsed: ParsedIntent = { query: '', originalQuery: message }

  // Extract price limits
  // "under 50000", "less than 50,000", "below 30K", "5K", "500 KES"
  const pricePatterns = [
    { regex: /(?:under|below|less than|max|up to|cheaper than)\s+(?:kes\s*)?([\d,]+)\s*(k|thousand)?/i, type: 'max' },
    { regex: /(?:above|over|more than|min|starting from|at least)\s+(?:kes\s*)?([\d,]+)\s*(k|thousand)?/i, type: 'min' },
  ]

  for (const p of pricePatterns) {
    const m = lower.match(p.regex)
    if (m) {
      let num = parseInt(m[1].replace(/,/g, ''), 10)
      if (m[2]) num *= 1000  // "50K" → 50000
      if (p.type === 'max') parsed.maxPrice = num
      else parsed.minPrice = num
    }
  }

  // Also handle "50k" standalone (e.g., "laptop 50k")
  if (!parsed.maxPrice && !parsed.minPrice) {
    const kMatch = lower.match(/(\d+)\s*k\b/i)
    if (kMatch) parsed.maxPrice = parseInt(kMatch[1], 10) * 1000
  }

  // Extract category from keywords
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    for (const kw of keywords) {
      if (lower.includes(kw)) {
        parsed.category = category
        break
      }
    }
    if (parsed.category) break
  }

  // Sort hints
  if (/cheap|budget|affordable|lowest|lowest price/i.test(lower)) parsed.sort = 'price_asc'
  else if (/best|rated|top|popular|quality/i.test(lower)) parsed.sort = 'rating'
  else if (/new|latest|recent|fresh/i.test(lower)) parsed.sort = 'newest'

  // Comparison intent
  if (/compare|vs|difference|better|which/i.test(lower)) parsed.wantsComparison = true

  // Extract search terms (strip common filler)
  let searchText = lower
    .replace(/(?:under|below|less than|above|over|more than|max|min|up to|cheaper than|at least|starting from|kes)\s*[\d,]+\s*(?:k|thousand)?/gi, '')
    .replace(/\b(?:for|with|some|a|an|the|i|need|want|looking|find|me|show|get|please|buy|buying|purchase)\b/g, ' ')
    .replace(/[?.!,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()

  parsed.query = searchText || parsed.category || ''
  return parsed
}

async function searchProducts(intent: ParsedIntent, limit = 5): Promise<ProductResult[]> {
  try {
    let query = `SELECT l.id, l.title, l.price, l.images, l.location, l.condition,
                        sp."averageRating"
                 FROM "MarketplaceListing" l
                 LEFT JOIN "SellerProfile" sp ON sp."userId" = l."sellerId"
                 WHERE l.status = 'ACTIVE' AND l.stock > 0`
    const params: any[] = []

    if (intent.query) {
      params.push(`%${intent.query}%`)
      query += ` AND (l.title ILIKE $${params.length} OR l.description ILIKE $${params.length})`
    }
    if (intent.category) {
      params.push(intent.category)
      query += ` AND l.category = $${params.length}`
    }
    if (intent.minPrice) {
      params.push(intent.minPrice)
      query += ` AND l.price >= $${params.length}`
    }
    if (intent.maxPrice) {
      params.push(intent.maxPrice)
      query += ` AND l.price <= $${params.length}`
    }

    const sortMap: Record<string, string> = {
      price_asc: 'l.price ASC',
      price_desc: 'l.price DESC',
      rating: 'sp."averageRating" DESC NULLS LAST',
      newest: 'l."createdAt" DESC',
    }
    query += ` ORDER BY ${sortMap[intent.sort || ''] || 'l.views DESC, l."createdAt" DESC'}`
    params.push(limit)
    query += ` LIMIT $${params.length}`

    const res = await pool.query(query, params)
    return res.rows
  } catch (e) {
    console.error('Product search error:', e)
    return []
  }
}

function buildReply(intent: ParsedIntent, products: ProductResult[]): string {
  if (products.length === 0) {
    let msg = `I couldn't find any products`
    if (intent.query) msg += ` matching "${intent.query}"`
    if (intent.category) msg += ` in ${intent.category}`
    if (intent.maxPrice) msg += ` under KES ${intent.maxPrice.toLocaleString()}`
    msg += `. Try broadening your search or removing some filters.`
    return msg
  }

  const parts: string[] = []
  parts.push(`Here ${products.length === 1 ? 'is' : 'are'} ${products.length} match${products.length === 1 ? '' : 'es'}:`)

  if (products.length > 1) {
    const cheapest = products.reduce((a, b) => Number(a.price) < Number(b.price) ? a : b)
    const rated = products.filter(p => p.averageRating).sort((a, b) => Number(b.averageRating) - Number(a.averageRating))[0]

    if (cheapest) parts.push(`💰 **Cheapest:** ${cheapest.title} at KES ${Number(cheapest.price).toLocaleString()}`)
    if (rated && rated.averageRating && rated.id !== cheapest.id) parts.push(`⭐ **Best rated:** ${rated.title} (${Number(rated.averageRating).toFixed(1)}★)`)
  }

  return parts.join('\n\n')
}

// Fallback provider chain (matches existing /api/ai/copilot pattern)
async function tryAIProviders(systemPrompt: string, userMessage: string): Promise<string | null> {
  const providers = [
    { name: 'openai', key: process.env.OPENAI_API_KEY, url: 'https://api.openai.com/v1/chat/completions', model: 'gpt-3.5-turbo' },
    { name: 'deepseek', key: process.env.DEEPSEEK_API_KEY, url: 'https://api.deepseek.com/v1/chat/completions', model: 'deepseek-chat' },
  ]

  for (const provider of providers) {
    if (!provider.key) continue
    try {
      const res = await fetch(provider.url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${provider.key}`,
        },
        body: JSON.stringify({
          model: provider.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userMessage },
          ],
          temperature: 0.7,
          max_tokens: 300,
        }),
        cache: 'no-store',
      })
      if (res.ok) {
        const data = await res.json()
        const text = data?.choices?.[0]?.message?.content
        if (text) return text
      }
    } catch (e) {
      console.log(`${provider.name} failed, trying next...`)
    }
  }

  return null
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}))
    const message = String(body.message || '').trim()

    if (!message) {
      return NextResponse.json({ error: 'Message required' }, { status: 400 })
    }
    if (message.length > 1000) {
      return NextResponse.json({ error: 'Message too long (max 1000 chars)' }, { status: 400 })
    }

    // 1. Parse intent
    const intent = parseIntent(message)

    // 2. Search products
    const products = await searchProducts(intent, 5)

    // 3. Try AI providers if configured
    let aiReply: string | null = null
    if (process.env.OPENAI_API_KEY || process.env.DEEPSEEK_API_KEY) {
      const systemPrompt = `You are a helpful shopping assistant for WaveMarket, a Kenyan online marketplace.

Product search results already found:
${products.map((p, i) => `${i + 1}. ${p.title} — KES ${Number(p.price).toLocaleString()}${p.averageRating ? ` (${Number(p.averageRating).toFixed(1)}★)` : ''}${p.location ? ` — ${p.location}` : ''}`).join('\n') || 'No products found.'}

Instructions:
- Be friendly, concise, and helpful.
- If products exist, recommend the best 1-2 with reasons.
- If no products, suggest alternatives or broad suggestions.
- Use KES for prices.
- Keep replies under 3 sentences unless comparing.`

      aiReply = await tryAIProviders(systemPrompt, message)
    }

    // 4. Fallback reply
    const reply = aiReply || buildReply(intent, products)

    return NextResponse.json({
      reply,
      products,
      intent: {
        query: intent.query,
        category: intent.category,
        maxPrice: intent.maxPrice,
        minPrice: intent.minPrice,
      },
      aiPowered: !!aiReply,
    })
  } catch (error: any) {
    console.error('AI chat error:', error?.message)
    return NextResponse.json({
      reply: "I'm having trouble right now. Please try again or use the search bar above.",
      products: [],
    }, { status: 500 })
  }
}