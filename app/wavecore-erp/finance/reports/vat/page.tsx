'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Download, FileText, Loader2, TrendingUp, TrendingDown } from 'lucide-react'

interface Row {
  id: string
  number: string
  date: string
  status: string
  party: string
  subtotal: number
  vat: number
  total: number
}

export default function VatReturnPage() {
  const [outputRows, setOutputRows] = useState<Row[]>([])
  const [inputRows, setInputRows] = useState<Row[]>([])
  const [outputVat, setOutputVat] = useState(0)
  const [inputVat, setInputVat] = useState(0)
  const [netVat, setNetVat] = useState(0)
  const [totalSales, setTotalSales] = useState(0)
  const [totalPurchases, setTotalPurchases] = useState(0)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (from) qs.set('from', from)
      if (to) qs.set('to', to)
      const res = await fetch('/api/wavecore/finance/reports/vat-return' + (qs.toString() ? '?' + qs.toString() : ''), { cache: 'no-store' })
      const data = await res.json()
      setOutputRows(data.outputRows || [])
      setInputRows(data.inputRows || [])
      setOutputVat(Number(data.outputVat || 0))
      setInputVat(Number(data.inputVat || 0))
      setNetVat(Number(data.netVat || 0))
      setTotalSales(Number(data.totalSales || 0))
      setTotalPurchases(Number(data.totalPurchases || 0))
    } catch {}
    finally { setLoading(false) }
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [from, to])

  const fmt = (n: number) => 'KSh ' + Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const handleExport = () => {
    let csv = 'Section,Invoice#,Date,Party,Status,Subtotal,VAT,Total\n'
    outputRows.forEach(r => { csv += `Output,${r.number},${r.date || ''},"${r.party}",${r.status},${r.subtotal},${r.vat},${r.total}\n` })
    inputRows.forEach(r => { csv += `Input,${r.number},${r.date || ''},"${r.party}",${r.status},${r.subtotal},${r.vat},${r.total}\n` })
    csv += `,,\nTotal Sales,,,${totalSales}\nTotal Purchases,,,${totalPurchases}\nOutput VAT,,,${outputVat}\nInput VAT,,,${inputVat}\nNet VAT,,,${netVat}\n`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'vat-return.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => window.print()

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800 print:hidden">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-4">
            <Link href="/wavecore-erp" className="flex items-center gap-3">
              <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
              <span className="font-bold">WaveCore</span>
            </Link>
            <span className="text-sm text-neutral-500">VAT Return</span>
          </div>
          <Link href="/wavecore-erp/finance" className="flex items-center gap-2 text-sm text-neutral-500">
            <ArrowLeft className="w-4 h-4" /> Finance
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3 print:hidden">
          <div>
            <h1 className="text-2xl font-bold">VAT Return</h1>
            <p className="text-sm text-neutral-500 mt-1">Output VAT from sales, input VAT from purchases. Kenya KRA format (informational).</p>
          </div>
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-neutral-500 font-bold">From</label>
              <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm" />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-neutral-500 font-bold">To</label>
              <input type="date" value={to} onChange={e => setTo(e.target.value)} className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm" />
            </div>
            <button onClick={handleExport} disabled={loading} className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold flex items-center gap-2 disabled:opacity-40">
              <Download className="w-4 h-4" /> CSV
            </button>
            <button onClick={handlePrint} disabled={loading} className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-40">
              <FileText className="w-4 h-4" /> Print
            </button>
          </div>
        </div>

        {/* Summary tiles */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
            <TrendingUp className="w-5 h-5 text-green-600 mb-2" />
            <p className="text-lg font-bold text-green-700 dark:text-green-300">{fmt(outputVat)}</p>
            <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Output VAT (on sales)</p>
          </div>
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
            <TrendingDown className="w-5 h-5 text-red-600 mb-2" />
            <p className="text-lg font-bold text-red-700 dark:text-red-300">{fmt(inputVat)}</p>
            <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Input VAT (on purchases)</p>
          </div>
          <div className={'p-4 rounded-2xl border ' + (netVat >= 0 ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' : 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800')}>
            <p className={'text-lg font-bold ' + (netVat >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300')}>{fmt(Math.abs(netVat))}</p>
            <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">
              {netVat >= 0 ? 'Net VAT payable to KRA' : 'Net VAT refundable'}
            </p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div>
        ) : (
          <div className="space-y-6">
            {/* Output section */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
                <h3 className="text-xs uppercase tracking-wide text-green-600 font-bold">Output VAT — Sales ({outputRows.length})</h3>
                <p className="text-sm font-bold">Sales: {fmt(totalSales)} · VAT: {fmt(outputVat)}</p>
              </div>
              {outputRows.length === 0 ? (
                <p className="p-6 text-sm text-neutral-500">No customer invoices in this period.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                      <tr className="text-left text-[10px] uppercase tracking-wide text-neutral-500 font-bold">
                        <th className="px-4 py-2">Invoice#</th>
                        <th className="px-4 py-2">Date</th>
                        <th className="px-4 py-2">Customer</th>
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2 text-right">Subtotal</th>
                        <th className="px-4 py-2 text-right">VAT</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {outputRows.map(r => (
                        <tr key={r.id} className="border-t border-neutral-100 dark:border-neutral-800">
                          <td className="px-4 py-2 font-mono text-xs">{r.number}</td>
                          <td className="px-4 py-2 text-xs text-neutral-500">{r.date ? new Date(r.date).toLocaleDateString('en-GB') : '—'}</td>
                          <td className="px-4 py-2">{r.party}</td>
                          <td className="px-4 py-2"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">{r.status}</span></td>
                          <td className="px-4 py-2 text-right">{fmt(r.subtotal)}</td>
                          <td className="px-4 py-2 text-right text-green-600">{fmt(r.vat)}</td>
                          <td className="px-4 py-2 text-right font-bold">{fmt(r.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Input section */}
            <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
              <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex justify-between items-center">
                <h3 className="text-xs uppercase tracking-wide text-red-600 font-bold">Input VAT — Purchases ({inputRows.length})</h3>
                <p className="text-sm font-bold">Purchases: {fmt(totalPurchases)} · VAT: {fmt(inputVat)}</p>
              </div>
              {inputRows.length === 0 ? (
                <p className="p-6 text-sm text-neutral-500">No supplier invoices in this period.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-neutral-50 dark:bg-neutral-800/50">
                      <tr className="text-left text-[10px] uppercase tracking-wide text-neutral-500 font-bold">
                        <th className="px-4 py-2">Invoice#</th>
                        <th className="px-4 py-2">Date</th>
                        <th className="px-4 py-2">Supplier</th>
                        <th className="px-4 py-2">Status</th>
                        <th className="px-4 py-2 text-right">Subtotal</th>
                        <th className="px-4 py-2 text-right">VAT</th>
                        <th className="px-4 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {inputRows.map(r => (
                        <tr key={r.id} className="border-t border-neutral-100 dark:border-neutral-800">
                          <td className="px-4 py-2 font-mono text-xs">{r.number}</td>
                          <td className="px-4 py-2 text-xs text-neutral-500">{r.date ? new Date(r.date).toLocaleDateString('en-GB') : '—'}</td>
                          <td className="px-4 py-2">{r.party}</td>
                          <td className="px-4 py-2"><span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300">{r.status}</span></td>
                          <td className="px-4 py-2 text-right">{fmt(r.subtotal)}</td>
                          <td className="px-4 py-2 text-right text-red-600">{fmt(r.vat)}</td>
                          <td className="px-4 py-2 text-right font-bold">{fmt(r.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Net summary bar */}
            <div className="bg-neutral-900 dark:bg-white text-white dark:text-black rounded-2xl p-6 flex justify-between items-center">
              <div>
                <p className="text-xs uppercase tracking-wide opacity-80 font-bold">Net VAT</p>
                <p className="text-sm opacity-80">{netVat >= 0 ? 'Payable to KRA' : 'Refundable from KRA'}</p>
              </div>
              <p className="text-3xl font-bold">{fmt(Math.abs(netVat))}</p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}