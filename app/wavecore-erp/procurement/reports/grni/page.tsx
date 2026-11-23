'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowLeft, RefreshCw, Loader2, Package, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { authedFetch } from '@/lib/wavecore/csrf-client'

interface Row {
  grnId: string
  grnNumber: string
  receivedAt: string
  grnStatus: string
  poId: string | null
  poNumber: string | null
  supplierId: string | null
  supplierName: string | null
  receivedAmount: number
  invoicedAmount: number
  outstandingAccrual: number
  daysOutstanding: number
  agingBucket: string
}

interface Totals { received: number; invoiced: number; outstanding: number }

const BUCKET_COLOR: Record<string,string> = {
  'CLEARED': 'bg-green-900/20 text-green-400 border-green-800/40',
  '0-30':    'bg-blue-900/20 text-blue-400 border-blue-800/40',
  '31-60':   'bg-amber-900/20 text-amber-400 border-amber-800/40',
  '61-90':   'bg-orange-900/20 text-orange-400 border-orange-800/40',
  '90+':     'bg-red-900/20 text-red-400 border-red-800/40',
}

export default function GRNIReconciliationPage() {
  const [rows, setRows] = useState<Row[]>([])
  const [totals, setTotals] = useState<Totals | null>(null)
  const [loading, setLoading] = useState(true)
  const [bucket, setBucket] = useState<string>('')

  async function load() {
    setLoading(true)
    try {
      const url = '/api/wavecore/procurement/reports/grni-reconciliation' + (bucket ? ('?bucket=' + encodeURIComponent(bucket)) : '')
      const res = await authedFetch(url)
      if (!res.ok) throw new Error('Failed to load')
      const j = await res.json()
      setRows(j.rows || [])
      setTotals(j.totals || null)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() /* eslint-disable-next-line react-hooks/exhaustive-deps */ }, [bucket])

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link href="/wavecore-erp/procurement" className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Package className="w-6 h-6 text-indigo-500" />
            GRNI Reconciliation
          </h1>
          <p className="text-sm text-neutral-500 mt-1">
            Goods Received Not Invoiced — the accrual that must match GL account 2150
          </p>
        </div>
        <button onClick={load} disabled={loading}
          className="px-4 py-2 rounded-xl bg-neutral-100 dark:bg-neutral-800 font-bold text-sm flex items-center gap-2 disabled:opacity-50">
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
          Refresh
        </button>
      </div>

      {totals && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Kpi label="Total Received"   value={totals.received}    color="text-blue-500" />
          <Kpi label="Total Invoiced"   value={totals.invoiced}    color="text-green-500" />
          <Kpi label="Outstanding GRNI" value={totals.outstanding} color="text-amber-500" />
        </div>
      )}

      <div className="flex items-center gap-2 mb-4">
        {['', 'CLEARED', '0-30', '31-60', '61-90', '90+'].map(b => (
          <button key={b} onClick={() => setBucket(b)}
            className={'px-3 py-1.5 rounded-lg text-xs font-bold border ' +
              (bucket === b
                ? 'bg-indigo-600 text-white border-indigo-600'
                : 'bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700')}>
            {b || 'All'}
          </button>
        ))}
      </div>

      <div className="rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden bg-white dark:bg-neutral-900">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-neutral-50 dark:bg-neutral-800/50">
              <tr className="text-left text-xs uppercase tracking-wider text-neutral-500">
                <th className="px-4 py-3">GRN #</th>
                <th className="px-4 py-3">PO #</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Received</th>
                <th className="px-4 py-3 text-right">Received Amt</th>
                <th className="px-4 py-3 text-right">Invoiced</th>
                <th className="px-4 py-3 text-right">Outstanding</th>
                <th className="px-4 py-3 text-center">Aging</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={8} className="px-4 py-12 text-center"><Loader2 className="w-6 h-6 animate-spin inline-block text-indigo-500" /></td></tr>}
              {!loading && rows.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-12 text-center text-neutral-500">
                  <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-green-500" />
                  No outstanding GRNI — all goods fully invoiced.
                </td></tr>
              )}
              {!loading && rows.map(r => (
                <tr key={r.grnId} className="border-t border-neutral-100 dark:border-neutral-800 hover:bg-neutral-50 dark:hover:bg-neutral-800/30">
                  <td className="px-4 py-3 font-mono font-bold text-indigo-400">{r.grnNumber}</td>
                  <td className="px-4 py-3 font-mono text-neutral-500">{r.poNumber || '—'}</td>
                  <td className="px-4 py-3">{r.supplierName || '—'}</td>
                  <td className="px-4 py-3 text-neutral-500">{new Date(r.receivedAt).toLocaleDateString('en-GB')}</td>
                  <td className="px-4 py-3 text-right font-mono">{Number(r.receivedAmount).toFixed(2)}</td>
                  <td className="px-4 py-3 text-right font-mono">{Number(r.invoicedAmount).toFixed(2)}</td>
                  <td className={'px-4 py-3 text-right font-mono font-bold ' +
                    (Number(r.outstandingAccrual) > 0.01 ? 'text-amber-500' : 'text-green-500')}>
                    {Number(r.outstandingAccrual).toFixed(2)}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={'px-2 py-1 rounded-md text-xs font-bold border ' + (BUCKET_COLOR[r.agingBucket] || '')}>
                      {r.agingBucket}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function Kpi({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-5 rounded-2xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-neutral-900">
      <div className="text-xs uppercase tracking-wider text-neutral-500 mb-2">{label}</div>
      <div className={'text-2xl font-bold font-mono ' + color}>{Number(value).toFixed(2)}</div>
    </div>
  )
}