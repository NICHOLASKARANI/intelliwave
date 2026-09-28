/**
 * Procurement activity feed helper.
 *
 * Maps ProcurementEvent.eventType → display metadata (icon key, label,
 * Tailwind color, severity). Used by the activity screen and the inline
 * "Activity" tabs on entity 360 pages.
 */

export type ActivitySeverity = 'info' | 'success' | 'warning' | 'danger'

export interface ActivityMeta {
  label: string
  icon: string
  color: string
  severity: ActivitySeverity
  entity: string
}

// Icon keys map to lucide-react icons; the UI resolves them.
const MAP: Record<string, ActivityMeta> = {
  // Purchase Orders
  PO_CREATED:                    { label: 'PO created',              icon: 'Plus',         color: 'text-pink-500',    severity: 'info',    entity: 'PurchaseOrder' },
  PO_UPDATED:                    { label: 'PO updated',              icon: 'Edit',         color: 'text-pink-500',    severity: 'info',    entity: 'PurchaseOrder' },
  PO_SUBMITTED:                  { label: 'PO submitted',            icon: 'Send',         color: 'text-amber-500',   severity: 'warning', entity: 'PurchaseOrder' },
  PO_APPROVED:                   { label: 'PO approved',             icon: 'Check',        color: 'text-green-500',   severity: 'success', entity: 'PurchaseOrder' },
  PO_REJECTED:                   { label: 'PO rejected',             icon: 'XCircle',      color: 'text-red-500',     severity: 'danger',  entity: 'PurchaseOrder' },
  PO_SENT:                       { label: 'PO sent to supplier',     icon: 'Send',         color: 'text-blue-500',    severity: 'info',    entity: 'PurchaseOrder' },
  PO_ACKNOWLEDGED:               { label: 'PO acknowledged',         icon: 'CheckCheck',   color: 'text-cyan-500',    severity: 'info',    entity: 'PurchaseOrder' },
  PO_CLOSED:                     { label: 'PO closed',               icon: 'CheckCheck',   color: 'text-neutral-500', severity: 'info',    entity: 'PurchaseOrder' },
  PO_CANCELLED:                  { label: 'PO cancelled',            icon: 'Ban',          color: 'text-neutral-500', severity: 'warning', entity: 'PurchaseOrder' },
  PO_LINE_ADDED:                 { label: 'PO line added',           icon: 'Plus',         color: 'text-pink-500',    severity: 'info',    entity: 'PurchaseOrder' },
  PO_LINE_UPDATED:               { label: 'PO line updated',         icon: 'Edit',         color: 'text-pink-500',    severity: 'info',    entity: 'PurchaseOrder' },
  PO_LINE_REMOVED:               { label: 'PO line removed',         icon: 'Trash2',       color: 'text-pink-500',    severity: 'info',    entity: 'PurchaseOrder' },

  // Goods receipts
  GOODS_RECEIPT_CREATED:         { label: 'GRN created',             icon: 'Package2',     color: 'text-emerald-500', severity: 'info',    entity: 'GoodsReceipt' },
  GOODS_RECEIPT_UPDATED:         { label: 'GRN updated',             icon: 'Edit',         color: 'text-emerald-500', severity: 'info',    entity: 'GoodsReceipt' },
  GOODS_RECEIPT_SUBMITTED:       { label: 'GRN submitted',           icon: 'Send',         color: 'text-emerald-500', severity: 'success', entity: 'GoodsReceipt' },
  GOODS_RECEIPT_DELETED:         { label: 'GRN deleted',             icon: 'Trash2',       color: 'text-red-500',     severity: 'danger',  entity: 'GoodsReceipt' },
  GOODS_RECEIPT_CANCELLED:       { label: 'GRN cancelled',           icon: 'Ban',          color: 'text-neutral-500', severity: 'warning', entity: 'GoodsReceipt' },
  GOODS_RECEIPT_LINE_ADDED:      { label: 'GRN line added',          icon: 'Plus',         color: 'text-emerald-500', severity: 'info',    entity: 'GoodsReceipt' },
  GOODS_RECEIPT_LINE_UPDATED:    { label: 'GRN line updated',        icon: 'Edit',         color: 'text-emerald-500', severity: 'info',    entity: 'GoodsReceipt' },
  GOODS_RECEIPT_LINE_REMOVED:    { label: 'GRN line removed',        icon: 'Trash2',       color: 'text-emerald-500', severity: 'info',    entity: 'GoodsReceipt' },

  // Quality inspections
  QUALITY_INSPECTION_CREATED:    { label: 'Inspection created',      icon: 'Microscope',   color: 'text-amber-500',   severity: 'info',    entity: 'QualityInspection' },
  QUALITY_INSPECTION_UPDATED:    { label: 'Inspection updated',      icon: 'Edit',         color: 'text-amber-500',   severity: 'info',    entity: 'QualityInspection' },
  QUALITY_INSPECTION_DECIDED:    { label: 'Inspection decided',      icon: 'CheckCheck',   color: 'text-amber-500',   severity: 'success', entity: 'QualityInspection' },

  // Supplier invoices
  SUPPLIER_INVOICE_CREATED:      { label: 'Invoice created',         icon: 'Receipt',      color: 'text-indigo-500',  severity: 'info',    entity: 'SupplierInvoice' },
  SUPPLIER_INVOICE_UPDATED:      { label: 'Invoice updated',         icon: 'Edit',         color: 'text-indigo-500',  severity: 'info',    entity: 'SupplierInvoice' },
  SUPPLIER_INVOICE_SUBMITTED:    { label: 'Invoice submitted',       icon: 'Send',         color: 'text-indigo-500',  severity: 'info',    entity: 'SupplierInvoice' },
  SUPPLIER_INVOICE_MATCHED:      { label: 'Invoice matched',         icon: 'ShieldCheck',  color: 'text-purple-500',  severity: 'success', entity: 'SupplierInvoice' },
  SUPPLIER_INVOICE_APPROVED:     { label: 'Invoice approved',        icon: 'Check',        color: 'text-green-500',   severity: 'success', entity: 'SupplierInvoice' },
  SUPPLIER_INVOICE_REJECTED:     { label: 'Invoice rejected',        icon: 'XCircle',      color: 'text-red-500',     severity: 'danger',  entity: 'SupplierInvoice' },
  SUPPLIER_INVOICE_PAID:         { label: 'Invoice paid',            icon: 'DollarSign',   color: 'text-purple-500',  severity: 'success', entity: 'SupplierInvoice' },
  SUPPLIER_INVOICE_CANCELLED:    { label: 'Invoice cancelled',       icon: 'Ban',          color: 'text-neutral-500', severity: 'warning', entity: 'SupplierInvoice' },
  SUPPLIER_INVOICE_DELETED:      { label: 'Invoice deleted',         icon: 'Trash2',       color: 'text-red-500',     severity: 'danger',  entity: 'SupplierInvoice' },
  SUPPLIER_INVOICE_LINE_ADDED:   { label: 'Invoice line added',      icon: 'Plus',         color: 'text-indigo-500',  severity: 'info',    entity: 'SupplierInvoice' },
  SUPPLIER_INVOICE_LINE_UPDATED: { label: 'Invoice line updated',    icon: 'Edit',         color: 'text-indigo-500',  severity: 'info',    entity: 'SupplierInvoice' },
  SUPPLIER_INVOICE_LINE_REMOVED: { label: 'Invoice line removed',    icon: 'Trash2',       color: 'text-indigo-500',  severity: 'info',    entity: 'SupplierInvoice' },

  // RFQs
  RFQ_CREATED:                   { label: 'RFQ created',             icon: 'ClipboardList',color: 'text-fuchsia-500', severity: 'info',    entity: 'RFQ' },
  RFQ_UPDATED:                   { label: 'RFQ updated',             icon: 'Edit',         color: 'text-fuchsia-500', severity: 'info',    entity: 'RFQ' },
  RFQ_PUBLISHED:                 { label: 'RFQ published',           icon: 'Send',         color: 'text-blue-500',    severity: 'success', entity: 'RFQ' },
  RFQ_CLOSED:                    { label: 'RFQ closed',              icon: 'XCircle',      color: 'text-amber-500',   severity: 'info',    entity: 'RFQ' },
  RFQ_AWARDED:                   { label: 'RFQ awarded',             icon: 'Award',        color: 'text-green-500',   severity: 'success', entity: 'RFQ' },
  RFQ_CANCELLED:                 { label: 'RFQ cancelled',           icon: 'Ban',          color: 'text-neutral-500', severity: 'warning', entity: 'RFQ' },
  RFQ_DELETED:                   { label: 'RFQ deleted',             icon: 'Trash2',       color: 'text-red-500',     severity: 'danger',  entity: 'RFQ' },
  RFQ_LINE_ADDED:                { label: 'RFQ line added',          icon: 'Plus',         color: 'text-fuchsia-500', severity: 'info',    entity: 'RFQ' },
  RFQ_LINE_UPDATED:              { label: 'RFQ line updated',        icon: 'Edit',         color: 'text-fuchsia-500', severity: 'info',    entity: 'RFQ' },
  RFQ_LINE_REMOVED:              { label: 'RFQ line removed',        icon: 'Trash2',       color: 'text-fuchsia-500', severity: 'info',    entity: 'RFQ' },
  RFQ_INVITES_ADDED:             { label: 'RFQ invites added',       icon: 'Users',        color: 'text-fuchsia-500', severity: 'info',    entity: 'RFQ' },
  RFQ_INVITE_STATUS:             { label: 'RFQ invite status',       icon: 'CheckCheck',   color: 'text-fuchsia-500', severity: 'info',    entity: 'RFQ' },
  RFQ_INVITE_REMOVED:            { label: 'RFQ invite removed',      icon: 'Trash2',       color: 'text-fuchsia-500', severity: 'info',    entity: 'RFQ' },
  RFQ_QUOTE_SUBMITTED:           { label: 'Quote submitted',         icon: 'TrendingUp',   color: 'text-purple-500',  severity: 'success', entity: 'RFQ' },

  // Contracts
  SUPPLIER_CONTRACT_CREATED:     { label: 'Contract created',        icon: 'FileSignature',color: 'text-blue-500',    severity: 'info',    entity: 'SupplierContract' },
  SUPPLIER_CONTRACT_UPDATED:     { label: 'Contract updated',        icon: 'Edit',         color: 'text-blue-500',    severity: 'info',    entity: 'SupplierContract' },
  SUPPLIER_CONTRACT_SIGNED:      { label: 'Contract signed',         icon: 'PenTool',      color: 'text-blue-500',    severity: 'success', entity: 'SupplierContract' },
  SUPPLIER_CONTRACT_ACTIVATED:   { label: 'Contract activated',      icon: 'Play',         color: 'text-green-500',   severity: 'success', entity: 'SupplierContract' },
  SUPPLIER_CONTRACT_SUSPENDED:   { label: 'Contract suspended',      icon: 'Pause',        color: 'text-amber-500',   severity: 'warning', entity: 'SupplierContract' },
  SUPPLIER_CONTRACT_RESUMED:     { label: 'Contract resumed',        icon: 'Play',         color: 'text-green-500',   severity: 'success', entity: 'SupplierContract' },
  SUPPLIER_CONTRACT_TERMINATED:  { label: 'Contract terminated',     icon: 'XCircle',      color: 'text-red-500',     severity: 'danger',  entity: 'SupplierContract' },
  SUPPLIER_CONTRACT_EXPIRED:     { label: 'Contract expired',        icon: 'AlertCircle',  color: 'text-orange-500',  severity: 'warning', entity: 'SupplierContract' },
  SUPPLIER_CONTRACT_DELETED:     { label: 'Contract deleted',        icon: 'Trash2',       color: 'text-red-500',     severity: 'danger',  entity: 'SupplierContract' },
  SUPPLIER_CONTRACT_LINE_ADDED:  { label: 'Contract line added',     icon: 'Plus',         color: 'text-blue-500',    severity: 'info',    entity: 'SupplierContract' },
  SUPPLIER_CONTRACT_LINE_UPDATED:{ label: 'Contract line updated',   icon: 'Edit',         color: 'text-blue-500',    severity: 'info',    entity: 'SupplierContract' },
  SUPPLIER_CONTRACT_LINE_REMOVED:{ label: 'Contract line removed',   icon: 'Trash2',       color: 'text-blue-500',    severity: 'info',    entity: 'SupplierContract' },
  SUPPLIER_CONTRACT_MILESTONE_ADDED:   { label: 'Milestone added',   icon: 'Clock',        color: 'text-blue-500',    severity: 'info',    entity: 'SupplierContract' },
  SUPPLIER_CONTRACT_MILESTONE_UPDATED: { label: 'Milestone updated', icon: 'Edit',         color: 'text-blue-500',    severity: 'info',    entity: 'SupplierContract' },
  SUPPLIER_CONTRACT_MILESTONE_REMOVED: { label: 'Milestone removed', icon: 'Trash2',       color: 'text-blue-500',    severity: 'info',    entity: 'SupplierContract' },

  // Payment runs
  PAYMENT_RUN_CREATED:           { label: 'Payment run created',     icon: 'Wallet',       color: 'text-emerald-500', severity: 'info',    entity: 'PaymentRun' },
  PAYMENT_RUN_UPDATED:           { label: 'Payment run updated',     icon: 'Edit',         color: 'text-emerald-500', severity: 'info',    entity: 'PaymentRun' },
  PAYMENT_RUN_SUBMITTED:         { label: 'Payment run submitted',   icon: 'Send',         color: 'text-blue-500',    severity: 'info',    entity: 'PaymentRun' },
  PAYMENT_RUN_APPROVED:          { label: 'Payment run approved',    icon: 'Check',        color: 'text-blue-500',    severity: 'success', entity: 'PaymentRun' },
  PAYMENT_RUN_EXECUTED:          { label: 'Payment run executed',    icon: 'CheckCheck',   color: 'text-green-500',   severity: 'success', entity: 'PaymentRun' },
  PAYMENT_RUN_FAILED:            { label: 'Payment run failed',      icon: 'AlertCircle',  color: 'text-red-500',     severity: 'danger',  entity: 'PaymentRun' },
  PAYMENT_RUN_CANCELLED:         { label: 'Payment run cancelled',   icon: 'Ban',          color: 'text-neutral-500', severity: 'warning', entity: 'PaymentRun' },
  PAYMENT_RUN_DELETED:           { label: 'Payment run deleted',     icon: 'Trash2',       color: 'text-red-500',     severity: 'danger',  entity: 'PaymentRun' },
  PAYMENT_RUN_LINES_ADDED:       { label: 'Invoices added to run',   icon: 'Plus',         color: 'text-emerald-500', severity: 'info',    entity: 'PaymentRun' },
  PAYMENT_RUN_LINE_REMOVED:      { label: 'Invoice removed from run',icon: 'Trash2',       color: 'text-emerald-500', severity: 'info',    entity: 'PaymentRun' },

  // RBAC & settings
  PROCUREMENT_ROLE_ASSIGNED:     { label: 'Role assigned',           icon: 'ShieldCheck',  color: 'text-cyan-500',    severity: 'info',    entity: 'ProcurementRole' },
  PROCUREMENT_ROLE_REVOKED:      { label: 'Role revoked',            icon: 'Shield',       color: 'text-neutral-500', severity: 'info',    entity: 'ProcurementRole' },
  APPROVAL_CHAIN_CREATED:        { label: 'Approval chain created',  icon: 'GitBranch',    color: 'text-cyan-500',    severity: 'info',    entity: 'ApprovalChain' },
  APPROVAL_CHAIN_UPDATED:        { label: 'Approval chain updated',  icon: 'Edit',         color: 'text-cyan-500',    severity: 'info',    entity: 'ApprovalChain' },
  APPROVAL_CHAIN_DEACTIVATED:    { label: 'Approval chain deactivated', icon: 'Ban',       color: 'text-neutral-500', severity: 'warning', entity: 'ApprovalChain' },
}

