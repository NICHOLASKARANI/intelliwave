import { NextRequest, NextResponse } from 'next/server'

// ML-based estimation model (simplified for demo - can connect to real ML model)
function calculateEstimate(projectType: string, features: string[], complexity: string) {
  const basePrice: Record<string, number> = {
    website: 150000,
    ecommerce: 100000,
    webapp: 300000,
    mobile: 200000,
    ai: 500000,
    saas: 400000,
  }

  const complexityMultiplier: Record<string, number> = {
    low: 0.7,
    medium: 1,
    high: 1.5,
    enterprise: 2.5,
  }

  const featureMultiplier = 1 + features.length * 0.15
  const base = basePrice[projectType] || 200000
  const complexityFactor = complexityMultiplier[complexity] || 1

  const estimate = Math.round(base * complexityFactor * featureMultiplier)
  const min = Math.round(estimate * 0.8)
  const max = Math.round(estimate * 1.3)

  return {
    estimatedCost: estimate,
    range: { min, max },
    currency: 'KES',
    confidence: features.length > 3 ? 'high' : 'medium',
    timeline: Math.round(estimate / 50000), // weeks
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { projectType, features, complexity } = body

    if (!projectType) {
      return NextResponse.json(
        { error: 'Project type is required' },
        { status: 400 }
      )
    }

    const estimate = calculateEstimate(
      projectType,
      features || [],
      complexity || 'medium'
    )

    return NextResponse.json({
      success: true,
      data: estimate,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate estimate' },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    service: 'AI Project Estimator',
    version: '1.0.0',
    endpoints: {
      POST: '/api/ai/estimate',
      description: 'Get AI-powered project cost estimation',
      parameters: {
        projectType: 'website | ecommerce | webapp | mobile | ai | saas',
        features: 'Array of feature strings',
        complexity: 'low | medium | high | enterprise',
      },
    },
  })
}