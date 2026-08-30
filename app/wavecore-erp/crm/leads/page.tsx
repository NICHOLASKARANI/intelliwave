'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Users, Search, Trash2, Loader2, Printer, Mail, Phone, Filter } from 'lucide-react'

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  status: string
  source: string
  createdAt: string
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState('')

  useEffect(() => {
    fetchLeads()
  }, [])

  const fetchLeads = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/crm/leads')
      const data = await res.json()
      setLeads(data.leads || [])
    } catch (err) {
      setError('Failed to load leads')
    } finally {
      setLoading(false)
    }
  }

  const deleteLead = async (id: string) => {
    if (!confirm('Delete this lead?')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/wavecore/crm/leads?id=${id}`, { method: 'DELETE' })
      if (res.ok) fetchLeads()
    } catch (err) {
      setError('Delete failed')
    } finally {
      setDeleting('')
    }
  }

  const downloadPdf = (id: string) => {
    window.open(`/api/wavecore/crm/leads/${id}/pdf`, '_blank')
  }

  const filtered = leads.filter(l => 
    (l.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (l.email || '').toLowerCase().includes(search.toLowerCase())
  )

  const statusColor = (status: string) => {
    switch (status) {
      case 'NEW': return 'bg-blue-100 text-blue-700'
      case 'CONTACTED': return 'bg-yellow-100 text-yellow-700'
      case 'QUALIFIED': return 'bg-green-100 text-green-700'
      case 'WON': return 'bg-emerald-100 text-emerald-700'
      case 'LOST': return 'bg-red-100 text-red-700'
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
          <span className="text-sm">Leads</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Filter className="w-6 h-6 text-purple-500" /> Leads ({leads.length})
          </h1>
          <Link href="/wavecore-erp/crm/leads/create"
            className="px-4 py-2.5 rounded-xl bg-purple-600 text-white font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Lead
          </Link>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600">{error}</div>}

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border w-full" placeholder="Search leads..." />
        </div>

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Users className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No leads yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(lead => (
              <div key={lead.id} className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold">{lead.name || 'N/A'}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${statusColor(lead.status)}`}>
                      {lead.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {lead.email || 'N/A'}</span>
                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {lead.phone || 'N/A'}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Source: {lead.source || 'N/A'}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => downloadPdf(lead.id)} title="Download PDF"
                    className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">
                    <Printer className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteLead(lead.id)} title="Delete"
                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                    {deleting === lead.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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