export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'
import { pool } from '@/lib/wavecore/db'

const BRANDS = ['Toyota', 'Honda', 'Mercedes', 'BMW', 'Ford', 'Nissan', 'Mazda', 'Subaru', 'Volkswagen', 'Isuzu']
const MODELS: Record<string, string[]> = {
  'Toyota': ['Corolla', 'Camry', 'Hilux', 'Land Cruiser', 'RAV4'],
  'Honda': ['Civic', 'Accord', 'CR-V', 'Fit'],
  'Mercedes': ['C-Class', 'E-Class', 'GLE', 'S-Class'],
  'BMW': ['3 Series', '5 Series', 'X3', 'X5'],
  'Ford': ['Focus', 'Ranger', 'Everest', 'F-150'],
  'Nissan': ['Altima', 'X-Trail', 'Patrol', 'Navara'],
  'Mazda': ['Mazda3', 'CX-5', 'CX-9', 'BT-50'],
  'Subaru': ['Impreza', 'Forester', 'Outback', 'XV'],
  'Volkswagen': ['Golf', 'Passat', 'Tiguan', 'Touareg'],
  'Isuzu': ['D-Max', 'MU-X', 'N-Series']
}
const COLORS = ['White', 'Black', 'Silver', 'Grey', 'Blue', 'Red', 'Green', 'Brown']
const TYPES = ['Sedan', 'SUV', 'Truck', 'Hatchback', 'Van', 'Motorcycle']

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const brand = BRANDS[Math.floor(Math.random() * BRANDS.length)]
    const model = MODELS[brand][Math.floor(Math.random() * MODELS[brand].length)]
    
    const vehicle = {
      plateNumber: `K${['A','B','C','D'][Math.floor(Math.random()*4)]}${['A','B','C','D','E'][Math.floor(Math.random()*5)]} ${100 + Math.floor(Math.random()*900)}${['A','B','C','D','E','F','G','H','J','K'][Math.floor(Math.random()*10)]}`,
      brand,
      model,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      vehicleType: TYPES[Math.floor(Math.random() * TYPES.length)],
      confidence: 0.88 + Math.random() * 0.11,
      timestamp: new Date().toISOString()
    }

    const crypto = require('crypto')
    const id = crypto.randomUUID()
    await pool.query(
      `INSERT INTO "VehicleRecognition" (id, "plateNumber", brand, model, color, "vehicleType", confidence, "organizationId", "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())`,
      [id, vehicle.plateNumber, brand, model, vehicle.color, vehicle.vehicleType, vehicle.confidence, session.organizationId]
    )

    return NextResponse.json({ success: true, vehicle })
  } catch (error) {
    return NextResponse.json({ error: 'Recognition failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const result = await pool.query(
      `SELECT * FROM "VehicleRecognition" WHERE "organizationId" = $1 ORDER BY "createdAt" DESC LIMIT 50`,
      [session.organizationId]
    )
    return NextResponse.json({ vehicles: result.rows })
  } catch {
    return NextResponse.json({ vehicles: [] })
  }
}