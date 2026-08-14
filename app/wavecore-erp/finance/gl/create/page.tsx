'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function CreateAccountPage() {
  const [code, setCode] = useState('')
  const [name, setName] = useState('')
  const [type, setType] = useState('')
  const [description, setDescription] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const accountTypes = [
    { value: 'ASSET', label: 'Asset' },
    { value: 'LIABILITY', label: 'Liability' },
    { value: 'EQUITY', label: 'Equity' },
    { value: 'INCOME', label: 'Income (Revenue)' },
    { value: 'EXPENSE', label: 'Expense' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/wavecore/gl/chart-of-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code, name, type, description: description || null }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Failed to create account')
        return
      }
      router.push('/wavecore-erp/finance/gl')
      router.refresh()
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
  }

  const quickAccounts = [
    { code: '1000', name: 'Cash', type: 'ASSET' },
    { code: '1100', name: 'Bank', type: 'ASSET' },
    { code: '1300', name: 'Accounts Receivable', type: 'ASSET' },
    { code: '2000', name: 'Accounts Payable', type: 'LIABILITY' },
    { code: '3000', name: 'Equity', type: 'EQUITY' },
    { code: '4000', name: 'Sales Revenue', type: 'INCOME' },
    { code: '5000', name: 'Rent Expense', type: 'EXPENSE' },
    { code: '6000', name: 'Salaries', type: 'EXPENSE' },
  ]

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-4">
            <Link href="/wavecore-erp" className="flex items-center gap-3">
              <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
              <span className="font-bold">WaveCore</span>
            </Link>
            <span className="text-sm">New Account</span>
          </div>
          <Link href="/wavecore-erp/finance/gl" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Create Account</h1>

        {error && (
          <div className="p-4 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <div>
            <label className="block text-sm font-medium mb-2">Account Code</label>
            <input type="text" value={code} onChange={(e) => setCode(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border bg-background"
              placeholder="e.g., 1000" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Account Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border bg-background"
              placeholder="e.g., Cash" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Account Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border bg-background" required>
              <option value="">Select type...</option>
              {accountTypes.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={3}
              className="w-full px-4 py-2.5 rounded-xl border bg-background resize-none"
              placeholder="Optional description" />
          </div>

          <Button type="submit" disabled={loading} className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Save className="w-4 h-4" />
            {loading ? 'Creating...' : 'Create Account'}
          </Button>
        </form>

        <div className="mt-6 p-4 rounded-xl bg-neutral-100 dark:bg-neutral-800">
          <p className="text-xs text-muted-foreground mb-3">Quick add common accounts:</p>
          <div className="flex flex-wrap gap-2">
            {quickAccounts.map(acc => (
              <button key={acc.code} type="button"
                onClick={() => { setCode(acc.code); setName(acc.name); setType(acc.type); }}
                className="px-3 py-1.5 text-xs rounded-full border border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                {acc.code} - {acc.name}
              </button>
            ))}
          </div>
        </div>
      </main>
    </div>
  )
}