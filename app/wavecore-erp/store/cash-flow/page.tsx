'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, DollarSign, TrendingUp, TrendingDown, CreditCard, Download, Loader2, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface CashFlowEntry {
  id: string
  date: string
  description: string
  type: 'INCOME' | 'EXPENSE'
  amount: number
}

export default function CashFlowPage() {
  const [entries, setEntries] = useState<CashFlowEntry[]>([])
  const [showAdd, setShowAdd] = useState(false)
  const [description, setDescription] = useState('')
  const [amount, setAmount] = useState('')
  const [type, setType] = useState<'INCOME' | 'EXPENSE'>('INCOME')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(false)
    setEntries([
      { id: '1', date: new Date().toISOString().split('T')[0], description: 'Opening Balance', type: 'INCOME', amount: 0 },
    ])
  }, [])

  const handleAdd = () => {
    if (!description || !amount) return
    const newEntry: CashFlowEntry = {
      id: Date.now().toString(),
      date: new Date().toISOString().split('T')[0],
      description,
      type,
      amount: parseFloat(amount),
    }
    setEntries([newEntry, ...entries])
    setDescription(''); setAmount(''); setShowAdd(false)
  }

  const handleDelete = (id: string) => setEntries(entries.filter(e => e.id !== id))

  const totalIncome = entries.filter(e => e.type === 'INCOME').reduce((s, e) => s + e.amount, 0)
  const totalExpenses = entries.filter(e => e.type === 'EXPENSE').reduce((s, e) => s + e.amount, 0)
  const netCash = totalIncome - totalExpenses

  const formatKES = (amount: number) => 'KSh ' + amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })

  const handleExport = () => {
    const csv = 'Date,Description,Type,Amount\n' + entries.map(e => `${e.date},${e.description},${e.type},${e.amount}`).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'cash-flow.csv'
    a.click()
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
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold">Cash Flow</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExport} className="gap-2"><Download className="w-4 h-4" /> Export</Button>
            <Button onClick={() => setShowAdd(!showAdd)} className="gap-2 bg-indigo-600"><Plus className="w-4 h-4" /> Add Entry</Button>
          </div>
        </div>

        {showAdd && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <h3 className="font-bold mb-4">Add Cash Flow Entry</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div><label className="block text-sm font-medium mb-2">Description</label>
                <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" />
              </div>
              <div><label className="block text-sm font-medium mb-2">Amount (KSh)</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" min="0" />
              </div>
              <div><label className="block text-sm font-medium mb-2">Type</label>
                <select value={type} onChange={(e) => setType(e.target.value as any)} className="w-full px-4 py-2.5 rounded-xl border">
                  <option value="INCOME">Income (Money In)</option>
                  <option value="EXPENSE">Expense (Money Out)</option>
                </select>
              </div>
            </div>
            <Button onClick={handleAdd} className="gap-2">Add Entry</Button>
          </div>
        )}

        {/* Summary */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
            <TrendingUp className="w-6 h-6 text-green-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-green-600">{formatKES(totalIncome)}</p>
            <p className="text-xs text-muted-foreground">Total Income</p>
          </div>
          <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
            <TrendingDown className="w-6 h-6 text-red-500 mx-auto mb-2" />
            <p className="text-xl font-bold text-red-600">{formatKES(totalExpenses)}</p>
            <p className="text-xs text-muted-foreground">Total Expenses</p>
          </div>
          <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
            <DollarSign className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
            <p className={`text-xl font-bold ${netCash >= 0 ? 'text-green-600' : 'text-red-600'}`}>{formatKES(netCash)}</p>
            <p className="text-xs text-muted-foreground">Net Cash Flow</p>
          </div>
        </div>

        {/* Entries */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
          {entries.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between p-4 border-b hover:bg-neutral-50 dark:hover:bg-neutral-800">
              <div>
                <p className="font-medium text-sm">{entry.description}</p>
                <p className="text-xs text-muted-foreground">{entry.date} • {entry.type}</p>
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-bold ${entry.type === 'INCOME' ? 'text-green-600' : 'text-red-600'}`}>
                  {entry.type === 'INCOME' ? '+' : '-'}{formatKES(entry.amount)}
                </span>
                <button onClick={() => handleDelete(entry.id)} className="text-red-500 text-xs">Remove</button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}