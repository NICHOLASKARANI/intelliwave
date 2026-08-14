'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { LayoutDashboard, DollarSign, Users, FileText, Plus, Search, Download, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Receivable {
  id: string
  number: string
  customer_name: string
  total: number
  balance_due: number
  status: string
  dueDate: string
}

export default function ARPage() {
  const [receivables, setReceivables] = useState<Receivable[]>([])
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    async function fetchAR() {
      try {
        const res = await fetch('/api/wavecore/gl/accounts-receivable')
        if (res.ok) {
          const data = await res.json()
          setReceivables(data.receivables || [])
          setTotal((data.receivables || []).reduce((sum: number, r: Receivable) => sum + (r.balance_due || 0), 0))
        }
      } catch {} finally {
        setLoading(false)
      }
    }
    fetchAR()
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
            <span className="text-sm">Accounts Receivable</span>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Accounts Receivable</h1>
            <p className="text-muted-foreground mt-1">Money owed to you by customers</p>
          </div>
          <Link href="/wavecore-erp/finance/invoices">
            <Button className="gap-2"><Plus className="w-4 h-4" /> New Invoice</Button>
          </Link>
        </div>

        {/* Total */}
        <div className="p-5 rounded-2xl border bg-white dark:bg-neutral-900 mb-8">
          <p className="text-sm text-muted-foreground">Total Outstanding</p>
          <p className="text-3xl font-bold">{formatKES(total)}</p>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : receivables.length > 0 ? (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-neutral-50 dark:bg-neutral-800">
                  <th className="text-left p-4">Invoice #</th>
                  <th className="text-left p-4">Customer</th>
                  <th className="text-right p-4">Total</th>
                  <th className="text-right p-4">Balance Due</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {receivables.map((r) => (
                  <tr key={r.id} className="border-b hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    <td className="p-4 font-medium">{r.number}</td>
                    <td className="p-4">{r.customer_name}</td>
                    <td className="p-4 text-right">{formatKES(r.total)}</td>
                    <td className="p-4 text-right font-bold text-orange-500">{formatKES(r.balance_due)}</td>
                    <td className="p-4"><span className="px-2 py-1 text-xs rounded-full bg-orange-50 text-orange-600">{r.status}</span></td>
                    <td className="p-4">{new Date(r.dueDate).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No receivables yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create invoices to see money owed to you</p>
          </div>
        )}
      </main>
    </div>
  )
}