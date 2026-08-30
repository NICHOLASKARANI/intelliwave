'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, FileText, Printer, Trash2, Loader2, Search, Banknote } from 'lucide-react'

interface Reconciliation {
  id: string
  name: string
  accountNumber: string
  bankName: string
  statementBalance: number
  bookBalance: number
  difference: number
  status: string
  createdAt: string
}

export default function ReconciliationPage() {
  const [reconciliations, setReconciliations] = useState<Reconciliation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ bankAccountId: '', statementBalance: '', bookBalance: '' })

  useEffect(() => {
    fetchReconciliations()
  }, [])

  const fetchReconciliations = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch('/api/wavecore/bank-reconciliation')
      const data = await res.json()
      setReconciliations(data.reconciliations || [])
    } catch (err) {
      setError('Failed to load')
    } finally {
      setLoading(false)
    }
  }

  const createReconciliation = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await fetch('/api/wavecore/bank-reconciliation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setFormData({ bankAccountId: '', statementBalance: '', bookBalance: '' })
        setShowForm(false)
        fetchReconciliations()
      } else {
        const data = await res.json()
        setError(data.error || 'Failed')
      }
    } catch (err) {
      setError('Network error')
    }
  }

  const deleteReconciliation = async (id: string) => {
    if (!confirm('Delete this reconciliation?')) return
    try {
      await fetch(`/api/wavecore/bank-reconciliation?id=${id}`, { method: 'DELETE' })
      fetchReconciliations()
    } catch (err) {
      setError('Delete failed')
    }
  }

  const downloadPdf = (id: string) => {
    window.open(`/api/wavecore/bank-reconciliation/${id}/pdf`, '_blank')
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp/finance" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Bank Reconciliation</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-3 sm:p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Banknote className="w-6 h-6 text-purple-500" /> Bank Reconciliation ({reconciliations.length})
          </h1>
          <button onClick={() => setShowForm(!showForm)}
            className="px-4 py-2.5 rounded-xl bg-purple-600 text-white font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Reconciliation
          </button>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600">{error}</div>}

        {showForm && (
          <form onSubmit={createReconciliation} className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Bank Account ID" value={formData.bankAccountId}
                onChange={(e) => setFormData({...formData, bankAccountId: e.target.value})}
                className="px-4 py-2 rounded-xl border" />
              <input type="number" placeholder="Statement Balance" value={formData.statementBalance}
                onChange={(e) => setFormData({...formData, statementBalance: e.target.value})}
                className="px-4 py-2 rounded-xl border" />
              <input type="number" placeholder="Book Balance" value={formData.bookBalance}
                onChange={(e) => setFormData({...formData, bookBalance: e.target.value})}
                className="px-4 py-2 rounded-xl border" />
            </div>
            <button type="submit" className="mt-4 px-6 py-2 rounded-xl bg-purple-600 text-white font-bold">Create</button>
          </form>
        )}

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : reconciliations.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Banknote className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No reconciliations yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {reconciliations.map(rec => (
              <div key={rec.id} className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 flex justify-between items-center">
                <div>
                  <p className="font-bold">{rec.bankName || 'Bank Account'} - {rec.name || rec.accountNumber || 'N/A'}</p>
                  <p className="text-sm text-muted-foreground">
                    Statement: KSh {Number(rec.statementBalance || 0).toLocaleString()} | Book: KSh {Number(rec.bookBalance || 0).toLocaleString()}
                  </p>
                  <p className={`text-sm font-bold ${rec.status === 'MATCHED' ? 'text-green-600' : 'text-red-600'}`}>
                    Difference: KSh {Number(rec.difference || 0).toLocaleString()} | {rec.status}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => downloadPdf(rec.id)} className="p-2 rounded-lg bg-blue-50 text-blue-600">
                    <Printer className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteReconciliation(rec.id)} className="p-2 rounded-lg bg-red-50 text-red-600">
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