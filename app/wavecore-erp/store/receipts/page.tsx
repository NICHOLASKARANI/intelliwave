'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Receipt, Download, Loader2, Search } from 'lucide-react'

interface Receipt {
  id: string
  receiptNumber: string
  amount: number
  createdAt: string
}

export default function ReceiptsPage() {
  const [receipts, setReceipts] = useState<Receipt[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchReceipts()
  }, [])

  const fetchReceipts = async () => {
    try {
      const res = await fetch('/api/wavecore/store/receipts')
      const data = await res.json()
      setReceipts(data.receipts || [])
    } catch (error) {
      console.error('Failed to fetch receipts')
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = (receipt: Receipt) => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <html><head><title>Receipt ${receipt.receiptNumber}</title>
      <style>body{font-family:Arial;padding:40px}h1{color:#333}</style></head><body>
      <h1>Receipt ${receipt.receiptNumber}</h1>
      <p>Amount: KSh ${receipt.amount.toLocaleString()}</p>
      <p>Date: ${new Date(receipt.createdAt).toLocaleString()}</p>
      <script>window.print()</script></body></html>
    `)
    printWindow.document.close()
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/store" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Receipts</span>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <Receipt className="w-6 h-6 text-pink-500" /> Receipts
        </h1>

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : receipts.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No receipts yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {receipts.map(receipt => (
              <div key={receipt.id} className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 flex justify-between items-center">
                <div>
                  <p className="font-bold">{receipt.receiptNumber}</p>
                  <p className="text-green-600 font-medium">KSh {receipt.amount.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">{new Date(receipt.createdAt).toLocaleString()}</p>
                </div>
                <button onClick={() => downloadPDF(receipt)} className="text-blue-500"><Download className="w-5 h-5" /></button>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}