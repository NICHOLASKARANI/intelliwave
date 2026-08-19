'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { LayoutDashboard, Plus, FileText, Search, Download } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Invoice {
  id: string
  number: string
  customer_name: string
  total: number
  status: string
  dueDate: string
  createdAt: string
}

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInvoices() {
      try {
        const res = await fetch('/api/wavecore/finance/invoices')
        if (res.ok) {
          const data = await res.json()
          setInvoices(data.invoices || [])
        }
      } catch {} finally {
        setLoading(false)
      }
    }
    fetchInvoices()
  }, [])

  const formatKES = (amount: number) => `KSh ${amount.toLocaleString('en-KE', { minimumFractionDigits: 2 })}`


  const handleDownloadPDF = () => {
    const content = [
      'WaveCore ERP - Invoices',
      '='.repeat(50),
      'Generated: ' + new Date().toLocaleString(),
      'IntelliWavve - Enterprise ERP',
      '='.repeat(50),
      '',
      ...invoices.map((inv: any, i: number) => 
        'Invoice #' + (i + 1) + '\n' +
        '  Number: ' + (inv.number || 'N/A') + '\n' +
        '  Date: ' + (inv.date || 'N/A') + '\n' +
        '  Status: ' + (inv.status || 'N/A') + '\n' +
        '  Subtotal: ' + (inv.subtotal || '0') + '\n' +
        '  Tax: ' + (inv.taxAmount || '0') + '\n' +
        '  Total: ' + ((inv.subtotal || 0) + (inv.taxAmount || 0)) + '\n' +
        '-'.repeat(40)
      ),
      '',
      '© 2026 IntelliWavve - All Rights Reserved'
    ].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'invoices.pdf'
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 lg:px-6 h-16">
          <div className="flex items-center gap-4">
            <Link href="/wavecore-erp" className="flex items-center gap-3">
              <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
              <span className="font-bold text-lg">WaveCore</span>
            </Link>
            <span className="text-sm">Invoices</span>
          </div>
          <Link href="/wavecore-erp/finance/invoices/create">
            <Button className="gap-2"><Plus className="w-4 h-4" /> New Invoice</Button>
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <h1 className="text-3xl font-bold mb-6">Invoices</h1>
          <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"><Download className="w-4 h-4" /> Download PDF</button>

        {loading ? (
          <div className="text-center py-12">
            <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : invoices.length > 0 ? (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-neutral-50 dark:bg-neutral-800">
                  <th className="text-left p-4">Number</th>
                  <th className="text-left p-4">Customer</th>
                  <th className="text-right p-4">Total</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-left p-4">Due Date</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id} className="border-b hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    <td className="p-4 font-medium">{inv.number}</td>
                    <td className="p-4">{inv.customer_name}</td>
                    <td className="p-4 text-right">{formatKES(inv.total)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        inv.status === 'PAID' ? 'bg-green-50 text-green-600' :
                        inv.status === 'DRAFT' ? 'bg-gray-50 text-gray-600' :
                        'bg-orange-50 text-orange-600'
                      }`}>{inv.status}</span>
                    </td>
                    <td className="p-4">{inv.dueDate ? new Date(inv.dueDate).toLocaleDateString() : '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No invoices yet</p>
            <p className="text-sm text-muted-foreground mt-1">Create your first invoice to start billing</p>
            <Link href="/wavecore-erp/finance/invoices/create">
              <Button className="mt-4 gap-2"><Plus className="w-4 h-4" /> Create Invoice</Button>
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}