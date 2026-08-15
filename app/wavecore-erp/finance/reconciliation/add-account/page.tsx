'use client'

import { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, AlertCircle, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function AddBankAccountPage() {
  const [name, setName] = useState('')
  const [accountNumber, setAccountNumber] = useState('')
  const [bankName, setBankName] = useState('')
  const [currency, setCurrency] = useState('KES')
  const [openingBalance, setOpeningBalance] = useState('0')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!name || !accountNumber || !bankName) {
      setError('All fields are required')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/wavecore/bank-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          accountNumber,
          bankName,
          currency,
          openingBalance: parseFloat(openingBalance) || 0,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'Failed to add bank account')
        return
      }

      router.push('/wavecore-erp/finance/reconciliation')
      router.refresh()
    } catch {
      setError('Network error')
    } finally {
      setLoading(false)
    }
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
            <span className="text-sm">Add Bank Account</span>
          </div>
          <Link href="/wavecore-erp/finance/reconciliation" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Add Bank Account</h1>

        {error && (
          <div className="p-4 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <div>
            <label className="block text-sm font-medium mb-2">Account Name</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border bg-background" placeholder="e.g., Main Bank Account" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Bank Name</label>
            <select value={bankName} onChange={(e) => setBankName(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border bg-background" required>
              <option value="">Select bank...</option>
              <option value="KCB">KCB Bank</option>
              <option value="Equity">Equity Bank</option>
              <option value="Cooperative">Cooperative Bank</option>
              <option value="NCBA">NCBA Bank</option>
              <option value="ABSA">ABSA Bank</option>
              <option value="Standard Chartered">Standard Chartered</option>
              <option value="Stanbic">Stanbic Bank</option>
              <option value="DTB">Diamond Trust Bank</option>
              <option value="M-Pesa">M-Pesa</option>
              <option value="Other">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Account Number</label>
            <input type="text" value={accountNumber} onChange={(e) => setAccountNumber(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border bg-background" placeholder="e.g., 1234567890" required />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Currency</label>
            <select value={currency} onChange={(e) => setCurrency(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border bg-background">
              <option value="KES">KES - Kenyan Shilling</option>
              <option value="USD">USD - US Dollar</option>
              <option value="EUR">EUR - Euro</option>
              <option value="GBP">GBP - British Pound</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Opening Balance</label>
            <input type="number" value={openingBalance} onChange={(e) => setOpeningBalance(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border bg-background" placeholder="0.00" min="0" step="0.01" />
          </div>

          <Button type="submit" disabled={loading} className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700">
            <Save className="w-4 h-4" /> {loading ? 'Adding...' : 'Add Bank Account'}
          </Button>
        </form>
      </main>
    </div>
  )
}