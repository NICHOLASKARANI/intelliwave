'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowLeft, Activity, Loader2 } from 'lucide-react'

export default function ActivitiesPage() {
  const [activities, setActivities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchActivities() {
      try {
        const res = await fetch('/api/wavecore/crm/activities')
        if (res.ok) {
          const data = await res.json()
          setActivities(data.activities || [])
        }
      } catch {} finally { setLoading(false) }
    }
    fetchActivities()
  }, [])


  const handleDownloadPDF = () => {
    const content = ['WaveCore ERP - Activities', '='.repeat(50), 'Generated: ' + new Date().toLocaleString(), '', '© 2026 IntelliWavve'].join('\n')
    const blob = new Blob([content], { type: 'application/pdf' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'activities.pdf'; a.click()
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
            <span className="text-sm">Activities</span>
          </div>
          <Link href="/wavecore-erp/crm" className="flex items-center gap-2 text-sm text-muted-foreground">
            <ArrowLeft className="w-4 h-4" /> CRM
          </Link>
        </div>
      </header>

      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <h1 className="text-2xl font-bold mb-6">Activities</h1>

        {loading ? (
          <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-indigo-500" /></div>
        ) : activities.length > 0 ? (
          <div className="space-y-3">
            {activities.map((a) => (
              <div key={a.id} className="p-4 rounded-xl border bg-white dark:bg-neutral-900">
                <div className="flex items-center gap-2 mb-2">
                  <Activity className="w-4 h-4 text-indigo-500" />
                  <span className="font-medium">{a.subject}</span>
                  <span className="text-xs bg-gray-100 px-2 py-0.5 rounded-full">{a.type}</span>
                </div>
                <p className="text-sm text-muted-foreground">{a.description}</p>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="font-medium">No activities yet</p>
          </div>
        )}
      </main>
    </div>
  )
}