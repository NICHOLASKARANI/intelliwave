'use client'

import { useEffect, useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  Package, Loader2, Search, ArrowUpDown, ShoppingBag, Clock,
  CheckCircle2, Truck, XCircle, AlertTriangle, RefreshCw, Store, Tag,
} from 'lucide-react'

const STATUSES = ['PENDING', 'CONFIRMED', 'SHIPPED', 'DELIVERED', 'CANCELLED', 'COMPLETED']

export default function OrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [summary, setSummary] = useState<any>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [view, setView] = useState<'buyer' | 'seller'>('buyer')
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('ALL')
  const [sortBy, setSortBy] = useState('createdAt')
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc')

  const fetchOrders = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/marketplace/orders?view=' + view)
      const data = await res.json()
      setOrders(data.orders || [])
      setSummary(data.summary || {})
    } catch { setError('Network error') }
    finally { setLoading(false) }
  }
  useEffect(() => { fetchOrders() }, [view])

  const statusStyle = (s: string) => {
    switch (s) {
      case 'PENDING': return 'bg-yellow-900/40 text-yellow-300 border border-yellow-700'
      case 'CONFIRMED': return 'bg-blue-900/40 text-blue-300 border border-blue-700'
      case 'SHIPPED': return 'bg-purple-900/40 text-purple-300 border border-purple-700'
      case 'DELIVERED': return 'bg-cyan-900/40 text-cyan-300 border border-cyan-700'
      case 'COMPLETED': return 'bg-green-900/40 text-green-300 border border-green-700'
      case 'CANCELLED': return 'bg-red-900/40 text-red-300 border border-red-700'
      default: return 'bg-neutral-800 text-neutral-400'
    }
  }

  const filtered = useMemo(() => {
    let list = [...orders]
    if (filterStatus !== 'ALL') list = list.filter(o => o.status === filterStatus)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(o => (o.orderNumber || '').toLowerCase().includes(s) || (o.shippingAddress || '').toLowerCase().includes(s))
    }
    list.sort((a, b) => {
      const av = a[sortBy] ?? ''; const bv = b[sortBy] ?? ''
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
    return list
  }, [orders, filterStatus, search, sortBy, sortDir])

  const toggleSort = (f: string) => {
    if (sortBy === f) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortBy(f); setSortDir('desc') }
  }

  return (
    <div className="min-h-screen bg-neutral-950">
      <header className="sticky top-0 z-40 bg-neutral-900/95 backdrop-blur-xl border-b border-neutral-800">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/marketplace" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={36} height={36} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveMarket</span>
          </Link>
          <span className="text-sm text-neutral-400">Orders</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <div>
            <h1 className="text-3xl font-bold flex items-center gap-2 text-white">
              <Package className="w-7 h-7 text-indigo-400" /> Orders
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Track your purchases and sales</p>
          </div>
          <button onClick={fetchOrders} className="px-4 py-3 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-white font-bold flex items-center gap-2">
            <RefreshCw className={'w-4 h-4 ' + (loading ? 'animate-spin' : '')} /> Refresh
          </button>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}

        {/* View toggle */}
        <div className="mb-4 flex gap-2 bg-neutral-900 rounded-xl p-1 w-fit">
          <button onClick={() => setView('buyer')} className={'px-4 py-2 rounded-lg text-sm font-bold transition ' + (view === 'buyer' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white')}>
            <ShoppingBag className="w-3 h-3 inline mr-1" /> Purchases
          </button>
          <button onClick={() => setView('seller')} className={'px-4 py-2 rounded-lg text-sm font-bold transition ' + (view === 'seller' ? 'bg-indigo-600 text-white' : 'text-neutral-400 hover:text-white')}>
            <Store className="w-3 h-3 inline mr-1" /> Sales
          </button>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 mb-6">
          <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-600 to-blue-800 text-white">
            <Package className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.total || 0}</p><p className="text-xs opacity-90">Total</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-yellow-600 to-amber-800 text-white">
            <Clock className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.pending || 0}</p><p className="text-xs opacity-90">Pending</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-cyan-600 to-teal-800 text-white">
            <CheckCircle2 className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.paid || 0}</p><p className="text-xs opacity-90">Paid</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-800 text-white">
            <Truck className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.shipped || 0}</p><p className="text-xs opacity-90">Shipped</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-800 text-white">
            <CheckCircle2 className="w-5 h-5 mb-2" /><p className="text-2xl font-bold">{summary.delivered || 0}</p><p className="text-xs opacity-90">Delivered</p>
          </div>
          <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-800 text-white">
            <Tag className="w-5 h-5 mb-2" /><p className="text-lg font-bold">KES {Number(summary.totalValue || 0).toLocaleString()}</p><p className="text-xs opacity-90">Value</p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-neutral-900 rounded-2xl border border-neutral-800 p-4 mb-4 flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[220px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search order # or address..."
              className="pl-9 pr-4 py-2.5 rounded-xl border border-neutral-700 bg-neutral-800 text-white w-full text-sm" />
          </div>
          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)} className="px-3 py-2.5 rounded-xl bg-neutral-800 border border-neutral-700 text-white text-sm">
            <option value="ALL">All Statuses</option>
            {STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <span className="text-xs text-neutral-500">{filtered.length} shown</span>
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Package className="w-12 h-12 mx-auto mb-3 opacity-30 text-neutral-400" />
            <p className="text-neutral-400 mb-4">No {view === 'buyer' ? 'purchases' : 'sales'} yet</p>
            {view === 'buyer' && (
              <Link href="/wavecore-erp/marketplace" className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold inline-flex items-center gap-2">
                <ShoppingBag className="w-4 h-4" /> Start Shopping
              </Link>
            )}
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-800">
                <tr>
                  {[['orderNumber','Order #'],['status','Status'],['paymentStatus','Payment'],['total','Total'],['createdAt','Date']].map(([f,label]) => (
                    <th key={f} onClick={() => toggleSort(f)} className="text-left p-3 text-xs uppercase tracking-wide text-neutral-400 cursor-pointer hover:text-white select-none">
                      <span className="inline-flex items-center gap-1">{label}<ArrowUpDown className="w-3 h-3" /></span>
                    </th>
                  ))}
                  <th className="text-center p-3 text-xs uppercase tracking-wide text-neutral-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(o => (
                  <tr key={o.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                    <td className="p-3">
                      <Link href={'/wavecore-erp/marketplace/orders/' + o.id} className="text-white font-mono text-sm font-bold hover:text-indigo-400">{o.orderNumber}</Link>
                      <p className="text-[10px] text-neutral-500 mt-0.5">{o.shippingAddress || 'No address'}</p>
                    </td>
                    <td className="p-3"><span className={'px-2 py-1 rounded-full text-[10px] font-bold ' + statusStyle(o.status)}>{o.status}</span></td>
                    <td className="p-3">
                      <span className={'px-2 py-1 rounded-full text-[10px] font-bold ' + (o.paymentStatus === 'PAID' ? 'bg-green-900/40 text-green-300' : o.paymentStatus === 'FAILED' ? 'bg-red-900/40 text-red-300' : 'bg-yellow-900/40 text-yellow-300')}>
                        {o.paymentStatus}
                      </span>
                    </td>
                    <td className="p-3 text-right text-amber-400 font-bold">KES {Number(o.total || 0).toLocaleString()}</td>
                    <td className="p-3 text-xs text-neutral-400">{new Date(o.createdAt).toLocaleDateString('en-GB')}</td>
                    <td className="p-3 text-center">
                      <Link href={'/wavecore-erp/marketplace/orders/' + o.id} className="text-xs text-indigo-400 hover:text-indigo-300 font-bold">View</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}