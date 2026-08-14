'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { LayoutDashboard, Plus, FileText, Download, AlertCircle, TrendingUp } from 'lucide-react'
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
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchBudgets() {
      try {
        const res = await fetch('/api/wavecore/finance/budgets')
        if (res.ok) {
          const data = await res.json()
          setBudgets(data.budgets || [])
        } else {
          setError('Failed to load budgets')
        }
      } catch (err) {
        setError('Network error')
      } finally {
        setLoading(false)
      }
    }
    fetchBudgets()
  }, [])

  const formatKES = (amount: number) => `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          <div className="flex items-center gap-4">
            <Link href="/wavecore-erp" className="flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-xl overflow-hidden border-2 border-indigo-200">
                <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="object-cover" />
              </div>
              <span className="font-bold text-lg">WaveCore</span>
            </Link>
            <span className="text-sm">Budgets</span>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Budgets</h1>
            <p className="text-muted-foreground mt-1">Plan and track your financial budgets</p>
          </div>
        </div>

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
            <p className="text-sm text-muted-foreground mt-1">Create your first budget to start planning</p>
            <Button className="mt-4 gap-2"><Plus className="w-4 h-4" /> Create Budget</Button>
          </div>
        )}
      </main>
    </div>
  )
}