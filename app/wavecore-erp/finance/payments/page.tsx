'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, DollarSign, CreditCard , Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Payment {
  id: string
  number: string
  invoice_number: string
  customer_name: string
  amount: number
  method: string
  date: string
}

export default function PaymentsPage() {
  const [payments, setPayments] = useState<Payment[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchPayments() {
      try {
        const res = await fetch('/api/wavecore/finance/payments')
        if (res.ok) {
          const data = await res.json()
          setPayments(data.payments || [])
        }
      } catch {} finally {
        setLoading(false)
      }
    }
    fetchPayments()
  }, [])

  const formatKES = (amount: number) => `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`


  const handleDownloadPDF = () => {
    const content = [
      'WaveCore ERP - Payments',
      '='.repeat(50),
      'Generated: ' + new Date().toLocaleString(),
      'IntelliWavve - Enterprise ERP',
      '='.repeat(50),
      '',
      ...payments.map((p: any, i: number) => 
        'Payment #' + (i + 1) + '\n' +
        '  Number: ' + (p.number || 'N/A') + '\n' +
        '  Date: ' + (p.date || 'N/A') + '\n' +
        '  Amount: ' + (p.amount || '0') + '\n' +
        '  Method: ' + (p.method || 'N/A') + '\n' +
        '-'.repeat(40)
      ),
      '',
      '© 2026 IntelliWavve - All Rights Reserved'
    ].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'payments.pdf'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-4">
            <Link href="/wavecore-erp" className="flex items-center gap-3">
              <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
              <span className="font-bold text-lg">WaveCore</span>
            </Link>
            <span className="text-sm">Payments</span>
          </div>
          <Link href="/wavecore-erp/finance/payments/record">
            <Button className="gap-2"><Plus className="w-4 h-4" /> Record Payment</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <h1 className="text-3xl font-bold mb-6">Payments</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"><Download className="w-4 h-4" /> Download PDF</button>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : payments.length > 0 ? (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-neutral-50 dark:bg-neutral-800">
                  <th className="text-left p-4">Payment #</th>
                  <th className="text-left p-4">Invoice</th>
                  <th className="text-left p-4">Customer</th>
                  <th className="text-right p-4">Amount</th>
                  <th className="text-left p-4">Method</th>
                  <th className="text-left p-4">Date</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((p) => (
                  <tr key={p.id} className="border-b hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    <td className="p-4 font-medium">{p.number}</td>
                    <td className="p-4">{p.invoice_number}</td>
                    <td className="p-4">{p.customer_name}</td>
                    <td className="p-4 text-right font-bold text-green-600">{formatKES(p.amount)}</td>
                    <td className="p-4"><span className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded-full">{p.method}</span></td>
                    <td className="p-4">{new Date(p.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No payments yet</p>
            <p className="text-sm text-muted-foreground mt-1">Record your first payment</p>
            <Link href="/wavecore-erp/finance/payments/record">
              <Button className="mt-4 gap-2"><Plus className="w-4 h-4" /> Record Payment</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}