'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { 
  Loader2, Package, Warehouse, Search,
  ArrowLeft, ArrowLeftRight, RefreshCw, Sliders, ClipboardList, Layers, Activity
} from 'lucide-react'

export default function LedgerPage() {
  const [ledger, setLedger] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')

  const fetchLedger = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/inventory/ledger')
      const data = await res.json()
      setLedger(data.ledger || [])
    } catch (err) {
      setError('Failed to load ledger')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLedger() }, [])

  const filtered = ledger.filter(l => 
    (l.productName || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.transactionId || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.transactionType || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-neutral-950">
      {/* Dark Sidebar */}
      <div className="fixed left-0 top-0 h-full w-64 bg-neutral-900 border-r border-neutral-800 z-50">
        <div className="p-4 border-b border-neutral-800">
          <Link href="/wavecore-erp" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold text-white">WaveCore</span>
          </Link>
        </div>
        <nav className="p-4 space-y-2">
          <Link href="/wavecore-erp/inventory" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <ArrowLeft className="w-5 h-5" /> Dashboard
          </Link>
          <Link href="/wavecore-erp/inventory/products" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <Package className="w-5 h-5" /> Products
          </Link>
          <Link href="/wavecore-erp/inventory/warehouses" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <Warehouse className="w-5 h-5" /> Warehouses
          </Link>
          <Link href="/wavecore-erp/inventory/movements" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <ArrowLeftRight className="w-5 h-5" /> Movements
          </Link>
          <Link href="/wavecore-erp/inventory/adjustments" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <Sliders className="w-5 h-5" /> Adjustments
          </Link>
          <Link href="/wavecore-erp/inventory/counts" className="flex items-center gap-3 p-3 rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white">
            <ClipboardList className="w-5 h-5" /> Counts
          </Link>
          <Link href="/wavecore-erp/inventory/ledger" className="flex items-center gap-3 p-3 rounded-xl bg-yellow-600 text-white font-bold">
            <Layers className="w-5 h-5" /> Ledger
          </Link>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-2">
              <Layers className="w-6 h-6 text-yellow-500" /> Stock Ledger ({ledger.length})
            </h1>
            <p className="text-sm text-neutral-400 mt-1">Immutable transaction history</p>
          </div>
          <button onClick={fetchLedger}
            className="px-4 py-2.5 rounded-xl bg-neutral-800 text-white font-bold flex items-center gap-2 hover:bg-neutral-700">
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-900/50 text-red-300 border border-red-800">{error}</div>}

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-500" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl bg-neutral-900 border border-neutral-800 text-white w-full focus:outline-none focus:ring-2 focus:ring-yellow-500" placeholder="Search ledger..." />
        </div>

        {loading ? (
          <div className="text-center py-16"><Loader2 className="w-12 h-12 animate-spin mx-auto text-yellow-500" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-neutral-900 rounded-2xl border border-neutral-800">
            <Layers className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-neutral-400">No ledger entries yet</p>
          </div>
        ) : (
          <div className="bg-neutral-900 rounded-2xl border border-neutral-800 overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-800">
                <tr>
                  <th className="text-left p-4 text-neutral-400">Transaction</th>
                  <th className="text-left p-4 text-neutral-400">Product</th>
                  <th className="text-right p-4 text-neutral-400">Qty</th>
                  <th className="text-right p-4 text-neutral-400">Before</th>
                  <th className="text-right p-4 text-neutral-400">After</th>
                  <th className="text-left p-4 text-neutral-400">Type</th>
                  <th className="text-left p-4 text-neutral-400">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((l: any) => (
                  <tr key={l.id} className="border-t border-neutral-800 hover:bg-neutral-800/50">
                    <td className="p-4 font-mono text-xs text-neutral-400">{l.transactionId || 'N/A'}</td>
                    <td className="p-4 font-bold text-white">{l.productName || 'N/A'}</td>
                    <td className="p-4 text-right font-bold text-white">{l.quantity || 0}</td>
                    <td className="p-4 text-right text-neutral-400">{l.beforeQuantity || 0}</td>
                    <td className="p-4 text-right text-neutral-400">{l.afterQuantity || 0}</td>
                    <td className="p-4">
                      <span className="px-2 py-1 rounded-full text-xs bg-green-900/50 text-green-300">{l.transactionType || 'N/A'}</span>
                    </td>
                    <td className="p-4 text-neutral-400 text-sm">{new Date(l.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}