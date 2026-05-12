import { NextRequest, NextResponse } from 'next/server'

function scoreLead(data: {
  company?: string
  budget?: string
  timeline?: string
  projectType?: string
  source?: string
}): { score: number; priority: string; recommendation: string } {
  let score = 0

  // Company size scoring
  if (data.company) {
    const companyLower = data.company.toLowerCase()
    if (companyLower.includes('bank') || companyLower.includes('hospital') || companyLower.includes('government')) {
      score += 30
    } else if (companyLower.includes('tech') || companyLower.includes('startup')) {
      score += 20
    } else {
      score += 10
    }
  }

  // Budget scoring
  if (data.budget) {
    const budgetNum = parseInt(data.budget.replace(/[^0-9]/g, ''))
    if (budgetNum > 1000000) score += 30
    else if (budgetNum > 500000) score += 20
    else if (budgetNum > 100000) score += 10
  }

  // Timeline scoring
  if (data.timeline === 'immediate' || data.timeline === 'asap') {
    score += 25
  } else if (data.timeline === '1-3 months') {
    score += 15
  } else {
    score += 5
  }

  // Source scoring
  if (data.source === 'referral') score += 20
  else if (data.source === 'website') score += 10
  else if (data.source === 'linkedin') score += 15

  let priority = 'Low'
  let recommendation = 'Nurture with email sequence'

  if (score >= 70) {
    priority = 'High'
    recommendation = 'Immediate sales call + dedicated onboarding'
  } else if (score >= 40) {
    priority = 'Medium'
    recommendation = 'Schedule consultation within 48 hours'
  }

  return { score: Math.min(score, 100), priority, recommendation }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const result = scoreLead(body)

    return NextResponse.json({
      success: true,
      data: result,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to score lead' },
      { status: 500 }
    )
  }
}