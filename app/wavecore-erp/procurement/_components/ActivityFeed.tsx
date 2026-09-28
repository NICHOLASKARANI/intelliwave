'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Loader2, Activity, CheckCircle2, AlertCircle, Clock,
  Package, Package2, Receipt, FileSignature, ClipboardList,
  Wallet, ShieldCheck, Award, TrendingUp, CheckCheck, Plus,
  Edit, Trash2, Send, Check, XCircle, Ban, Play, Pause,
  PenTool, DollarSign, Microscope, GitBranch, Shield, Users,
} from 'lucide-react'

const ICONS: Record<string, any> = {
  Activity, Package, Package2, Receipt, FileSignature, ClipboardList,
  Wallet, ShieldCheck, Award, TrendingUp, CheckCheck, Plus, Edit,
  Trash2, Send, Check, XCircle, Ban, Play, Pause, PenTool,
  DollarSign, Microscope, GitBranch, Shield, Users, Clock,
}

interface Ev {
  id: string
  eventType: string
  entityType: string
  entityId: string
  summary?: string
  actorName?: string
  metadata?: any
  createdAt: string
}

function meta(type: string): { label: string; icon: string; color: string } {
  const t = String(type || '').toUpperCase()
  const M: Record<string, any> = {
    PO_CREATED: { label: 'PO created', icon: 'Package', color: 'text-pink-500' },
    PO_UPDATED: { label: 'PO updated', icon: 'Edit', color: 'text-pink-500' },
    PO_SUBMITTED: { label: 'PO submitted', icon: 'Send', color: 'text-amber-500' },
    PO_APPROVED: { label: 'PO approved', icon: 'Check', color: 'text-green-500' },
    PO_REJECTED: { label: 'PO rejected', icon: 'XCircle', color: 'text-red-500' },
    PO_SENT: { label: 'PO sent', icon: 'Send', color: 'text-blue-500' },
    PO_ACKNOWLEDGED: { label: 'PO acknowledged', icon: 'CheckCheck', color: 'text-cyan-500' },
    PO_CLOSED: { label: 'PO closed', icon: 'CheckCheck', color: 'text-neutral-500' },
    PO_CANCELLED: { label: 'PO cancelled', icon: 'Ban', color: 'text-neutral-500' },
    PO_LINE_ADDED: { label: 'PO line added', icon: 'Plus', color: 'text-pink-500' },
    PO_LINE_UPDATED: { label: 'PO line updated', icon: 'Edit', color: 'text-pink-500' },
    PO_LINE_REMOVED: { label: 'PO line removed', icon: 'Trash2', color: 'text-pink-500' },
    GOODS_RECEIPT_CREATED: { label: 'GRN created', icon: 'Package2', color: 'text-emerald-500' },
    GOODS_RECEIPT_UPDATED: { label: 'GRN updated', icon: 'Edit', color: 'text-emerald-500' },
    GOODS_RECEIPT_SUBMITTED: { label: 'GRN submitted', icon: 'Send', color: 'text-emerald-500' },
    GOODS_RECEIPT_DELETED: { label: 'GRN deleted', icon: 'Trash2', color: 'text-red-500' },
    GOODS_RECEIPT_CANCELLED: { label: 'GRN cancelled', icon: 'Ban', color: 'text-neutral-500' },
    GOODS_RECEIPT_LINE_ADDED: { label: 'GRN line added', icon: 'Plus', color: 'text-emerald-500' },
    GOODS_RECEIPT_LINE_UPDATED: { label: 'GRN line updated', icon: 'Edit', color: 'text-emerald-500' },
    GOODS_RECEIPT_LINE_REMOVED: { label: 'GRN line removed', icon: 'Trash2', color: 'text-emerald-500' },
    QUALITY_INSPECTION_CREATED: { label: 'Inspection created', icon: 'Microscope', color: 'text-amber-500' },
    QUALITY_INSPECTION_UPDATED: { label: 'Inspection updated', icon: 'Edit', color: 'text-amber-500' },
    QUALITY_INSPECTION_DECIDED: { label: 'Inspection decided', icon: 'CheckCheck', color: 'text-amber-500' },
    SUPPLIER_INVOICE_CREATED: { label: 'Invoice created', icon: 'Receipt', color: 'text-indigo-500' },
    SUPPLIER_INVOICE_UPDATED: { label: 'Invoice updated', icon: 'Edit', color: 'text-indigo-500' },
    SUPPLIER_INVOICE_SUBMITTED: { label: 'Invoice submitted', icon: 'Send', color: 'text-indigo-500' },
    SUPPLIER_INVOICE_MATCHED: { label: 'Invoice matched', icon: 'ShieldCheck', color: 'text-purple-500' },
    SUPPLIER_INVOICE_APPROVED: { label: 'Invoice approved', icon: 'Check', color: 'text-green-500' },
    SUPPLIER_INVOICE_REJECTED: { label: 'Invoice rejected', icon: 'XCircle', color: 'text-red-500' },
    SUPPLIER_INVOICE_PAID: { label: 'Invoice paid', icon: 'DollarSign', color: 'text-purple-500' },
    SUPPLIER_INVOICE_CANCELLED: { label: 'Invoice cancelled', icon: 'Ban', color: 'text-neutral-500' },
    SUPPLIER_INVOICE_DELETED: { label: 'Invoice deleted', icon: 'Trash2', color: 'text-red-500' },
    SUPPLIER_INVOICE_LINE_ADDED: { label: 'Invoice line added', icon: 'Plus', color: 'text-indigo-500' },
    SUPPLIER_INVOICE_LINE_UPDATED: { label: 'Invoice line updated', icon: 'Edit', color: 'text-indigo-500' },
    SUPPLIER_INVOICE_LINE_REMOVED: { label: 'Invoice line removed', icon: 'Trash2', color: 'text-indigo-500' },
    RFQ_CREATED: { label: 'RFQ created', icon: 'ClipboardList', color: 'text-fuchsia-500' },
    RFQ_UPDATED: { label: 'RFQ updated', icon: 'Edit', color: 'text-fuchsia-500' },
    RFQ_PUBLISHED: { label: 'RFQ published', icon: 'Send', color: 'text-blue-500' },
    RFQ_CLOSED: { label: 'RFQ closed', icon: 'XCircle', color: 'text-amber-500' },
    RFQ_AWARDED: { label: 'RFQ awarded', icon: 'Award', color: 'text-green-500' },
    RFQ_CANCELLED: { label: 'RFQ cancelled', icon: 'Ban', color: 'text-neutral-500' },
    RFQ_DELETED: { label: 'RFQ deleted', icon: 'Trash2', color: 'text-red-500' },
    RFQ_LINE_ADDED: { label: 'RFQ line added', icon: 'Plus', color: 'text-fuchsia-500' },
    RFQ_LINE_UPDATED: { label: 'RFQ line updated', icon: 'Edit', color: 'text-fuchsia-500' },
    RFQ_LINE_REMOVED: { label: 'RFQ line removed', icon: 'Trash2', color: 'text-fuchsia-500' },
    RFQ_INVITES_ADDED: { label: 'RFQ invites added', icon: 'Users', color: 'text-fuchsia-500' },
    RFQ_INVITE_STATUS: { label: 'RFQ invite status', icon: 'CheckCheck', color: 'text-fuchsia-500' },
    RFQ_INVITE_REMOVED: { label: 'RFQ invite removed', icon: 'Trash2', color: 'text-fuchsia-500' },
    RFQ_QUOTE_SUBMITTED: { label: 'Quote submitted', icon: 'TrendingUp', color: 'text-purple-500' },
    SUPPLIER_CONTRACT_CREATED: { label: 'Contract created', icon: 'FileSignature', color: 'text-blue-500' },
    SUPPLIER_CONTRACT_UPDATED: { label: 'Contract updated', icon: 'Edit', color: 'text-blue-500' },
    SUPPLIER_CONTRACT_SIGNED: { label: 'Contract signed', icon: 'PenTool', color: 'text-blue-500' },
    SUPPLIER_CONTRACT_ACTIVATED: { label: 'Contract activated', icon: 'Play', color: 'text-green-500' },
    SUPPLIER_CONTRACT_SUSPENDED: { label: 'Contract suspended', icon: 'Pause', color: 'text-amber-500' },
    SUPPLIER_CONTRACT_RESUMED: { label: 'Contract resumed', icon: 'Play', color: 'text-green-500' },
    SUPPLIER_CONTRACT_TERMINATED: { label: 'Contract terminated', icon: 'XCircle', color: 'text-red-500' },
    SUPPLIER_CONTRACT_EXPIRED: { label: 'Contract expired', icon: 'AlertCircle', color: 'text-orange-500' },
    SUPPLIER_CONTRACT_DELETED: { label: 'Contract deleted', icon: 'Trash2', color: 'text-red-500' },
    SUPPLIER_CONTRACT_LINE_ADDED: { label: 'Contract line added', icon: 'Plus', color: 'text-blue-500' },
    SUPPLIER_CONTRACT_LINE_UPDATED: { label: 'Contract line updated', icon: 'Edit', color: 'text-blue-500' },
    SUPPLIER_CONTRACT_LINE_REMOVED: { label: 'Contract line removed', icon: 'Trash2', color: 'text-blue-500' },
    SUPPLIER_CONTRACT_MILESTONE_ADDED: { label: 'Milestone added', icon: 'Clock', color: 'text-blue-500' },
    SUPPLIER_CONTRACT_MILESTONE_UPDATED: { label: 'Milestone updated', icon: 'Edit', color: 'text-blue-500' },
    SUPPLIER_CONTRACT_MILESTONE_REMOVED: { label: 'Milestone removed', icon: 'Trash2', color: 'text-blue-500' },
    PAYMENT_RUN_CREATED: { label: 'Payment run created', icon: 'Wallet', color: 'text-emerald-500' },
    PAYMENT_RUN_UPDATED: { label: 'Payment run updated', icon: 'Edit', color: 'text-emerald-500' },
    PAYMENT_RUN_SUBMITTED: { label: 'Payment run submitted', icon: 'Send', color: 'text-blue-500' },
    PAYMENT_RUN_APPROVED: { label: 'Payment run approved', icon: 'Check', color: 'text-blue-500' },
    PAYMENT_RUN_EXECUTED: { label: 'Payment run executed', icon: 'CheckCheck', color: 'text-green-500' },
    PAYMENT_RUN_FAILED: { label: 'Payment run failed', icon: 'AlertCircle', color: 'text-red-500' },
    PAYMENT_RUN_CANCELLED: { label: 'Payment run cancelled', icon: 'Ban', color: 'text-neutral-500' },
    PAYMENT_RUN_DELETED: { label: 'Payment run deleted', icon: 'Trash2', color: 'text-red-500' },
    PAYMENT_RUN_LINES_ADDED: { label: 'Invoices added to run', icon: 'Plus', color: 'text-emerald-500' },
    PAYMENT_RUN_LINE_REMOVED: { label: 'Invoice removed from run', icon: 'Trash2', color: 'text-emerald-500' },
    PROCUREMENT_ROLE_ASSIGNED: { label: 'Role assigned', icon: 'ShieldCheck', color: 'text-cyan-500' },
    PROCUREMENT_ROLE_REVOKED: { label: 'Role revoked', icon: 'Shield', color: 'text-neutral-500' },
    APPROVAL_CHAIN_CREATED: { label: 'Approval chain created', icon: 'GitBranch', color: 'text-cyan-500' },
    APPROVAL_CHAIN_UPDATED: { label: 'Approval chain updated', icon: 'Edit', color: 'text-cyan-500' },
    APPROVAL_CHAIN_DEACTIVATED: { label: 'Approval chain deactivated', icon: 'Ban', color: 'text-neutral-500' },
  }
  return M[t] || { label: t.replace(/_/g, ' '), icon: 'Activity', color: 'text-neutral-400' }
}

