/**
 * WaveCore Procurement — Purchase Order lifecycle helpers
 */

export const PO_STATUSES = [
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'SENT',
  'ACKNOWLEDGED',
  'PARTIALLY_RECEIVED',
  'FULLY_RECEIVED',
  'INVOICED',
  'MATCHED',
  'CLOSED',
  'CANCELLED',
] as const

export type POStatus = typeof PO_STATUSES[number]

export const PO_TYPES = [
  'STANDARD','BLANKET','FRAMEWORK','CONTRACT','SERVICE','INVENTORY',
  'ASSET','PROJECT','DROP_SHIP','CONSIGNMENT','RECURRING','EMERGENCY',
] as const

export const PO_TERMINAL_STATUSES: POStatus[] = ['CLOSED', 'CANCELLED', 'REJECTED']

export const PO_MUTABLE_STATUSES: POStatus[] = ['DRAFT']

/**
 * Is the given status terminal (no further actions)?
 */
export function isTerminal(status: string): boolean {
  return PO_TERMINAL_STATUSES.includes(status as POStatus)
}

/**
 * Is the PO still fully editable (lines, header)?
 */
export function isMutable(status: string): boolean {
  return PO_MUTABLE_STATUSES.includes(status as POStatus)
}

/**
 * Can this PO be submitted for approval?
 */
export function canSubmit(status: string): boolean {
  return status === 'DRAFT'
}

/**
 * Can this PO be approved/rejected?
 */
export function canDecide(status: string): boolean {
  return status === 'SUBMITTED'
}

/**
 * Can this PO be sent to the supplier?
 */
export function canSend(status: string): boolean {
  return status === 'APPROVED'
}

/**
 * Can this PO be acknowledged by the supplier?
 */
export function canAcknowledge(status: string): boolean {
  return status === 'SENT'
}

/**
 * Can this PO be cancelled?
 */
export function canCancel(status: string): boolean {
  return !isTerminal(status) && status !== 'FULLY_RECEIVED' && status !== 'INVOICED' && status !== 'MATCHED'
}

/**
 * Can this PO be closed?
 */
export function canClose(status: string): boolean {
  return ['PARTIALLY_RECEIVED', 'FULLY_RECEIVED', 'INVOICED', 'MATCHED', 'ACKNOWLEDGED'].includes(status)
}

/**
 * Human-readable labels for status badges.
 */
export const PO_STATUS_LABELS: Record<string, string> = {
  DRAFT: 'Draft',
  SUBMITTED: 'Awaiting Approval',
  APPROVED: 'Approved',
  REJECTED: 'Rejected',
  SENT: 'Sent to Supplier',
  ACKNOWLEDGED: 'Acknowledged',
  PARTIALLY_RECEIVED: 'Partially Received',
  FULLY_RECEIVED: 'Fully Received',
  INVOICED: 'Invoiced',
  MATCHED: '3-Way Matched',
  CLOSED: 'Closed',
  CANCELLED: 'Cancelled',
}