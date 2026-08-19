'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, Search, Trash2, Edit3, ArrowLeft, Loader2, Target } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Lead {
  id: string
  name: string
  email: string
  phone: string
  company: string
  status: string
  priority: string
  createdAt: string
}

export default function LeadsPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  async function fetchLeads() {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/crm/leads')
      if (res.ok) {
        const data = await res.json()
        setLeads(data.leads || [])
      }
    } catch {} finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchLeads() }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this lead?')) return
    try {
      const res = await fetch(`/api/wavecore/crm/leads/${id}`, { method: 'DELETE' })
      if (res.ok) fetchLeads()
    } catch {}
  }

  const filtered = leads.filter(l =>
    l.name?.toLowerCase().includes(search.toLowerCase()) ||
    l.email?.toLowerCase().includes(search.toLowerCase()) ||
    l.company?.toLowerCase().includes(search.toLowerCase())
  )

  const statusColors: Record<string, string> = {
    NEW: 'bg-blue-50 text-blue-600',
    CONTACTED: 'bg-yellow-50 text-yellow-600',
    QUALIFIED: 'bg-green-50 text-green-600',
    PROPOSAL: 'bg-purple-50 text-purple-600',
    NEGOTIATION: 'bg-orange-50 text-orange-600',
    WON: 'bg-emerald-50 text-emerald-600',
    LOST: 'bg-red-50 text-red-600',
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-4">
            <Link href="/wavecore-erp" className="flex items-center gap-3">
              <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
              <span className="font-bold">WaveCore</span>
            </Link>
            <span className="text-sm">Leads</span>
          </div>
          <Link href="/wavecore-erp/crm" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> CRM
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">Leads</h1>
            <p className="text-muted-foreground mt-1">Manage your sales leads</p>
          </div>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
                className="pl-9 pr-4 py-2 rounded-xl border text-sm w-48" placeholder="Search leads..." />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div>
        ) : filtered.length > 0 ? (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-neutral-50 dark:bg-neutral-800">
                  <th className="text-left p-4">Name</th>
                  <th className="text-left p-4">Email</th>
                  <th className="text-left p-4">Phone</th>
                  <th className="text-left p-4">Company</th>
                  <th className="text-left p-4">Status</th>
                  <th className="text-center p-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((lead) => (
                  <tr key={lead.id} className="border-b hover:bg-neutral-50 dark:hover:bg-neutral-800">
                    <td className="p-4 font-medium">{lead.name}</td>
                    <td className="p-4">{lead.email || '-'}</td>
                    <td className="p-4">{lead.phone || '-'}</td>
                    <td className="p-4">{lead.company || '-'}</td>
                    <td className="p-4">
                      <span className={`px-2 py-1 text-xs rounded-full ${statusColors[lead.status] || 'bg-gray-50 text-gray-600'}`}>
                        {lead.status}
                      </span>
                    </td>
                    <td className="p-4 text-center">
                      <div className="flex justify-center gap-2">
                        <button className="p-2 rounded-lg hover:bg-blue-50 text-blue-500"><Edit3 className="w-4 h-4" /></button>
                        <button onClick={() => handleDelete(lead.id)} className="p-2 rounded-lg hover:bg-red-50 text-red-500"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No leads yet</p>
            <p className="text-sm text-muted-foreground mt-1">Add your first sales lead</p>
          </div>
        )}
      </main>
    </div>
  )
}