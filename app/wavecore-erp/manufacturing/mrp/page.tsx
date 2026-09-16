'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Calculator, Loader2, Search, Printer, X, ArrowUpDown, CheckCircle2,
  AlertTriangle, Package, TrendingUp, Activity, DollarSign, ChevronRight, Sparkles,
} from 'lucide-react'

const STATUSES = ['ALL', 'SHORTAGE', 'LOW', 'OK', 'SURPLUS']

const statusStyle = (s: string) => {
  switch (s) {
    case 'SHORTAGE': return 'bg-red-900/40 text-red-300 border border-red-700'
    case 'LOW': return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'
    case 'OK': return 'bg-green-900/40 text-green-300 border border-green-700'
    case 'SURPLUS': return 'bg-purple-900/40 text-purple-300 border border-purple-700'
    default: return 'bg-neutral-800 text-neutral-300'
  }
}

export default function MRPPage() {
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [activeKpi, setActiveKpi] = useState('ALL')
  const [search, setSearch] = useState('')
  const [sortBy, setSortBy] = useState('status')
  const [sortDir, setSortDir] = useState<'asc'|'desc'>('asc')
  const [detail, setDetail] = useState<any>(null)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/manufacturing/mrp')
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to load'); setItems([]) }
      else setItems(data.items || data.allItems || [])
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [])

  const flash = (m: string) => { setSuccess(m); setTimeout(() => setSuccess(''), 3000) }

  const summary = useMemo(() => {
    const total = items.length
    const shortage = items.filter(i => i.status === 'SHORTAGE').length
    const low = items.filter(i => i.status === 'LOW').length
    const ok = items.filter(i => i.status === 'OK').length
    const surplus = items.filter(i => i.status === 'SURPLUS').length
    const critical = items.filter(i => i.status === 'SHORTAGE' && i.available < 0).length
    const suggestions = items.filter(i => i.suggestedQty > 0).length
    const totalValueAtRisk = Math.round(items.reduce((s, i) => s + Number(i.valueAtRisk || 0), 0))
    return { total, shortage, low, ok, surplus, critical, suggestions, totalValueAtRisk }
  }, [items])

  const filtered = useMemo(() => {
    let list = [...items]
    if (activeKpi !== 'ALL') list = list.filter(i => i.status === activeKpi)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(i =>
        (i.name || '').toLowerCase().includes(s) ||
        (i.sku || '').toLowerCase().includes(s)
      )
    }
    // Status priority for sorting
    const statusRank: Record<string, number> = { SHORTAGE: 0, LOW: 1, OK: 2, SURPLUS: 3 }
    list.sort((a, b) => {
      let av: any = a[sortBy] ?? ''
      let bv: any = b[sortBy] ?? ''
      if (sortBy === 'status') { av = statusRank[a.status] ?? 99; bv = statusRank[b.status] ?? 99 }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [items, activeKpi, search, sortBy, sortDir])

  const toggleSort = (f: string) => {
    if (sortBy === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(f); setSortDir('asc') }
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/manufacturing" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
          <span className="text-sm text-neutral-400">Manufacturing · MRP</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <Calculator className="w-7 h-7 text-indigo-500" /> Material Requirements Planning
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Shortage detection · Suggested orders · Value at risk</p>
          </div>
          <div className="flex gap-3">
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <Loader2 className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Run MRP
            </button>
            <button onClick={() => window.open('/api/wavecore/manufacturing/mrp/pdf', '_blank')} className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2 shadow-lg shadow-indigo-900/40">
              <Printer className="w-5 h-5" /> Print Report
            </button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}
        {success && <div className="mb-4 p-4 rounded-xl bg-green-900/50 text-green-300 border border-green-800 flex items-center gap-2"><CheckCircle2 className="w-5 h-5" /> {success}</div>}

        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 mb-6">
          <button onClick={() => setActiveKpi('ALL')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-indigo-600 to-blue-800 text-white shadow-lg ' + (activeKpi === 'ALL' ? 'ring-4 ring-indigo-300' : '')}>
            <Package className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.total}</p><p className="text-xs opacity-90">Analyzed</p>
          </button>
          <button onClick={() => setActiveKpi('SHORTAGE')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-red-600 to-rose-800 text-white shadow-lg ' + (activeKpi === 'SHORTAGE' ? 'ring-4 ring-red-300' : '')}>
            <AlertTriangle className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.shortage}</p><p className="text-xs opacity-90">Shortage</p>
          </button>
          <button onClick={() => setActiveKpi('LOW')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-yellow-600 to-amber-800 text-white shadow-lg ' + (activeKpi === 'LOW' ? 'ring-4 ring-yellow-300' : '')}>
            <TrendingUp className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.low}</p><p className="text-xs opacity-90">Low</p>
          </button>
          <button onClick={() => setActiveKpi('OK')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-green-600 to-emerald-800 text-white shadow-lg ' + (activeKpi === 'OK' ? 'ring-4 ring-green-300' : '')}>
            <CheckCircle2 className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.ok}</p><p className="text-xs opacity-90">OK</p>
          </button>
          <button onClick={() => setActiveKpi('SURPLUS')} className={'p-4 rounded-2xl text-left bg-gradient-to-br from-purple-600 to-fuchsia-800 text-white shadow-lg ' + (activeKpi === 'SURPLUS' ? 'ring-4 ring-purple-300' : '')}>
            <Activity className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.surplus}</p><p className="text-xs opacity-90">Surplus</p>
          </button>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-orange-600 to-red-800 text-white shadow-lg">
            <AlertTriangle className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.critical}</p><p className="text-xs opacity-90">Critical</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-teal-600 to-cyan-800 text-white shadow-lg">
            <DollarSign className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.totalValueAtRisk.toLocaleString()}</p><p className="text-xs opacity-90">Value at Risk</p>
          </div>
        </div>

        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div className="relative flex-1 min-w-[220px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by product or SKU..."
                className="pl-9 pr-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-white w-full" />
            </div>
            <span className="text-sm text-neutral-400">
              Showing <b className="text-white">{filtered.length}</b> of <b className="text-white">{summary.total}</b>
            </span>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Calculator className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400">No products to analyze. Create products first.</p>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-neutral-800">
                  <tr>
                    {[['name','Product'],['onHand','On Hand'],['allocated','Allocated'],['available','Available'],['reorderPoint','Reorder Pt'],['suggestedQty','Suggested'],['valueAtRisk','Value at Risk'],['status','Status']].map(([f,label]) => (
                      <th key={f} onClick={() => toggleSort(f)} className="text-left p-3 text-xs uppercase tracking-wide text-neutral-400 cursor-pointer hover:text-white select-none">
                        <span className="inline-flex items-center gap-1">{label}<ArrowUpDown className="w-3 h-3" /></span>
                      </th>
                    ))}
                    <th className="text-center p-3 text-xs uppercase tracking-wide text-neutral-400">Detail</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(i => (
                    <tr key={i.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                      <td className="p-3 text-white">
                        <div className="font-medium">{i.name}</div>
                        {i.sku && <div className="text-xs text-neutral-500">{i.sku}</div>}
                      </td>
                      <td className="p-3 text-right text-neutral-200">{Number(i.onHand).toFixed(0)}</td>
                      <td className="p-3 text-right text-neutral-200">{Number(i.allocated).toFixed(0)}</td>
                      <td className={'p-3 text-right font-bold ' + (i.available < 0 ? 'text-red-400' : 'text-white')}>{Number(i.available).toFixed(0)}</td>
                      <td className="p-3 text-right text-neutral-400">{Number(i.reorderPoint).toFixed(0)}</td>
                      <td className={'p-3 text-right font-bold ' + (i.suggestedQty > 0 ? 'text-indigo-400' : 'text-neutral-500')}>{Number(i.suggestedQty).toFixed(0)}</td>
                      <td className="p-3 text-right text-purple-300 font-bold">{Number(i.valueAtRisk || 0).toFixed(0)}</td>
                      <td className="p-3">
                        <span className={'px-2 py-1 rounded-full text-[10px] font-bold ' + statusStyle(i.status)}>{i.status}</span>
                      </td>
                      <td className="p-3 text-center">
                        <button onClick={() => setDetail(i)} className="p-1.5 rounded-lg bg-indigo-900/50 text-indigo-300 hover:bg-indigo-800" title="Details">
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {detail && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70" onClick={() => setDetail(null)}>
          <div onClick={e => e.stopPropagation()} className="w-full max-w-xl bg-neutral-900 border-l border-neutral-800 h-full overflow-y-auto">
            <div className="flex justify-between items-center p-5 border-b border-neutral-800">
              <h2 className="text-lg font-bold text-white">MRP Analysis</h2>
              <button onClick={() => setDetail(null)} className="text-neutral-400 hover:text-red-400"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div className="text-center">
                <span className={'inline-block px-6 py-3 rounded-2xl text-xl font-bold ' + statusStyle(detail.status)}>{detail.status}</span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  ['Product', detail.name],
                  ['SKU', detail.sku],
                  ['Unit', detail.unit],
                  ['On Hand', Number(detail.onHand).toFixed(0)],
                  ['Allocated', Number(detail.allocated).toFixed(0)],
                  ['Available', Number(detail.available).toFixed(0)],
                  ['Reorder Point', Number(detail.reorderPoint).toFixed(0)],
                  ['Safety Stock', Number(detail.safetyStock).toFixed(0)],
                  ['Max Stock', Number(detail.maxStock).toFixed(0)],
                  ['Suggested Order', Number(detail.suggestedQty).toFixed(0)],
                  ['Unit Cost', Number(detail.unitCost).toFixed(2)],
                  ['Value at Risk', Number(detail.valueAtRisk).toFixed(0)],
                ].map(([k, v]) => (
                  <div key={k as string} className="bg-neutral-800 rounded-xl p-3">
                    <div className="text-[10px] uppercase tracking-wide text-neutral-500">{k}</div>
                    <div className="text-sm font-bold text-white">{v ?? '—'}</div>
                  </div>
                ))}
              </div>
              <div className="p-4 rounded-xl bg-indigo-900/30 border border-indigo-800">
                <div className="text-xs uppercase tracking-wide text-indigo-300 font-bold mb-1">Recommendation</div>
                <div className="text-sm text-white">
                  {detail.status === 'SHORTAGE' && `Immediate action required. Order at least ${Math.abs(detail.available) + detail.safetyStock} units to cover open work orders plus safety stock.`}
                  {detail.status === 'LOW' && `Order ${detail.suggestedQty} units to reach reorder point + safety stock.`}
                  {detail.status === 'OK' && `Stock level is healthy. No action needed.`}
                  {detail.status === 'SURPLUS' && `Overstocked by ${Math.abs(detail.available - detail.maxStock)} units. Consider pausing future orders.`}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}