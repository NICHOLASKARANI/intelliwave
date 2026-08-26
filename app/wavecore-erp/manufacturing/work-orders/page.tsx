'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Factory, Plus, Loader2, Search, Download } from 'lucide-react'

interface WorkOrder {
  id: string
  orderNumber: string
  productName: string
  quantity: number
  status: string
  createdAt: string
}

export default function WorkOrdersPage() {
  const [orders, setOrders] = useState<WorkOrder[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/wavecore/manufacturing/work-orders')
      const data = await res.json()
      setOrders(data.workOrders || [])
    } catch (error) {
      console.error('Failed to fetch work orders')
    } finally {
      setLoading(false)
    }
  }

  const downloadPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <html><head><title>Work Orders</title>
      <style>body{font-family:Arial;padding:40px}h1{color:#333}table{width:100%;border-collapse:collapse;margin-top:20px}th{background:#7c3aed;color:white;padding:12px;text-align:left}td{padding:10px;border-bottom:1px solid #ddd}</style></head><body>
      <h1>Work Orders</h1>
      <table><thead><tr><th>Order #</th><th>Product</th><th>Quantity</th><th>Status</th></tr></thead><tbody>
      ${orders.map(o => `<tr><td>${o.orderNumber}</td><td>${o.productName}</td><td>${o.quantity}</td><td>${o.status}</td></tr>`).join('')}
      </tbody></table>
      <script>window.print()</script></body></html>
    `)
    printWindow.document.close()
  }

  const filtered = orders.filter(o => 
    (o.orderNumber || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.productName || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/manufacturing" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Work Orders</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Factory className="w-6 h-6 text-purple-500" /> Work Orders ({orders.length})
          </h1>
          <button onClick={downloadPDF} className="px-4 py-2 rounded-xl bg-blue-600 text-white flex items-center gap-2">
            <Download className="w-4 h-4" /> PDF
          </button>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border w-full" placeholder="Search work orders..." />
        </div>

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Factory className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No work orders</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800">
                <tr>
                  <th className="text-left p-4 text-sm">Order #</th>
                  <th className="text-left p-4 text-sm">Product</th>
                  <th className="text-left p-4 text-sm">Quantity</th>
                  <th className="text-left p-4 text-sm">Status</th>
                  <th className="text-left p-4 text-sm">Date</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(order => (
                  <tr key={order.id} className="border-t">
                    <td className="p-4 font-mono">{order.orderNumber}</td>
                    <td className="p-4">{order.productName}</td>
                    <td className="p-4">{order.quantity}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        order.status === 'COMPLETED' ? 'bg-green-50 text-green-600' :
                        order.status === 'IN_PROGRESS' ? 'bg-blue-50 text-blue-600' :
                        'bg-yellow-50 text-yellow-600'
                      }`}>{order.status}</span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</td>
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