function timeAgo(iso: string): string {
  const sec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000)
  if (sec < 60) return sec + 's ago'
  const min = Math.floor(sec / 60); if (min < 60) return min + 'm ago'
  const hr = Math.floor(min / 60); if (hr < 24) return hr + 'h ago'
  const day = Math.floor(hr / 24); if (day < 30) return day + 'd ago'
  const mon = Math.floor(day / 30); if (mon < 12) return mon + 'mo ago'
  return Math.floor(mon / 12) + 'y ago'
}

export default function ActivityFeed({ entityId }: { entityId: string }) {
  const [events, setEvents] = useState<Ev[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchEvents = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/procurement/activity?entityId=' + encodeURIComponent(entityId) + '&limit=100')
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); return }
      setEvents(data.events || [])
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { if (entityId) fetchEvents() /* eslint-disable-next-line */ }, [entityId])

  if (loading) return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-12 text-center">
      <Loader2 className="w-6 h-6 animate-spin inline text-neutral-400" />
    </div>
  )

  if (error) return (
    <div className="bg-red-900/20 rounded-2xl border border-red-800 p-4 text-sm text-red-300 flex items-center gap-2">
      <AlertCircle className="w-4 h-4" /> {error}
    </div>
  )

  if (events.length === 0) return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-12 text-center">
      <Activity className="w-10 h-10 mx-auto mb-2 text-neutral-300 dark:text-neutral-700" />
      <p className="text-sm text-neutral-500">No activity yet for this record</p>
    </div>
  )

  return (
    <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
      {events.map(e => {
        const m = meta(e.eventType)
        const Icon = ICONS[m.icon] || Activity
        return (
          <div key={e.id} className="p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 flex items-start gap-3">
            <div className={'w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center flex-shrink-0 ' + m.color}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-0.5">
                <p className="text-sm font-medium">{e.summary || m.label}</p>
                <span className="text-[10px] text-neutral-500 font-mono">{e.eventType}</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-neutral-500 flex-wrap">
                <span>{e.actorName || 'System'}</span>
                <span>·</span>
                <span>{timeAgo(e.createdAt)}</span>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}