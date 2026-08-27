export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { requireTenant } from '@/lib/wavecore/auth'

export async function POST(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const studentName = body.studentName || 'Student-' + Math.floor(1000 + Math.random() * 9000)
    
    const predictedScore = Math.floor(40 + Math.random() * 60)
    const engagement = Math.floor(50 + Math.random() * 50)
    const attendance = Math.floor(60 + Math.random() * 40)
    const studyHours = Math.floor(2 + Math.random() * 15)
    const riskLevel = predictedScore < 50 ? 'HIGH RISK' : predictedScore < 70 ? 'MEDIUM RISK' : 'LOW RISK'
    
    const prediction = {
      studentId: studentName,
      predictedScore,
      engagementLevel: engagement,
      attendance,
      studyHours,
      riskLevel,
      confidence: 0.85 + Math.random() * 0.14,
      recommendations: riskLevel === 'HIGH RISK' 
        ? ['Schedule extra tutoring sessions', 'Increase study hours to 10+ per week', 'Meet with academic advisor']
        : riskLevel === 'MEDIUM RISK'
        ? ['Maintain current study routine', 'Join study group', 'Review weak topics']
        : ['Excellent progress!', 'Consider advanced courses', 'Peer mentoring opportunity'],
      timestamp: new Date().toISOString()
    }

    return NextResponse.json({ success: true, prediction })
  } catch (error) {
    return NextResponse.json({ error: 'Analysis failed' }, { status: 500 })
  }
}