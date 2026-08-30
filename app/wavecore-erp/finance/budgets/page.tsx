'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, FileText, Printer, Trash2, Loader2, Search, Wallet } from 'lucide-react'

interface Budget {
  id: string
  name: string
  fiscalYear: number
  period: string
  amount: number
  createdAt: string
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ name: '', fiscalYear: new Date().getFullYear(), period: 'ANNUAL', amount: '' })

  useEffect(() => {
    fetchBudgets()
  }, [])

  const fetchBudgets = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/finance/budgets')
      const data = await res.json()
      setBudgets(data.budgets || [])
    } catch (err) {
      setError('Failed to load')
    } finally {
      setLoading(false)
    }
  }

  const createBudget = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch('/api/wavecore/finance/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setFormData({ name: '', fiscalYear: new Date().getFullYear(), period: 'ANNUAL', amount: '' })
        setShowForm(false)
        fetchBudgets()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  const deleteBudget = async (id: string) => {
    if (!confirm('Delete this budget?')) return
    try {
      await fetch(`/api/wavecore/finance/budgets?id=${id}`, { method: 'DELETE' })
      fetchBudgets()
    } catch (err) {
      setError('Delete failed')
    }
  }

  const downloadPdf = (id: string) => {
    window.open(`/api/wavecore/finance/budgets/${id}/pdf`, '_blank')
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp/finance" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Budgets</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-3 sm:p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Wallet className="w-6 h-6 text-emerald-500" /> Budgets ({budgets.length})
          </h1>
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Budget
          </button>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600">{error}</div>}

        {showForm && (
          <form onSubmit={createBudget} className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Budget Name" value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="px-4 py-2 rounded-xl border" />
              <input type="number" placeholder="Fiscal Year" value={formData.fiscalYear}
                onChange={(e) => setFormData({...formData, fiscalYear: Number(e.target.value)})}
                className="px-4 py-2 rounded-xl border" />
              <select value={formData.period}
                onChange={(e) => setFormData({...formData, period: e.target.value})}
                className="px-4 py-2 rounded-xl border">
                <option value="ANNUAL">Annual</option>
                <option value="QUARTERLY">Quarterly</option>
                <option value="MONTHLY">Monthly</option>
              </select>
              <input type="number" placeholder="Amount" value={formData.amount}
                onChange={(e) => setFormData({...formData, amount: e.target.value})}
                className="px-4 py-2 rounded-xl border" />
            </div>
            <button type="submit" className="mt-4 px-6 py-2 rounded-xl bg-emerald-600 text-white font-bold">Create Budget</button>
          </form>
        )}

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : budgets.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Wallet className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No budgets yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {budgets.map(budget => (
              <div key={budget.id} className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 flex justify-between items-center">
                <div>
                  <p className="font-bold">{budget.name}</p>
                  <p className="text-sm text-muted-foreground">FY {budget.fiscalYear} | {budget.period}</p>
                  <p className="text-lg font-bold text-emerald-600">KSh {Number(budget.amount || 0).toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => downloadPdf(budget.id)} className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <Printer className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteBudget(budget.id)} className="p-2 rounded-lg bg-red-50 text-red-600">
                    <Trash2 className="w-4 h-4" />
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