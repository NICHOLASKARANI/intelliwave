'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { FileText, Plus, Download, Loader2, Trash2, Search } from 'lucide-react'

interface RFQ {
  id: string
  title: string
  status: string
  createdAt: string
}

export default function RFQsPage() {
  const [rfqs, setRfqs] = useState<RFQ[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [formData, setFormData] = useState({ title: '', status: 'OPEN' })

  useEffect(() => {
    fetchRFQs()
  }, [])

  const fetchRFQs = async () => {
    try {
      const res = await fetch('/api/wavecore/rfqs')
      const data = await res.json()
      setRfqs(data.rfqs || [])
    } catch (error) {
      console.error('Failed to fetch RFQs')
    } finally {
      setLoading(false)
    }
  }

  const addRFQ = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const res = await fetch('/api/wavecore/rfqs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      if (res.ok) {
        setFormData({ title: '', status: 'OPEN' })
        setShowForm(false)
        fetchRFQs()
      }
    } catch (error) {
      console.error('Failed to add RFQ')
    }
  }

  const deleteRFQ = async (id: string) => {
    if (!confirm('Delete this RFQ?')) return
    try {
      await fetch(`/api/wavecore/rfqs?id=${id}`, { method: 'DELETE' })
      fetchRFQs()
    } catch (error) {
      console.error('Failed to delete RFQ')
    }
  }

  const downloadPDF = () => {
    const printWindow = window.open('', '_blank')
    if (!printWindow) return
    printWindow.document.write(`
      <html>
        <head>
          <title>RFQs - Request for Quotations</title>
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
            <h1>RFQs</h1>
            <div>Generated: ${new Date().toLocaleString()}</div>
          </div>
          <table>
            <thead><tr><th>Title</th><th>Status</th><th>Date</th></tr></thead>
            <tbody>
              ${rfqs.map(r => `<tr><td>${r.title}</td><td>${r.status}</td><td>${new Date(r.createdAt).toLocaleDateString()}</td></tr>`).join('')}
            </tbody>
          </table>
          <script>window.print();</script>
        </body>
      </html>
    `)
    printWindow.document.close()
  }

  const filtered = rfqs.filter(r => 
    r.title.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/procurement" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">RFQs</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-purple-500" /> RFQs ({rfqs.length})
          </h1>
          <div className="flex gap-2">
            <button onClick={downloadPDF} className="px-4 py-2 rounded-xl bg-blue-600 text-white flex items-center gap-2 hover:bg-blue-700">
              <Download className="w-4 h-4" /> PDF
            </button>
            <button onClick={() => setShowForm(!showForm)} className="px-4 py-2 rounded-xl bg-emerald-600 text-white flex items-center gap-2 hover:bg-emerald-700">
              <Plus className="w-4 h-4" /> New RFQ
            </button>
          </div>
        </div>

        {showForm && (
          <form onSubmit={addRFQ} className="bg-white dark:bg-neutral-900 rounded-2xl border p-6 mb-6">
            <input type="text" placeholder="RFQ Title" required value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
              className="w-full px-4 py-2 rounded-xl border" />
            <button type="submit" className="mt-4 px-6 py-2 rounded-xl bg-emerald-600 text-white">Create RFQ</button>
          </form>
        )}

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border w-full" placeholder="Search RFQs..." />
        </div>

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No RFQs yet</p>
          </div>
        ) : (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            <table className="w-full">
              <thead className="bg-neutral-50 dark:bg-neutral-800">
                <tr>
                  <th className="text-left p-4 text-sm">Title</th>
                  <th className="text-left p-4 text-sm">Status</th>
                  <th className="text-left p-4 text-sm">Date</th>
                  <th className="text-left p-4 text-sm">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(rfq => (
                  <tr key={rfq.id} className="border-t">
                    <td className="p-4 font-medium">{rfq.title}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        rfq.status === 'OPEN' ? 'bg-green-50 text-green-600' :
                        rfq.status === 'CLOSED' ? 'bg-red-50 text-red-600' :
                        'bg-yellow-50 text-yellow-600'
                      }`}>{rfq.status}</span>
                    </td>
                    <td className="p-4 text-sm text-muted-foreground">{new Date(rfq.createdAt).toLocaleDateString()}</td>
                    <td className="p-4"><button onClick={() => deleteRFQ(rfq.id)} className="text-red-500 hover:text-red-700"><Trash2 className="w-4 h-4" /></button></td>
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