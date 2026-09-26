'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  Package, Package2, ArrowLeft, Loader2, AlertTriangle, CheckCircle2,
  X, Check, XCircle, Send, Truck, CheckCheck, Ban, FileDown, Layers,
  Activity, FileText, ClipboardList, Users, ExternalLink, Calendar,
  Clock, Plus, Trash2, Save, Warehouse, Info, ShieldCheck, Microscope,
} from 'lucide-react'

type Tab = 'overview' | 'lines' | 'inspections' | 'activity' | 'related'

interface GRNHook {
  id: string
  grnNumber: string
  purchaseOrderId: string
  status: string
  receivedBy?: string
  receivedByName?: string
  receivedAt?: string
  deliveryNoteNumber?: string
  vehicleNumber?: string
  driverName?: string
  warehouseId?: string
  locationId?: string
  currency: string
  totalReceived: number
  hasVariance: boolean
  notes?: string
  createdAt: string
  updatedAt: string
}

export default function GRNDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = String(params.id || '')

  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tab, setTab] = useState<Tab>('overview')

  const [grn, setGrn] = useState<GRNHook | null>(null)
  const [lines, setLines] = useState<any[]>([])
  const [po, setPo] = useState<any>(null)
  const [supplier, setSupplier] = useState<any>(null)
  const [inspections, setInspections] = useState<any[]>([])
  const [activity, setActivity] = useState<any[]>([])

  // Decide modal
  const [decideTarget, setDecideTarget] = useState<any>(null)
  const [decision, setDecision] = useState<'PASSED' | 'FAILED' | 'CONDITIONAL'>('PASSED')
  const [decideForm, setDecideForm] = useState({
    sampleSize: '', passedQty: '', failedQty: '', findings: '', correctiveAction: '',
  })

  const csrf = () => document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || ''
  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3500) }

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/procurement/goods-receipts/' + id)
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); return }
      setGrn(data.goodsReceipt)
      setLines(data.lines || [])
      setPo(data.purchaseOrder)
      setSupplier(data.supplier)
      setInspections(data.inspections || [])
      setActivity(data.activity || [])
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { if (id) fetchAll() /* eslint-disable-next-line */ }, [id])

  const action = async (endpoint: string, body?: any, successMsg = 'Done') => {
    setWorking(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/procurement/goods-receipts/' + id + '/' + endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: body ? JSON.stringify(body) : '{}',
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Action failed'); return false }
      flash(successMsg)
      fetchAll()
      return true
    } catch (e) {
      setError('Network error: ' + (e as Error).message)
      return false
    } finally { setWorking(false) }
  }

  const deleteGRN = async () => {
    if (!confirm('Delete this draft GRN? Cannot be undone.')) return
    const res = await fetch('/api/wavecore/procurement/goods-receipts/' + id, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrf() },
    })
    if (res.ok) router.push('/wavecore-erp/procurement/goods-receipts')
    else { const d = await res.json(); setError(d.error || 'Delete failed') }
  }

  const openDecide = (insp: any) => {
    setDecideTarget(insp)
    setDecision('PASSED')
    setDecideForm({
      sampleSize: insp.sampleSize ?? '',
      passedQty: insp.passedQty ?? '',
      failedQty: insp.failedQty ?? '',
      findings: insp.findings ?? '',
      correctiveAction: insp.correctiveAction ?? '',
    })
  }

  const submitDecide = async () => {
    if (!decideTarget) return
    setWorking(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/procurement/quality-inspections/' + decideTarget.id + '/decide', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({
          decision,
          sampleSize: decideForm.sampleSize !== '' ? Number(decideForm.sampleSize) : undefined,
          passedQty: decideForm.passedQty !== '' ? Number(decideForm.passedQty) : undefined,
          failedQty: decideForm.failedQty !== '' ? Number(decideForm.failedQty) : undefined,
          findings: decideForm.findings || undefined,
          correctiveAction: decideForm.correctiveAction || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Decide failed'); return }
      flash('Inspection ' + decision)
      setDecideTarget(null)
      fetchAll()
    } catch (e) {
      setError('Network error: ' + (e as Error).message)
    } finally { setWorking(false) }
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'DRAFT': return 'bg-neutral-700 text-neutral-200'
      case 'SUBMITTED': return 'bg-blue-900/50 text-blue-200'
      case 'INSPECTED': return 'bg-amber-900/50 text-amber-200'
      case 'ACCEPTED': return 'bg-green-900/50 text-green-200'
      case 'REJECTED': return 'bg-red-900/50 text-red-200'
      case 'CANCELLED': return 'bg-neutral-800 text-neutral-500'
      case 'PENDING': return 'bg-amber-900/50 text-amber-200'
      case 'PASSED': return 'bg-green-900/50 text-green-200'
      case 'FAILED': return 'bg-red-900/50 text-red-200'
      case 'CONDITIONAL': return 'bg-cyan-900/50 text-cyan-200'
      default: return 'bg-neutral-800 text-neutral-300'
    }
  }
  const statusLabel = (s: string) => ({
    DRAFT: 'Draft', SUBMITTED: 'Submitted', INSPECTED: 'Inspected',
    ACCEPTED: 'Accepted', REJECTED: 'Rejected', CANCELLED: 'Cancelled',
    PENDING: 'Pending', PASSED: 'Passed', FAILED: 'Failed', CONDITIONAL: 'Conditional',
  } as Record<string, string>)[s] || s

  if (loading) return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
    </div>
  )
  if (error && !grn) return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-500" />
        <p className="text-red-300 mb-4">{error}</p>
        <Link href="/wavecore-erp/procurement/goods-receipts" className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold">Back</Link>
      </div>
    </div>
  )
  if (!grn) return null

  const isDraft = grn.status === 'DRAFT'
  const canSubmit = isDraft && lines.length > 0
  const isTerminal = ['ACCEPTED','REJECTED','CANCELLED'].includes(grn.status)
  const canCancel = !isTerminal
  const pendingInspections = inspections.filter(i => i.status === 'PENDING').length

  const tabs: { key: Tab; label: string; icon: any; count?: number }[] = [
    { key: 'overview',    label: 'Overview',    icon: FileText },
    { key: 'lines',       label: 'Lines',       icon: Layers, count: lines.length },
    { key: 'inspections', label: 'Inspections', icon: Microscope, count: inspections.length },
    { key: 'activity',    label: 'Activity',    icon: Activity, count: activity.length },
    { key: 'related',     label: 'Related',     icon: ExternalLink },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/procurement" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-500">Procurement · Goods Receipt</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <Link href="/wavecore-erp/procurement/goods-receipts" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Goods Receipts
        </Link>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2"><AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/30 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-emerald-600 via-teal-600 to-cyan-700 p-6 lg:p-8 mb-6">
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div className="flex-1 min-w-[280px]">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-sm font-bold text-white/90">{grn.grnNumber}</span>
                <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + statusColor(grn.status)}>{statusLabel(grn.status)}</span>
                {grn.hasVariance && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-900/50 text-amber-200">variance</span>}
                {pendingInspections > 0 && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-900/50 text-amber-200">{pendingInspections} pending</span>}
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-white mb-2 flex items-center gap-2">
                <Package className="w-6 h-6" />
                {po ? (
                  <Link href={'/wavecore-erp/procurement/orders/' + po.id} className="hover:underline">
                    PO {po.number}
                  </Link>
                ) : 'PO —'}
              </p>
              <div className="flex items-center gap-4 text-xs text-white/80 flex-wrap">
                {supplier && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{supplier.name || po?.supplierName}</span>}
                {grn.receivedAt && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />received {new Date(grn.receivedAt).toLocaleDateString('en-GB')}</span>}
                {grn.receivedByName && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{grn.receivedByName}</span>}
                {grn.deliveryNoteNumber && <span className="flex items-center gap-1"><FileText className="w-3 h-3" />DN {grn.deliveryNoteNumber}</span>}
              </div>
            </div>

            <div className="text-right">
              <p className="text-3xl lg:text-4xl font-bold text-white">{grn.currency} {Number(grn.totalReceived || 0).toLocaleString()}</p>
              <p className="text-[10px] uppercase tracking-wide text-white/60 font-bold">Total received</p>
            </div>
          </div>

          <div className="flex gap-2 mt-6 flex-wrap">
            {isDraft && (
              <>
                <button onClick={() => action('submit', {}, 'Submitted — PO updated')} disabled={working || !canSubmit} className="px-4 py-2.5 rounded-xl bg-white text-emerald-700 font-bold flex items-center gap-2 shadow-lg disabled:opacity-50">
                  {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit
                </button>
                <button onClick={deleteGRN} className="px-4 py-2.5 rounded-xl bg-red-700/80 hover:bg-red-700 text-white font-bold flex items-center gap-2">
                  <Trash2 className="w-4 h-4" /> Delete
                </button>
              </>
            )}
            {canCancel && !isDraft && (
              <button onClick={() => action('cancel', { reason: prompt('Cancel reason (optional):') || '' }, 'Cancelled — PO reverted')} className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-2">
                <Ban className="w-4 h-4" /> Cancel GRN
              </button>
            )}
            <button onClick={() => window.print()} className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-2">
              <FileDown className="w-4 h-4" /> Print / PDF
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white dark:bg-neutral-900 rounded-2xl p-1 mb-6 overflow-x-auto border border-neutral-200 dark:border-neutral-800">
          {tabs.map(t => {
            const Icon = t.icon
            return (
              <button key={t.key} onClick={() => setTab(t.key)} className={'px-4 py-2.5 rounded-xl text-sm font-bold transition whitespace-nowrap flex items-center gap-1.5 ' + (tab === t.key ? 'bg-emerald-600 text-white' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white')}>
                <Icon className="w-3.5 h-3.5" /> {t.label}
                {t.count !== undefined && t.count > 0 && <span className="px-1.5 py-0.5 rounded-full bg-black/20 text-[10px]">{t.count}</span>}
              </button>
            )
          })}
        </div>

        {tab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Delivery</h3>
              <div className="space-y-3 text-sm">
                <Row label="Received date" value={grn.receivedAt ? new Date(grn.receivedAt).toLocaleDateString('en-GB') : null} />
                <Row label="Received by" value={grn.receivedByName} />
                <Row label="Delivery note" value={grn.deliveryNoteNumber} />
                <Row label="Vehicle" value={grn.vehicleNumber} />
                <Row label="Driver" value={grn.driverName} />
                <Row label="Warehouse" value={grn.warehouseId} />
                <Row label="Location" value={grn.locationId} />
              </div>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Summary</h3>
              <div className="space-y-3 text-sm">
                <Row label="Lines" value={String(lines.length)} />
                <Row label="Inspections" value={String(inspections.length)} />
                <Row label="Total received" value={grn.currency + ' ' + Number(grn.totalReceived || 0).toLocaleString()} bold />
                <Row label="Has variance" value={grn.hasVariance ? 'Yes' : 'No'} />
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 md:col-span-2">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Timeline</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-xs">
                <TimeStamp label="Created" value={grn.createdAt} />
                <TimeStamp label="Updated" value={grn.updatedAt} />
              </div>
            </div>

            {grn.notes && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 md:col-span-2">
                <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Notes</h3>
                <p className="text-sm text-neutral-700 dark:text-neutral-300 whitespace-pre-wrap">{grn.notes}</p>
              </div>
            )}
          </div>
        )}

        {tab === 'lines' && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-sm font-bold flex items-center gap-2"><Layers className="w-4 h-4 text-emerald-500" /> Received Lines</h3>
            </div>
            {lines.length === 0 ? (
              <p className="text-center text-sm text-neutral-500 py-12">No lines</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                    <tr className="text-left text-[10px] uppercase tracking-wide text-neutral-500 font-bold">
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 text-right">Ordered</th>
                      <th className="px-4 py-3 text-right">Received</th>
                      <th className="px-4 py-3 text-right">Rejected</th>
                      <th className="px-4 py-3 text-right">Damaged</th>
                      <th className="px-4 py-3 text-right">Accepted</th>
                      <th className="px-4 py-3 text-right">Line Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l: any) => {
                      const accepted = Math.max(0, Number(l.receivedQty) - Number(l.rejectedQty) - Number(l.damagedQty))
                      return (
                        <tr key={l.id} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                          <td className="px-4 py-3 text-neutral-500">{l.lineNumber || '—'}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium">{l.description || l.poDescription}</p>
                            {l.unitOfMeasure && <p className="text-[10px] text-neutral-500">{l.unitOfMeasure}</p>}
                          </td>
                          <td className="px-4 py-3 text-right">{Number(l.orderedQty || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-bold text-emerald-500">{Number(l.receivedQty || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-red-400">{Number(l.rejectedQty || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right text-orange-400">{Number(l.damagedQty || 0).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-bold">{accepted.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-bold">{Number(l.lineTotal || 0).toLocaleString()}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'inspections' && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-sm font-bold flex items-center gap-2"><Microscope className="w-4 h-4 text-emerald-500" /> Quality Inspections</h3>
              {pendingInspections > 0 && !isDraft && <span className="text-xs text-amber-500 font-bold">{pendingInspections} pending decision{pendingInspections > 1 ? 's' : ''}</span>}
            </div>
            {inspections.length === 0 ? (
              <p className="text-center text-sm text-neutral-500 py-12">No inspections yet (auto-created on submit)</p>
            ) : (
              <div>
                {inspections.map((insp: any) => {
                  const line = lines.find((l: any) => l.id === insp.goodsReceiptLineId)
                  return (
                    <div key={insp.id} className="p-5 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-[260px]">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + statusColor(insp.status)}>{statusLabel(insp.status)}</span>
                            {insp.inspectorName && <span className="text-xs text-neutral-500">by {insp.inspectorName}</span>}
                            {insp.inspectedAt && <span className="text-xs text-neutral-500">· {new Date(insp.inspectedAt).toLocaleString('en-GB')}</span>}
                          </div>
                          <p className="font-bold text-sm">Line {line?.lineNumber || '—'}: {line?.description || line?.poDescription || '—'}</p>
                          {insp.findings && <p className="text-xs text-neutral-600 dark:text-neutral-400 mt-2 p-2 rounded bg-neutral-50 dark:bg-neutral-800/50 whitespace-pre-wrap">{insp.findings}</p>}
                          {insp.correctiveAction && <p className="text-xs text-cyan-600 dark:text-cyan-400 mt-2">Corrective: {insp.correctiveAction}</p>}
                          <div className="flex gap-3 mt-2 text-[11px] text-neutral-500 flex-wrap">
                            {insp.sampleSize != null && <span>Sample {insp.sampleSize}</span>}
                            {insp.passedQty != null && <span className="text-green-500">Passed {insp.passedQty}</span>}
                            {insp.failedQty != null && <span className="text-red-500">Failed {insp.failedQty}</span>}
                          </div>
                        </div>
                        {insp.status === 'PENDING' && (
                          <div className="flex gap-2 flex-wrap">
                            <button onClick={() => { openDecide(insp); setDecision('PASSED') }} className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold flex items-center gap-1">
                              <Check className="w-3 h-3" /> Pass
                            </button>
                            <button onClick={() => { openDecide(insp); setDecision('FAILED') }} className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> Fail
                            </button>
                            <button onClick={() => { openDecide(insp); setDecision('CONDITIONAL') }} className="px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-700 text-white text-xs font-bold flex items-center gap-1">
                              <Info className="w-3 h-3" /> Conditional
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'activity' && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            {activity.length === 0 ? (
              <p className="text-center text-sm text-neutral-500 py-12">No activity yet</p>
            ) : (
              <div>
                {activity.map((e: any) => (
                  <div key={e.id} className="p-4 flex items-center gap-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                    <div className="w-8 h-8 rounded-full bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {(e.actorName || 'S')[0]}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm">{e.summary || e.eventType}</p>
                      <p className="text-xs text-neutral-500">{e.actorName || 'System'} · {new Date(e.createdAt).toLocaleString('en-GB')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'related' && (
          <div className="space-y-4">
            {po && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
                <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4 flex items-center gap-2"><Package className="w-4 h-4 text-emerald-500" /> Purchase Order</h3>
                <Link href={'/wavecore-erp/procurement/orders/' + po.id} className="block p-4 rounded-xl bg-emerald-900/10 dark:bg-emerald-900/20 border border-emerald-800/30 hover:border-emerald-500 transition">
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{po.number}</p>
                  <p className="font-bold mt-1">{po.supplierName || 'Unknown supplier'}</p>
                  <p className="text-xs text-neutral-500 mt-1">{po.currency} {Number(po.total || po.amount || 0).toLocaleString()} · {po.status}</p>
                </Link>
              </div>
            )}
            {supplier && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
                <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4 flex items-center gap-2"><Users className="w-4 h-4 text-blue-500" /> Supplier</h3>
                <Link href={'/wavecore-erp/procurement/suppliers/' + supplier.id} className="block p-4 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 hover:border-blue-500 transition">
                  <p className="font-bold">{supplier.name}</p>
                  {supplier.legalName && <p className="text-xs text-neutral-500 mt-0.5">{supplier.legalName}</p>}
                  <p className="text-xs text-neutral-500 mt-1">{supplier.email || 'No email'} · {supplier.phone || 'No phone'}</p>
                </Link>
              </div>
            )}
          </div>
        )}
      </main>

      {decideTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => setDecideTarget(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl">
            <div className="flex justify-between items-center p-5 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="text-lg font-bold flex items-center gap-2"><Microscope className="w-5 h-5 text-emerald-500" /> Record Inspection Decision</h2>
              <button onClick={() => setDecideTarget(null)} className="text-neutral-400 hover:text-red-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-2">Decision *</label>
                <div className="flex gap-2">
                  {(['PASSED','FAILED','CONDITIONAL'] as const).map(d => (
                    <button key={d} onClick={() => setDecision(d)} className={'flex-1 px-3 py-2.5 rounded-xl text-sm font-bold transition ' + (decision === d ? 'bg-emerald-600 text-white' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300')}>
                      {d}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <Field label="Sample size">
                  <input type="number" value={decideForm.sampleSize} onChange={e => setDecideForm({ ...decideForm, sampleSize: e.target.value })} min="0" className="w-full px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
                </Field>
                <Field label="Passed qty">
                  <input type="number" value={decideForm.passedQty} onChange={e => setDecideForm({ ...decideForm, passedQty: e.target.value })} min="0" className="w-full px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
                </Field>
                <Field label="Failed qty">
                  <input type="number" value={decideForm.failedQty} onChange={e => setDecideForm({ ...decideForm, failedQty: e.target.value })} min="0" className="w-full px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
                </Field>
              </div>
              <Field label="Findings">
                <textarea rows={3} value={decideForm.findings} onChange={e => setDecideForm({ ...decideForm, findings: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              </Field>
              <Field label="Corrective action">
                <textarea rows={2} value={decideForm.correctiveAction} onChange={e => setDecideForm({ ...decideForm, correctiveAction: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
              </Field>
            </div>
            <div className="flex justify-end gap-2 p-5 border-t border-neutral-200 dark:border-neutral-800">
              <button onClick={() => setDecideTarget(null)} className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold">Cancel</button>
              <button onClick={submitDecide} disabled={working} className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
                {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Confirm {decision}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Row({ label, value, bold }: any) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-neutral-500">{label}</span>
      <span className={bold ? 'font-bold text-emerald-600 dark:text-emerald-400' : 'font-medium'}>{value || '—'}</span>
    </div>
  )
}

function TimeStamp({ label, value }: any) {
  return (
    <div className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800">
      <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold mb-1">{label}</p>
      <p className="text-xs font-medium">{value ? new Date(value).toLocaleString('en-GB') : '—'}</p>
    </div>
  )
}

function Field({ label, children }: any) {
  return (
    <div>
      <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">{label}</label>
      {children}
    </div>
  )
}