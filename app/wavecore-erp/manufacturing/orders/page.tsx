'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ClipboardList, Plus, Search, Download, Loader2, Edit3, Trash2 } from 'lucide-react'

export default function WorkOrdersPage() {
  const [orders, setOrders] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showCreate, setShowCreate] = useState(false)
  const [editing, setEditing] = useState<any>(null)

  useEffect(() => {
    fetchOrders()
  }, [])

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/wavecore/manufacturing/work-orders')
      if (res.ok) {
        const data = await res.json()
        setOrders(data.workOrders || data.orders || [])
      }
    } catch {} finally { setLoading(false) }
  }

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this work order?')) return
    try {
      await fetch(`/api/wavecore/manufacturing/work-orders?id=${id}`, { method: 'DELETE' })
      fetchOrders()
    } catch {}
  }

  const handleDownloadPDF = () => {
    const content = [
      'WaveCore ERP - Work Orders',
      '='.repeat(50),
      'Generated: ' + new Date().toLocaleString(),
      'Total: ' + filtered.length,
      '='.repeat(50),
      '',
      ...filtered.map((o: any, i) => `${i+1}. ${o.number || 'WO'} - Status: ${o.status || 'N/A'} - Quantity: ${o.quantity || 0}`),
      '',
      '© 2026 IntelliWavve'
    ].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'work-orders.pdf'; a.click()
  }

  const filtered = orders.filter((o: any) => 
    (o.number || '').toLowerCase().includes(search.toLowerCase()) ||
    (o.status || '').toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
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
          <h1 className="text-2xl font-bold flex items-center gap-2"><ClipboardList className="w-6 h-6 text-indigo-500" /> Work Orders ({filtered.length})</h1>
          <div className="flex gap-2">
            <button onClick={handleDownloadPDF} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 text-white text-sm"><Download className="w-4 h-4" /> PDF</button>
            <button onClick={() => setShowCreate(!showCreate)} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 text-white text-sm"><Plus className="w-4 h-4" /> Create</button>
          </div>
        </div>
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9 pr-4 py-2.5 rounded-xl border w-full" placeholder="Search work orders..." />
        </div>
        {loading ? <Loader2 className="w-8 h-8 animate-spin mx-auto" /> : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-neutral-50 dark:bg-neutral-800">
                <th className="p-3 text-left">Number</th><th className="p-3">Status</th><th className="p-3 text-right">Qty</th><th className="p-3 text-center">Actions</th>
              </tr></thead>
              <tbody>
                {filtered.map((o: any) => (
                  <tr key={o.id} className="border-b hover:bg-neutral-50">
                    <td className="p-3 font-medium">{o.number || 'N/A'}</td>
                    <td className="p-3">{o.status || 'N/A'}</td>
                    <td className="p-3 text-right">{o.quantity || 0}</td>
                    <td className="p-3"><div className="flex justify-center gap-2">
                      <button onClick={() => setEditing(o)} className="p-1.5 text-blue-500"><Edit3 className="w-4 h-4" /></button>
                      <button onClick={() => handleDelete(o.id)} className="p-1.5 text-red-500"><Trash2 className="w-4 h-4" /></button>
                    </div></td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">No work orders</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  )
}