const DEFAULT_META: ActivityMeta = {
  label: 'Activity',
  icon: 'Activity',
  color: 'text-neutral-400',
  severity: 'info',
  entity: 'Unknown',
}

export function getActivityMeta(eventType: string): ActivityMeta {
  const key = String(eventType || '').toUpperCase()
  if (MAP[key]) return MAP[key]
  // Heuristic fallbacks by prefix
  if (key.startsWith('PO_')) return { ...DEFAULT_META, entity: 'PurchaseOrder' }
  if (key.startsWith('GOODS_')) return { ...DEFAULT_META, entity: 'GoodsReceipt' }
  if (key.startsWith('QUALITY_')) return { ...DEFAULT_META, entity: 'QualityInspection' }
  if (key.startsWith('SUPPLIER_INVOICE_')) return { ...DEFAULT_META, entity: 'SupplierInvoice' }
  if (key.startsWith('RFQ_')) return { ...DEFAULT_META, entity: 'RFQ' }
  if (key.startsWith('SUPPLIER_CONTRACT_')) return { ...DEFAULT_META, entity: 'SupplierContract' }
  if (key.startsWith('PAYMENT_RUN_')) return { ...DEFAULT_META, entity: 'PaymentRun' }
  if (key.startsWith('PROCUREMENT_ROLE_')) return { ...DEFAULT_META, entity: 'ProcurementRole' }
  if (key.startsWith('APPROVAL_CHAIN_')) return { ...DEFAULT_META, entity: 'ApprovalChain' }
  return DEFAULT_META
}

export const ALL_ACTIVITY_TYPES = Object.keys(MAP).sort()

export function humanTimeAgo(iso: string | null | undefined): string {
  if (!iso) return ''
  const d = new Date(iso).getTime()
  const now = Date.now()
  const sec = Math.floor((now - d) / 1000)
  if (sec < 60) return sec + 's ago'
  const min = Math.floor(sec / 60)
  if (min < 60) return min + 'm ago'
  const hr = Math.floor(min / 60)
  if (hr < 24) return hr + 'h ago'
  const day = Math.floor(hr / 24)
  if (day < 30) return day + 'd ago'
  const mon = Math.floor(day / 30)
  if (mon < 12) return mon + 'mo ago'
  return Math.floor(mon / 12) + 'y ago'
}