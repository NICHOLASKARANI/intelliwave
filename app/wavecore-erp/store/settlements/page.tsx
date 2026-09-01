'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Wallet, Loader2, TrendingUp, DollarSign, CheckCircle, Clock, Printer, ArrowUpRight, BarChart3 } from 'lucide-react'

interface Settlement {
  id: string
  number: string
  amount: number
  status: string
  method: string
  createdAt: string
}

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<Settlement[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [activeView, setActiveView] = useState('all')
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchSettlements()
  }, [])

  const fetchSettlements = async () => {
    setLoading(true)
    try {
      // Fetch payments as settlements
      const res = await fetch('/api/wavecore/finance/payments')
      const data = await res.json()
      setSettlements(data.payments || [])
    } catch (err) {
      setError('Failed to load settlements')
    } finally {
      setLoading(false)
    }
  }

  const completedSettlements = settlements.filter(s => s.status === 'COMPLETED' || s.status === 'PAID')
  const pendingSettlements = settlements.filter(s => s.status === 'PENDING' || s.status === 'DRAFT')
  const totalSettled = completedSettlements.reduce((sum, s) => sum + Number(s.amount || 0), 0)
  const totalPending = pendingSettlements.reduce((sum, s) => sum + Number(s.amount || 0), 0)

  const printReport = () => window.print()

  const filtered = settlements.filter(s =>
    (s.number || s.receiptNumber || '').toLowerCase().includes(search.toLowerCase()) ||
    (s.customerName || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Settlements</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-3 sm:p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="w-6 h-6 text-purple-500" /> Settlements
          </h1>
          <button onClick={printReport}
            className="px-4 py-2 rounded-xl bg-purple-600 text-white font-bold flex items-center gap-2">
            <Printer className="w-4 h-4" /> Print
          </button>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600">{error}</div>}

        {/* CLICKABLE KPI CARDS */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <button onClick={() => setActiveView('all')}
            className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'all' ? 'ring-4 ring-purple-300' : ''}`}
            style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)' }}>
            <BarChart3 className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{settlements.length}</p>
            <p className="text-xs opacity-80">Total Settlements</p>
            <ArrowUpRight className="w-4 h-4 mx-auto mt-1" />
          </button>
          <button onClick={() => setActiveView('completed')}
            className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'completed' ? 'ring-4 ring-green-300' : ''}`}
            style={{ background: 'linear-gradient(135deg, #16a34a, #059669)' }}>
            <CheckCircle className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">KSh {totalSettled.toLocaleString()}</p>
            <p className="text-xs opacity-80">Settled</p>
            <ArrowUpRight className="w-4 h-4 mx-auto mt-1" />
          </button>
          <button onClick={() => setActiveView('pending')}
            className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'pending' ? 'ring-4 ring-yellow-300' : ''}`}
            style={{ background: 'linear-gradient(135deg, #d97706, #b45309)' }}>
            <Clock className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">KSh {totalPending.toLocaleString()}</p>
            <p className="text-xs opacity-80">Pending</p>
            <ArrowUpRight className="w-4 h-4 mx-auto mt-1" />
          </button>
          <button onClick={() => setActiveView('all')}
            className={`p-5 rounded-2xl text-white text-center transition-all hover:shadow-lg ${activeView === 'all' ? 'ring-4 ring-blue-300' : ''}`}
            style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)' }}>
            <TrendingUp className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{completedSettlements.length}</p>
            <p className="text-xs opacity-80">Completed</p>
            <ArrowUpRight className="w-4 h-4 mx-auto mt-1" />
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search settlements..." className="w-full px-4 py-2.5 rounded-xl border" />
        </div>

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : (
          <div className="space-y-3">
            {filtered
              .filter(s => {
                if (activeView === 'completed') return s.status === 'COMPLETED' || s.status === 'PAID'
                if (activeView === 'pending') return s.status === 'PENDING' || s.status === 'DRAFT'
                return true
              })
              .map((settlement, i) => (
                <div key={i} className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 flex justify-between items-center">
                  <div>
                    <p className="font-mono font-bold">{settlement.number || settlement.receiptNumber || 'N/A'}</p>
                    <p className="text-sm text-muted-foreground">{settlement.customerName || 'N/A'}</p>
                    <p className="text-xs text-muted-foreground">{new Date(settlement.createdAt).toLocaleDateString()}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-purple-600">KSh {Number(settlement.amount || 0).toLocaleString()}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${settlement.status === 'COMPLETED' || settlement.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {settlement.status || 'PENDING'}
                    </span>
                  </div>
                </div>
              ))}
            {filtered.length === 0 && (
              <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
                <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="text-muted-foreground">No settlements yet</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}