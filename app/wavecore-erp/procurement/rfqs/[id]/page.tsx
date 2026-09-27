'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  ClipboardList, ArrowLeft, Loader2, AlertTriangle, CheckCircle2, X,
  Check, XCircle, Send, Ban, FileDown, Layers, Activity, FileText,
  Users, ExternalLink, Calendar, Plus, Trash2, Award, TrendingUp,
  BarChart3, Sparkles, Package, Crown, ChevronRight, Clock, MapPin,
} from 'lucide-react'

type Tab = 'overview' | 'lines' | 'invites' | 'quotes' | 'analysis' | 'related'

interface RFQHook {
  id: string
  rfqNumber: string
  title: string
  description?: string
  type: string
  category?: string
  currency: string
  requisitionId?: string
  purchaseOrderId?: string
  issueDate?: string
  closingDate?: string
  deliveryDate?: string
  deliveryLocation?: string
  paymentTerms?: string
  status: string
  publishedAt?: string
  awardedAt?: string
  awardedBidId?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

const INVITE_STATUS_LABELS: Record<string, string> = {
  INVITED: 'Invited', RESPONDED: 'Responded', DECLINED: 'Declined', NO_RESPONSE: 'No Response',
}

export default function RFQDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = String(params.id || '')

  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tab, setTab] = useState<Tab>('overview')

  const [rfq, setRfq] = useState<RFQHook | null>(null)
  const [lines, setLines] = useState<any[]>([])
  const [invites, setInvites] = useState<any[]>([])
  const [quotes, setQuotes] = useState<any>({ quotes: [], totalSuppliers: 0 })
  const [requisition, setRequisition] = useState<any>(null)
  const [po, setPo] = useState<any>(null)
  const [analysis, setAnalysis] = useState<any>(null)

  const [modal, setModal] = useState<null | 'add-line' | 'add-invite' | 'quote' | 'award' | 'cancel'>(null)
  const [newLine, setNewLine] = useState<any>({ description: '', quantity: 1, unitOfMeasure: 'UNIT', specifications: '', targetPrice: 0 })
  const [invitePicker, setInvitePicker] = useState<any[]>([])
  const [inviteSearch, setInviteSearch] = useState('')
  const [selectedInviteIds, setSelectedInviteIds] = useState<string[]>([])
  const [quoteSupplierId, setQuoteSupplierId] = useState('')
  const [quoteLines, setQuoteLines] = useState<any[]>([])
  const [awardSupplierId, setAwardSupplierId] = useState('')
  const [cancelReason, setCancelReason] = useState('')

  const csrf = () => document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || ''
  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3500) }

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/procurement/rfqs/' + id)
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); return }
      setRfq(data.rfq)
      setLines(data.lines || [])
      setInvites(data.invites || [])
      setRequisition(data.requisition)
      setPo(data.purchaseOrder)
      // quotes
      const qres = await fetch('/api/wavecore/procurement/rfqs/' + id + '/quotes')
      const qdata = await qres.json()
      if (qres.ok) setQuotes(qdata)
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { if (id) fetchAll() /* eslint-disable-next-line */ }, [id])

  const lifecycle = async (action: string, extra?: any) => {
    setWorking(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/procurement/rfqs/' + id + '/lifecycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({ action, ...(extra || {}) }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Action failed'); return false }
      flash(action + ' OK')
      fetchAll()
      return true
    } catch (e) {
      setError('Network error: ' + (e as Error).message)
      return false
    } finally { setWorking(false) }
  }

  const runAnalysis = async () => {
    setWorking(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/procurement/rfqs/' + id + '/analysis', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: '{}',
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Analysis failed'); return }
      setAnalysis(data.analysis)
      flash('Analysis complete')
    } catch (e) {
      setError('Network error: ' + (e as Error).message)
    } finally { setWorking(false) }
  }

  const addLine = async () => {
    if (!newLine.description.trim()) { setError('Description required'); return }
    setWorking(true)
    try {
      const res = await fetch('/api/wavecore/procurement/rfqs/' + id + '/lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify(newLine),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash('Line added')
      setModal(null)
      setNewLine({ description: '', quantity: 1, unitOfMeasure: 'UNIT', specifications: '', targetPrice: 0 })
      fetchAll()
    } finally { setWorking(false) }
  }

  const removeLine = async (lineId: string) => {
    if (!confirm('Remove this line?')) return
    const res = await fetch('/api/wavecore/procurement/rfqs/' + id + '/lines/' + lineId, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrf() },
    })
    if (res.ok) { flash('Line removed'); fetchAll() }
    else { const d = await res.json(); setError(d.error || 'Failed') }
  }

  const loadInvitePicker = async () => {
    setModal('add-invite')
    setInviteSearch('')
    setSelectedInviteIds([])
    if (invitePicker.length === 0) {
      try {
        const res = await fetch('/api/wavecore/procurement/suppliers?status=ACTIVE&limit=200')
        const data = await res.json()
        if (res.ok) setInvitePicker(data.suppliers || [])
      } catch {}
    }
  }

  const saveInvites = async () => {
    if (selectedInviteIds.length === 0) { setError('Pick at least one supplier'); return }
    setWorking(true)
    try {
      const res = await fetch('/api/wavecore/procurement/rfqs/' + id + '/invites', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({ supplierIds: selectedInviteIds }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash('Invites added')
      setModal(null)
      fetchAll()
    } finally { setWorking(false) }
  }

  const removeInvite = async (inviteId: string) => {
    if (!confirm('Remove this invite?')) return
    const res = await fetch('/api/wavecore/procurement/rfqs/' + id + '/invites/' + inviteId, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrf() },
    })
    if (res.ok) { flash('Invite removed'); fetchAll() }
    else { const d = await res.json(); setError(d.error || 'Failed') }
  }

  const openQuoteModal = (supplierId: string) => {
    setQuoteSupplierId(supplierId)
    setQuoteLines(lines.map(l => ({
      rfqLineId: l.id,
      description: l.description,
      quantity: Number(l.quantity) || 0,
      unitPrice: 0,
      taxRate: 0,
      leadTimeDays: '',
      incoterms: '',
      validUntil: '',
      notes: '',
    })))
    setModal('quote')
  }

  const submitQuote = async () => {
    if (!quoteSupplierId) { setError('Pick a supplier'); return }
    setWorking(true)
    try {
      const payload = {
        supplierId: quoteSupplierId,
        lines: quoteLines.map(l => ({
          rfqLineId: l.rfqLineId,
          quantity: Number(l.quantity) || 0,
          unitPrice: Number(l.unitPrice) || 0,
          taxRate: Number(l.taxRate) || 0,
          leadTimeDays: l.leadTimeDays !== '' ? Number(l.leadTimeDays) : undefined,
          incoterms: l.incoterms || undefined,
          validUntil: l.validUntil || undefined,
          notes: l.notes || undefined,
        })),
      }
      const res = await fetch('/api/wavecore/procurement/rfqs/' + id + '/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash('Quote submitted')
      setModal(null)
      fetchAll()
      setTab('quotes')
    } finally { setWorking(false) }
  }

  const submitAward = async () => {
    if (!awardSupplierId) { setError('Pick a supplier to award'); return }
    const ok = await lifecycle('AWARD', { awardedSupplierId: awardSupplierId })
    if (ok) { setModal(null); setAwardSupplierId('') }
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'DRAFT': return 'bg-neutral-700 text-neutral-200'
      case 'PUBLISHED': return 'bg-blue-900/50 text-blue-200'
      case 'CLOSED': return 'bg-amber-900/50 text-amber-200'
      case 'AWARDED': return 'bg-green-900/50 text-green-200'
      case 'CANCELLED': return 'bg-neutral-800 text-neutral-500'
      default: return 'bg-neutral-800 text-neutral-300'
    }
  }
  const statusLabel = (s: string) => ({
    DRAFT: 'Draft', PUBLISHED: 'Published', CLOSED: 'Closed',
    AWARDED: 'Awarded', CANCELLED: 'Cancelled',
  } as Record<string, string>)[s] || s

  if (loading) return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
    </div>
  )
  if (error && !rfq) return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-500" />
        <p className="text-red-300 mb-4">{error}</p>
        <Link href="/wavecore-erp/procurement/rfqs" className="px-5 py-2.5 rounded-xl bg-purple-600 text-white font-bold">Back</Link>
      </div>
    </div>
  )
  if (!rfq) return null

  const isDraft = rfq.status === 'DRAFT'
  const isPublished = rfq.status === 'PUBLISHED'
  const isClosed = rfq.status === 'CLOSED'
  const isAwarded = rfq.status === 'AWARDED'
  const isCancelled = rfq.status === 'CANCELLED'
  const canPublish = isDraft && invites.length > 0
  const canClose = isPublished
  const canAward = (isPublished || isClosed) && quotes.quotes.length > 0
  const canCancel = !isAwarded && !isCancelled
  const canEditLines = isDraft
  const canEditInvites = isDraft || isPublished
  const canQuote = isPublished

  const daysToClose = rfq.closingDate
    ? Math.floor((new Date(rfq.closingDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const tabs: { key: Tab; label: string; icon: any; count?: number }[] = [
    { key: 'overview', label: 'Overview',  icon: FileText },
    { key: 'lines',    label: 'Lines',     icon: Layers, count: lines.length },
    { key: 'invites',  label: 'Invites',   icon: Users, count: invites.length },
    { key: 'quotes',   label: 'Quotes',    icon: TrendingUp, count: quotes.totalSuppliers },
    { key: 'analysis', label: 'Analysis',  icon: BarChart3 },
    { key: 'related',  label: 'Related',   icon: ExternalLink },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/procurement" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-500">Procurement · RFQ</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <Link href="/wavecore-erp/procurement/rfqs" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to RFQs
        </Link>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2"><AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/30 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-purple-600 via-fuchsia-600 to-pink-700 p-6 lg:p-8 mb-6">
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div className="flex-1 min-w-[280px]">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-sm font-bold text-white/90">{rfq.rfqNumber || '—'}</span>
                <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + statusColor(rfq.status)}>{statusLabel(rfq.status)}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">{rfq.type}</span>
                {rfq.category && <span className="text-[10px] text-white/70">{rfq.category}</span>}
                {isPublished && daysToClose != null && daysToClose >= 0 && daysToClose <= 7 && (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-900/60 text-amber-100">closes in {daysToClose}d</span>
                )}
                {isAwarded && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-900/60 text-green-100 flex items-center gap-1"><Crown className="w-3 h-3" /> awarded</span>}
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-white mb-2">{rfq.title}</p>
              <div className="flex items-center gap-4 text-xs text-white/80 flex-wrap">
                {rfq.closingDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />closes {new Date(rfq.closingDate).toLocaleDateString('en-GB')}</span>}
                {rfq.deliveryDate && <span className="flex items-center gap-1"><Clock className="w-3 h-3" />delivery {new Date(rfq.deliveryDate).toLocaleDateString('en-GB')}</span>}
                {rfq.deliveryLocation && <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{rfq.deliveryLocation}</span>}
                {requisition && <span className="flex items-center gap-1"><FileText className="w-3 h-3" />req {requisition.requisitionNumber}</span>}
              </div>
            </div>
          </div>

          <div className="flex gap-2 mt-6 flex-wrap">
            {canPublish && (
              <button onClick={() => lifecycle('PUBLISH')} disabled={working} className="px-4 py-2.5 rounded-xl bg-white text-purple-700 font-bold flex items-center gap-2 shadow-lg disabled:opacity-50">
                {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Publish
              </button>
            )}
            {canClose && (
              <button onClick={() => lifecycle('CLOSE')} disabled={working} className="px-4 py-2.5 rounded-xl bg-white text-purple-700 font-bold flex items-center gap-2 shadow-lg disabled:opacity-50">
                {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />} Close
              </button>
            )}
            {canAward && (
              <button onClick={() => setModal('award')} className="px-4 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold flex items-center gap-2 shadow-lg">
                <Award className="w-4 h-4" /> Award
              </button>
            )}
            {canCancel && !isDraft && (
              <button onClick={() => setModal('cancel')} className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-2">
                <Ban className="w-4 h-4" /> Cancel
              </button>
            )}
            {isDraft && (
              <button onClick={async () => {
                if (!confirm('Delete this draft RFQ? Cannot be undone.')) return
                const res = await fetch('/api/wavecore/procurement/rfqs/' + id, { method: 'DELETE', headers: { 'X-CSRF-Token': csrf() } })
                if (res.ok) router.push('/wavecore-erp/procurement/rfqs')
                else { const d = await res.json(); setError(d.error || 'Delete failed') }
              }} className="px-4 py-2.5 rounded-xl bg-red-700/80 hover:bg-red-700 text-white font-bold flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Delete
              </button>
            )}
            <button onClick={() => window.print()} className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-2">
              <FileDown className="w-4 h-4" /> Print
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-white dark:bg-neutral-900 rounded-2xl p-1 mb-6 overflow-x-auto border border-neutral-200 dark:border-neutral-800">
          {tabs.map(t => {
            const Icon = t.icon
            return (
              <button key={t.key} onClick={() => setTab(t.key)} className={'px-4 py-2.5 rounded-xl text-sm font-bold transition whitespace-nowrap flex items-center gap-1.5 ' + (tab === t.key ? 'bg-purple-600 text-white' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white')}>
                <Icon className="w-3.5 h-3.5" /> {t.label}
                {t.count !== undefined && t.count > 0 && <span className="px-1.5 py-0.5 rounded-full bg-black/20 text-[10px]">{t.count}</span>}
              </button>
            )
          })}
        </div>

        {tab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 md:col-span-2">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Description</h3>
              <p className="text-sm whitespace-pre-wrap">{rfq.description || '—'}</p>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Terms</h3>
              <div className="space-y-3 text-sm">
                <Row label="Type" value={rfq.type} />
                <Row label="Category" value={rfq.category} />
                <Row label="Currency" value={rfq.currency} />
                <Row label="Payment terms" value={rfq.paymentTerms} />
              </div>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Timeline</h3>
              <div className="space-y-3 text-sm">
                <Row label="Issued" value={rfq.issueDate ? new Date(rfq.issueDate).toLocaleDateString('en-GB') : null} />
                <Row label="Closes" value={rfq.closingDate ? new Date(rfq.closingDate).toLocaleDateString('en-GB') : null} />
                <Row label="Delivery" value={rfq.deliveryDate ? new Date(rfq.deliveryDate).toLocaleDateString('en-GB') : null} />
                <Row label="Published" value={rfq.publishedAt ? new Date(rfq.publishedAt).toLocaleString('en-GB') : null} />
                <Row label="Awarded" value={rfq.awardedAt ? new Date(rfq.awardedAt).toLocaleString('en-GB') : null} />
              </div>
            </div>
            {rfq.notes && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 md:col-span-2">
                <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Notes</h3>
                <p className="text-sm whitespace-pre-wrap">{rfq.notes}</p>
              </div>
            )}
          </div>
        )}

        {tab === 'lines' && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-sm font-bold flex items-center gap-2"><Layers className="w-4 h-4 text-purple-500" /> RFQ Lines</h3>
              {canEditLines && (
                <button onClick={() => setModal('add-line')} className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add line
                </button>
              )}
            </div>
            {lines.length === 0 ? (
              <p className="text-center text-sm text-neutral-500 py-12">No lines yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                    <tr className="text-left text-[10px] uppercase tracking-wide text-neutral-500 font-bold">
                      <th className="px-4 py-3">#</th>
                      <th className="px-4 py-3">Description</th>
                      <th className="px-4 py-3 text-right">Qty</th>
                      <th className="px-4 py-3 text-right">Target Price</th>
                      <th className="px-4 py-3">Specs</th>
                      {canEditLines && <th className="px-4 py-3"></th>}
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((l: any) => (
                      <tr key={l.id} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                        <td className="px-4 py-3 text-neutral-500">{l.lineNumber || '—'}</td>
                        <td className="px-4 py-3">
                          <p className="font-medium">{l.description}</p>
                          {l.unitOfMeasure && <p className="text-[10px] text-neutral-500">{l.unitOfMeasure}</p>}
                        </td>
                        <td className="px-4 py-3 text-right">{Number(l.quantity || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">{Number(l.targetPrice || 0).toLocaleString()}</td>
                        <td className="px-4 py-3 text-xs text-neutral-500">{l.specifications || '—'}</td>
                        {canEditLines && (
                          <td className="px-4 py-3 text-right">
                            <button onClick={() => removeLine(l.id)} className="p-1 rounded text-red-500 hover:bg-red-900/20"><Trash2 className="w-3.5 h-3.5" /></button>
                          </td>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {tab === 'invites' && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-sm font-bold flex items-center gap-2"><Users className="w-4 h-4 text-purple-500" /> Invited Suppliers</h3>
              {canEditInvites && (
                <button onClick={loadInvitePicker} className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Invite
                </button>
              )}
            </div>
            {invites.length === 0 ? (
              <p className="text-center text-sm text-neutral-500 py-12">No suppliers invited yet</p>
            ) : (
              <div>
                {invites.map((i: any) => {
                  const q = quotes.quotes.find((qq: any) => qq.supplierId === i.supplierId)
                  return (
                    <div key={i.id} className="p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1 min-w-[220px]">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="font-bold text-sm">{i.supplierName || 'Unknown supplier'}</p>
                          <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + (
                            i.status === 'RESPONDED' ? 'bg-green-900/50 text-green-300' :
                            i.status === 'DECLINED' ? 'bg-red-900/50 text-red-300' :
                            i.status === 'NO_RESPONSE' ? 'bg-orange-900/50 text-orange-300' :
                            'bg-neutral-800 text-neutral-400'
                          )}>{INVITE_STATUS_LABELS[i.status] || i.status}</span>
                        </div>
                        <p className="text-[11px] text-neutral-500">
                          Invited {i.invitedAt ? new Date(i.invitedAt).toLocaleDateString('en-GB') : '—'}
                          {i.respondedAt && ' · responded ' + new Date(i.respondedAt).toLocaleDateString('en-GB')}
                        </p>
                        {q && <p className="text-[11px] text-purple-500 mt-1">Quoted {q.currency || rfq.currency} {Number(q.total || 0).toLocaleString()}</p>}
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {canQuote && (
                          <button onClick={() => openQuoteModal(i.supplierId)} className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1">
                            <Sparkles className="w-3 h-3" /> {q ? 'Update quote' : 'Submit quote'}
                          </button>
                        )}
                        {canEditInvites && (
                          <button onClick={() => removeInvite(i.id)} className="p-1.5 rounded text-red-400 hover:bg-red-900/30"><Trash2 className="w-3.5 h-3.5" /></button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'quotes' && (
          <div className="space-y-4">
            {quotes.quotes.length === 0 ? (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-12 text-center">
                <TrendingUp className="w-12 h-12 mx-auto mb-3 text-neutral-300 dark:text-neutral-700" />
                <p className="text-sm text-neutral-500">No quotes submitted yet</p>
              </div>
            ) : quotes.quotes.map((q: any) => (
              <div key={q.supplierId} className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="p-5 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center gap-3 flex-wrap">
                  <div>
                    <p className="font-bold">{q.supplierName || 'Unknown supplier'}</p>
                    <p className="text-xs text-neutral-500">{q.lines.length} line{q.lines.length !== 1 ? 's' : ''} · avg lead {q.leadTimeAvg}d</p>
                  </div>
                  <p className="text-lg font-bold text-purple-500">{q.lines[0]?.currency || rfq.currency} {Number(q.total || 0).toLocaleString()}</p>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                      <tr className="text-left text-[10px] uppercase tracking-wide text-neutral-500 font-bold">
                        <th className="px-4 py-2">Line</th>
                        <th className="px-4 py-2 text-right">Qty</th>
                        <th className="px-4 py-2 text-right">Unit Price</th>
                        <th className="px-4 py-2 text-right">Tax %</th>
                        <th className="px-4 py-2 text-right">Lead</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {q.lines.map((l: any) => (
                        <tr key={l.id} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                          <td className="px-4 py-2 text-neutral-500 text-xs">{l.lineDescription || '—'}</td>
                          <td className="px-4 py-2 text-right">{Number(l.quantity).toLocaleString()}</td>
                          <td className="px-4 py-2 text-right">{Number(l.unitPrice).toLocaleString()}</td>
                          <td className="px-4 py-2 text-right">{Number(l.taxRate || 0)}%</td>
                          <td className="px-4 py-2 text-right">{l.leadTimeDays ? l.leadTimeDays + 'd' : '—'}</td>
                          <td className="px-4 py-2 text-right font-bold">{Number(l.lineTotal).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}

        {tab === 'analysis' && (
          <div className="space-y-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 flex justify-between items-start gap-4 flex-wrap">
              <div>
                <h3 className="text-sm font-bold flex items-center gap-2 mb-1"><BarChart3 className="w-4 h-4 text-purple-500" /> Weighted Bid Analysis</h3>
                <p className="text-xs text-neutral-500">Scores suppliers on price, lead time, rating and coverage. Weighted sum + preferred bonus.</p>
                {analysis && (
                  <div className="mt-2 flex gap-2 flex-wrap text-[10px]">
                    <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">price {analysis.weights.price}%</span>
                    <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">lead {analysis.weights.leadTime}%</span>
                    <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">rating {analysis.weights.rating}%</span>
                    <span className="px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300">coverage {analysis.weights.coverage}%</span>
                  </div>
                )}
              </div>
              <button onClick={runAnalysis} disabled={working || quotes.quotes.length === 0} className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
                {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <BarChart3 className="w-4 h-4" />} Run Analysis
              </button>
            </div>

            {!analysis && quotes.quotes.length > 0 && (
              <p className="text-center text-sm text-neutral-500 py-6">Click "Run Analysis" to score the {quotes.totalSuppliers} submitted quote{quotes.totalSuppliers !== 1 ? 's' : ''}</p>
            )}

            {analysis && analysis.recommendedSupplierId && (
              <div className="rounded-2xl p-6 bg-green-900/10 dark:bg-green-900/20 border border-green-800">
                <div className="flex items-center gap-3 mb-2">
                  <Crown className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-green-600 dark:text-green-400 font-bold">Recommended</p>
                    <p className="text-2xl font-bold">{analysis.ranking[0]?.supplierName}</p>
                  </div>
                </div>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mt-2">{analysis.rationale}</p>
                {!isAwarded && !isCancelled && (
                  <button onClick={() => { setAwardSupplierId(analysis.recommendedSupplierId); setModal('award') }} className="mt-4 px-5 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold flex items-center gap-2">
                    <Award className="w-4 h-4" /> Award to {analysis.ranking[0]?.supplierName}
                  </button>
                )}
              </div>
            )}

            {analysis && analysis.ranking.length > 0 && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
                <div className="p-5 border-b border-neutral-200 dark:border-neutral-800">
                  <h3 className="text-sm font-bold">Ranking</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                      <tr className="text-left text-[10px] uppercase tracking-wide text-neutral-500 font-bold">
                        <th className="px-4 py-3">#</th>
                        <th className="px-4 py-3">Supplier</th>
                        <th className="px-4 py-3 text-right">Total</th>
                        <th className="px-4 py-3 text-right">Price</th>
                        <th className="px-4 py-3 text-right">Lead</th>
                        <th className="px-4 py-3 text-right">Rating</th>
                        <th className="px-4 py-3 text-right">Coverage</th>
                        <th className="px-4 py-3 text-right">Final</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analysis.ranking.map((r: any) => (
                        <tr key={r.supplierId} className={'border-b border-neutral-100 dark:border-neutral-800 last:border-0 ' + (r.isRecommended ? 'bg-green-900/10' : '')}>
                          <td className="px-4 py-3 font-bold">{r.rank === 1 ? '🥇' : r.rank === 2 ? '🥈' : r.rank === 3 ? '🥉' : r.rank}</td>
                          <td className="px-4 py-3">
                            <p className="font-medium flex items-center gap-2">
                              {r.supplierName}
                              {r.bonus > 0 && <span className="px-1.5 py-0.5 rounded-full bg-amber-900/50 text-amber-300 text-[9px] font-bold">+{r.bonus} preferred</span>}
                            </p>
                            <p className="text-[10px] text-neutral-500">{r.linesQuoted}/{r.linesTotal} lines</p>
                          </td>
                          <td className="px-4 py-3 text-right font-bold">{Number(r.totalQuoted).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">{r.scores.price}</td>
                          <td className="px-4 py-3 text-right">{r.scores.leadTime} <span className="text-[10px] text-neutral-500">({r.leadTimeAvg}d)</span></td>
                          <td className="px-4 py-3 text-right">{r.scores.rating}</td>
                          <td className="px-4 py-3 text-right">{r.scores.coverage}</td>
                          <td className="px-4 py-3 text-right font-bold text-purple-500">{r.finalScore}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'related' && (
          <div className="space-y-4">
            {requisition && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
                <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4 flex items-center gap-2"><FileText className="w-4 h-4 text-indigo-500" /> Linked Requisition</h3>
                <Link href={'/wavecore-erp/procurement/requisitions/' + requisition.id} className="block p-4 rounded-xl bg-indigo-900/10 dark:bg-indigo-900/20 border border-indigo-800/30 hover:border-indigo-500 transition">
                  <p className="text-xs font-bold text-indigo-600 dark:text-indigo-400">{requisition.requisitionNumber}</p>
                  <p className="font-bold mt-1">{requisition.title}</p>
                  <p className="text-xs text-neutral-500 mt-1">{requisition.status} · {requisition.currency} {Number(requisition.totalAmount || 0).toLocaleString()}</p>
                </Link>
              </div>
            )}
            {po && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
                <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4 flex items-center gap-2"><Package className="w-4 h-4 text-emerald-500" /> Purchase Order</h3>
                <Link href={'/wavecore-erp/procurement/orders/' + po.id} className="block p-4 rounded-xl bg-emerald-900/10 dark:bg-emerald-900/20 border border-emerald-800/30 hover:border-emerald-500 transition">
                  <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">{po.number}</p>
                  <p className="font-bold mt-1">{po.supplierName}</p>
                  <p className="text-xs text-neutral-500 mt-1">{po.status}</p>
                </Link>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Modals */}
      {modal === 'add-line' && (
        <Modal title="Add RFQ line" onClose={() => setModal(null)}>
          <Field label="Description *"><input value={newLine.description} onChange={e => setNewLine({ ...newLine, description: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" /></Field>
          <div className="grid grid-cols-3 gap-2 mt-3">
            <Field label="Qty"><input type="number" value={newLine.quantity} onChange={e => setNewLine({ ...newLine, quantity: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" /></Field>
            <Field label="UoM">
              <select value={newLine.unitOfMeasure} onChange={e => setNewLine({ ...newLine, unitOfMeasure: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                {['UNIT','BOX','KG','LITER','METER','SET','PAIR','HOUR','DAY','MONTH'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </Field>
            <Field label="Target price"><input type="number" value={newLine.targetPrice} onChange={e => setNewLine({ ...newLine, targetPrice: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" /></Field>
          </div>
          <Field label="Specifications"><textarea rows={2} value={newLine.specifications} onChange={e => setNewLine({ ...newLine, specifications: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm mt-3" /></Field>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold">Cancel</button>
            <button onClick={addLine} disabled={working} className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
              {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
            </button>
          </div>
        </Modal>
      )}

      {modal === 'add-invite' && (
        <Modal title="Invite suppliers" onClose={() => setModal(null)}>
          <input value={inviteSearch} onChange={e => setInviteSearch(e.target.value)} placeholder="Search suppliers…" className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm mb-3" />
          <div className="max-h-64 overflow-y-auto rounded-xl border border-neutral-200 dark:border-neutral-800">
            {invitePicker
              .filter(s => !invites.find(i => i.supplierId === s.id))
              .filter(s => !inviteSearch || s.name.toLowerCase().includes(inviteSearch.toLowerCase()))
              .map(s => {
                const picked = selectedInviteIds.includes(s.id)
                return (
                  <button key={s.id} onClick={() => setSelectedInviteIds(prev => picked ? prev.filter(x => x !== s.id) : [...prev, s.id])} className={'w-full text-left p-3 border-b border-neutral-100 dark:border-neutral-800 last:border-0 hover:bg-neutral-50 dark:hover:bg-neutral-800 ' + (picked ? 'bg-purple-900/10' : '')}>
                    <p className="text-sm font-medium">{s.name}</p>
                    {s.legalName && <p className="text-xs text-neutral-500">{s.legalName}</p>}
                  </button>
                )
              })}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold">Cancel</button>
            <button onClick={saveInvites} disabled={working || selectedInviteIds.length === 0} className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
              {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Invite {selectedInviteIds.length}
            </button>
          </div>
        </Modal>
      )}

      {modal === 'quote' && (
        <Modal title={'Submit quote'} onClose={() => setModal(null)} width="max-w-3xl">
          <div className="space-y-3 max-h-[60vh] overflow-y-auto">
            {quoteLines.map((ql, i) => (
              <div key={i} className="p-3 rounded-xl bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-200 dark:border-neutral-800 space-y-2">
                <p className="text-xs font-bold text-neutral-500">Line {i+1}: {ql.description} (qty {ql.quantity})</p>
                <div className="grid grid-cols-3 gap-2">
                  <Field label="Unit price *"><input type="number" value={ql.unitPrice} onChange={e => setQuoteLines(prev => prev.map((x, idx) => idx === i ? { ...x, unitPrice: Number(e.target.value) } : x))} min="0" step="0.01" className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm" /></Field>
                  <Field label="Tax %"><input type="number" value={ql.taxRate} onChange={e => setQuoteLines(prev => prev.map((x, idx) => idx === i ? { ...x, taxRate: Number(e.target.value) } : x))} min="0" max="100" className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm" /></Field>
                  <Field label="Lead days"><input type="number" value={ql.leadTimeDays} onChange={e => setQuoteLines(prev => prev.map((x, idx) => idx === i ? { ...x, leadTimeDays: e.target.value } : x))} min="0" className="w-full px-3 py-2 rounded-lg bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-700 text-sm" /></Field>
                </div>
              </div>
            ))}
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold">Cancel</button>
            <button onClick={submitQuote} disabled={working} className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
              {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Submit quote
            </button>
          </div>
        </Modal>
      )}

      {modal === 'award' && (
        <Modal title="Award RFQ" onClose={() => setModal(null)}>
          <Field label="Award to supplier *">
            <select value={awardSupplierId} onChange={e => setAwardSupplierId(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
              <option value="">Pick a supplier…</option>
              {quotes.quotes.map((q: any) => (
                <option key={q.supplierId} value={q.supplierId}>
                  {q.supplierName} — {q.lines[0]?.currency || rfq.currency} {Number(q.total || 0).toLocaleString()}
                </option>
              ))}
            </select>
          </Field>
          <p className="text-xs text-neutral-500 mt-3">Awarding accepts this supplier's quotes and rejects all others.</p>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold">Cancel</button>
            <button onClick={submitAward} disabled={working || !awardSupplierId} className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
              {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Award className="w-4 h-4" />} Award
            </button>
          </div>
        </Modal>
      )}

      {modal === 'cancel' && (
        <Modal title="Cancel RFQ" onClose={() => setModal(null)}>
          <Field label="Reason (optional)"><textarea rows={3} value={cancelReason} onChange={e => setCancelReason(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" /></Field>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold">Keep</button>
            <button onClick={async () => { const ok = await lifecycle('CANCEL', { reason: cancelReason }); if (ok) { setModal(null); setCancelReason('') } }} disabled={working} className="px-6 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
              {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Ban className="w-4 h-4" />} Cancel RFQ
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}

function Row({ label, value, bold }: any) {
  return (
    <div className="flex justify-between gap-3">
      <span className="text-neutral-500">{label}</span>
      <span className={bold ? 'font-bold text-purple-600 dark:text-purple-400' : 'font-medium'}>{value || '—'}</span>
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

function Modal({ title, children, onClose, width = 'max-w-lg' }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className={'w-full bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl ' + width}>
        <div className="flex justify-between items-center p-5 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-red-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}