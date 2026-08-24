'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle, Plus, Download, Loader2, Trash2, Search } from 'lucide-react'

interface GoodsReceipt {
  id: string
  purchaseOrderId: string
  quantity: number
  receivedAt: string
}

export default function GoodsReceiptsPage() {
  const [receipts, setReceipts] = useState<GoodsReceipt[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ purchaseOrderId: '', quantity: '' })

  useEffect(() => {
    fetchReceipts()
  }, [])

  const fetchReceipts = async () => {
    try {
      const res = await fetch('/api/wavecore/goods-receipts')
      const data = await res.json()
      setReceipts(data.receipts || [])
    } catch (error) {
      console.error('Failed to fetch receipts')
    } finally {
      setLoading(false)
    }
  }

  const addReceipt = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/wavecore/goods-receipts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setFormData({ purchaseOrderId: '', quantity: '' })
        setShowForm(false)
        fetchReceipts()
      }
    } catch (error) {
      console.error('Failed to add receipt')
    }
  }

  const deleteReceipt = async (id: string) => {
    if (!confirm('Delete this goods receipt?')) return
    try {
      await fetch(`/api/wavecore/goods-receipts?id=${id}`, { method: 'DELETE' })
      fetchReceipts()
    } catch (error) {
      console.error('Failed to delete receipt')
    }
  }

  const downloadPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head>
          <title>Goods Receipts</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; }
            h1 { color: #333; border-bottom: 3px solid #059669; padding-bottom: 10px; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th { background: #059669; color: white; padding: 12px; text-align: left; }
            td { padding: 10px; border-bottom: 1px solid #ddd; }
            .header { display: flex; justify-content: space-between; align-items: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Goods Receipts</h1>
            <div>Generated: ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead><tr><th>PO ID</th><th>Quantity</th><th>Received Date</th></tr></thead>
            <tbody>
              ${receipts.map(r => `<tr><td>${r.purchaseOrderId}</td><td>${r.quantity}</td><td>${new Date(r.receivedAt).toLocaleDateString()}</td></tr>`).join('')}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const filtered = receipts.filter(r => 
    r.purchaseOrderId.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/procurement" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Goods Receipts</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-teal-500" /> Goods Receipts ({receipts.length})
          </h1>
          <div className="flex gap-2">
            <button onClick={downloadPDF} className="px-4 py-2 rounded-xl bg-blue-600 text-white flex items-center gap-2 hover:bg-blue-700">
              <Download className="w-4 h-4" /> PDF
            </button>
            <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-xl bg-emerald-600 text-white flex items-center gap-2 hover:bg-emerald-700">
              <Plus className="w-4 h-4" /> New Receipt
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={addReceipt} className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <input type="text" placeholder="Purchase Order ID" required value={formData.purchaseOrderId}
                onChange={(e) => setFormData({...formData, purchaseOrderId: e.target.value})}
                className="px-4 py-2 rounded-xl border" />
              <input type="number" placeholder="Quantity" required value={formData.quantity}
                onChange={(e) => setFormData({...formData, quantity: e.target.value})}
                className="px-4 py-2 rounded-xl border" />
            </div>
            <button type="submit" className="mt-4 px-6 py-2 rounded-xl bg-emerald-600 text-white">Save Receipt</button>
          </form>
        )}

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border w-full" placeholder="Search receipts..." />
        </div>

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No goods receipts yet</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800">
                <tr>
                  <th className="text-left p-4 text-sm">PO ID</th>
                  <th className="text-left p-4 text-sm">Quantity</th>
                  <th className="text-left p-4 text-sm">Received Date</th>
                  <th className="text-left p-4 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(receipt => (
                  <tr key={receipt.id} className="border-t">
                    <td className="p-4 font-medium">{receipt.purchaseOrderId}</td>
                    <td className="p-4">{receipt.quantity}</td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(receipt.receivedAt).toLocaleDateString()}</td>
                    <td className="p-4"><button onClick={() => deleteReceipt(receipt.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button></td>
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