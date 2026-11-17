/**
 * WaveCore Finance — Fiscal Period Helper
 *
 * Resolve (or auto-create) the correct FiscalPeriod for a posting date.
 * Enforces the enterprise rule: cannot post to a closed period.
 *
 * Runs inside the caller's transaction so period creation + journal insert
 * commit or roll back together (no orphan periods).
 */

import type { PoolClient } from 'pg'

export interface ResolvedPeriod {
  periodId: string
  periodName: string
  fiscalYearId: string
  autoCreatedPeriod: boolean
  autoCreatedYear: boolean
}

/**
 * Convert a date to a UTC midnight Date object on the 1st of its month.
 */
function monthStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1))
}

/**
 * Convert a date to a UTC midnight Date object on the 1st of the NEXT month.
 */
function nextMonthStart(d: Date): Date {
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + 1, 1))
}

function formatPeriodName(d: Date): string {
  // "Nov 2026"
  const months = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${months[d.getUTCMonth()]} ${d.getUTCFullYear()}`
}

/**
 * Ensure a valid, open FiscalPeriod exists for the given posting date.
 * Throws if the target period is closed.
 */
export async function resolveOpenPeriod(
  client: PoolClient,
  organizationId: string,
  dateInput: Date | string
): Promise<ResolvedPeriod> {
  const date = dateInput instanceof Date ? dateInput : new Date(dateInput)
  if (isNaN(date.getTime())) throw new Error('Invalid posting date')

  // STEP 1: Find the FiscalYear containing this date for this org
  const yearRes = await client.query(
    `SELECT id, name, "startDate", "endDate", "isClosed"
     FROM "FiscalYear"
     WHERE "organizationId" = $1
       AND $2::timestamp >= "startDate"
       AND $2::timestamp <  "endDate"
     LIMIT 1`,
    [organizationId, date]
  )

  let fiscalYearId: string
  let autoCreatedYear = false

  if (yearRes.rowCount === 0) {
    // STEP 2a: Auto-create a calendar-year FiscalYear covering this date
    const crypto = require('crypto')
    fiscalYearId = crypto.randomUUID()
    const ys = new Date(Date.UTC(date.getUTCFullYear(), 0, 1))
    const ye = new Date(Date.UTC(date.getUTCFullYear() + 1, 0, 1))
    const yearName = `FY ${date.getUTCFullYear()}`
    await client.query(
      `INSERT INTO "FiscalYear"
         (id, name, "startDate", "endDate", "isClosed", "organizationId", "createdAt")
       VALUES ($1, $2, $3, $4, FALSE, $5, NOW())`,
      [fiscalYearId, yearName, ys, ye, organizationId]
    )
    autoCreatedYear = true
  } else {
    fiscalYearId = yearRes.rows[0].id
    if (yearRes.rows[0].isClosed) {
      throw new Error(`Cannot post to closed fiscal year ${yearRes.rows[0].name}`)
    }
  }

  // STEP 3: Find the FiscalPeriod containing this date under that year
  const periodRes = await client.query(
    `SELECT id, name, "isClosed"
     FROM "FiscalPeriod"
     WHERE "fiscalYearId" = $1
       AND $2::timestamp >= "startDate"
       AND $2::timestamp <  "endDate"
     LIMIT 1`,
    [fiscalYearId, date]
  )

  if (periodRes.rowCount !== 0) {
    const period = periodRes.rows[0]
    if (period.isClosed) {
      throw new Error(`Cannot post to closed period ${period.name}`)
    }
    return {
      periodId: period.id,
      periodName: period.name,
      fiscalYearId,
      autoCreatedPeriod: false,
      autoCreatedYear,
    }
  }

  // STEP 4: Auto-create the period for this month
  const crypto = require('crypto')
  const periodId = crypto.randomUUID()
  const ps = monthStart(date)
  const pe = nextMonthStart(date)
  const pName = formatPeriodName(ps)
  await client.query(
    `INSERT INTO "FiscalPeriod"
       (id, name, "startDate", "endDate", "isClosed", "fiscalYearId", "createdAt")
     VALUES ($1, $2, $3, $4, FALSE, $5, NOW())`,
    [periodId, pName, ps, pe, fiscalYearId]
  )

  return {
    periodId,
    periodName: pName,
    fiscalYearId,
    autoCreatedPeriod: true,
    autoCreatedYear,
  }
}