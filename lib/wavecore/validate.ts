// ============================================================
// WaveCore Input Validation Library
// Non-breaking: valid data flows unchanged; malformed data
// rejected with friendly 400 responses + field-level messages.
// ============================================================

export interface ValidationResult {
  valid: boolean
  errors: string[]
  fields: Record<string, string>
}

function ok(): ValidationResult {
  return { valid: true, errors: [], fields: {} }
}

function fail(fields: Record<string, string>): ValidationResult {
  const errors = Object.entries(fields).map(([k, v]) => `${k}: ${v}`)
  return { valid: false, errors, fields }
}

// ============ PRIMITIVE VALIDATORS ============

export function isValidEmail(v: any): boolean {
  if (typeof v !== 'string') return false
  const s = v.trim()
  if (s.length < 5 || s.length > 254) return false
  // RFC 5322-lite
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(s)
}

export function isValidKenyanPhone(v: any): boolean {
  if (typeof v !== 'string') return false
  const s = v.trim().replace(/\s+/g, '')
  return /^(\+254|0)[17]\d{8}$/.test(s)
}

export function isValidKraPin(v: any): boolean {
  if (typeof v !== 'string') return false
  return /^[A-Z]\d{9}[A-Z]$/.test(v.trim().toUpperCase())
}

export function isValidNssfNumber(v: any): boolean {
  if (typeof v !== 'string') return false
  const s = v.trim()
  if (s.length < 6 || s.length > 15) return false
  return /^[A-Za-z0-9]+$/.test(s)
}

export function isValidNhifNumber(v: any): boolean {
  if (typeof v !== 'string') return false
  const s = v.trim()
  if (s.length < 6 || s.length > 15) return false
  return /^\d+$/.test(s)
}

export function isValidIdNumber(v: any): boolean {
  if (typeof v !== 'string') return false
  const s = v.trim()
  if (s.length < 7 || s.length > 10) return false
  return /^\d+$/.test(s)
}

export function isValidSalary(v: any): boolean {
  const n = Number(v)
  if (isNaN(n) || !isFinite(n)) return false
  if (n < 0 || n > 100_000_000) return false
  return true
}

export function isValidString(v: any, max = 500): boolean {
  if (typeof v !== 'string') return false
  return v.length <= max
}

export function isValidDate(v: any): boolean {
  if (v === null || v === undefined || v === '') return false
  const d = new Date(v)
  return !isNaN(d.getTime()) && d.getFullYear() >= 1900 && d.getFullYear() <= 2100
}

export function isValidInt(v: any, min = 0, max = Number.MAX_SAFE_INTEGER): boolean {
  const n = Number(v)
  if (!Number.isInteger(n)) return false
  if (n < min || n > max) return false
  return true
}

// ============ COMPOSITE: EMPLOYEE ============

export interface EmployeeInput {
  firstName?: string
  lastName?: string
  email?: string
  phone?: string
  idNumber?: string
  taxPin?: string
  nssfNumber?: string
  nhifNumber?: string
  salary?: number | string
  notes?: string
  preferredName?: string
}

export function validateEmployeeInput(body: EmployeeInput, requireCore = false): ValidationResult {
  const fields: Record<string, string> = {}

  // Required fields (only on create)
  if (requireCore) {
    if (!body.firstName || !String(body.firstName).trim()) fields.firstName = 'First name is required'
    if (!body.lastName || !String(body.lastName).trim()) fields.lastName = 'Last name is required'
  }

  // Length caps (applies to both create and update)
  if (body.firstName !== undefined && !isValidString(body.firstName, 100)) fields.firstName = 'Must be 100 chars or fewer'
  if (body.lastName !== undefined && !isValidString(body.lastName, 100)) fields.lastName = 'Must be 100 chars or fewer'
  if (body.preferredName !== undefined && body.preferredName !== '' && !isValidString(body.preferredName, 100)) fields.preferredName = 'Must be 100 chars or fewer'
  if (body.notes !== undefined && body.notes !== '' && !isValidString(body.notes, 2000)) fields.notes = 'Must be 2000 chars or fewer'

  // Optional format checks (only if provided and non-empty)
  if (body.email && !isValidEmail(body.email)) fields.email = 'Invalid email format'
  if (body.phone && !isValidKenyanPhone(body.phone)) fields.phone = 'Must be Kenyan format (+254… or 0…)'
  if (body.idNumber && !isValidIdNumber(body.idNumber)) fields.idNumber = 'Must be 7–10 digits'
  if (body.taxPin && !isValidKraPin(body.taxPin)) fields.taxPin = 'Must be KRA PIN format (e.g. A123456789Z)'
  if (body.nssfNumber && !isValidNssfNumber(body.nssfNumber)) fields.nssfNumber = 'Must be 6–15 alphanumeric'
  if (body.nhifNumber && !isValidNhifNumber(body.nhifNumber)) fields.nhifNumber = 'Must be 6–15 digits'
  if (body.salary !== undefined && body.salary !== '' && !isValidSalary(body.salary)) fields.salary = 'Must be between 0 and 100,000,000'

  return Object.keys(fields).length === 0 ? ok() : fail(fields)
}

