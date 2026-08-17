'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { CheckCircle, Plus, Trash2, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function QualityPage() {
  const [checks, setChecks] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAdd, setShowAdd] = useState(false)
  const [workOrder, setWorkOrder] = useState('')
  const [result, setResult] = useState('PASSED')

  async function fetchChecks() {
    setLoading(true)
    try {
      const res = await fetch('/api/wavecore/manufacturing/quality')
      if (res.ok) { const data = await res.json(); setChecks(data.checks || []) }
    } catch {} finally { setLoading(false) }
  }

  useEffect(() => { fetchChecks() }, [])

  const handleAdd = async () => {
    if (!workOrder) return
    try {
      const res = await fetch('/api/wavecore/manufacturing/quality', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workOrder, result }),
      })
      if (res.ok) { setShowAdd(false); setWorkOrder(''); fetchChecks() }
    } catch {}
  }

  const handleDelete = async (id: string) => {
    try { await fetch(`/api/wavecore/manufacturing/quality/${id}`, { method: 'DELETE' }); fetchChecks() } catch {}
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b">
        <div className="flex items-center justify-between px-4 h-16">
          <Link href="/wavecore-erp/manufacturing" className="flex items-center gap-3">
            <Image src="/images/Wavecore.jpeg" alt="WaveCore" width={40} height={40} className="rounded-xl object-cover" />
            <span className="font-bold">WaveCore</span>
          </Link>
          <span className="text-sm">Quality Control</span>
        </div>
      </header>
      <main className="max-w-4xl mx-auto p-4 lg:p-8">
        <div className="flex justify-between mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2"><CheckCircle className="w-6 h-6 text-emerald-500" /> Quality Control</h1>
          <Button onClick={() => setShowAdd(!showAdd)} className="gap-2 bg-emerald-600 hover:bg-emerald-700"><Plus className="w-4 h-4" /> New Check</Button>
        </div>

        {showAdd && (
          <div className="bg-white dark:bg-neutral-900 rounded-2xl border p-4 mb-6">
            <div className="grid grid-cols-2 gap-3">
              <input type="text" value={workOrder} onChange={(e) => setWorkOrder(e.target.value)} className="px-4 py-2.5 rounded-xl border" placeholder="Work Order #" />
              <select value={result} onChange={(e) => setResult(e.target.value)} className="px-4 py-2.5 rounded-xl border">
                <option value="PASSED">Passed</option><option value="FAILED">Failed</option><option value="PARTIAL">Partial</option>
              </select>
            </div>
            <Button onClick={handleAdd} className="mt-3">Record Check</Button>
          </div>
        )}

        {loading ? <div className="text-center py-12"><Loader2 className="w-8 h-8 animate-spin mx-auto text-emerald-500" /></div> :
          checks.length > 0 ? (
            <div className="space-y-3">
              {checks.map(c => (
                <div key={c.id} className="p-4 rounded-xl border bg-white dark:bg-neutral-900 flex justify-between items-center">
                  <div><p className="font-medium">{c.workOrder}</p><p className="text-xs text-muted-foreground">{new Date(c.createdAt).toLocaleString()}</p></div>
                  <div className="flex items-center gap-2">
                    <span className={`px-3 py-1 text-xs rounded-full ${c.result === 'PASSED' ? 'bg-green-50 text-green-600' : c.result === 'FAILED' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'}`}>{c.result}</span>
                    <button onClick={() => handleDelete(c.id)} className="p-2 text-red-500"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
              ))}
            </div>
          ) : <div className="text-center py-16 bg-white dark:bg-neutral-900 rounded-2xl border"><CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-30" /><p>No quality checks yet</p></div>
        }
      </main>
    </div>
  )
}