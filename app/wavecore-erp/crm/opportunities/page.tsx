'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Target, Search, Trash2, Loader2, Printer, TrendingUp, DollarSign } from 'lucide-react'

interface Opportunity {
  id: string
  name: string
  title: string
  amount: number
  value: number
  stage: string
  status: string
  createdAt: string
}

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [error, setError] = useState('')
  const [deleting, setDeleting] = useState('')

  useEffect(() => {
    fetchOpportunities()
  }, [])

  const fetchOpportunities = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/crm/opportunities')
      const data = await res.json()
      setOpportunities(data.opportunities || [])
    } catch (err) {
      setError('Failed to load opportunities')
    } finally {
      setLoading(false)
    }
  }

  const deleteOpportunity = async (id: string) => {
    if (!confirm('Delete this opportunity?')) return
    setDeleting(id)
    try {
      const res = await fetch(`/api/wavecore/crm/opportunities?id=${id}`, { method: 'DELETE' })
      if (res.ok) fetchOpportunities()
    } catch (err) {
      setError('Delete failed')
    } finally {
      setDeleting('')
    }
  }

  const downloadPdf = (id: string) => {
    window.open(`/api/wavecore/crm/opportunities/${id}/pdf`, '_blank')
  }

  const filtered = opportunities.filter(o => 
    (o.name || o.title || '').toLowerCase().includes(search.toLowerCase())
  )

  const stageColor = (stage: string) => {
    switch (stage?.toUpperCase()) {
      case 'PROSPECTING': return 'bg-blue-100 text-blue-700'
      case 'QUALIFICATION': return 'bg-yellow-100 text-yellow-700'
      case 'PROPOSAL': return 'bg-purple-100 text-purple-700'
      case 'NEGOTIATION': return 'bg-orange-100 text-orange-700'
      case 'CLOSED WON': return 'bg-green-100 text-green-700'
      case 'CLOSED LOST': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  const totalValue = opportunities.reduce((sum, o) => sum + Number(o.amount || o.value || 0), 0)

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 dark:bg-neutral-900/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-3 sm:px-4 h-14 sm:h-16">
          <Link href="/wavecore-erp/crm" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Opportunities</span>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-3 sm:p-4 lg:p-8">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Target className="w-6 h-6 text-emerald-500" /> Opportunities ({opportunities.length})
            </h1>
            <p className="text-sm text-muted-foreground">Total Pipeline: KSh {totalValue.toLocaleString()}</p>
          </div>
          <Link href="/wavecore-erp/crm/opportunities/create"
            className="px-4 py-2.5 rounded-xl bg-emerald-600 text-white font-bold flex items-center gap-2">
            <Plus className="w-4 h-4" /> New Opportunity
          </Link>
        </div>

        {error && <div className="mb-4 p-3 rounded-xl bg-red-50 text-red-600">{error}</div>}

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-4 py-2.5 rounded-xl border w-full" placeholder="Search opportunities..." />
        </div>

        {loading ? (
          <div className="text-center py-8"><Loader2 className="w-8 h-8 animate-spin mx-auto" /></div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground">No opportunities yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(opp => (
              <div key={opp.id} className="p-4 rounded-2xl border bg-white dark:bg-neutral-900 flex justify-between items-center">
                <div>
                  <div className="flex items-center gap-2">
                    <p className="font-bold">{opp.name || opp.title || 'N/A'}</p>
                    <span className={`px-2 py-1 rounded-full text-xs font-bold ${stageColor(opp.stage)}`}>
                      {opp.stage || opp.status}
                    </span>
                  </div>
                  <p className="text-lg font-bold text-emerald-600 flex items-center gap-1 mt-1">
                    <DollarSign className="w-4 h-4" /> KSh {Number(opp.amount || opp.value || 0).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => downloadPdf(opp.id)} title="Download PDF"
                    className="p-2 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100">
                    <Printer className="w-4 h-4" />
                  </button>
                  <button onClick={() => deleteOpportunity(opp.id)} title="Delete"
                    className="p-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100">
                    {deleting === opp.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
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