import { NextRequest, NextResponse } from 'next/server'

interface ServiceRecommendation {
  service: string
  confidence: number
  reason: string
  estimatedCost: string
  timeline: string
}

// ML recommendation logic
function recommendServices(answers: Record<string, string>): ServiceRecommendation[] {
  const recommendations: ServiceRecommendation[] = []

  // Rule-based AI logic (can be replaced with actual ML model)
  if (answers.goal === 'automate' || answers.goal === 'Automate Business Processes') {
    recommendations.push({
      service: 'AI Automation Suite',
      confidence: 0.95,
      reason: 'Your goal to automate processes aligns perfectly with our AI automation solutions',
      estimatedCost: 'KSh 150,000 - 500,000',
      timeline: '4-8 weeks',
    })
  }

  if (answers.goal === 'saas' || answers.goal === 'Build a SaaS Product') {
    recommendations.push({
      service: 'SaaS Development Platform',
      confidence: 0.92,
      reason: 'Building a SaaS product requires our specialized multi-tenant architecture expertise',
      estimatedCost: 'KSh 300,000 - 3,000,000',
      timeline: '8-16 weeks',
    })
  }

  if (answers.scale === 'enterprise' || answers.scale === 'Enterprise (100,000+)') {
    recommendations.push({
      service: 'Enterprise Cloud Infrastructure',
      confidence: 0.88,
      reason: 'Enterprise scale requires robust cloud infrastructure with auto-scaling',
      estimatedCost: 'KSh 1,000,000+',
      timeline: '12-24 weeks',
    })
  }

  if (answers.timeline === 'asap' || answers.timeline === 'Immediate (ASAP)') {
    recommendations.push({
      service: 'Rapid Development Sprint',
      confidence: 0.85,
      reason: 'Urgent timeline matched with our accelerated development program',
      estimatedCost: 'KSh 200,000 - 800,000',
      timeline: '2-6 weeks',
    })
  }

  // Default recommendation
  if (recommendations.length === 0) {
    recommendations.push({
      service: 'Custom Enterprise Solution',
      confidence: 0.75,
      reason: 'Based on your requirements, a custom solution would be most effective',
      estimatedCost: 'KSh 300,000 - 3,000,000',
      timeline: '8-16 weeks',
    })
  }

  return recommendations.sort((a, b) => b.confidence - a.confidence)
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { answers } = body

    if (!answers || Object.keys(answers).length === 0) {
      return NextResponse.json(
        { error: 'Answers are required for recommendations' },
        { status: 400 }
      )
    }

    const recommendations = recommendServices(answers)

    return NextResponse.json({
      success: true,
      data: {
        recommendations,
        totalOptions: recommendations.length,
        topPick: recommendations[0],
      },
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to generate recommendations' },
      { status: 500 }
    )
  }
}