// ============ COMPOSITE: LEAVE ============

export interface LeaveInput {
  employeeId?: string
  startDate?: string
  endDate?: string
  days?: number | string
  reason?: string
}

export function validateLeaveInput(body: LeaveInput, requireCore = false): ValidationResult {
  const fields: Record<string, string> = {}

  if (requireCore) {
    if (!body.employeeId) fields.employeeId = 'Employee is required'
    if (!body.startDate) fields.startDate = 'Start date is required'
    if (!body.endDate) fields.endDate = 'End date is required'
  }

  if (body.startDate && !isValidDate(body.startDate)) fields.startDate = 'Invalid date'
  if (body.endDate && !isValidDate(body.endDate)) fields.endDate = 'Invalid date'

  if (body.startDate && body.endDate) {
    const s = new Date(body.startDate).getTime()
    const e = new Date(body.endDate).getTime()
    if (e < s) fields.endDate = 'End date must be after start date'
  }

  if (body.days !== undefined && body.days !== '') {
    const d = Number(body.days)
    if (isNaN(d) || d < 0 || d > 365) fields.days = 'Must be between 0 and 365'
  }

  if (body.reason !== undefined && body.reason !== '' && !isValidString(body.reason, 500)) fields.reason = 'Must be 500 chars or fewer'

  return Object.keys(fields).length === 0 ? ok() : fail(fields)
}

// ============ COMPOSITE: ATTENDANCE ============

export interface AttendanceInput {
  employeeId?: string
  date?: string
  checkIn?: string
  checkOut?: string
  status?: string
  notes?: string
}

const VALID_STATUSES = ['PRESENT', 'LATE', 'ABSENT', 'LEAVE', 'REMOTE']

export function validateAttendanceInput(body: AttendanceInput, requireCore = false): ValidationResult {
  const fields: Record<string, string> = {}

  if (requireCore) {
    if (!body.employeeId) fields.employeeId = 'Employee is required'
    if (!body.date) fields.date = 'Date is required'
  }

  if (body.date && !isValidDate(body.date)) fields.date = 'Invalid date'
  if (body.checkIn && !isValidDate(body.checkIn)) fields.checkIn = 'Invalid check-in time'
  if (body.checkOut && !isValidDate(body.checkOut)) fields.checkOut = 'Invalid check-out time'

  if (body.checkIn && body.checkOut) {
    const i = new Date(body.checkIn).getTime()
    const o = new Date(body.checkOut).getTime()
    if (o < i) fields.checkOut = 'Check-out must be after check-in'
  }

  if (body.status && !VALID_STATUSES.includes(body.status)) {
    fields.status = `Must be one of: ${VALID_STATUSES.join(', ')}`
  }

  if (body.notes !== undefined && body.notes !== '' && !isValidString(body.notes, 1000)) fields.notes = 'Must be 1000 chars or fewer'

  return Object.keys(fields).length === 0 ? ok() : fail(fields)
}

// ============ COMPOSITE: PAYROLL ============

export function validatePayrollRunInput(body: { action?: string; periodId?: string; name?: string; startDate?: string; endDate?: string }): ValidationResult {
  const fields: Record<string, string> = {}

  if (body.action === 'create-period') {
    if (!body.name || !String(body.name).trim()) fields.name = 'Period name is required'
    if (body.startDate && !isValidDate(body.startDate)) fields.startDate = 'Invalid start date'
    if (body.endDate && !isValidDate(body.endDate)) fields.endDate = 'Invalid end date'
    if (body.startDate && body.endDate) {
      const s = new Date(body.startDate).getTime()
      const e = new Date(body.endDate).getTime()
      if (e < s) fields.endDate = 'End date must be after start date'
    }
  }

  if (body.action === 'run' || body.action === 'generate') {
    if (!body.periodId) fields.periodId = 'Period ID is required'
  }

  return Object.keys(fields).length === 0 ? ok() : fail(fields)
}

// ============ RESPONSE HELPER ============

import { NextResponse } from 'next/server'

export function validationErrorResponse(result: ValidationResult): NextResponse {
  return NextResponse.json(
    {
      error: 'Validation failed',
      fields: result.fields,
      messages: result.errors,
    },
    { status: 400 }
  )
}