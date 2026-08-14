'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { LayoutDashboard, Plus, FileText, Download, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Account {
  id: string
  code: string
  name: string
  type: string
  description: string
  isActive: boolean
}

export default function ChartOfAccountsPage() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAccounts() {
      try {
        const res = await fetch('/api/wavecore/gl/chart-of-accounts')
        if (res.ok) {
          const data = await res.json()
          setAccounts(data.accounts || [])
        }
      } catch (err) {
        console.error('Failed to load accounts:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchAccounts()
  }, [])

  const handleExport = async () => {
    try {
      const res = await fetch('/api/wavecore/gl/chart-of-accounts/export')
      if (res.ok) {
        const blob = await res.blob()
        const url = window.URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = 'chart-of-accounts.csv'
        a.click()
        window.URL.revokeObjectURL(url)
      }
    } catch (err) {
      console.error('Export failed:', err)
    }
  }

  const typeColors: Record<string, string> = {
    ASSET: 'bg-blue-50 text-blue-600',
    LIABILITY: 'bg-orange-50 text-orange-600',
    EQUITY: 'bg-purple-50 text-purple-600',
    INCOME: 'bg-green-50 text-green-600',
    EXPENSE: 'bg-red-50 text-red-600',
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-4">
            <Link href="/wavecore-erp" className="flex items-center gap-3">
              <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
              <span className="font-bold">WaveCore</span>
            </Link>
            <span className="text-sm">Chart of Accounts</span>
          </div>
          <Link href="/wavecore-erp/finance" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> Finance
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Chart of Accounts</h1>
            <p className="text-muted-foreground mt-1">Manage your general ledger accounts</p>
          </div>
          <div className="flex gap-2">
            {accounts.length > 0 && (
              <Button variant="outline" onClick={handleExport} className="gap-2">
                <Download className="w-4 h-4" /> Export
              </Button>
            )}
            <Link href="/wavecore-erp/finance/gl/create">
              <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4" /> New Account
              </Button>
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : accounts.length > 0 ? (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-neutral-50 dark:bg-neutral-800">
                  <th className="text-left p-4">Code</th>
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Type</th>
                  <th className="text-left p-4">Description</th>
                </tr>
              </thead>
              <tbody>
                {accounts.map((account) => (
                  <tr key={account.id} className="border-b hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    <td className="p-4 font-mono font-medium">{account.code}</td>
                    <td className="p-4 font-medium">{account.name}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${typeColors[account.type] || 'bg-gray-50 text-gray-600'}`}>
                        {account.type}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground">{account.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium text-lg">Your Chart of Accounts is empty</p>
            <p className="text-sm text-muted-foreground mt-1 mb-6">
              Create accounts to start recording financial transactions
            </p>
            <Link href="/wavecore-erp/finance/gl/create">
              <Button className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                <Plus className="w-4 h-4" /> Create Your First Account
              </Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}