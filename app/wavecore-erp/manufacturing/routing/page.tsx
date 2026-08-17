'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Gauge, Plus, Trash2, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function RoutingPage() {
  const [routes, setRoutes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function fetchRoutes() {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/manufacturing/routing')
      if (res.ok) { const data = await res.json(); setRoutes(data.routes || []) }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchRoutes() }, [])

  const handleAdd = async () => {
    setError(''); setSuccess('')
    if (!name) { setError('Route name required'); return }
    try {
      const res = await fetch('/api/wavecore/manufacturing/routing', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      })
      const data = await res.json()
      if (res.ok) { setSuccess('Route created!'); setShowAdd(false); setName(''); fetchRoutes() }
      else { setError(data.error || 'Failed') }
    } catch { setError('Network error') }
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/manufacturing" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Routing</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Gauge className="w-6 h-6 text-teal-500" /> Routing</h1>
          <Button onClick={() => setShowAdd(!showAdd)} className="gap-2 bg-teal-600"><Plus className="w-4 h-4" /> New Route</Button>
        </div>
        {error && <div className="p-4 mb-4 rounded-xl bg-red-50 text-red-600 text-sm">{error}</div>}
        {success && <div className="p-4 mb-4 rounded-xl bg-green-50 text-green-600 text-sm">{success}</div>}
        {showAdd && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 mb-6">
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border" placeholder="Route Name *" />
            <Button onClick={handleAdd} className="mt-3">Create Route</Button>
          </div>
        )}
        {loading ? <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-teal-500" /></div> :
          routes.length > 0 ? (
            <div className="space-y-3">{routes.map(r => (
              <div key={r.id} className="p-4 rounded-xl border bg-white dark:bg-neutral-900 flex justify-between">
                <div><p className="font-bold">{r.name}</p><p className="text-xs text-muted-foreground">{r.code}</p></div>
                <button className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}</div>
          ) : <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border"><Gauge className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No routes yet</p></div>
        }
      </main>
    </div>
  )
}