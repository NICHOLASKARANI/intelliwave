'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Download, Loader2, TrendingUp, TrendingDown } from 'lucide-react'

interface Section { inflows: number; outflows: number; net: number; accounts: any[] }

export default function CashFlowPage() {
  const [operating, setOperating] = useState<Section>({ inflows: 0, outflows: 0, net: 0, accounts: [] })
  const [investing, setInvesting] = useState<Section>({ inflows: 0, outflows: 0, net: 0, accounts: [] })
  const [financing, setFinancing] = useState<Section>({ inflows: 0, outflows: 0, net: 0, accounts: [] })
  const [netChange, setNetChange] = useState(0)
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setLoading(true)
    try {
      const qs = new URLSearchParams()
      if (from) qs.set('from', from)
      if (to) qs.set('to', to)
      const res = await fetch('/api/wavecore/finance/reports/cash-flow' + (qs.toString() ? '?' + qs.toString() : ''), { cache: 'no-store' })
      const data = await res.json()
      setOperating(data.operating || { inflows: 0, outflows: 0, net: 0, accounts: [] })
      setInvesting(data.investing || { inflows: 0, outflows: 0, net: 0, accounts: [] })
      setFinancing(data.financing || { inflows: 0, outflows: 0, net: 0, accounts: [] })
      setNetChange(Number(data.netChange || 0))
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [from, to])

  const fmt = (n: number) => 'KSh ' + Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const handleExport = () => {
    let csv = 'Section,Account,Debit,Credit,Net cash\n'
    for (const [label, sec] of [['Operating', operating], ['Investing', investing], ['Financing', financing]] as any) {
      for (const a of sec.accounts) {
        csv += `${label},"${a.code} ${a.name}",${a.debit},${a.credit},${a.net}\n`
      }
    }
    csv += `Net change,,,,\n${netChange}\n`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cash-flow.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const totalIn = operating.inflows + investing.inflows + financing.inflows
  const totalOut = operating.outflows + investing.outflows + financing.outflows

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-4">
            <Link href="/wavecore-erp" className="flex items-center gap-3">
              <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
              <span className="font-bold">WaveCore</span>
            </Link>
            <span className="text-sm text-neutral-500">Cash Flow Statement</span>
          </div>
          <Link href="/wavecore-erp/finance" className="flex items-center gap-2 text-sm text-neutral-500">
            <ArrowLeft className="w-4 h-4" /> Finance
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Cash Flow Statement</h1>
            <p className="text-sm text-neutral-500 mt-1">Movements on cash and bank accounts from POSTED journals.</p>
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
          </div>
        </div>

        {/* Summary tiles */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="p-4 rounded-2xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
            <TrendingUp className="w-5 h-5 text-green-600 mb-2" />
            <p className="text-lg font-bold text-green-700 dark:text-green-300">{fmt(totalIn)}</p>
            <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Inflows</p>
          </div>
          <div className="p-4 rounded-2xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
            <TrendingDown className="w-5 h-5 text-red-600 mb-2" />
            <p className="text-lg font-bold text-red-700 dark:text-red-300">{fmt(totalOut)}</p>
            <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Outflows</p>
          </div>
          <div className={'p-4 rounded-2xl border ' + (netChange >= 0 ? 'bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800' : 'bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800')}>
            <p className={'text-lg font-bold ' + (netChange >= 0 ? 'text-blue-700 dark:text-blue-300' : 'text-orange-700 dark:text-orange-300')}>{fmt(netChange)}</p>
            <p className="text-[10px] uppercase tracking-wide text-neutral-500 font-bold">Net change in cash</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            {[
              ['Operating activities', operating, 'text-blue-600'],
              ['Investing activities', investing, 'text-purple-600'],
              ['Financing activities', financing, 'text-amber-600'],
            ].map(([label, sec, color]: any) => (
              <div key={label} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                <div className="px-6 py-4 bg-neutral-50 dark:bg-neutral-800/40 flex justify-between items-center">
                  <h3 className={'text-xs uppercase tracking-wide font-bold ' + color}>{label}</h3>
                  <span className={'text-sm font-bold ' + (sec.net >= 0 ? 'text-green-600' : 'text-red-600')}>
                    {sec.net >= 0 ? '+' : ''}{fmt(sec.net)}
                  </span>
                </div>
                {sec.accounts.length === 0 ? (
                  <p className="px-6 py-3 text-xs text-neutral-500">No activity.</p>
                ) : (
                  <table className="w-full text-sm">
                    <tbody>
                      {sec.accounts.map((a: any) => (
                        <tr key={a.code} className="border-t border-neutral-100 dark:border-neutral-800">
                          <td className="px-6 py-2 font-mono text-xs text-neutral-500">{a.code}</td>
                          <td className="px-4 py-2">{a.name}</td>
                          <td className="px-4 py-2 text-right text-green-600">{fmt(a.debit)}</td>
                          <td className="px-4 py-2 text-right text-red-600">{fmt(a.credit)}</td>
                          <td className={'px-6 py-2 text-right font-medium ' + (a.net >= 0 ? 'text-green-600' : 'text-red-600')}>{fmt(a.net)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            ))}
            <div className="px-6 py-4 bg-neutral-900 dark:bg-white text-white dark:text-black flex justify-between items-center">
              <span className="text-lg font-bold">Net change in cash</span>
              <span className="text-2xl font-bold">{fmt(netChange)}</span>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}