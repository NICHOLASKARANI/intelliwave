'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Save, DollarSign, AlertCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Invoice {
  id: string
  number: string
  customer_name: string
  total: number
  status: string
}

export default function RecordPaymentPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [invoiceId, setInvoiceId] = useState('')
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(new Date().toISOString().split('T')[0])
  const [method, setMethod] = useState('MPESA')
  const [reference, setReference] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const res = await fetch('/api/wavecore/finance/invoices')
        if (res.ok) {
          const data = await res.json()
          setInvoices(data.invoices?.filter((i: Invoice) => i.status !== 'PAID') || [])
        }
      } catch {}
    }
    fetchInvoices()
  }, [])

  const selectedInvoice = invoices.find(i => i.id === invoiceId)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    if (!invoiceId || !amount) {
      setError('Please select an invoice and enter an amount')
      setLoading(false)
      return
    }

    try {
      const res = await fetch('/api/wavecore/finance/payments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoiceId, amount: parseFloat(amount), date, method, reference: reference || null }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Payment failed')
        return
      }
      router.push('/wavecore-erp/finance/payments')
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
            <span className="text-sm">Record Payment</span>
          </div>
          <Link href="/wavecore-erp/finance/payments" className="flex items-center gap-2 text-sm">
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
        </div>
      </header>

      <main className="max-w-lg mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Record Payment</h1>

        {error && (
          <div className="p-4 mb-6 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm flex items-center gap-2">
            <AlertCircle className="w-4 h-4" /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 bg-white dark:bg-neutral-900 rounded-2xl border p-6">
          <div>
            <label className="block text-sm font-medium mb-2">Invoice</label>
            <select value={invoiceId} onChange={(e) => setInvoiceId(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border bg-background">
              <option value="">Select invoice...</option>
              {invoices.map(inv => (
                <option key={inv.id} value={inv.id}>
                  {inv.number} - {inv.customer_name} (KSh {inv.total.toLocaleString()})
                </option>
              ))}
            </select>
            {selectedInvoice && (
              <p className="text-xs text-muted-foreground mt-1">
                Invoice total: KSh {selectedInvoice.total.toLocaleString()}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Amount</label>
            <div className="relative">
              <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)}
                min="0" step="0.01"
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border bg-background" placeholder="0.00" />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border bg-background" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Method</label>
            <select value={method} onChange={(e) => setMethod(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border bg-background">
              <option value="MPESA">M-Pesa</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="CASH">Cash</option>
              <option value="CHEQUE">Cheque</option>
              <option value="CREDIT_CARD">Credit Card</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Reference</label>
            <input type="text" value={reference} onChange={(e) => setReference(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl border bg-background" placeholder="Optional reference" />
          </div>

          <Button type="submit" disabled={loading} className="w-full gap-2">
            <Save className="w-4 h-4" /> {loading ? 'Recording...' : 'Record Payment'}
          </Button>
        </form>
      </main>
    </div>
  )
}