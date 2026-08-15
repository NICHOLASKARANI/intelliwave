'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, Plus, Trash2, AlertCircle, CheckCircle, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Account {
  id: string
  code: string
  name: string
  type: string
}

interface JournalLine {
  accountId: string
  description: string
  debit: number
  credit: number
}

export default function CreateJournalEntryPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [reference, setReference] = useState('')
  const [description, setDescription] = useState('')
  const [lines, setLines] = useState<JournalLine[]>([
    { accountId: '', description: '', debit: 0, credit: 0 },
    { accountId: '', description: '', debit: 0, credit: 0 },
  ])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [quickSetupLoading, setQuickSetupLoading] = useState(false)
  const router = useRouter()

  useEffect(() => {
    fetchAccounts()
  }, [])

  async function fetchAccounts() {
    try {
      const res = await fetch('/api/wavecore/gl/chart-of-accounts')
      if (res.ok) {
        const data = await res.json()
        setAccounts(data.accounts || [])
      }
    } catch (err) {
      console.error('Failed to load accounts:', err)
    }
  }

  const handleQuickSetup = async () => {
    setQuickSetupLoading(true)
    try {
      const res = await fetch('/api/wavecore/gl/chart-of-accounts/quick-setup', { method: 'POST' })
      const data = await res.json()
      if (res.ok) {
        await fetchAccounts()
        alert('Created ' + data.created + ' accounts! Now you can select them.')
      } else {
        alert(data.error || 'Failed to setup accounts')
      }
    } catch {
      alert('Network error')
    } finally {
      setQuickSetupLoading(false)
    }
  }

  const addLine = () => {
    setLines([...lines, { accountId: '', description: '', debit: 0, credit: 0 }])
  }

  const removeLine = (index: number) => {
    if (lines.length <= 2) return
    setLines(lines.filter((_, i) => i !== index))
  }

  const updateLine = (index: number, field: keyof JournalLine, value: any) => {
    const newLines = [...lines]
    newLines[index] = { ...newLines[index], [field]: value }
    if (field === 'debit' && value > 0) newLines[index].credit = 0
    if (field === 'credit' && value > 0) newLines[index].debit = 0
    setLines(newLines)
  }

  const totalDebit = lines.reduce((sum, l) => sum + (Number(l.debit) || 0), 0)
  const totalCredit = lines.reduce((sum, l) => sum + (Number(l.credit) || 0), 0)
  const isBalanced = Math.abs(totalDebit - totalCredit) < 0.01

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!description) { setError('Description is required'); setLoading(false); return }
    if (lines.some(l => !l.accountId)) { setError('All lines need an account selected'); setLoading(false); return }
    if (lines.some(l => l.debit === 0 && l.credit === 0)) { setError('Each line needs a debit or credit'); setLoading(false); return }
    if (!isBalanced) { setError('Debits must equal credits'); setLoading(false); return }

    try {
      const res = await fetch('/api/wavecore/gl/journal-entries', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          date, reference: reference || null, description,
          items: lines.map(l => ({ accountId: l.accountId, description: l.description || null, debit: Number(l.debit) || 0, credit: Number(l.credit) || 0 })),
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || 'Failed to post'); return }
      setSuccess('Journal entry posted!')
      setTimeout(() => router.push('/wavecore-erp/finance/journal'), 1500)
    } catch { setError('Network error') } finally { setLoading(false) }
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
            <span className="text-sm">New Journal Entry</span>
          </div>
          <Link href="/wavecore-erp/finance/journal" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Create Journal Entry</h1>

        {error && <div className="p-4 mb-6 rounded-xl bg-red-50 text-red-600 text-sm flex items-center gap-2"><AlertCircle className="w-4 h-4" /> {error}</div>}
        {success && <div className="p-4 mb-6 rounded-xl bg-green-50 text-green-600 text-sm flex items-center gap-2"><CheckCircle className="w-4 h-4" /> {success}</div>}

        {accounts.length === 0 && (
          <div className="p-4 mb-6 rounded-xl bg-yellow-50 border border-yellow-200">
            <p className="text-sm font-medium text-yellow-700 mb-2">No Chart of Accounts found</p>
            <p className="text-xs text-yellow-600 mb-3">You need accounts before creating journal entries</p>
            <button type="button" onClick={handleQuickSetup} disabled={quickSetupLoading}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg font-medium">
              {quickSetupLoading ? 'Setting up...' : '? Quick Setup (Create 18 Accounts)'}
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" required />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Reference</label>
              <input type="text" value={reference} onChange={(e) => setReference(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" placeholder="Optional" />
            </div>
            <div className="col-span-2">
              <label className="block text-sm font-medium mb-2">Description</label>
              <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" required />
            </div>
          </div>

          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold">Line Items</h3>
              <Button type="button" variant="outline" size="sm" onClick={addLine}><Plus className="w-4 h-4 mr-1" /> Add Line</Button>
            </div>

            {lines.map((line, index) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-[1fr_1fr_120px_120px_40px] gap-3 mb-3">
                <select value={line.accountId} onChange={(e) => updateLine(index, 'accountId', e.target.value)} className="px-3 py-2 rounded-lg border text-sm" required>
                  <option value="">Select account...</option>
                  {accounts.map(acc => <option key={acc.id} value={acc.id}>{acc.code} - {acc.name}</option>)}
                </select>
                <input type="text" value={line.description} onChange={(e) => updateLine(index, 'description', e.target.value)} className="px-3 py-2 rounded-lg border text-sm" placeholder="Optional" />
                <input type="number" value={line.debit || ''} onChange={(e) => updateLine(index, 'debit', parseFloat(e.target.value) || 0)} className="px-3 py-2 rounded-lg border text-sm text-right" placeholder="0.00" min="0" step="0.01" />
                <input type="number" value={line.credit || ''} onChange={(e) => updateLine(index, 'credit', parseFloat(e.target.value) || 0)} className="px-3 py-2 rounded-lg border text-sm text-right" placeholder="0.00" min="0" step="0.01" />
                <button type="button" onClick={() => removeLine(index)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}

            <div className="border-t pt-4 mt-4 space-y-2">
              <div className="flex justify-between text-sm"><span>Total Debits</span><span>{totalDebit.toFixed(2)}</span></div>
              <div className="flex justify-between text-sm"><span>Total Credits</span><span>{totalCredit.toFixed(2)}</span></div>
              <div className={`flex justify-between font-bold ${isBalanced ? 'text-green-600' : 'text-red-600'}`}>
                <span>{isBalanced ? '? Balanced' : '? Not Balanced'}</span>
                <span>{(totalDebit - totalCredit).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Link href="/wavecore-erp/finance/journal"><Button variant="outline" type="button">Cancel</Button></Link>
            <Button type="submit" disabled={loading || !isBalanced} className="gap-2"><Save className="w-4 h-4" />{loading ? 'Posting...' : 'Post Journal Entry'}</Button>
          </div>
        </form>
      </main>
    </div>
  )
}