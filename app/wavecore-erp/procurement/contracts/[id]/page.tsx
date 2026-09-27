'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
  FileSignature, ArrowLeft, Loader2, AlertTriangle, CheckCircle2, X,
  Check, XCircle, Ban, FileDown, Layers, Activity, FileText, Users,
  ExternalLink, Calendar, DollarSign, Plus, Trash2, Save, Clock,
  RefreshCw, Pause, Play, Landmark, PenTool, AlertCircle,
} from 'lucide-react'

type Tab = 'overview' | 'lines' | 'milestones' | 'activity' | 'related'

interface ContractHook {
  id: string
  contractNumber: string
  title: string
  supplierId?: string
  supplierName?: string
  type: string
  startDate?: string
  endDate?: string
  value: number
  currency: string
  paymentTerms: number
  status: string
  autoRenew: boolean
  renewalNoticeDays: number
  signedAt?: string
  signedByName?: string
  contractFileUrl?: string
  notes?: string
  createdAt: string
  updatedAt: string
}

export default function ContractDetailPage() {
  const params = useParams()
  const router = useRouter()
  const id = String(params.id || '')

  const [loading, setLoading] = useState(true)
  const [working, setWorking] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [tab, setTab] = useState<Tab>('overview')

  const [contract, setContract] = useState<ContractHook | null>(null)
  const [lines, setLines] = useState<any[]>([])
  const [milestones, setMilestones] = useState<any[]>([])
  const [supplier, setSupplier] = useState<any>(null)

  const [modal, setModal] = useState<null | 'sign' | 'suspend' | 'terminate' | 'cancel' | 'add-line' | 'add-milestone'>(null)
  const [comment, setComment] = useState('')
  const [newLine, setNewLine] = useState<any>({ description: '', quantity: 1, unitPrice: 0, taxRate: 0, unitOfMeasure: 'UNIT' })
  const [newMilestone, setNewMilestone] = useState<any>({ name: '', dueDate: '', amount: 0, notes: '' })

  const csrf = () => document.cookie.match(/wavecore_csrf=([^;]+)/)?.[1] || ''
  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3500) }

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/procurement/contracts/' + id)
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); return }
      setContract(data.contract)
      setLines(data.lines || [])
      setMilestones(data.milestones || [])
      setSupplier(data.supplier)
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { if (id) fetchAll() /* eslint-disable-next-line */ }, [id])

  const lifecycle = async (action: string, reason?: string) => {
    setWorking(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/procurement/contracts/' + id + '/lifecycle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify({ action, reason }),
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

  const addLine = async () => {
    if (!newLine.description.trim()) { setError('Description required'); return }
    setWorking(true)
    try {
      const res = await fetch('/api/wavecore/procurement/contracts/' + id + '/lines', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify(newLine),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash('Line added')
      setModal(null)
      setNewLine({ description: '', quantity: 1, unitPrice: 0, taxRate: 0, unitOfMeasure: 'UNIT' })
      fetchAll()
    } finally { setWorking(false) }
  }

  const removeLine = async (lineId: string) => {
    if (!confirm('Remove this line?')) return
    const res = await fetch('/api/wavecore/procurement/contracts/' + id + '/lines/' + lineId, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrf() },
    })
    if (res.ok) { flash('Line removed'); fetchAll() }
    else { const d = await res.json(); setError(d.error || 'Failed') }
  }

  const addMilestone = async () => {
    if (!newMilestone.name.trim()) { setError('Milestone name required'); return }
    setWorking(true)
    try {
      const res = await fetch('/api/wavecore/procurement/contracts/' + id + '/milestones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
        body: JSON.stringify(newMilestone),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash('Milestone added')
      setModal(null)
      setNewMilestone({ name: '', dueDate: '', amount: 0, notes: '' })
      fetchAll()
    } finally { setWorking(false) }
  }

  const updateMilestone = async (msId: string, patch: any) => {
    const res = await fetch('/api/wavecore/procurement/contracts/' + id + '/milestones/' + msId, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': csrf() },
      body: JSON.stringify(patch),
    })
    if (res.ok) { flash('Milestone updated'); fetchAll() }
    else { const d = await res.json(); setError(d.error || 'Failed') }
  }

  const removeMilestone = async (msId: string) => {
    if (!confirm('Remove this milestone?')) return
    const res = await fetch('/api/wavecore/procurement/contracts/' + id + '/milestones/' + msId, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrf() },
    })
    if (res.ok) { flash('Milestone removed'); fetchAll() }
    else { const d = await res.json(); setError(d.error || 'Failed') }
  }

  const deleteContract = async () => {
    if (!confirm('Delete this DRAFT contract? Cannot be undone.')) return
    const res = await fetch('/api/wavecore/procurement/contracts/' + id, {
      method: 'DELETE',
      headers: { 'X-CSRF-Token': csrf() },
    })
    if (res.ok) router.push('/wavecore-erp/procurement/contracts')
    else { const d = await res.json(); setError(d.error || 'Delete failed') }
  }

  const statusColor = (s: string) => {
    switch (s) {
      case 'DRAFT': return 'bg-neutral-700 text-neutral-200'
      case 'ACTIVE': return 'bg-green-900/50 text-green-200'
      case 'SUSPENDED': return 'bg-amber-900/50 text-amber-200'
      case 'EXPIRED': return 'bg-orange-900/50 text-orange-200'
      case 'TERMINATED': return 'bg-red-900/50 text-red-200'
      default: return 'bg-neutral-800 text-neutral-300'
    }
  }

  const statusLabel = (s: string) => ({
    DRAFT: 'Draft', ACTIVE: 'Active', SUSPENDED: 'Suspended',
    EXPIRED: 'Expired', TERMINATED: 'Terminated',
  } as Record<string, string>)[s] || s

  if (loading) return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-blue-500" />
    </div>
  )
  if (error && !contract) return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
      <div className="text-center">
        <AlertTriangle className="w-12 h-12 mx-auto mb-3 text-red-500" />
        <p className="text-red-300 mb-4">{error}</p>
        <Link href="/wavecore-erp/procurement/contracts" className="px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold">Back</Link>
      </div>
    </div>
  )
  if (!contract) return null

  const daysToExpiry = contract.endDate
    ? Math.floor((new Date(contract.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
    : null

  const isDraft = contract.status === 'DRAFT'
  const isActive = contract.status === 'ACTIVE'
  const isSuspended = contract.status === 'SUSPENDED'
  const isTerminal = ['TERMINATED','EXPIRED'].includes(contract.status)
  const canSign = isDraft && !contract.signedAt
  const canActivate = isDraft && !!contract.signedAt
  const canSuspend = isActive
  const canResume = isSuspended
  const canTerminate = isActive || isSuspended
  const canCancel = !isTerminal

  const tabs: { key: Tab; label: string; icon: any; count?: number }[] = [
    { key: 'overview',   label: 'Overview',   icon: FileText },
    { key: 'lines',      label: 'Lines',      icon: Layers, count: lines.length },
    { key: 'milestones', label: 'Milestones', icon: Clock, count: milestones.length },
    { key: 'activity',   label: 'Activity',   icon: Activity },
    { key: 'related',    label: 'Related',    icon: ExternalLink },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/procurement" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-500">Procurement · Contract</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <Link href="/wavecore-erp/procurement/contracts" className="text-sm text-neutral-500 hover:text-neutral-900 dark:hover:text-white flex items-center gap-1 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Contracts
        </Link>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/30 text-red-300 border border-red-800 flex items-start gap-2"><AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" /> {error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/30 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        {/* Expiry banner */}
        {isActive && daysToExpiry != null && daysToExpiry >= 0 && daysToExpiry <= 60 && (
          <div className="mb-4 p-4 rounded-xl bg-amber-900/20 text-amber-200 border border-amber-800 flex items-center gap-3">
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <div className="flex-1">
              <p className="font-bold text-sm">Contract expires in {daysToExpiry} day{daysToExpiry !== 1 ? 's' : ''}</p>
              <p className="text-xs text-amber-300/80">
                End date: {new Date(contract.endDate!).toLocaleDateString('en-GB')}
                {contract.autoRenew && ' · auto-renew enabled (' + contract.renewalNoticeDays + 'd notice)'}
              </p>
            </div>
          </div>
        )}

        {/* Hero */}
        <div className="rounded-3xl bg-gradient-to-br from-sky-600 via-blue-600 to-indigo-700 p-6 lg:p-8 mb-6">
          <div className="flex justify-between items-start gap-4 flex-wrap">
            <div className="flex-1 min-w-[280px]">
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <span className="text-sm font-bold text-white/90">{contract.contractNumber}</span>
                <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + statusColor(contract.status)}>{statusLabel(contract.status)}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/20 text-white">{contract.type}</span>
                {contract.autoRenew && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-cyan-900/50 text-cyan-200">auto-renew</span>}
                {contract.signedAt && <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-green-900/50 text-green-200">signed</span>}
              </div>
              <p className="text-2xl lg:text-3xl font-bold text-white mb-2">{contract.title}</p>
              <div className="flex items-center gap-4 text-xs text-white/80 flex-wrap">
                {supplier && (
                  <Link href={'/wavecore-erp/procurement/suppliers/' + supplier.id} className="flex items-center gap-1 hover:underline">
                    <Users className="w-3 h-3" />{supplier.name}
                  </Link>
                )}
                {contract.startDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />from {new Date(contract.startDate).toLocaleDateString('en-GB')}</span>}
                {contract.endDate && <span>to {new Date(contract.endDate).toLocaleDateString('en-GB')}</span>}
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl lg:text-4xl font-bold text-white">{contract.currency} {Number(contract.value || 0).toLocaleString()}</p>
              <p className="text-[10px] uppercase tracking-wide text-white/60 font-bold">Contract value</p>
            </div>
          </div>

          {/* Lifecycle actions */}
          <div className="flex gap-2 mt-6 flex-wrap">
            {canSign && (
              <button onClick={() => setModal('sign')} disabled={working} className="px-4 py-2.5 rounded-xl bg-white text-blue-700 font-bold flex items-center gap-2 shadow-lg disabled:opacity-50">
                <PenTool className="w-4 h-4" /> Sign Contract
              </button>
            )}
            {canActivate && (
              <button onClick={() => lifecycle('ACTIVATE')} disabled={working} className="px-4 py-2.5 rounded-xl bg-white text-blue-700 font-bold flex items-center gap-2 shadow-lg disabled:opacity-50">
                {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Activate
              </button>
            )}
            {canSuspend && (
              <button onClick={() => setModal('suspend')} className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-2">
                <Pause className="w-4 h-4" /> Suspend
              </button>
            )}
            {canResume && (
              <button onClick={() => lifecycle('RESUME')} disabled={working} className="px-4 py-2.5 rounded-xl bg-white text-blue-700 font-bold flex items-center gap-2 shadow-lg disabled:opacity-50">
                {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />} Resume
              </button>
            )}
            {canTerminate && (
              <button onClick={() => setModal('terminate')} className="px-4 py-2.5 rounded-xl bg-red-700/80 hover:bg-red-700 text-white font-bold flex items-center gap-2">
                <XCircle className="w-4 h-4" /> Terminate
              </button>
            )}
            {canCancel && (
              <button onClick={() => setModal('cancel')} className="px-4 py-2.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold flex items-center gap-2">
                <Ban className="w-4 h-4" /> Cancel
              </button>
            )}
            {isDraft && (
              <button onClick={deleteContract} className="px-4 py-2.5 rounded-xl bg-red-700/80 hover:bg-red-700 text-white font-bold flex items-center gap-2">
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
              <button key={t.key} onClick={() => setTab(t.key)} className={'px-4 py-2.5 rounded-xl text-sm font-bold transition whitespace-nowrap flex items-center gap-1.5 ' + (tab === t.key ? 'bg-blue-600 text-white' : 'text-neutral-500 hover:text-neutral-900 dark:hover:text-white')}>
                <Icon className="w-3.5 h-3.5" /> {t.label}
                {t.count !== undefined && t.count > 0 && <span className="px-1.5 py-0.5 rounded-full bg-black/20 text-[10px]">{t.count}</span>}
              </button>
            )
          })}
        </div>

        {tab === 'overview' && (
          <div className="grid md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Terms</h3>
              <div className="space-y-3 text-sm">
                <Row label="Type" value={contract.type} />
                <Row label="Currency" value={contract.currency} />
                <Row label="Payment terms" value={(contract.paymentTerms || 30) + ' days'} />
                <Row label="Start date" value={contract.startDate ? new Date(contract.startDate).toLocaleDateString('en-GB') : null} />
                <Row label="End date" value={contract.endDate ? new Date(contract.endDate).toLocaleDateString('en-GB') : null} />
                <Row label="Auto-renew" value={contract.autoRenew ? 'Yes · ' + contract.renewalNoticeDays + 'd notice' : 'No'} />
              </div>
            </div>
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Signing</h3>
              <div className="space-y-3 text-sm">
                <Row label="Signed" value={contract.signedAt ? new Date(contract.signedAt).toLocaleString('en-GB') : '—'} />
                <Row label="Signed by" value={contract.signedByName || '—'} />
                <Row label="Value" value={contract.currency + ' ' + Number(contract.value || 0).toLocaleString()} bold />
              </div>
            </div>

            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 md:col-span-2">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Timeline</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
                <TimeStamp label="Created" value={contract.createdAt} />
                <TimeStamp label="Updated" value={contract.updatedAt} />
                <TimeStamp label="Signed" value={contract.signedAt} />
              </div>
            </div>

            {contract.notes && (
              <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6 md:col-span-2">
                <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold mb-4">Notes</h3>
                <p className="text-sm whitespace-pre-wrap">{contract.notes}</p>
              </div>
            )}
          </div>
        )}

        {tab === 'lines' && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-sm font-bold flex items-center gap-2"><Layers className="w-4 h-4 text-blue-500" /> Contract Lines</h3>
              {isDraft && (
                <button onClick={() => setModal('add-line')} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5">
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
                      <th className="px-4 py-3 text-right">Unit Price</th>
                      <th className="px-4 py-3 text-right">Tax %</th>
                      <th className="px-4 py-3 text-right">Total</th>
                      {isDraft && <th className="px-4 py-3"></th>}
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
                        <td className="px-4 py-3 text-right">{Number(l.quantity).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">{Number(l.unitPrice).toLocaleString()}</td>
                        <td className="px-4 py-3 text-right">{Number(l.taxRate || 0)}%</td>
                        <td className="px-4 py-3 text-right font-bold">{Number(l.lineTotal).toLocaleString()}</td>
                        {isDraft && (
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

        {tab === 'milestones' && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="flex justify-between items-center p-5 border-b border-neutral-200 dark:border-neutral-800">
              <h3 className="text-sm font-bold flex items-center gap-2"><Clock className="w-4 h-4 text-blue-500" /> Milestones</h3>
              {isDraft && (
                <button onClick={() => setModal('add-milestone')} className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5">
                  <Plus className="w-3.5 h-3.5" /> Add milestone
                </button>
              )}
            </div>
            {milestones.length === 0 ? (
              <p className="text-center text-sm text-neutral-500 py-12">No milestones yet</p>
            ) : (
              <div>
                {milestones.map((m: any) => (
                  <div key={m.id} className="p-4 border-b border-neutral-100 dark:border-neutral-800 last:border-0 flex items-start justify-between gap-3 flex-wrap">
                    <div className="flex-1 min-w-[220px]">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <p className="font-bold text-sm">{m.name}</p>
                        <span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + (
                          m.status === 'DONE' ? 'bg-green-900/50 text-green-300' :
                          m.status === 'MISSED' ? 'bg-red-900/50 text-red-300' :
                          'bg-neutral-800 text-neutral-400'
                        )}>{m.status}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-neutral-500 flex-wrap">
                        {m.dueDate && <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(m.dueDate).toLocaleDateString('en-GB')}</span>}
                        {Number(m.amount) > 0 && <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" />{Number(m.amount).toLocaleString()}</span>}
                      </div>
                      {m.notes && <p className="text-xs text-neutral-500 mt-1">{m.notes}</p>}
                    </div>
                    {isDraft && (
                      <div className="flex gap-1 flex-wrap">
                        {m.status !== 'DONE' && (
                          <button onClick={() => updateMilestone(m.id, { status: 'DONE' })} className="px-3 py-1.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-xs font-bold">Mark DONE</button>
                        )}
                        {m.status !== 'MISSED' && (
                          <button onClick={() => updateMilestone(m.id, { status: 'MISSED' })} className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold">Mark MISSED</button>
                        )}
                        <button onClick={() => removeMilestone(m.id)} className="p-1.5 rounded text-red-400 hover:bg-red-900/30"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'activity' && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 p-6">
            <p className="text-center text-sm text-neutral-500 py-8">Activity log visible via Procurement dashboard</p>
          </div>
        )}

        {tab === 'related' && (
          <div className="space-y-4">
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

      {/* Modals */}
      {modal === 'sign' && (
        <Modal title="Sign contract" onClose={() => { setModal(null); setComment('') }}>
          <p className="text-sm text-neutral-500 mb-4">This will record you as the signer and set the signing date.</p>
          <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">Comment (optional)</label>
          <textarea rows={3} value={comment} onChange={e => setComment(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => { setModal(null); setComment('') }} className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold">Cancel</button>
            <button onClick={async () => { const ok = await lifecycle('SIGN', comment); if (ok) { setModal(null); setComment('') } }} disabled={working} className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
              {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <PenTool className="w-4 h-4" />} Sign
            </button>
          </div>
        </Modal>
      )}

      {(modal === 'suspend' || modal === 'terminate' || modal === 'cancel') && (
        <Modal title={modal + ' contract'} onClose={() => { setModal(null); setComment('') }}>
          <label className="text-xs uppercase tracking-wide text-neutral-500 font-bold block mb-1">Reason{modal === 'terminate' ? ' *' : ' (optional)'}</label>
          <textarea rows={3} value={comment} onChange={e => setComment(e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => { setModal(null); setComment('') }} className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold">Cancel</button>
            <button
              onClick={async () => {
                const action = modal === 'suspend' ? 'SUSPEND' : modal === 'terminate' ? 'TERMINATE' : 'CANCEL'
                const ok = await lifecycle(action, comment)
                if (ok) { setModal(null); setComment('') }
              }}
              disabled={working || (modal === 'terminate' && !comment.trim())}
              className={'px-6 py-2.5 rounded-xl text-white font-bold flex items-center gap-2 disabled:opacity-50 ' + (modal === 'suspend' ? 'bg-amber-600 hover:bg-amber-700' : 'bg-red-600 hover:bg-red-700')}
            >
              {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Confirm {modal}
            </button>
          </div>
        </Modal>
      )}

      {modal === 'add-line' && (
        <Modal title="Add contract line" onClose={() => setModal(null)}>
          <Field label="Description *">
            <input value={newLine.description} onChange={e => setNewLine({ ...newLine, description: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
          </Field>
          <div className="grid grid-cols-4 gap-2 mt-3">
            <Field label="Qty"><input type="number" value={newLine.quantity} onChange={e => setNewLine({ ...newLine, quantity: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" /></Field>
            <Field label="UoM">
              <select value={newLine.unitOfMeasure} onChange={e => setNewLine({ ...newLine, unitOfMeasure: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm">
                {['UNIT','BOX','KG','LITER','METER','SET','PAIR','HOUR','DAY','MONTH'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </Field>
            <Field label="Unit price"><input type="number" value={newLine.unitPrice} onChange={e => setNewLine({ ...newLine, unitPrice: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" /></Field>
            <Field label="Tax %"><input type="number" value={newLine.taxRate} onChange={e => setNewLine({ ...newLine, taxRate: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" /></Field>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold">Cancel</button>
            <button onClick={addLine} disabled={working} className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
              {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
            </button>
          </div>
        </Modal>
      )}

      {modal === 'add-milestone' && (
        <Modal title="Add milestone" onClose={() => setModal(null)}>
          <Field label="Name *">
            <input value={newMilestone.name} onChange={e => setNewMilestone({ ...newMilestone, name: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" />
          </Field>
          <div className="grid grid-cols-2 gap-3 mt-3">
            <Field label="Due date"><input type="date" value={newMilestone.dueDate} onChange={e => setNewMilestone({ ...newMilestone, dueDate: e.target.value })} className="w-full px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" /></Field>
            <Field label="Amount"><input type="number" value={newMilestone.amount} onChange={e => setNewMilestone({ ...newMilestone, amount: Number(e.target.value) })} className="w-full px-3 py-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm" /></Field>
          </div>
          <Field label="Notes"><textarea rows={2} value={newMilestone.notes} onChange={e => setNewMilestone({ ...newMilestone, notes: e.target.value })} className="w-full px-4 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 text-sm mt-3" /></Field>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => setModal(null)} className="px-5 py-2.5 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold">Cancel</button>
            <button onClick={addMilestone} disabled={working} className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center gap-2 disabled:opacity-50">
              {working ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Add
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
      <span className={bold ? 'font-bold text-blue-600 dark:text-blue-400' : 'font-medium'}>{value || '—'}</span>
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

function Modal({ title, children, onClose }: any) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div onClick={e => e.stopPropagation()} className="w-full max-w-lg bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 shadow-2xl">
        <div className="flex justify-between items-center p-5 border-b border-neutral-200 dark:border-neutral-800">
          <h2 className="text-lg font-bold capitalize">{title}</h2>
          <button onClick={onClose} className="text-neutral-400 hover:text-red-400"><X className="w-5 h-5" /></button>
        </div>
        <div className="p-6">{children}</div>
      </div>
    </div>
  )
}