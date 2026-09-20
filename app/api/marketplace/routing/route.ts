export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'
import { guardHR } from '@/lib/wavecore/guard'

// Haversine distance in km
function haversine(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}

interface SellerOffer {
  sellerId: string
  sellerName: string
  storeName: string | null
  listingId: number
  title: string
  price: number
  quantity: number
  stock: number
  slaHours: number
  fulfillmentType: string
  latitude: number | null
  longitude: number | null
  distance: number | null
  trustScore: number
  averageRating: number
  totalReviews: number
  images: string[]
  deliveryCostEstimate: number
  totalCost: number
  fulfillmentScore: number
  deliveryEta: string
}

// Calculate delivery cost based on distance + base rate
function calculateDeliveryCost(distance: number | null, fulfillmentType: string): number {
  const BASE = 200
  if (fulfillmentType === 'PICKUP') return 0
  if (distance === null) return 300
  return Math.round(BASE + distance * 40)
}

// Calculate ETA as human-readable string
function calculateEta(distance: number | null, slaHours: number, fulfillmentType: string): string {
  if (fulfillmentType === 'PICKUP') return 'Ready for pickup'
  if (distance === null) return `${slaHours}h`
  if (distance < 3) return '30 min'
  if (distance < 10) return '1 hour'
  if (distance < 30) return '2-3 hours'
  if (distance < 100) return 'Same day'
  return `${slaHours}h`
}

// Compute fulfillment score (higher = better)
function computeScore(offer: SellerOffer): number {
  // Distance weight (closer is better, capped at 100km)
  const distanceScore = offer.distance !== null ? Math.max(0, 100 - (offer.distance / 100) * 100) : 30

  // Trust weight
  const trustWeight = offer.trustScore * 0.9

  // Rating weight (0-5 scaled to 0-100)
  const ratingWeight = offer.averageRating * 18

  // SLA weight (lower hours is better)
  const slaWeight = Math.max(0, 100 - offer.slaHours)

  // Stock confidence (more stock = safer)
  const stockWeight = Math.min(100, offer.stock * 10)

  return Math.round(
    distanceScore * 0.35 +
    trustWeight * 0.20 +
    ratingWeight * 0.15 +
    slaWeight * 0.15 +
    stockWeight * 0.15
  )
}

