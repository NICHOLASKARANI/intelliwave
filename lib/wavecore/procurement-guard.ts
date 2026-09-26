/**
 * WaveCore Procurement Guard
 * --------------------------
 * Uses an explicit type guard function to guarantee TypeScript narrows
 * correctly. No discriminated-union quirks. Works everywhere.
 */

import { NextRequest, NextResponse } from 'next/server'
import { guardModule, GuardAction } from './guard'

export type ProcurementAction = 'READ' | 'WRITE' | 'APPROVE' | 'DELETE' | 'EXPORT'

const ACTION_MAP: Record<ProcurementAction, GuardAction> = {
  READ:    'PROCUREMENT_READ',
  WRITE:   'PROCUREMENT_WRITE',
  APPROVE: 'PROCUREMENT_APPROVE',
  DELETE:  'PROCUREMENT_DELETE',
  EXPORT:  'PROCUREMENT_EXPORT',
}

export interface ProcurementContext {
  ok: true
  deny: false
  session: any
  organizationId: string
  userId: string
  userName: string
  action: ProcurementAction
  tier: number
}

export interface ProcurementDenial {
  ok: false
  deny: true
  response: NextResponse
}

export type ProcurementGuardResult = ProcurementContext | ProcurementDenial

/** Type guard — proves to TS that a denial is a denial */
function isDenial(x: ProcurementGuardResult): x is ProcurementDenial {
  return x.ok === false
}

/** Type guard — proves to TS that a context is a context */
function isContext(x: ProcurementGuardResult): x is ProcurementContext {
  return x.ok === true
}

export class ProcurementDenied extends Error {
  response: NextResponse
  constructor(response: NextResponse) {
    super('PROCUREMENT_DENIED')
    this.name = 'ProcurementDenied'
    this.response = response
  }
}

export async function guardProcurement(
  request: NextRequest,
  action: ProcurementAction = 'READ'
): Promise<ProcurementGuardResult> {
  const g = await guardModule(request, ACTION_MAP[action])

  if (g.deny || !g.session) {
    const denied: ProcurementDenial = {
      ok: false,
      deny: true,
      response: g.response || NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
    return denied
  }

  const s: any = g.session
  const ctx: ProcurementContext = {
    ok: true,
    deny: false,
    session: s,
    organizationId: String(s.organizationId),
    userId: String(s.userId),
    userName: String(s.name || s.email || 'Unknown'),
    action,
    tier: g.tier,
  }
  return ctx
}

/**
 * Assert guard — throws ProcurementDenied on failure.
 * Uses the isDenial type guard so TS narrows 100% reliably.
 */
export async function assertProcurement(
  request: NextRequest,
  action: ProcurementAction = 'READ'
): Promise<ProcurementContext> {
  const g = await guardProcurement(request, action)
  if (isDenial(g)) {
    throw new ProcurementDenied(g.response)
  }
  return g
}

export async function logProcurementEvent(
  pool: any,
  params: {
    organizationId: string
    eventType: string
    entityType: string
    entityId: string
    actorId: string
    actorName: string
    summary: string
    metadata?: Record<string, any>
  }
) {
  const crypto = require('crypto')
  const id = crypto.randomUUID()
  try {
    await pool.query(
      `INSERT INTO "ProcurementEvent"
         (id, "organizationId", "eventType", "entityType", "entityId",
          "actorId", "actorName", "summary", metadata, "createdAt")
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,NOW())`,
      [
        id,
        params.organizationId,
        params.eventType,
        params.entityType,
        params.entityId,
        params.actorId,
        params.actorName,
        params.summary,
        params.metadata ? JSON.stringify(params.metadata) : null,
      ]
    )
  } catch (err) {
    console.error('[procurement-guard] failed to log event:', (err as Error).message)
  }
}

export function procurementHandler<T extends any[]>(
  fn: (req: NextRequest, ...args: T) => Promise<NextResponse>
) {
  return async (req: NextRequest, ...args: T): Promise<NextResponse> => {
    try {
      return await fn(req, ...args)
    } catch (error) {
      if (error instanceof ProcurementDenied) {
        return error.response
      }
      console.error('[procurement] unhandled:', error)
      return NextResponse.json(
        { error: 'Something went wrong. Please try again.' },
        { status: 500 }
      )
    }
  }
}