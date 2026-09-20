'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  BarChart3, Loader2, RefreshCw, DollarSign, TrendingUp, Receipt,
  CheckCircle2, Clock, Printer, Calendar, ArrowUpDown, Store, Percent,
} from 'lucide-react'

export default function CommissionPage() {
  const [summary, setSummary] = useState<any>({})
  const [wallet, setWallet] = useState<any>({})
  const [daily, setDaily] = useState<any[]>([])
  const [items, setItems] = useState<any[]>([])
  const [period, setPeriod] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [sortBy, setSortBy] = useState('orderDate')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')

  const fetchAll = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (fromDate) params.set('from', fromDate)
      if (toDate) params.set('to', toDate)
      const res = await fetch('/api/marketplace/commission?' + params.toString())
      const data = await res.json()
      setSummary(data.summary || {})
      setWallet(data.wallet || {})
      setDaily(data.daily || [])
      setItems(data.items || [])
      setPeriod(data.period || {})
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchAll() }, [fromDate, toDate])

  const sortedItems = useMemo(() => {
    const list = [...items]
    list.sort((a, b) => {
      const av = a[sortBy] ?? ''; const bv = b[sortBy] ?? ''
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [items, sortBy, sortDir])

  const toggleSort = (f: string) => {
    if (sortBy === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(f); setSortDir('desc') }
  }

  const pdf = () => window.print()

  const statusStyle = (s: string) => {
    switch (s) {
      case 'SETTLED': return 'bg-green-900/40 text-green-300'
      case 'SHIPPED': return 'bg-purple-900/40 text-purple-300'
      case 'PENDING': return 'bg-yellow-900/40 text-yellow-300'
      case 'CANCELLED': return 'bg-red-900/40 text-red-300'
      default: return 'bg-neutral-800 text-neutral-400'
    }
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/marketplace/seller" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">Seller · Earnings</span>
          </Link>
          <div className="flex gap-2">
            <Link href="/wavecore-erp/marketplace/seller" className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold">Dashboard</Link>
            <Link href="/wavecore-erp/marketplace/seller/wallet" className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white text-xs font-bold">Wallet</Link>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8 space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-2">
              <BarChart3 className="w-7 h-7 text-indigo-400" /> Commission Statement
            </h1>
            <p className="text-sm text-neutral-400 mt-1">
              {period.from ? new Date(period.from).toLocaleDateString('en-GB') : 'Start'} → {period.to ? new Date(period.to).toLocaleDateString('en-GB') : 'Now'}
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} className="px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm" />
            <input type="date" value={toDate} onChange={e => setToDate(e.target.value)} className="px-3 py-2 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm" />
            <button onClick={fetchAll} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
              <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} />
            </button>
            <button onClick={pdf} className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold flex items-center gap-2">
              <Printer className="w-4 h-4" /> Print
            </button>
          </div>
        </div>

        {error && <div className="p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" /></div>
        ) : (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-800 text-white shadow-lg">
                <DollarSign className="w-6 h-6 mb-2" />
                <p className="text-3xl font-bold">KES {Number(summary.grossSales || 0).toLocaleString()}</p>
                <p className="text-xs opacity-90">Gross Sales</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-600 to-red-800 text-white shadow-lg">
                <Percent className="w-6 h-6 mb-2" />
                <p className="text-3xl font-bold">KES {Number(summary.totalCommission || 0).toLocaleString()}</p>
                <p className="text-xs opacity-90">Total Commission ({summary.effectiveCommissionRate || 0}%)</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white shadow-lg">
                <TrendingUp className="w-6 h-6 mb-2" />
                <p className="text-3xl font-bold">KES {Number(summary.netPayout || 0).toLocaleString()}</p>
                <p className="text-xs opacity-90">Net Payout</p>
              </div>
              <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-700 to-slate-900 text-white shadow-lg">
                <Receipt className="w-6 h-6 mb-2" />
                <p className="text-3xl font-bold">{summary.itemCount || 0}</p>
                <p className="text-xs opacity-90">Total Items</p>
              </div>
            </div>

            {/* Status breakdown */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
                <CheckCircle2 className="w-5 h-5 text-green-400 mb-2" />
                <p className="text-2xl font-bold text-white">{summary.settledCount || 0}</p>
                <p className="text-xs text-neutral-400">Settled</p>
              </div>
              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
                <Clock className="w-5 h-5 text-yellow-400 mb-2" />
                <p className="text-2xl font-bold text-white">{summary.pendingCount || 0}</p>
                <p className="text-xs text-neutral-400">Pending</p>
              </div>
              <div className="p-4 rounded-2xl bg-neutral-900 border border-neutral-800">
                <Receipt className="w-5 h-5 text-neutral-400 mb-2" />
                <p className="text-2xl font-bold text-white">KES {Number(wallet.availableBalance || 0).toLocaleString()}</p>
                <p className="text-xs text-neutral-400">In Wallet</p>
              </div>
            </div>

            {/* Daily chart */}
            {daily.length > 0 && (
              <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-5">
                <h3 className="text-sm font-bold uppercase tracking-wide text-indigo-400 mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> Daily Net Earnings
                </h3>
                <div className="flex items-end gap-2 h-32">
                  {daily.map((d, i) => {
                    const max = Math.max(...daily.map(x => x.net), 1)
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center group">
                        <div
                          className="w-full bg-gradient-to-t from-indigo-600 to-blue-400 rounded-t transition-all hover:from-indigo-500 hover:to-blue-300"
                          style={{ height: (d.net / max) * 100 + '%', minHeight: d.net > 0 ? '4px' : '2px' }}
                          title={`${d.date}: KES ${d.net.toLocaleString()}`}
                        ></div>
                        <span className="text-[8px] text-neutral-600 mt-1 whitespace-nowrap">{d.date.slice(5)}</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Line items table */}
            <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
              <div className="p-5 border-b border-neutral-800">
                <h3 className="text-sm font-bold uppercase tracking-wide text-white flex items-center gap-2">
                  <Receipt className="w-4 h-4 text-indigo-400" /> Sales Breakdown ({sortedItems.length})
                </h3>
              </div>
              {sortedItems.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-500" />
                  <p className="text-sm text-neutral-500">No sales in this period</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-neutral-800">
                      <tr>
                        {[['orderNumber','Order #'],['title','Product'],['quantity','Qty'],['unitPrice','Unit'],['lineTotal','Gross'],['commissionAmount','Comm.'],['sellerPayout','Net'],['fulfillmentStatus','Status']].map(([f,label]) => (
                          <th key={f} onClick={() => toggleSort(f)} className="text-left p-3 text-xs uppercase tracking-wide text-neutral-400 cursor-pointer hover:text-white select-none">
                            <span className="inline-flex items-center gap-1">{label}<ArrowUpDown className="w-3 h-3" /></span>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {sortedItems.map(it => (
                        <tr key={it.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                          <td className="p-3 font-mono text-xs text-neutral-400">{it.orderNumber}</td>
                          <td className="p-3 text-white text-sm">{it.title}</td>
                          <td className="p-3 text-center text-white">{it.quantity}</td>
                          <td className="p-3 text-right text-neutral-300">KES {Number(it.unitPrice).toLocaleString()}</td>
                          <td className="p-3 text-right text-white font-bold">KES {Number(it.lineTotal).toLocaleString()}</td>
                          <td className="p-3 text-right text-rose-400">−KES {Number(it.commissionAmount).toLocaleString()}</td>
                          <td className="p-3 text-right text-emerald-400 font-bold">KES {Number(it.sellerPayout).toLocaleString()}</td>
                          <td className="p-3 text-center"><span className={'px-2 py-0.5 rounded-full text-[10px] font-bold ' + statusStyle(it.fulfillmentStatus)}>{it.fulfillmentStatus}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}
      </main>
    </div>
  )
}