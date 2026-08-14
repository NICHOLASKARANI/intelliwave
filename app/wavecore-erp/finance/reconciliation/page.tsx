'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { LayoutDashboard, Plus, ArrowLeft, CheckCircle, AlertCircle, Building2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface BankAccount {
  id: string
  name: string
  bankName: string
  accountNumber: string
  currentBalance: number
}

interface BankTransaction {
  id: string
  date: string
  description: string
  reference: string
  amount: number
  type: string
  matched: boolean
  bank_name: string
}

export default function ReconciliationPage() {
  const [accounts, setAccounts] = useState<BankAccount[]>([])
  const [selectedAccount, setSelectedAccount] = useState('')
  const [transactions, setTransactions] = useState<BankTransaction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const res = await fetch('/api/wavecore/bank-accounts')
        if (res.ok) {
          const data = await res.json()
          setAccounts(data.bankAccounts || [])
        }
      } catch {} finally {
        setLoading(false)
      }
    }
    fetchAccounts()
  }, [])

  useEffect(() => {
    if (!selectedAccount) return
    async function fetchTransactions() {
      setLoading(true)
      try {
        const res = await fetch(`/api/wavecore/bank-transactions?bankAccountId=${selectedAccount}`)
        if (res.ok) {
          const data = await res.json()
          setTransactions(data.transactions || [])
        }
      } catch {} finally {
        setLoading(false)
      }
    }
    fetchTransactions()
  }, [selectedAccount])

  const handleMatch = async (transactionId: string) => {
    try {
      const res = await fetch(`/api/wavecore/bank-transactions/${transactionId}/match`, {
        method: 'POST',
      })
      if (res.ok) {
        setTransactions(prev => prev.map(t => 
          t.id === transactionId ? { ...t, matched: true } : t
        ))
      }
    } catch (err) {
      console.error('Match failed:', err)
    }
  }

  const matchedCount = transactions.filter(t => t.matched).length
  const unmatchedCount = transactions.filter(t => !t.matched).length

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-4">
            <Link href="/wavecore-erp" className="flex items-center gap-3">
              <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
              <span className="font-bold">WaveCore</span>
            </Link>
            <span className="text-sm">Bank Reconciliation</span>
          </div>
          <Link href="/wavecore-erp/finance" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Finance
          </Link>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Bank Reconciliation</h1>

        {/* Select Bank Account */}
        <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
          <label className="block text-sm font-medium mb-2">Select Bank Account</label>
          <select 
            value={selectedAccount} 
            onChange={(e) => setSelectedAccount(e.target.value)}
            className="w-full md:w-80 px-4 py-2.5 rounded-xl border bg-background"
          >
            <option value="">Select account...</option>
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {acc.bankName} - {acc.name} ({acc.accountNumber})
              </option>
            ))}
          </select>

          {accounts.length === 0 && !loading && (
            <div className="mt-4 p-4 rounded-xl bg-yellow-50 border border-yellow-200 text-yellow-700 text-sm">
              No bank accounts yet. Add a bank account first.
              <Link href="/wavecore-erp/finance/reconciliation/add-account" className="block mt-2 text-indigo-600 font-medium">
                + Add Bank Account
              </Link>
            </div>
          )}
        </div>

        {/* Stats */}
        {selectedAccount && (
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
              <p className="text-2xl font-bold">{transactions.length}</p>
              <p className="text-xs text-muted-foreground">Total Transactions</p>
            </div>
            <div className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
              <p className="text-2xl font-bold text-green-600">{matchedCount}</p>
              <p className="text-xs text-muted-foreground">Matched</p>
            </div>
            <div className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 text-center">
              <p className="text-2xl font-bold text-orange-600">{unmatchedCount}</p>
              <p className="text-xs text-muted-foreground">Unmatched</p>
            </div>
          </div>
        )}

        {/* Transactions */}
        {selectedAccount && !loading && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            {transactions.length > 0 ? (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-neutral-50 dark:bg-neutral-800">
                    <th className="text-left p-4">Date</th>
                    <th className="text-left p-4">Description</th>
                    <th className="text-left p-4">Reference</th>
                    <th className="text-right p-4">Amount</th>
                    <th className="text-center p-4">Status</th>
                    <th className="text-center p-4">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {transactions.map(txn => (
                    <tr key={txn.id} className="border-b hover:bg-neutral-50 dark:hover:bg-neutral-800">
                      <td className="p-4">{new Date(txn.date).toLocaleDateString()}</td>
                      <td className="p-4">{txn.description}</td>
                      <td className="p-4 text-muted-foreground">{txn.reference || '-'}</td>
                      <td className={`p-4 text-right font-medium ${txn.type === 'CREDIT' ? 'text-green-600' : 'text-red-600'}`}>
                        {txn.type === 'CREDIT' ? '+' : '-'}KSh {txn.amount.toLocaleString()}
                      </td>
                      <td className="p-4 text-center">
                        {txn.matched ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-50 text-green-600 rounded-full">
                            <CheckCircle className="w-3 h-3" /> Matched
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-orange-50 text-orange-600 rounded-full">
                            <AlertCircle className="w-3 h-3" /> Unmatched
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        {!txn.matched && (
                          <Button size="sm" variant="outline" onClick={() => handleMatch(txn.id)}>
                            Match
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div className="text-center py-16">
                <Building2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                <p className="font-medium">No transactions</p>
                <p className="text-sm text-muted-foreground mt-1">Import bank transactions to start reconciling</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}