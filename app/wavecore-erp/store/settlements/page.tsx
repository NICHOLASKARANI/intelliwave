'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Wallet, Loader2, TrendingUp, DollarSign, CheckCircle, Clock, Printer, ArrowUpRight, BarChart3, Plus, Trash2, X } from 'lucide-react'

export default function SettlementsPage() {
  const [settlements, setSettlements] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [deleting, setDeleting] = useState('')
  const [activeView, setActiveView] = useState('all')
  const [formData, setFormData] = useState({ amount: '', method: 'MPESA', customerName: '' })

  const fetchSettlements = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/store/settlements')
      const data = await res.json()
      setSettlements(data.settlements || [])
    } catch (err) {
      setError('Failed to load settlements')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSettlements()
  }, [])

  const createSettlement = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.amount) return
    try {
      const res = await fetch('/api/wavecore/store/settlements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setFormData({ amount: '', method: 'MPESA', customerName: '' })
        setShowForm(false)
        fetchSettlements()
      }
    } catch (err) {
      setError('Failed to create settlement')
    }
  }

  const deleteSettlement = async (id: string) => {
    if (!confirm('Delete this settlement?')) return
    setDeleting(id)
    try {
      await fetch(`/api/wavecore/store/settlements?id=${id}`, { method: 'DELETE' })
      fetchSettlements()
    } catch (err) {
      setError('Delete failed')
    } finally {
      setDeleting('')
    }
  }

  const downloadPdf = (id: string) => {
    window.open(`/api/wavecore/store/settlements/${id}/pdf`, '_blank')
  }

  const totalSettled = settlements.filter(s => s.status === 'COMPLETED' || s.status === 'PAID').reduce((sum, s) => sum + Number(s.amount || 0), 0)
  const totalPending = settlements.filter(s => s.status === 'PENDING').reduce((sum, s) => sum + Number(s.amount || 0), 0)

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
            <Wallet className="w-6 h-6 text-purple-500" /> Settlements ({settlements.length})
          </h1>
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2.5 rounded-xl bg-purple-600 text-white font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Settlement
          </button>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600">{error}</div>}

        {/* Form */}
        {showForm && (
          <form onSubmit={createSettlement} className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold text-lg">New Settlement</h2>
              <button type="button" onClick={() => setShowForm(false)} className="text-red-500"><X className="w-5 h-5" /></button>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <input type="number" placeholder="Amount" value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="px-4 py-2 rounded-xl border" />
              <select value={formData.method} onChange={(e) => setFormData({...formData, method: e.target.value})}
                className="px-4 py-2 rounded-xl border">
                <option>MPESA</option><option>BANK</option><option>CASH</option>
              </select>
              <input type="text" placeholder="Customer" value={formData.customerName}
                onChange={(e) => setFormData({...formData, customerName: e.target.value})}
                className="px-4 py-2 rounded-xl border" />
            </div>
            <button type="submit" className="mt-4 px-6 py-2 rounded-xl bg-purple-600 text-white font-bold">Create Settlement</button>
          </form>
        )}

        {/* KPI Cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <button onClick={() => setActiveView("all")} className="p-4 rounded-2xl bg-gradient-to-br from-purple-600 to-violet-600 text-white text-center w-full">
            <BarChart3 className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">{settlements.length}</p>
            <p className="text-xs opacity-80">Total</p>
          </div>
          <button onClick={() => setActiveView("settled")} className="p-4 rounded-2xl bg-gradient-to-br from-green-600 to-emerald-600 text-white text-center w-full">
            <CheckCircle className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">KSh {totalSettled.toLocaleString()}</p>
            <p className="text-xs opacity-80">Settled</p>
          </div>
          <button onClick={() => setActiveView("pending")} className="p-4 rounded-2xl bg-gradient-to-br from-yellow-600 to-amber-600 text-white text-center w-full">
            <Clock className="w-6 h-6 mx-auto mb-2" />
            <p className="text-2xl font-bold">KSh {totalPending.toLocaleString()}</p>
            <p className="text-xs opacity-80">Pending</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : settlements.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No settlements yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {settlements.filter(s => {
              if (activeView === 'settled') return s.status === 'COMPLETED' || s.status === 'PAID'
              if (activeView === 'pending') return s.status === 'PENDING'
              return true
            }).map(s => (
              <div key={s.id} className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 flex justify-between items-center">
                <div>
                  <p className="font-mono font-bold">{s.number}</p>
                  <p className="text-sm text-muted-foreground">{s.customerName || 'N/A'} | {s.method}</p>
                  <span className={`px-2 py-1 rounded-full text-xs font-bold ${s.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {s.status}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-lg font-bold text-purple-600">KSh {Number(s.amount || 0).toLocaleString()}</p>
                  <button onClick={() => downloadPdf(s.id)} className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <Printer className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteSettlement(s.id)} className="p-2 rounded-lg bg-red-50 text-red-600">
                    {deleting === s.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}