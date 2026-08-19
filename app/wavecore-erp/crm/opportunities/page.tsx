'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Loader2, Target, DollarSign, Trash2 } from 'lucide-react'

interface Opportunity {
  id: string
  name: string
  amount: number
  stage: string
  probability: number
  customer_name: string
  createdAt: string
}

export default function OpportunitiesPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchOpps() {
      try {
        const res = await fetch('/api/wavecore/crm/opportunities')
        if (res.ok) {
          const data = await res.json()
          setOpportunities(data.opportunities || [])
        }
      } catch {} finally {
        setLoading(false)
      }
    }
    fetchOpps()
  }, [])

  const formatKES = (amount: number) => 'KSh ' + (amount || 0).toLocaleString('en-KE', { minimumFractionDigits: 2 })

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <div className="flex items-center gap-4">
            <Link href="/wavecore-erp" className="flex items-center gap-3">
              <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
              <span className="font-bold">WaveCore</span>
            </Link>
            <span className="text-sm">Opportunities</span>
          </div>
          <Link href="/wavecore-erp/crm" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> CRM
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Opportunities</h1>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div>
        ) : opportunities.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {opportunities.map((opp) => (
              <div key={opp.id} className="p-5 rounded-2xl border bg-white dark:bg-neutral-900">
                <div className="flex items-start justify-between mb-3">
                  <h3 className="font-bold">{opp.name}</h3>
                  <span className="px-2 py-1 text-xs bg-indigo-50 text-indigo-600 rounded-full">{opp.stage}</span>
                </div>
                <p className="text-2xl font-bold text-green-600">{formatKES(opp.amount)}</p>
                <p className="text-sm text-muted-foreground mt-1">{opp.customer_name}</p>
                <p className="text-xs text-muted-foreground mt-2">Probability: {opp.probability}%</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Target className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No opportunities yet</p>
          </div>
        )}
      </main>
    </div>
  )
}