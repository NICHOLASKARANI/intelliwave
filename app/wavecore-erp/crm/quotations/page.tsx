'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, FileText, Search, Trash2, Loader2, Printer, DollarSign } from 'lucide-react'

interface Quotation {
  id: string
  number: string
  total: number
  amount: number
  status: string
  createdAt: string
}

export default function QuotationsPage() {
  const [quotations, setQuotations] = useState<Quotation[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState('')

  useEffect(() => {
    fetchQuotations()
  }, [])

  const fetchQuotations = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/crm/quotations')
      const data = await res.json()
      setQuotations(data.quotations || [])
    } catch (err) {
      setError('Failed to load quotations')
    } finally {
      setLoading(false)
    }
  }

  const deleteQuotation = async (id: string) => {
    if (!confirm('Delete this quotation?')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/wavecore/crm/quotations?id=${id}`, { method: 'DELETE' })
      if (res.ok) fetchQuotations()
    } catch (err) {
      setError('Delete failed')
    } finally {
      setDeleting('')
    }
  }

  const downloadPdf = (id: string) => {
    window.open(`/api/wavecore/crm/quotations/${id}/pdf`, '_blank')
  }

  const filtered = quotations.filter(q => 
    (q.number || '').toLowerCase().includes(search.toLowerCase())
  )

  const statusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'DRAFT': return 'bg-gray-100 text-gray-700'
      case 'SENT': return 'bg-blue-100 text-blue-700'
      case 'ACCEPTED': return 'bg-green-100 text-green-700'
      case 'REJECTED': return 'bg-red-100 text-red-700'
      case 'EXPIRED': return 'bg-orange-100 text-orange-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp/crm" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Quotations</span>
        </div>
      </header>

      <main className="max-w-5xl mx-auto p-3 sm:p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FileText className="w-6 h-6 text-amber-500" /> Quotations ({quotations.length})
          </h1>
          <Link href="/wavecore-erp/crm/quotations/create"
            className="px-4 py-2.5 rounded-xl bg-amber-600 text-white font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Quotation
          </Link>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600">{error}</div>}

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border w-full" placeholder="Search quotations..." />
        </div>

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No quotations yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(quote => (
              <div key={quote.id} className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-mono font-bold">{quote.number || 'N/A'}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColor(quote.status)}`}>
                      {quote.status}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-amber-600 flex items-center gap-1 mt-1">
                    <DollarSign className="w-4 h-4" /> KSh {Number(quote.total || quote.amount || 0).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => downloadPdf(quote.id)} title="Download PDF"
                    className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">
                    <Printer className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteQuotation(quote.id)} title="Delete"
                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                    {deleting === quote.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}