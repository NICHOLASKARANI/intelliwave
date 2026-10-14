'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  ArrowLeft, DollarSign, TrendingUp, TrendingDown, CreditCard, Download,
  Loader2, Plus, Trash2, X
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePosShop } from '@/lib/wavecore/context/pos-shop-context'
import { authedFetch } from '@/lib/wavecore/csrf-client'

interface CashFlowEntry {
  id: string
  date: string
  description: string
  type: 'INCOME' | 'EXPENSE'
  amount: number
  method?: string | null
  reference?: string | null
}

export default function CashFlowPage() {
  const { shopId } = usePosShop()
  const [entries, setEntries] = useState<CashFlowEntry[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('INCOME')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [deleting, setDeleting] = useState('')

  const fetchEntries = async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true)
    setError('')
    try {
      const url = '/api/wavecore/store/cash-flow' + (shopId ? '?locationId=' + encodeURIComponent(shopId) : '')
      const res = await authedFetch(url)
      const data = await res.json()
      setEntries(data.entries || [])
    } catch {
      setError('Failed to load cash flow')
    } finally {
      if (!opts?.silent) setLoading(false)
    }
  }

  useEffect(() => { fetchEntries() }, [shopId])
  useEffect(() => {
    const t = setInterval(() => { fetchEntries({ silent: true }) }, 30000)
    return () => clearInterval(t)
    // eslint-disable-next-line
  }, [shopId])

  const handleAdd = async () => {
    if (!description || !amount) return
    setSubmitting(true)
    setError('')
    try {
      const res = await authedFetch('/api/wavecore/store/cash-flow', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description,
          type,
          amount: parseFloat(amount),
          locationId: shopId || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to add'); return }
      setDescription(''); setAmount(''); setShowAdd(false)
      fetchEntries()
    } catch {
      setError('Network error')
    } finally {
      setSubmitting(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this entry?')) return
    setDeleting(id)
    try {
      await authedFetch('/api/wavecore/store/cash-flow?id=' + encodeURIComponent(id), { method: 'DELETE' })
      fetchEntries()
    } finally {
      setDeleting('')
    }
  }

  const totalIncome = entries.filter(e => e.type === 'INCOME').reduce((s, e) => s + Number(e.amount || 0), 0)
  const totalExpenses = entries.filter(e => e.type === 'EXPENSE').reduce((s, e) => s + Number(e.amount || 0), 0)
  const netCash = totalIncome - totalExpenses

  const formatKES = (amount: number) => 'KSh ' + amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })

  const handleExport = () => {
    const csv = 'Date,Description,Type,Amount\n' + entries.map(e => `${e.date},${e.description},${e.type},${e.amount}`).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'cash-flow.csv'; a.click()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Cash Flow</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <Link href="/wavecore-erp/store" className="flex items-center gap-1 text-sm text-muted-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to Store
        </Link>

        <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-500" /> Cash Flow
          </h1>
          <div className="flex gap-2">
            <Button onClick={handleExport} variant="outline" className="gap-2" disabled={entries.length === 0}>
              <Download className="w-4 h-4" /> Export CSV
            </Button>
            <Button onClick={() => setShowAdd(!showAdd)} className="gap-2">
              <Plus className="w-4 h-4" /> Add Entry
            </Button>
          </div>
        </div>

        {error && <div className="mb-4 p-4 rounded-xl bg-red-50 text-red-600">{error}</div>}

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
            <TrendingUp className="w-6 h-6 text-green-500 mb-2" />
            <p className="text-xs text-muted-foreground">Income</p>
            <p className="text-xl font-bold text-green-600">{formatKES(totalIncome)}</p>
          </div>
          <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
            <TrendingDown className="w-6 h-6 text-red-500 mb-2" />
            <p className="text-xs text-muted-foreground">Expenses</p>
            <p className="text-xl font-bold text-red-600">{formatKES(totalExpenses)}</p>
          </div>
          <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
            <CreditCard className="w-6 h-6 text-blue-500 mb-2" />
            <p className="text-xs text-muted-foreground">Net Cash</p>
            <p className={`text-xl font-bold ${netCash >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatKES(netCash)}</p>
          </div>
        </div>

        {/* Add form */}
        {showAdd && (
          <div className="mb-6 p-6 rounded-2xl border bg-white dark:bg-neutral-900">
            <div className="flex justify-between items-center mb-4">
              <h2 className="font-bold">New Entry</h2>
              <button onClick={() => setShowAdd(false)} className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800"><X className="w-4 h-4" /></button>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              <input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" className="px-4 py-2.5 rounded-xl border md:col-span-2" />
              <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="Amount (KSh)" className="px-4 py-2.5 rounded-xl border" />
              <select value={type} onChange={(e) => setType(e.target.value as 'INCOME' | 'EXPENSE')} className="px-4 py-2.5 rounded-xl border">
                <option value="INCOME">Income</option>
                <option value="EXPENSE">Expense</option>
              </select>
            </div>
            <button onClick={handleAdd} disabled={submitting || !description || !amount} className="mt-4 px-6 py-2.5 rounded-xl bg-green-600 text-white font-bold disabled:opacity-50">
              {submitting ? 'Saving...' : 'Add Entry'}
            </button>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-green-500" /></div>
        ) : entries.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No cash flow entries yet</p>
            <p className="text-sm text-muted-foreground mt-1">Click "Add Entry" to record income or expense</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-neutral-50 dark:bg-neutral-800">
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="p-4">Date</th>
                  <th className="p-4">Description</th>
                  <th className="p-4">Type</th>
                  <th className="p-4 text-right">Amount</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {entries.map(e => (
                  <tr key={e.id} className="border-t">
                    <td className="p-4 text-xs">{new Date(e.date).toLocaleDateString()}</td>
                    <td className="p-4 font-medium">{e.description}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${e.type === 'INCOME' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                        {e.type}
                      </span>
                    </td>
                    <td className={`p-4 text-right font-bold ${e.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                      {e.type === 'INCOME' ? '+' : '-'} {formatKES(Number(e.amount || 0))}
                    </td>
                    <td className="p-4">
                      <button onClick={() => handleDelete(e.id)} disabled={deleting === e.id} className="p-2 rounded-lg text-red-500 hover:bg-red-50">
                        {deleting === e.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                      </button>
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