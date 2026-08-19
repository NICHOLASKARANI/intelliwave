'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, TrendingUp, AlertCircle, Save , Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Budget {
  id: string
  name: string
  fiscalYear: number
  period: string
  total_budget: number
  createdAt: string
}

export default function BudgetsPage() {
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [loading, setLoading] = useState(true)
  const [showCreate, setShowCreate] = useState(false)
  const [name, setName] = useState('')
  const [fiscalYear, setFiscalYear] = useState(new Date().getFullYear())
  const [period, setPeriod] = useState('ANNUAL')
  const [amount, setAmount] = useState('')
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchBudgets()
  }, [])

  async function fetchBudgets() {
    try {
      const res = await fetch('/api/wavecore/finance/budgets')
      if (res.ok) {
        const data = await res.json()
        setBudgets(data.budgets || [])
      }
    } catch {} finally {
      setLoading(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)
    setError('')

    try {
      const res = await fetch('/api/wavecore/finance/budgets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          fiscalYear: Number(fiscalYear),
          period,
          lines: [{ accountId: 'placeholder', amount: Number(amount) }],
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create budget')
        return
      }
      setShowCreate(false)
      setName('')
      setAmount('')
      fetchBudgets()
    } catch {
      setError('Network error')
    } finally {
      setCreating(false)
    }
  }

  const formatKES = (amount: number) => `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`


  const handleDownloadPDF = () => {
    const content = [
      'WaveCore ERP - Budgets',
      '='.repeat(50),
      'Generated: ' + new Date().toLocaleString(),
      'IntelliWavve - Enterprise ERP',
      '='.repeat(50),
      '',
      ...budgets.map((b: any, i: number) => 
        'Budget #' + (i + 1) + '\n' +
        '  Name: ' + (b.name || 'N/A') + '\n' +
        '  Amount: ' + (b.amount || '0') + '\n' +
        '  Spent: ' + (b.spent || '0') + '\n' +
        '-'.repeat(40)
      ),
      '',
      '© 2026 IntelliWavve - All Rights Reserved'
    ].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'budgets.pdf'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-4">
            <Link href="/wavecore-erp" className="flex items-center gap-3">
              <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
              <span className="font-bold">WaveCore</span>
            </Link>
            <span className="text-sm">Budgets</span>
          </div>
          <Button onClick={() => setShowCreate(!showCreate)} className="gap-2">
            <Plus className="w-4 h-4" /> New Budget
          </Button>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Budgets</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"><Download className="w-4 h-4" /> Download PDF</button>

        {/* Create Budget Form */}
        {showCreate && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-8">
            <h3 className="font-bold mb-4">Create Budget</h3>
            {error && (
              <div className="p-3 mb-4 rounded-lg bg-red-50 text-red-600 text-sm flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> {error}
              </div>
            )}
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Budget Name</label>
                  <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border bg-background" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Fiscal Year</label>
                  <input type="number" value={fiscalYear} onChange={(e) => setFiscalYear(parseInt(e.target.value))}
                    className="w-full px-4 py-2.5 rounded-xl border bg-background" required />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Period</label>
                  <select value={period} onChange={(e) => setPeriod(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border bg-background">
                    <option value="ANNUAL">Annual</option>
                    <option value="MONTHLY">Monthly</option>
                    <option value="QUARTERLY">Quarterly</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Total Budget Amount (KSh)</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                  className="w-full md:w-64 px-4 py-2.5 rounded-xl border bg-background" required min="0" />
              </div>
              <Button type="submit" disabled={creating} className="gap-2">
                <Save className="w-4 h-4" /> {creating ? 'Creating...' : 'Create Budget'}
              </Button>
            </form>
          </div>
        )}

        {/* Budget List */}
        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : budgets.length > 0 ? (
          <div className="grid md:grid-cols-2 gap-4">
            {budgets.map((b) => (
              <div key={b.id} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-bold">{b.name}</h3>
                  <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-1 rounded-full">{b.period}</span>
                </div>
                <p className="text-2xl font-bold">{formatKES(b.total_budget || 0)}</p>
                <p className="text-xs text-muted-foreground mt-2">Fiscal Year: {b.fiscalYear}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <TrendingUp className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No budgets yet</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">Create your first budget</p>
            <Button onClick={() => setShowCreate(true)} className="gap-2">
              <Plus className="w-4 h-4" /> Create Budget
            </Button>
          </div>
        )}
      </main>
    </div>
  )
}