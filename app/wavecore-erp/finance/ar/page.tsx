'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, DollarSign, Download, Loader2, Plus, RefreshCw } from 'lucide-react'

interface Invoice {
  id: string
  number: string
  customerName: string
  total: number
  paidAmount: number
  balanceDue: number
  dueDate: string
  status: string
  daysOverdue: number | null
  bucket: string
}

type BucketKey = 'all' | 'current' | 'd0_30' | 'd31_60' | 'd61_90' | 'd90plus'

const BUCKETS: { key: BucketKey; label: string }[] = [
  { key: 'all',     label: 'All outstanding' },
  { key: 'current', label: 'Current' },
  { key: 'd0_30',   label: '0–30' },
  { key: 'd31_60',  label: '31–60' },
  { key: 'd61_90',  label: '61–90' },
  { key: 'd90plus', label: '90+' },
]

export default function ARPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [totals, setTotals] = useState<any>({})
  const [byCustomer, setByCustomer] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [bucket, setBucket] = useState<BucketKey>('all')

  const load = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true); else setRefreshing(true)
    try {
      const res = await fetch('/api/wavecore/finance/ar/aging', { cache: 'no-store' })
      const data = await res.json()
      setInvoices(data.invoices || [])
      setTotals(data.totals || {})
      setByCustomer(data.byCustomer || [])
    } catch {}
    finally { setLoading(false); setRefreshing(false) }
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [])
  useEffect(() => {
    const t = setInterval(() => { load({ silent: true }) }, 30000)
    return () => clearInterval(t)
  }, [])

  const filtered = useMemo(() => {
    if (bucket === 'all') return invoices
    return invoices.filter(i => i.bucket === bucket)
  }, [invoices, bucket])

  const fmt = (n: number, cur = 'KES') => cur + ' ' + Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const amountFor = (k: BucketKey) => k === 'all' ? (totals.total || 0) : (totals[k] || 0)
  const countFor  = (k: BucketKey) => k === 'all' ? (totals.count || 0) : (totals[k + 'Count'] || 0)

  const handleExport = () => {
    let csv = 'Invoice#,Customer,Due date,Status,Total,Paid,Balance due,Days overdue,Bucket\n'
    filtered.forEach(i => {
      csv += `${i.number},"${i.customerName || ''}",${i.dueDate || ''},${i.status},${i.total},${i.paidAmount},${i.balanceDue},${i.daysOverdue ?? ''},${i.bucket}\n`
    })
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'ar-aging.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-4">
            <Link href="/wavecore-erp" className="flex items-center gap-3">
              <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
              <span className="font-bold">WaveCore</span>
            </Link>
            <span className="text-sm text-neutral-500">Accounts Receivable</span>
          </div>
          <Link href="/wavecore-erp/finance" className="flex items-center gap-2 text-sm text-neutral-500">
            <ArrowLeft className="w-4 h-4" /> Finance
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Accounts Receivable — Aging</h1>
            <p className="text-sm text-neutral-500 mt-1">What customers owe you, net of payments, by days overdue.</p>
          </div>
          <div className="flex items-center gap-2">
            <Link href="/wavecore-erp/finance/invoices" className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold flex items-center gap-2">
              <Plus className="w-4 h-4" /> New Invoice
            </Link>
            <button onClick={handleExport} disabled={filtered.length === 0} className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold flex items-center gap-2 disabled:opacity-40">
              <Download className="w-4 h-4" /> CSV
            </button>
            <button onClick={() => load({ silent: true })} disabled={refreshing} className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold flex items-center gap-2 disabled:opacity-40">
              <RefreshCw className={'w-4 h-4 ' + (refreshing ? 'animate-spin' : '')} /> Refresh
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {BUCKETS.map(b => {
            const active = bucket === b.key
            const amount = amountFor(b.key)
            const count = countFor(b.key)
            const tone = b.key === 'current' ? 'border-blue-300' :
                         b.key === 'd0_30' ? 'border-amber-300' :
                         b.key === 'd31_60' ? 'border-orange-300' :
                         b.key === 'd61_90' ? 'border-red-300' :
                         b.key === 'd90plus' ? 'border-red-500' :
                         'border-neutral-300'
            return (
              <button
                key={b.key}
                onClick={() => setBucket(b.key)}
                className={
                  'min-w-[150px] text-left px-4 py-3 rounded-2xl border-2 transition ' +
                  (active ? 'bg-white dark:bg-neutral-900 ' + tone + ' ring-1 ring-black/5' : 'bg-white dark:bg-neutral-900 border-neutral-200 dark:border-neutral-800 hover:border-neutral-400')
                }
              >
                <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">{b.label}</p>
                <p className="text-lg font-bold mt-1">{Number(amount).toLocaleString('en-KE')}</p>
                <p className="text-[10px] text-neutral-500">{count} invoice{count === 1 ? '' : 's'}</p>
              </button>
            )
          })}
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div>
        ) : filtered.length > 0 ? (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-800/50 border-b border-neutral-200 dark:border-neutral-800">
                  <tr className="text-left text-[10px] uppercase tracking-wide text-neutral-500 font-bold">
                    <th className="px-4 py-3">Invoice#</th>
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3">Due</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3 text-right">Total</th>
                    <th className="px-4 py-3 text-right">Paid</th>
                    <th className="px-4 py-3 text-right">Balance</th>
                    <th className="px-4 py-3 text-right">Age</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map(i => {
                    const ageClass = i.daysOverdue == null ? 'text-neutral-500'
                      : i.daysOverdue > 90 ? 'text-red-500 font-bold'
                      : i.daysOverdue > 60 ? 'text-orange-500 font-bold'
                      : i.daysOverdue > 30 ? 'text-amber-500 font-bold'
                      : i.daysOverdue > 0 ? 'text-amber-400'
                      : 'text-cyan-500'
                    const ageLabel = i.daysOverdue == null ? '—'
                      : i.daysOverdue < 0 ? 'in ' + Math.abs(i.daysOverdue) + 'd'
                      : i.daysOverdue === 0 ? 'due today'
                      : i.daysOverdue + 'd'
                    return (
                      <tr key={i.id} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                        <td className="px-4 py-2 font-mono text-xs">{i.number}</td>
                        <td className="px-4 py-2">{i.customerName}</td>
                        <td className="px-4 py-2 text-xs text-neutral-500">{i.dueDate ? new Date(i.dueDate).toLocaleDateString('en-GB') : '—'}</td>
                        <td className="px-4 py-2"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">{i.status}</span></td>
                        <td className="px-4 py-2 text-right">{fmt(i.total)}</td>
                        <td className="px-4 py-2 text-right text-green-600">{fmt(i.paidAmount)}</td>
                        <td className="px-4 py-2 text-right font-bold">{fmt(i.balanceDue)}</td>
                        <td className={'px-4 py-2 text-right text-xs ' + ageClass}>{ageLabel}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="font-medium">No outstanding receivables</p>
            <p className="text-sm text-neutral-500 mt-1">Create invoices to see money owed to you.</p>
          </div>
        )}

        {byCustomer.length > 0 && (
          <div className="mt-6 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-xs uppercase tracking-wide text-neutral-500 font-bold">Aging by customer</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                  <tr className="text-left text-[10px] uppercase tracking-wide text-neutral-500 font-bold">
                    <th className="px-4 py-3">Customer</th>
                    <th className="px-4 py-3 text-right">Current</th>
                    <th className="px-4 py-3 text-right">0-30</th>
                    <th className="px-4 py-3 text-right">31-60</th>
                    <th className="px-4 py-3 text-right">61-90</th>
                    <th className="px-4 py-3 text-right">90+</th>
                    <th className="px-4 py-3 text-right">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {byCustomer.map((s: any) => (
                    <tr key={s.customerName} className="border-t border-neutral-100 dark:border-neutral-800">
                      <td className="px-4 py-2 font-medium">{s.customerName}</td>
                      <td className="px-4 py-2 text-right">{Number(s.current).toLocaleString()}</td>
                      <td className="px-4 py-2 text-right text-amber-500">{Number(s.d0_30).toLocaleString()}</td>
                      <td className="px-4 py-2 text-right text-orange-500">{Number(s.d31_60).toLocaleString()}</td>
                      <td className="px-4 py-2 text-right text-red-500">{Number(s.d61_90).toLocaleString()}</td>
                      <td className="px-4 py-2 text-right text-red-600 font-bold">{Number(s.d90plus).toLocaleString()}</td>
                      <td className="px-4 py-2 text-right font-bold">{Number(s.total).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}