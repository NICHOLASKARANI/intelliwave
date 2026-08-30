'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, DollarSign, Download, Printer, Trash2, Loader2, Search } from 'lucide-react'

interface Payment {
  id: string
  receiptNumber: string
  amount: number
  method: string
  invoiceNumber: string
  customerName: string
  createdAt: string
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    fetchPayments()
  }, [])

  const fetchPayments = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/finance/payments')
      const data = await res.json()
      setPayments(data.payments || [])
    } catch (err) {
      setError('Failed to load payments')
    } finally {
      setLoading(false)
    }
  }

  const deletePayment = async (id: string) => {
    if (!confirm('Delete this payment?')) return
    try {
      const res = await fetch(`/api/wavecore/finance/payments?id=${id}`, { method: 'DELETE' })
      if (res.ok) fetchPayments()
    } catch (err) {
      setError('Delete failed')
    }
  }

  const downloadPdf = (id: string) => {
    window.open(`/api/wavecore/finance/payments/${id}/pdf`, '_blank')
  }

  const filtered = payments.filter(p => 
    (p.customerName || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.invoiceNumber || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp/finance" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Payments</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <DollarSign className="w-6 h-6 text-green-500" /> Payments ({payments.length})
          </h1>
          <Link href="/wavecore-erp/finance/payments/record"
            className="px-4 py-2.5 rounded-xl bg-green-600 text-white font-bold flex items-center gap-2 hover:bg-green-700">
            <Plus className="w-4 h-4" /> Record Payment
          </Link>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600">{error}</div>}

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border w-full" placeholder="Search payments..." />
        </div>

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <DollarSign className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No payments yet</p>
            <Link href="/wavecore-erp/finance/payments/record" className="text-blue-600 mt-2 inline-block">Record your first payment</Link>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800">
                <tr>
                  <th className="text-left p-4 text-sm">Receipt #</th>
                  <th className="text-left p-4 text-sm">Customer</th>
                  <th className="text-left p-4 text-sm">Invoice</th>
                  <th className="text-left p-4 text-sm">Amount</th>
                  <th className="text-left p-4 text-sm">Method</th>
                  <th className="text-left p-4 text-sm">Date</th>
                  <th className="text-left p-4 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(payment => (
                  <tr key={payment.id} className="border-t hover:bg-neutral-50">
                    <td className="p-4 font-mono text-sm">{payment.receiptNumber || payment.id.substring(0, 8)}</td>
                    <td className="p-4">{payment.customerName || 'N/A'}</td>
                    <td className="p-4 text-sm">{payment.invoiceNumber || 'N/A'}</td>
                    <td className="p-4 font-bold text-green-600">KSh {Number(payment.amount || 0).toLocaleString()}</td>
                    <td className="p-4"><span className="px-2 py-1 rounded-full text-xs bg-blue-50 text-blue-600">{payment.method}</span></td>
                    <td className="p-4 text-sm">{new Date(payment.createdAt).toLocaleDateString()}</td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <button onClick={() => downloadPdf(payment.id)} title="Download PDF"
                          className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">
                          <Printer className="w-4 h-4" />
                        </button>
                        <button onClick={() => deletePayment(payment.id)} title="Delete"
                          className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}