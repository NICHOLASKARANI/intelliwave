'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Wrench, Plus, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function MaintenancePage() {
  const [requests, setRequests] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [assetName, setAssetName] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState('MEDIUM')

  async function fetchRequests() {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/manufacturing/maintenance')
      if (res.ok) { const data = await res.json(); setRequests(data.requests || []) }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchRequests() }, [])

  const handleAdd = async () => {
    if (!assetName) return
    try {
      const res = await fetch('/api/wavecore/manufacturing/maintenance', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assetName, description, priority }),
      })
      if (res.ok) { setShowAdd(false); setAssetName(''); setDescription(''); fetchRequests() }
    } catch {}
  }

  const handleDelete = async (id: string) => {
    try { await fetch(`/api/wavecore/manufacturing/maintenance/${id}`, { method: 'DELETE' }); fetchRequests() } catch {}
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/manufacturing" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Maintenance</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><Wrench className="w-6 h-6 text-orange-500" /> Maintenance</h1>
          <Button onClick={() => setShowAdd(!showAdd)} className="gap-2 bg-orange-600 hover:bg-orange-700"><Plus className="w-4 h-4" /> New Request</Button>
        </div>

        {showAdd && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 mb-6">
            <div className="grid grid-cols-2 gap-3">
              <input type="text" value={assetName} onChange={(e) => setAssetName(e.target.value)} className="px-4 py-2.5 rounded-xl border" placeholder="Asset Name *" />
              <select value={priority} onChange={(e) => setPriority(e.target.value)} className="px-4 py-2.5 rounded-xl border">
                <option value="LOW">Low</option><option value="MEDIUM">Medium</option><option value="HIGH">High</option><option value="EMERGENCY">Emergency</option>
              </select>
            </div>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border mt-3" placeholder="Description" rows={3} />
            <Button onClick={handleAdd} className="mt-3">Submit Request</Button>
          </div>
        )}

        {loading ? <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-orange-500" /></div> :
          requests.length > 0 ? (
            <div className="space-y-3">
              {requests.map(r => (
                <div key={r.id} className="p-4 rounded-xl border bg-white dark:bg-neutral-900 flex justify-between items-center">
                  <div><p className="font-medium">{r.assetName}</p><p className="text-xs text-muted-foreground">{r.description}</p></div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-xs rounded-full ${r.priority === 'EMERGENCY' ? 'bg-red-50 text-red-600' : r.priority === 'HIGH' ? 'bg-orange-50 text-orange-600' : 'bg-gray-50 text-gray-600'}`}>{r.priority}</span>
                    <button onClick={() => handleDelete(r.id)} className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border"><Wrench className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No maintenance requests</p></div>
        }
      </main>
    </div>
  )
}