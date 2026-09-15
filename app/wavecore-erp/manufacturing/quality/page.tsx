'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  CheckCircle, XCircle, AlertTriangle, Plus, Loader2, Search, Printer, Trash2, X,
  ArrowUpDown, ClipboardCheck, TrendingUp, Activity, FileEdit, ChevronRight, Sparkles,
} from 'lucide-react'

const RESULT_OPTIONS = ['ALL', 'PASS', 'FAIL', 'PENDING']

const resultStyle = (r: string) => {
  switch (r) {
    case 'PASS': return 'bg-green-900/40 text-green-300 border border-green-700'
    case 'FAIL': return 'bg-red-900/40 text-red-300 border border-red-700'
    case 'PENDING': return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'
    default: return 'bg-neutral-800 text-neutral-300 border border-neutral-700'
  }
}

export default function QualityPage() {
  const [checks, setChecks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [activeKpi, setActiveKpi] = useState('ALL')
  const [search, setSearch] = useState('')
  const [filterResult, setFilterResult] = useState('ALL')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('desc')

  const [showCreate, setShowCreate] = useState(false)
  const [detail, setDetail] = useState<any>(null)
  const [editing, setEditing] = useState<any>(null)
  const [deleting, setDeleting] = useState('')
  const [selected, setSelected] = useState<Set<string>>(new Set())

  const [form, setForm] = useState({
    type: '', workOrderId: '', inspectedQty: '0', passedQty: '0', rejectedQty: '0',
    result: 'PASS', notes: '',
  })

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/manufacturing/quality')
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); setChecks([]) }
      else setChecks(data.checks || [])
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3000) }
  const resetForm = () => setForm({ type: '', workOrderId: '', inspectedQty: '0', passedQty: '0', rejectedQty: '0', result: 'PASS', notes: '' })

  const openCreate = () => { resetForm(); setEditing(null); setShowCreate(true) }

  const openEdit = async (id: string) => {
    const res = await fetch('/api/wavecore/manufacturing/quality/' + id)
    const data = await res.json()
    if (!data.check) return
    const q = data.check
    setForm({
      type: q.type || '',
      workOrderId: q.workOrderId || '',
      inspectedQty: String(q.inspectedQty || 0),
      passedQty: String(q.passedQty || 0),
      rejectedQty: String(q.rejectedQty || 0),
      result: q.result || 'PASS',
      notes: q.notes || '',
    })
    setEditing(q)
    setShowCreate(true)
  }

  const autoCalcResult = (passed: string, rejected: string) => {
    const p = Number(passed || 0), r = Number(rejected || 0)
    if (r > 0) return 'FAIL'
    if (p > 0) return 'PASS'
    return 'PENDING'
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (!form.type.trim()) { setError('Inspection type is required'); return }
    const inspected = Number(form.inspectedQty || 0)
    const passed = Number(form.passedQty || 0)
    const rejected = Number(form.rejectedQty || 0)
    if (inspected <= 0) { setError('Inspected quantity must be > 0'); return }
    if (passed + rejected > inspected) { setError('Passed + Rejected cannot exceed Inspected'); return }
    try {
      const url = editing ? '/api/wavecore/manufacturing/quality/' + editing.id : '/api/wavecore/manufacturing/quality'
      const res = await fetch(url, {
        method: editing ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          inspectedQty: inspected,
          passedQty: passed,
          rejectedQty: rejected,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed'); return }
      flash(editing ? 'Quality check updated' : 'Quality check created')
      setShowCreate(false); setEditing(null); resetForm(); fetchAll()
    } catch { setError('Network error') }
  }

  const del = async (id: string, label: string) => {
    if (!confirm('Delete quality check ' + label + '?')) return
    setDeleting(id)
    try {
      const res = await fetch('/api/wavecore/manufacturing/quality/' + id, { method: 'DELETE' })
      if (res.ok) { flash('Deleted'); fetchAll() }
    } finally { setDeleting('') }
  }

  const bulkDelete = async () => {
    if (selected.size === 0) return
    if (!confirm('Delete ' + selected.size + ' quality check(s)?')) return
    for (const id of Array.from(selected)) {
      await fetch('/api/wavecore/manufacturing/quality/' + id, { method: 'DELETE' })
    }
    setSelected(new Set()); flash('Bulk delete complete'); fetchAll()
  }

  const openDetail = async (id: string) => {
    const res = await fetch('/api/wavecore/manufacturing/quality/' + id)
    const data = await res.json()
    setDetail(data)
  }

  const pdf = (id: string) => window.open('/api/wavecore/manufacturing/quality/' + id + '/pdf', '_blank')

  const summary = useMemo(() => {
    const total = checks.length
    const passed = checks.filter(c => c.result === 'PASS').length
    const failed = checks.filter(c => c.result === 'FAIL').length
    const pending = checks.filter(c => !c.result || c.result === 'PENDING').length
    const passRate = total > 0 ? Math.round((passed / total) * 100) : 0
    const totalInspected = checks.reduce((s, c) => s + Number(c.inspectedQty || 0), 0)
    const totalPassed = checks.reduce((s, c) => s + Number(c.passedQty || 0), 0)
    const totalRejected = checks.reduce((s, c) => s + Number(c.rejectedQty || 0), 0)
    const rejectRate = totalInspected > 0 ? Math.round((totalRejected / totalInspected) * 100) : 0
    return { total, passed, failed, pending, passRate, totalInspected, totalPassed, totalRejected, rejectRate }
  }, [checks])

  const filtered = useMemo(() => {
    let list = [...checks]
    if (activeKpi === 'PASS') list = list.filter(c => c.result === 'PASS')
    else if (activeKpi === 'FAIL') list = list.filter(c => c.result === 'FAIL')
    else if (activeKpi === 'PENDING') list = list.filter(c => !c.result || c.result === 'PENDING')
    if (filterResult !== 'ALL') list = list.filter(c => c.result === filterResult)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(c =>
        (c.type || '').toLowerCase().includes(s) ||
        (c.workOrderId || '').toLowerCase().includes(s) ||
        (c.notes || '').toLowerCase().includes(s)
      )
    }
    list.sort((a, b) => {
      const av = a[sortBy] ?? ''; const bv = b[sortBy] ?? ''
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [checks, activeKpi, filterResult, search, sortBy, sortDir])

  const toggleSort = (f: string) => {
    if (sortBy === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(f); setSortDir('asc') }
  }
  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }
  const toggleAll = () => {
    if (selected.size === filtered.length) setSelected(new Set())
    else setSelected(new Set(filtered.map(c => c.id)))
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/manufacturing" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">Manufacturing · Quality Control</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <ClipboardCheck className="w-7 h-7 text-green-500" /> Quality Control
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Inspections · Pass rates · Defect tracking</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <Loader2 className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
            </button>
            <button onClick={openCreate} className="px-5 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-green-900/40">
              <Plus className="w-5 h-5" /> New Quality Check
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle className="w-5 h-5" /> {success}</div>}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <button onClick={() => setActiveKpi('ALL')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg ' + (activeKpi === 'ALL' ? 'ring-4 ring-green-300' : '')}>
            <ClipboardCheck className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.total}</p><p className="text-xs opacity-90">Total Checks</p>
          </button>
          <button onClick={() => setActiveKpi('PASS')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-lg ' + (activeKpi === 'PASS' ? 'ring-4 ring-emerald-300' : '')}>
            <CheckCircle className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.passed}</p><p className="text-xs opacity-90">Passed</p>
          </button>
          <button onClick={() => setActiveKpi('FAIL')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-lg ' + (activeKpi === 'FAIL' ? 'ring-4 ring-red-300' : '')}>
            <XCircle className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.failed}</p><p className="text-xs opacity-90">Failed</p>
          </button>
          <button onClick={() => setActiveKpi('PENDING')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-yellow-600 to-amber-800 text-white shadow-lg ' + (activeKpi === 'PENDING' ? 'ring-4 ring-yellow-300' : '')}>
            <AlertTriangle className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.pending}</p><p className="text-xs opacity-90">Pending</p>
          </button>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-800 text-white shadow-lg">
            <TrendingUp className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.passRate}%</p><p className="text-xs opacity-90">Pass Rate</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-800 text-white shadow-lg">
            <Activity className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.totalInspected}</p><p className="text-xs opacity-90">Inspected</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-fuchsia-600 to-purple-800 text-white shadow-lg">
            <AlertTriangle className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.rejectRate}%</p><p className="text-xs opacity-90">Reject Rate</p>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by type, WO or notes..."
                className="pl-9 pr-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-white w-full" />
            </div>
            <select value={filterResult} onChange={e => setFilterResult(e.target.value)} className="px-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm">
              {RESULT_OPTIONS.map(r => <option key={r} value={r}>{r === 'ALL' ? 'All Results' : r}</option>)}
            </select>
            {selected.size > 0 && (
              <button onClick={bulkDelete} className="px-3 py-2.5 rounded-xl bg-red-700 hover:bg-red-600 text-white text-sm font-bold">
                Delete {selected.size}
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-green-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <ClipboardCheck className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400">No quality checks match filters</p>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-800">
                  <tr>
                    <th className="p-3 w-10"><input type="checkbox" checked={selected.size === filtered.length && filtered.length > 0} onChange={toggleAll} /></th>
                    {[['type','Type'],['workOrderId','Work Order'],['inspectedQty','Inspected'],['passedQty','Passed'],['rejectedQty','Rejected'],['result','Result'],['createdAt','Date']].map(([f,label]) => (
                      <th key={f} onClick={() => toggleSort(f)} className="text-left p-3 text-xs uppercase tracking-wide text-neutral-400 cursor-pointer hover:text-white select-none">
                        <span className="inline-flex items-center gap-1">{label}<ArrowUpDown className="w-3 h-3" /></span>
                      </th>
                    ))}
                    <th className="text-center p-3 text-xs uppercase tracking-wide text-neutral-400">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(q => (
                    <tr key={q.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                      <td className="p-3"><input type="checkbox" checked={selected.has(q.id)} onChange={() => toggleSelect(q.id)} /></td>
                      <td className="p-3 text-white">
                        <button onClick={() => openDetail(q.id)} className="hover:text-green-400 inline-flex items-center gap-1 font-medium">
                          {q.type || 'Inspection'} <ChevronRight className="w-3 h-3" />
                        </button>
                      </td>
                      <td className="p-3 font-mono text-xs text-neutral-400">{q.workOrderId || '—'}</td>
                      <td className="p-3 text-right text-white">{Number(q.inspectedQty || 0)}</td>
                      <td className="p-3 text-right text-green-300 font-bold">{Number(q.passedQty || 0)}</td>
                      <td className="p-3 text-right text-red-300 font-bold">{Number(q.rejectedQty || 0)}</td>
                      <td className="p-3"><span className={'px-2 py-1 rounded-full text-[10px] font-bold ' + resultStyle(q.result)}>{q.result || 'PENDING'}</span></td>
                      <td className="p-3 text-xs text-neutral-400">{q.createdAt ? new Date(q.createdAt).toLocaleDateString('en-GB') : '—'}</td>
                      <td className="p-3">
                        <div className="flex gap-1 justify-center">
                          <button onClick={() => pdf(q.id)} className="p-1.5 rounded-lg bg-blue-900/50 text-blue-300 hover:bg-blue-800" title="PDF"><Printer className="w-4 h-4" /></button>
                          <button onClick={() => openEdit(q.id)} className="p-1.5 rounded-lg bg-yellow-900/50 text-yellow-300 hover:bg-yellow-800" title="Edit"><FileEdit className="w-4 h-4" /></button>
                          <button onClick={() => del(q.id, q.type)} disabled={deleting === q.id} className="p-1.5 rounded-lg bg-red-900/50 text-red-300 hover:bg-red-800" title="Delete">
                            {deleting === q.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {showCreate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={() => { setShowCreate(false); setEditing(null) }}>
          <form onSubmit={save} onClick={e => e.stopPropagation()} className="w-full max-w-2xl bg-neutral-900 rounded-2xl border border-neutral-800 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-neutral-800">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-green-400" /> {editing ? 'Edit Quality Check' : 'New Quality Check'}
              </h2>
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="text-neutral-400 hover:text-red-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Inspection Type *</label>
                <input value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="e.g. Incoming inspection, Final QC..." />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Work Order (optional)</label>
                <input value={form.workOrderId} onChange={e => setForm({ ...form, workOrderId: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="Type WO number or leave blank" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Inspected Qty *</label>
                <input type="number" min="1" value={form.inspectedQty} onChange={e => setForm({ ...form, inspectedQty: e.target.value })} required className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Result</label>
                <select value={form.result} onChange={e => setForm({ ...form, result: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white">
                  <option value="PASS">PASS</option>
                  <option value="FAIL">FAIL</option>
                  <option value="PENDING">PENDING</option>
                </select>
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Passed Qty</label>
                <input type="number" min="0" value={form.passedQty} onChange={e => {
                  const passed = e.target.value
                  setForm({ ...form, passedQty: passed, result: autoCalcResult(passed, form.rejectedQty) })
                }} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div>
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Rejected Qty</label>
                <input type="number" min="0" value={form.rejectedQty} onChange={e => {
                  const rejected = e.target.value
                  setForm({ ...form, rejectedQty: rejected, result: autoCalcResult(form.passedQty, rejected) })
                }} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs uppercase tracking-wide text-neutral-400 font-bold">Notes</label>
                <textarea rows={3} value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} className="mt-1 w-full px-4 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white" placeholder="Findings, defect details..." />
              </div>
            </div>
            <div className="flex justify-end gap-3 p-5 border-t border-neutral-800">
              <button type="button" onClick={() => { setShowCreate(false); setEditing(null) }} className="px-5 py-2.5 rounded-xl bg-neutral-800 text-neutral-300 hover:bg-neutral-700">Cancel</button>
              <button type="submit" className="px-6 py-2.5 rounded-xl bg-green-600 hover:bg-green-700 text-white font-bold">{editing ? 'Save Changes' : 'Create Check'}</button>
            </div>
          </form>
        </div>
      )}

      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70" onClick={() => setDetail(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-xl bg-neutral-900 border-l border-neutral-800 h-full overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-neutral-800">
              <h2 className="text-lg font-bold text-white">Quality Check Detail</h2>
              <button onClick={() => setDetail(null)} className="text-neutral-400 hover:text-red-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center">
                <span className={'inline-block px-6 py-3 rounded-2xl text-2xl font-bold ' + resultStyle(detail.check?.result)}>{detail.check?.result || 'PENDING'}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Type', detail.check?.type],
                  ['Work Order', detail.workOrder?.number || detail.check?.workOrderId],
                  ['Product', detail.workOrder?.productId],
                  ['Inspected', detail.check?.inspectedQty],
                  ['Passed', detail.check?.passedQty],
                  ['Rejected', detail.check?.rejectedQty],
                  ['Date', detail.check?.createdAt ? new Date(detail.check.createdAt).toLocaleDateString('en-GB') : '—'],
                ].map(([k, v]) => (
                  <div key={k as string} className="bg-neutral-800 rounded-xl p-3">
                    <div className="text-[10px] uppercase tracking-wide text-neutral-500">{k}</div>
                    <div className="text-sm font-bold text-white">{v ?? '—'}</div>
                  </div>
                ))}
              </div>
              {detail.check?.notes && (
                <div className="bg-neutral-800 rounded-xl p-3">
                  <div className="text-[10px] uppercase tracking-wide text-neutral-500 mb-1">Notes</div>
                  <div className="text-sm text-white whitespace-pre-wrap">{detail.check.notes}</div>
                </div>
              )}
              <button onClick={() => pdf(detail.check.id)} className="w-full py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold flex items-center justify-center gap-2">
                <Printer className="w-4 h-4" /> Print Quality Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}