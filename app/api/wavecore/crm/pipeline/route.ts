export const dynamic = 'force-dynamic'

import { NextRequest, NextResponse } from 'next/server'
import { pool } from '@/lib/wavecore/db'
import { requireTenant } from '@/lib/wavecore/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireTenant(request)
    const orgId = session!.organizationId

    // Get all pipeline stages
    const stages = await pool.query(
      `SELECT id, name, "order", color
       FROM "PipelineStage"
       WHERE "organizationId" = $1
       ORDER BY "order" ASC`,
      [orgId]
    )

    // Get all opportunities with their stages
    const opportunities = await pool.query(
      `SELECT o.id, o.name, o.amount, o.stage, o.probability,
              c.name as customer_name
       FROM "Opportunity" o
       LEFT JOIN "Customer" c ON c.id = o."customerId"
       WHERE o."organizationId" = $1
       ORDER BY o."createdAt" DESC`,
      [orgId]
    )

    // Group opportunities by stage
    const pipeline = stages.rows.map(stage => ({
      ...stage,
      opportunities: opportunities.rows.filter(opp => {
        // Map stage name to opportunity stage
        const stageMap: Record<string, string> = {
          'Qualification': 'QUALIFICATION',
          'Needs Analysis': 'NEEDS_ANALYSIS',
          'Proposal': 'PROPOSAL',
          'Negotiation': 'NEGOTIATION',
          'Closed Won': 'CLOSED_WON',
          'Closed Lost': 'CLOSED_LOST',
        }
        return opp.stage === stageMap[stage.name]
      }),
      totalValue: opportunities.rows
        .filter(opp => {
          const stageMap: Record<string, string> = {
            'Qualification': 'QUALIFICATION',
            'Needs Analysis': 'NEEDS_ANALYSIS',
            'Proposal': 'PROPOSAL',
            'Negotiation': 'NEGOTIATION',
            'Closed Won': 'CLOSED_WON',
            'Closed Lost': 'CLOSED_LOST',
          }
          return opp.stage === stageMap[stage.name]
        })
        .reduce((sum, opp) => sum + (opp.amount || 0), 0),
    }))

    // Open pipeline excludes both CLOSED_WON and CLOSED_LOST — the
    // number a sales leader wants is what is still in play.
    const openRows = opportunities.rows.filter(
      o => o.stage !== 'CLOSED_WON' && o.stage !== 'CLOSED_LOST'
    )
    const totalPipelineValue = openRows.reduce((sum, opp) => sum + (opp.amount || 0), 0)

    // Win rate = won / (won + lost). Deals still in progress do not
    // count against the ratio — matches standard CRM practice.
    const wonCount   = opportunities.rows.filter(o => o.stage === 'CLOSED_WON').length
    const lostCount  = opportunities.rows.filter(o => o.stage === 'CLOSED_LOST').length
    const closedCount = wonCount + lostCount
    const winRate = closedCount > 0 ? Math.round((wonCount / closedCount) * 100) : 0
    const totalCount = opportunities.rows.length

    return NextResponse.json({
      pipeline,
      summary: {
        totalOpportunities: totalCount,
        totalPipelineValue,
        wonCount,
        winRate,
      },
    })
  } catch (error) {
    console.error('Pipeline error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
