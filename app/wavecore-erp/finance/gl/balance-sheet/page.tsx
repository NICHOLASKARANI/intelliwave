'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Download, FileText, Loader2, CheckCircle2, AlertTriangle } from 'lucide-react'

interface Line { accountId: string; code: string; name: string; type: string; natural: number }

export default function BalanceSheetPage() {
  const [assets, setAssets] = useState<Line[]>([])
  const [liabilities, setLiabilities] = useState<Line[]>([])
  const [equity, setEquity] = useState<Line[]>([])
  const [netProfit, setNetProfit] = useState(0)
  const [totalAssets, setTotalAssets] = useState(0)
  const [totalLiabilities, setTotalLiabilities] = useState(0)
  const [totalEquity, setTotalEquity] = useState(0)
  const [totalLE, setTotalLE] = useState(0)
  const [balanced, setBalanced] = useState(true)
  const [difference, setDifference] = useState(0)
  const [loading, setLoading] = useState(true)
  const [asOf, setAsOf] = useState('')

  const load = async () => {
    setLoading(true)
    try {
      const url = '/api/wavecore/finance/gl/balance-sheet-real' + (asOf ? '?asOf=' + asOf : '')
      const res = await fetch(url, { cache: 'no-store' })
      const data = await res.json()
      setAssets(data.assets || [])
      setLiabilities(data.liabilities || [])
      setEquity(data.equity || [])
      setNetProfit(Number(data.netProfit || 0))
      setTotalAssets(Number(data.totalAssets || 0))
      setTotalLiabilities(Number(data.totalLiabilities || 0))
      setTotalEquity(Number(data.totalEquity || 0))
      setTotalLE(Number(data.totalLiabilitiesAndEquity || 0))
      setBalanced(Boolean(data.balanced))
      setDifference(Number(data.difference || 0))
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { load() /* eslint-disable-next-line */ }, [asOf])

  const fmt = (n: number) => 'KSh ' + Number(n || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const handleExport = () => {
    let csv = 'Section,Code,Account,Amount\n'
    assets.forEach(l => { csv += `Assets,${l.code},"${l.name}",${l.natural}\n` })
    liabilities.forEach(l => { csv += `Liabilities,${l.code},"${l.name}",${l.natural}\n` })
    equity.forEach(l => { csv += `Equity,${l.code},"${l.name}",${l.natural}\n` })
    csv += `,,\nNet Profit (current period),,,${netProfit}\n`
    csv += `,,\nTotal Assets,,,${totalAssets}\nTotal Liabilities,,,${totalLiabilities}\nTotal Equity (incl. current P&L),,,${totalEquity}\nTotal L+E,,,${totalLE}\n`
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'balance-sheet.csv'
    a.click()
    URL.revokeObjectURL(url)
  }

  const hasAny = assets.length + liabilities.length + equity.length > 0

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-neutral-200 dark:border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-4">
            <Link href="/wavecore-erp" className="flex items-center gap-3">
              <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
              <span className="font-bold">WaveCore</span>
            </Link>
            <span className="text-sm text-neutral-500">Balance Sheet</span>
          </div>
          <Link href="/wavecore-erp/finance" className="flex items-center gap-2 text-sm text-neutral-500">
            <ArrowLeft className="w-4 h-4" /> Finance
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto p-4 lg:p-8">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-bold">Balance Sheet</h1>
            <p className="text-sm text-neutral-500 mt-1">Assets, Liabilities &amp; Equity from POSTED journals. Current-period profit is included in equity.</p>
          </div>
          <div className="flex items-end gap-3">
            <div>
              <label className="block text-[10px] uppercase tracking-wide text-neutral-500 font-bold">As of</label>
              <input type="date" value={asOf} onChange={e => setAsOf(e.target.value)} className="px-3 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm" />
            </div>
            <button onClick={handleExport} disabled={!hasAny} className="px-4 py-2 rounded-xl bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 text-sm font-bold flex items-center gap-2 disabled:opacity-40">
              <Download className="w-4 h-4" /> CSV
            </button>
          </div>
        </div>

        {/* Balance indicator */}
        <div className={`p-4 rounded-2xl border mb-6 flex items-center justify-between ${balanced ? 'bg-green-50 dark:bg-green-950/30 border-green-300 dark:border-green-800' : 'bg-red-50 dark:bg-red-950/30 border-red-300 dark:border-red-800'}`}>
          <div className="flex items-center gap-3">
            {balanced ? <CheckCircle2 className="w-5 h-5 text-green-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
            <p className="text-sm font-bold">
              {balanced ? 'Assets = Liabilities + Equity' : 'Out of balance by ' + fmt(difference)}
            </p>
          </div>
          <div className="text-right text-xs">
            <p>Assets: <span className="font-bold">{fmt(totalAssets)}</span></p>
            <p>L + E: <span className="font-bold">{fmt(totalLE)}</span></p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div>
        ) : hasAny ? (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800 overflow-hidden">
            <div className="p-6">
              <h3 className="text-xs uppercase tracking-wide text-blue-600 font-bold mb-3">Assets</h3>
              <table className="w-full text-sm mb-6">
                <tbody>
                  {assets.map(l => (
                    <tr key={l.accountId} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                      <td className="py-2 font-mono text-xs text-neutral-500 w-16">{l.code}</td>
                      <td className="py-2">{l.name}</td>
                      <td className="py-2 text-right font-medium">{fmt(l.natural)}</td>
                    </tr>
                  ))}
                  <tr className="font-bold border-t-2 border-neutral-200 dark:border-neutral-700">
                    <td></td><td className="pt-3">Total Assets</td>
                    <td className="pt-3 text-right">{fmt(totalAssets)}</td>
                  </tr>
                </tbody>
              </table>

              <h3 className="text-xs uppercase tracking-wide text-orange-600 font-bold mb-3">Liabilities</h3>
              <table className="w-full text-sm mb-6">
                <tbody>
                  {liabilities.map(l => (
                    <tr key={l.accountId} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                      <td className="py-2 font-mono text-xs text-neutral-500 w-16">{l.code}</td>
                      <td className="py-2">{l.name}</td>
                      <td className="py-2 text-right font-medium">{fmt(l.natural)}</td>
                    </tr>
                  ))}
                  <tr className="font-bold border-t-2 border-neutral-200 dark:border-neutral-700">
                    <td></td><td className="pt-3">Total Liabilities</td>
                    <td className="pt-3 text-right">{fmt(totalLiabilities)}</td>
                  </tr>
                </tbody>
              </table>

              <h3 className="text-xs uppercase tracking-wide text-purple-600 font-bold mb-3">Equity</h3>
              <table className="w-full text-sm mb-6">
                <tbody>
                  {equity.map(l => (
                    <tr key={l.accountId} className="border-b border-neutral-100 dark:border-neutral-800 last:border-0">
                      <td className="py-2 font-mono text-xs text-neutral-500 w-16">{l.code}</td>
                      <td className="py-2">{l.name}</td>
                      <td className="py-2 text-right font-medium">{fmt(l.natural)}</td>
                    </tr>
                  ))}
                  <tr className="border-b border-neutral-100 dark:border-neutral-800">
                    <td></td><td className="py-2 italic">Current period net profit</td>
                    <td className="py-2 text-right font-medium">{fmt(netProfit)}</td>
                  </tr>
                  <tr className="font-bold border-t-2 border-neutral-200 dark:border-neutral-700">
                    <td></td><td className="pt-3">Total Equity</td>
                    <td className="pt-3 text-right">{fmt(totalEquity)}</td>
                  </tr>
                </tbody>
              </table>

              <div className="border-t-2 border-neutral-900 dark:border-white pt-4 flex justify-between items-center">
                <span className="text-lg font-bold">Total Liabilities + Equity</span>
                <span className="text-2xl font-bold">{fmt(totalLE)}</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border border-neutral-200 dark:border-neutral-800">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="font-medium">No balance sheet data yet</p>
            <p className="text-sm text-neutral-500 mt-1">Post journal entries against Asset, Liability or Equity accounts.</p>
          </div>
        )}
      </main>
    </div>
  )
}