// POST: Route order — given cartId (or items[]) + buyer location, return best fulfillment options
export async function POST(req: NextRequest) {
  try {
    const session = await requireTenant(req)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const guard = await guardHR(req, 'HR_READ')
    if (guard.deny) return guard.response!

    const body = await req.json()
    const buyerLat = Number(body.latitude || -1.2921) // default Nairobi
    const buyerLon = Number(body.longitude || 36.8219)

    // Determine what to route: cartId OR explicit items array
    let requestedItems: { listingId: number; quantity: number; title?: string }[] = []

    if (body.cartId) {
      const cartRes = await pool.query(
        `SELECT ci."listingId", ci.quantity, l.title
         FROM "CartItem" ci
         JOIN "MarketplaceListing" l ON ci."listingId" = l.id
         WHERE ci."cartId" = $1`,
        [body.cartId]
      )
      requestedItems = cartRes.rows.map(r => ({ listingId: r.listingId, quantity: r.quantity, title: r.title }))
    } else if (body.items && Array.isArray(body.items)) {
      requestedItems = body.items.map((i: any) => ({ listingId: Number(i.listingId), quantity: Number(i.quantity || 1) }))
    }

    if (requestedItems.length === 0) {
      // Fall back to active cart for this user
      const userCart = await pool.query(
        `SELECT ci."listingId", ci.quantity, l.title
         FROM "Cart" c
         JOIN "CartItem" ci ON ci."cartId" = c.id
         JOIN "MarketplaceListing" l ON ci."listingId" = l.id
         WHERE c."userId" = $1 AND c.status = 'ACTIVE'`,
        [session.userId]
      )
      requestedItems = userCart.rows.map(r => ({ listingId: r.listingId, quantity: r.quantity, title: r.title }))
    }

    if (requestedItems.length === 0) {
      return NextResponse.json({ error: 'No items to route' }, { status: 400 })
    }

    // For each requested item, find all competing listings (same product title match or same listing)
    const offersByItem: { requested: any; offers: SellerOffer[] }[] = []

    for (const item of requestedItems) {
      // Get the base listing
      const baseRes = await pool.query(
        `SELECT id, title, category, sku, price FROM "MarketplaceListing" WHERE id = $1`,
        [item.listingId]
      )
      if (baseRes.rows.length === 0) continue
      const base = baseRes.rows[0]

      // Find all sellers offering this exact listing OR same SKU OR same normalized title
      let matchingQuery = `
        SELECT l.id AS "listingId", l.title, l.price, l.stock, l."slaHours", l."fulfillmentType",
               l."latitude", l."longitude", l.images,
               l."sellerId", u.name AS "sellerName",
               sp."storeName", sp."trustScore", sp."averageRating", sp."totalReviews"
        FROM "MarketplaceListing" l
        LEFT JOIN "User" u ON l."sellerId" = u.id
        LEFT JOIN "SellerProfile" sp ON sp."userId" = l."sellerId"
        WHERE l.status = 'ACTIVE' AND l.stock >= $1
          AND (l.id = $2`
      const params: any[] = [item.quantity, item.listingId]

      if (base.sku) {
        matchingQuery += ` OR l.sku = $3`
        params.push(base.sku)
        if (base.title) {
          matchingQuery += ` OR LOWER(l.title) = LOWER($4)`
          params.push(base.title)
        }
      } else if (base.title) {
        matchingQuery += ` OR LOWER(l.title) = LOWER($3)`
        params.push(base.title)
      }

      matchingQuery += `) ORDER BY l.price ASC LIMIT 30`

      const matchingRes = await pool.query(matchingQuery, params)

      const offers: SellerOffer[] = matchingRes.rows.map((r: any) => {
        let distance: number | null = null
        if (r.latitude !== null && r.longitude !== null) {
          distance = Math.round(haversine(buyerLat, buyerLon, Number(r.latitude), Number(r.longitude)) * 10) / 10
        }

        const price = Number(r.price)
        const lineTotal = price * item.quantity
        const deliveryCost = calculateDeliveryCost(distance, r.fulfillmentType || 'SELLER_SHIP')
        const totalCost = lineTotal + deliveryCost

        const offer: SellerOffer = {
          sellerId: r.sellerId,
          sellerName: r.sellerName || 'Unknown Seller',
          storeName: r.storeName || null,
          listingId: r.listingId,
          title: r.title,
          price,
          quantity: item.quantity,
          stock: Number(r.stock || 0),
          slaHours: Number(r.slaHours || 48),
          fulfillmentType: r.fulfillmentType || 'SELLER_SHIP',
          latitude: r.latitude,
          longitude: r.longitude,
          distance,
          trustScore: Number(r.trustScore || 50),
          averageRating: Number(r.averageRating || 0),
          totalReviews: Number(r.totalReviews || 0),
          images: r.images || [],
          deliveryCostEstimate: deliveryCost,
          totalCost: Math.round(totalCost * 100) / 100,
          fulfillmentScore: 0,
          deliveryEta: calculateEta(distance, Number(r.slaHours || 48), r.fulfillmentType || 'SELLER_SHIP'),
        }
        offer.fulfillmentScore = computeScore(offer)
        return offer
      })

      offersByItem.push({ requested: item, offers })
    }

    // Compute the 3 routing strategies:
    // 1. FASTEST — for each item, pick offer with lowest ETA (distance-based)
    // 2. CHEAPEST — for each item, pick offer with lowest total cost
    // 3. MOST_TRUSTED — for each item, pick offer with highest fulfillment score

    const pickStrategy = (strategy: 'fastest' | 'cheapest' | 'trusted') => {
      let grandTotal = 0
      let grandDelivery = 0
      const selections: any[] = []

      for (const { requested, offers } of offersByItem) {
        if (offers.length === 0) continue
        let best: SellerOffer
        if (strategy === 'fastest') {
          best = [...offers].sort((a, b) => (a.distance ?? 9999) - (b.distance ?? 9999))[0]
        } else if (strategy === 'cheapest') {
          best = [...offers].sort((a, b) => a.totalCost - b.totalCost)[0]
        } else {
          best = [...offers].sort((a, b) => b.fulfillmentScore - a.fulfillmentScore)[0]
        }
        grandTotal += best.totalCost
        grandDelivery += best.deliveryCostEstimate
        selections.push({
          requestedQuantity: requested.quantity,
          listingId: best.listingId,
          title: best.title,
          sellerId: best.sellerId,
          sellerName: best.sellerName,
          storeName: best.storeName,
          unitPrice: best.price,
          quantity: requested.quantity,
          lineTotal: Math.round(best.price * requested.quantity * 100) / 100,
          deliveryCost: best.deliveryCostEstimate,
          itemTotal: best.totalCost,
          distance: best.distance,
          eta: best.deliveryEta,
          fulfillmentScore: best.fulfillmentScore,
          trustScore: best.trustScore,
          averageRating: best.averageRating,
          totalReviews: best.totalReviews,
          images: best.images,
          fulfillmentType: best.fulfillmentType,
        })
      }

      // Delivery cost is per unique seller
      const uniqueSellers = new Set(selections.map(s => s.sellerId))
      const consolidatedDelivery = uniqueSellers.size * 300

      return {
        strategy,
        selections,
        subtotal: Math.round(selections.reduce((s, x) => s + x.lineTotal, 0) * 100) / 100,
        deliveryFee: consolidatedDelivery,
        total: Math.round((selections.reduce((s, x) => s + x.lineTotal, 0) + consolidatedDelivery) * 100) / 100,
        sellerCount: uniqueSellers.size,
        itemCount: selections.length,
      }
    }

    const options = {
      fastest: pickStrategy('fastest'),
      cheapest: pickStrategy('cheapest'),
      trusted: pickStrategy('trusted'),
    }

    // Also return full offers per item for transparency
    return NextResponse.json({
      buyerLocation: { latitude: buyerLat, longitude: buyerLon },
      options,
      offersByItem: offersByItem.map(o => ({
        requested: o.requested,
        offerCount: o.offers.length,
        offers: o.offers.slice(0, 10),
      })),
    })
  } catch (error) {
    console.error('Routing error:', error)
    return NextResponse.json({ error: 'Something went wrong. Please try again.' }, { status: 500 })
  }
}